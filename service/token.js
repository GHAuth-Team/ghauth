const USER = require('../db/models/user');
const User = require('./user');
const utils = require('../utils');
const redis = require('../db/redis');

module.exports = {
  genAccessToken: (email, clientToken) => new Promise((resolve) => {
    USER.findOne({ email }, 'tokens isBanned', (err, user) => {
      if (err) throw err;
      if (user && !user.isBanned) {
        const { tokens } = user;

        // 遍历所有旧token并使其暂时失效
        // (仅能同时存在一个有效token)
        for (let i = 0; i < tokens.length; i += 1) {
          tokens[i].status = 0;
        }

        // 遍历所有旧token并删除过期token
        for (let i = 0; i < tokens.length; i += 1) {
          if (Date.now() - tokens[i].createAt >= 432000000) {
            tokens[i].remove();
          }
        }

        // 生成新token
        const newToken = {
          accessToken: utils.genUUID().replace(/-/g, ''),
          clientToken,
        };
        tokens.push(newToken);
        user.save();
        resolve(newToken.accessToken);
      } else {
        resolve(false);
      }
    });
  }),
  searchUserByAccessToken: (accessToken) => new Promise((resolve) => {
    const query = { tokens: { $elemMatch: { accessToken } } };
    USER.findOne(query, '', (err, user) => {
      if (err) throw err;
      if (user) {
        resolve(user);
      } else {
        resolve(false);
      }
    });
  }),
  refreshAccessToken: (accessToken, clientToken) => new Promise((resolve) => {
    const query = { tokens: { $elemMatch: { accessToken } } };
    USER.findOne(query, 'tokens uuid playername', (err, user) => {
      if (err) throw err;
      if (user && !user.isBanned) {
        let tokenIndex = -1;
        for (let i = 0; i < user.tokens.length; i += 1) {
          if (user.tokens[i].accessToken === accessToken) {
            tokenIndex = i;
            break;
          }
        }

        // 未找到指定accessToken
        if (tokenIndex === -1) {
          resolve(false);
          return;
        }

        // clientToken不匹配
        if (clientToken) {
          if (clientToken !== user.tokens[tokenIndex].clientToken) {
            resolve(false);
            return;
          }
        }

        // accessToken已过期
        if (Date.now() - user.tokens[tokenIndex].createAt >= 432000000) {
          user.tokens[tokenIndex].remove();
          user.save();
          resolve(false);
          return;
        }

        Object.assign(user.tokens[tokenIndex], { status: 1 });
        user.save();
        resolve({
          accessToken: user.tokens[tokenIndex].accessToken,
          clientToken: user.tokens[tokenIndex].clientToken,
          uuid: user.uuid,
          playername: user.playername,
        });
        return;
      }
      resolve(false);
    });
  }),
  validateAccessToken: (accessToken, clientToken) => new Promise((resolve) => {
    const query = { tokens: { $elemMatch: { accessToken } } };
    USER.findOne(query, 'tokens uuid playername', (err, user) => {
      if (err) throw err;
      if (user && !user.isBanned) {
        let tokenIndex = -1;
        for (let i = 0; i < user.tokens.length; i += 1) {
          if (user.tokens[i].accessToken === accessToken) {
            tokenIndex = i;
            break;
          }
        }

        // 未找到指定accessToken
        if (tokenIndex === -1) {
          resolve(false);
          return;
        }

        // clientToken不匹配
        if (clientToken) {
          if (clientToken !== user.tokens[tokenIndex].clientToken) {
            resolve(false);
            return;
          }
        }

        // accessToken已过期
        if (Date.now() - user.tokens[tokenIndex].createAt >= 432000000) {
          user.tokens[tokenIndex].remove();
          user.save();
          resolve(false);
          return;
        }

        // accessToken暂时失效
        if (user.tokens[tokenIndex].status !== 1) {
          resolve(false);
          return;
        }

        resolve(true);
        return;
      }
      resolve(false);
    });
  }),
  invalidateAccessToken: (accessToken) => new Promise((resolve) => {
    const query = { tokens: { $elemMatch: { accessToken } } };
    USER.findOne(query, 'tokens _id', (err, user) => {
      if (err) throw err;
      if (user && !user.isBanned) {
        let tokenIndex = -1;
        for (let i = 0; i < user.tokens.length; i += 1) {
          if (user.tokens[i].accessToken === accessToken) {
            tokenIndex = i;
            break;
          }
        }

        // 未找到指定accessToken
        if (tokenIndex === -1) {
          resolve(false);
          return;
        }
        user.tokens[tokenIndex].remove();
        user.save();
        resolve(true);
        return;
      }
      resolve(false);
    });
  }),
  invalidateAllAccessToken: (email, password) => new Promise((resolve) => {
    USER.findOne({ email }, 'tokens password', (err, user) => {
      if (err) throw err;
      if (user && !user.isBanned) {
        const { tokens } = user;

        // 密码不正确
        if (password !== user.password) {
          resolve(false);
        }

        // 遍历所有token并删除
        for (let i = 0; i < tokens.length; i += 1) {
          tokens[i].remove();
        }
        Object.assign(user, { tokens });
        user.save();
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }),
  clientToServerValidate: (accessToken, selectedProfile, serverId, ip) => new Promise((resolve) => {
    // 根据accessToken获取对应用户
    module.exports.searchUserByAccessToken(accessToken).then((result) => {
      // 无法找到accessToken
      if (!result) {
        resolve(false);
        return;
      }

      // 令牌对应用户已被封禁
      if (result.isBanned) {
        resolve(false);
        return;
      }

      // 令牌对应用户未验证邮箱
      if (!result.verified) {
        resolve(false);
        return;
      }

      // 令牌对应玩家uuid不一致
      if (result.uuid.replace(/-/g, '') !== selectedProfile) {
        resolve(false);
        return;
      }

      let data = {
        accessToken,
        selectedProfile,
        username: result.playername,
        ip,
      };

      data = JSON.stringify(data);
      // 将授权信息储存至redis，15秒过期
      redis.set(`serverId_${serverId}`, data, 'EX', 15).then(
        () => {
          resolve(true);
        },
      );
    });
  }),
  serverToClientValidate: (username, serverId, ip) => new Promise((resolve) => {
    // 根据serverId获取对应授权信息
    redis.get(`serverId_${serverId}`, (err, response) => {
      // 未找到对应授权信息或发生错误
      if (err || !response) {
        resolve(false);
        return;
      }

      const clientData = JSON.parse(response);

      // 玩家名称与授权不对应
      if (clientData.username !== username) {
        resolve(false);
        return;
      }

      // 若提供了客户端ip，则需要判断储存的客户端ip与其是否一致
      if (ip) {
        if (clientData.ip !== ip) {
          resolve(false);
          return;
        }
      }

      // 根据accessToken获取玩家资料
      module.exports.searchUserByAccessToken(clientData.accessToken).then((result) => {
        // 生成玩家完整Profile
        const data = User.genUserProfile(result);
        resolve(data);
      });
    });
  }),
};
