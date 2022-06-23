/* controller/yggdrasil.js */

const CryptoJS = require('crypto-js');
const config = require('../../config');
const pkg = require('../../package.json');
const utils = require('../../utils');
const User = require('../../service/user');
const stoken = require('../../service/token');

module.exports = {
  yggdrasil: async (ctx) => {
    ctx.set('Content-Type', 'application/json');
    const data = {
      meta: {
        implementationName: `${config.common.sitename}(GHAuth Yggdrasil)`, // Yggdrasil协议名称
        implementationVersion: pkg.version, // Yggdrasil协议版本
        serverName: config.common.sitename, // Yggdrasil认证站点名称
        links: {
          homepage: config.common.url,
          register: `${config.common.url}/register`,
        },
      },
      skinDomains: config.extra.skinDomains, // 可信域（皮肤加载所信任的域名）
      signaturePublickey: config.extra.signature.public, // 签名公钥
    };
    ctx.body = data;
  },
  api: {
    profiles: {
      minecraft: async (ctx) => {
        const data = ctx.request.body;

        // 校验是否传入了数组
        if (!(data instanceof Array)) {
          ctx.set('Content-Type', 'application/json');
          ctx.body = [];
          return;
        }

        // 去除重复及无效数据
        data.filter((item, index, arr) => arr.indexOf(item, 0) === index && typeof item === 'string');

        // 一次最多查询3个玩家的数据
        if (data.length >= 3) {
          ctx.set('Content-Type', 'application/json');
          ctx.body = [];
          return;
        }

        const playerList = [];

        // 遍历玩家列表
        for (let i = 0; i < data.length; i += 1) {
          // 搜索玩家信息
          const userData = await User.searchUserInfoByPlayerName(data[i]).then((result) => result);

          // 如果存在则生成玩家Profile，并加入到playerList
          // 无需提供详细角色属性，第二个参数设置为false
          if (userData) {
            playerList.push(User.genUserProfile(userData, false));
          }
        }

        // 返回数据
        ctx.set('Content-Type', 'application/json');
        ctx.body = playerList;
      },
    },
  },
  authserver: {
    authenticate: async (ctx) => {
      const data = ctx.request.body;
      ctx.set('Content-Type', 'application/json');

      // 用户名/密码不存在，返回403
      if (!data.username || !data.password) {
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid credentials. Invalid username or password.',
        };
        return;
      }
      const { username } = data;
      let { password } = data;
      const clientToken = data.clientToken || utils.genUUID().replace(/-/g, '');
      const requestUser = data.requestUser || false;

      // 密码预处理
      password += 'dKfkZh';
      password = CryptoJS.SHA3(password);
      password = password.toString(CryptoJS.enc.Hex);
      password = CryptoJS.HmacSHA256(password, config.extra.slat).toString();

      // 查找用户信息
      const userData = await User.searchUserInfoByEmail(username).then((result) => result);

      // 未找到用户
      if (!userData) {
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid credentials. Invalid username or password.',
        };
        return;
      }

      // 用户被封禁
      if (userData.isBanned) {
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid credentials. Invalid username or password.',
        };
        return;
      }

      // 用户密码不正确
      if (userData.password !== password) {
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid credentials. Invalid username or password.',
        };
        return;
      }

      // 生成accessToken
      const accessToken = await stoken.genAccessToken(username, clientToken).then((result) => result);
      const profileData = {
        id: userData.uuid.replace(/-/g, ''),
        name: userData.playername,
      };
      const responseData = {
        accessToken,
        clientToken,
        availableProfiles: [
          profileData,
        ],
        selectedProfile: profileData,
      };
      if (requestUser) {
        responseData.user = {
          id: userData.uuid.replace(/-/g, ''),
        };
      }
      ctx.body = responseData;
    },
    refresh: async (ctx) => {
      const data = ctx.request.body;
      ctx.set('Content-Type', 'application/json');
      // 属性accessToken不存在，返回403
      if (!data.accessToken) {
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid token.',
        };
        return;
      }

      const { accessToken } = data;
      const { clientToken } = data;
      const requestUser = data.requestUser || false;

      // 刷新令牌
      const result = await stoken.refreshAccessToken(accessToken, clientToken).then((ret) => ret);

      // 刷新操作失败
      if (!result) {
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid token.',
        };
        return;
      }

      const profileData = {
        id: result.uuid.replace(/-/g, ''),
        name: result.playername,
      };

      const responseData = {
        accessToken: result.accessToken,
        clientToken: result.clientToken,
        selectedProfile: profileData,
      };
      if (requestUser) {
        responseData.user = {
          id: result.uuid.replace(/-/g, ''),
        };
      }
      ctx.body = responseData;
    },
    validate: async (ctx) => {
      const data = ctx.request.body;

      // 属性accessToken不存在
      if (!data.accessToken) {
        ctx.set('Content-Type', 'application/json');
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid token.',
        };
        return;
      }

      const { accessToken } = data;
      const { clientToken } = data;

      // 验证令牌
      const result = await stoken.validateAccessToken(accessToken, clientToken).then((ret) => ret);

      // 验证失败或令牌无效
      if (!result) {
        ctx.set('Content-Type', 'application/json');
        ctx.status = 403;
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid token.',
        };
        return;
      }

      // 令牌有效，返回204
      ctx.status = 204;
    },
    invalidate: async (ctx) => {
      const data = ctx.request.body;

      if (data.accessToken) {
        await stoken.invalidateAccessToken(data.accessToken);
      }

      // 吊销令牌（无论如何都返回204）
      ctx.status = 204;
    },
    signout: async (ctx) => {
      const data = ctx.request.body;
      if (!data.username || !data.password) {
        ctx.status = 403;
        ctx.set('Content-Type', 'application/json');
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid credentials. Invalid username or password.',
        };
        return;
      }
      const { username } = data;
      let { password } = data;

      // 密码预处理
      password += 'dKfkZh';
      password = CryptoJS.SHA3(password);
      password = password.toString(CryptoJS.enc.Hex);
      password = CryptoJS.HmacSHA256(password, config.extra.slat).toString();

      // 删除用户所有token
      const result = await stoken.invalidateAllAccessToken(username, password).then((ret) => ret);

      // 操作失败，返回403
      if (!result) {
        ctx.status = 403;
        ctx.set('Content-Type', 'application/json');
        ctx.body = {
          error: 'ForbiddenOperationException',
          errorMessage: 'Invalid credentials. Invalid username or password.',
        };
        return;
      }

      // 操作成功，返回204
      ctx.status = 204;
    },
  },
  sessionserver: {
    session: {
      minecraft: {
        join: async (ctx) => {
          const data = ctx.request.body;
          if (!data.accessToken || !data.selectedProfile || !data.serverId || data.selectedProfile.length !== 32 || data.accessToken.length !== 32) {
            ctx.status = 403;
            ctx.set('Content-Type', 'application/json');
            ctx.body = {
              error: 'ForbiddenOperationException',
              errorMessage: 'Invalid token.',
            };
            return;
          }
          const { accessToken } = data;
          const { selectedProfile } = data;
          const { serverId } = data;
          const clientIP = utils.getUserIp(ctx.req);

          // 比对并储存数据
          const result = await stoken.clientToServerValidate(accessToken, selectedProfile, serverId, clientIP).then((ret) => ret);

          // 操作失败，返回403
          if (!result) {
            ctx.status = 403;
            ctx.set('Content-Type', 'application/json');
            ctx.body = {
              error: 'ForbiddenOperationException',
              errorMessage: 'Invalid token.',
            };
            return;
          }

          // 操作成功，返回204
          ctx.status = 204;
        },
        hasJoined: async (ctx) => {
          const { username } = ctx.query;
          const { serverId } = ctx.query;
          const { ip } = ctx.query;

          // 比对授权 生成玩家信息
          const result = await stoken.serverToClientValidate(username, serverId, ip).then((ret) => ret);

          if (!result) {
            // 操作失败，返回204
            ctx.status = 204;
            return;
          }

          // 操作成功 返回完整玩家信息
          ctx.set('Content-Type', 'application/json');
          ctx.body = result;
        },
        profile: async (ctx) => {
          // 获取uuid参数
          let { uuid } = ctx.params;

          // uuid格式错误，返回204
          if (uuid.length !== 32) {
            ctx.status = 204;
            return;
          }

          // 处理无符号uuid为有符号uuid
          uuid = utils.convertUUIDwithHyphen(uuid);

          // 根据UUID获取玩家信息
          const userData = await User.searchUserInfoByUUID(uuid).then((result) => result);

          // 玩家不存在，返回204
          if (!userData) {
            ctx.status = 204;
            return;
          }

          ctx.set('Content-Type', 'application/json');
          ctx.body = User.genUserProfile(userData);
        },
      },
    },
  },
};
