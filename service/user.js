const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');
const USER = require('../db/models/user');
const utils = require('../utils');
const config = require('../config');
const adminList = require('../adminList');

module.exports = {
  getUserInfo: (ctx) => new Promise((resolve) => {
    if (!ctx.session || !ctx.session.userInfo || !ctx.session.userInfo.isLoggedIn) {
      resolve({ isLoggedIn: false });
      return;
    }

    USER.findOne({ email: ctx.session.userInfo.email }, 'id email password verified playername uuid tokens skin isBanned ip time', { lean: true }, (err, user) => {
      if (err) {
        resolve({ isLoggedIn: false });
        return;
      }
      if (!user) {
        ctx.session.userInfo = null;
        resolve({ isLoggedIn: false });
        return;
      }

      const userInfo = {
        isLoggedIn: true,
        id: user.id,
        email: user.email,
        verified: user.verified,
        password: user.password,
        playername: user.playername,
        uuid: user.uuid,
        skin: user.skin,
        isAdmin: adminList.includes(user.email),
        isBanned: user.isBanned,
        tokens: user.tokens,
        ip: user.ip,
        time: user.time,
      };

      // 修改密码需要重新登录，uuid只用于验证是否为首次信息初始化
      if (ctx.session.userInfo.uuid === user.uuid && ctx.session.userInfo.password !== user.password) {
        ctx.session.userInfo = null;
        resolve({ isLoggedIn: false });
        return;
      }

      // 异地登陆需要重新登录
      if (ctx.session.userInfo.uuid === user.uuid && ctx.session.userInfo.time.lastLogged !== user.time.lastLogged) {
        ctx.session.userInfo = null;
        resolve({ isLoggedIn: false });
        return;
      }

      ctx.session.userInfo = userInfo;
      resolve(ctx.session.userInfo);
    });
  }),
  isUserExists: (type, text) => new Promise((resolve) => {
    if (type === 'email') {
      USER.findOne({ email: text }, '', { lean: true }, (err, user) => {
        if (err) throw err;
        if (user) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } else {
      USER.findOne({ playername: text }, '', { lean: true }, (err, user) => {
        if (err) throw err;
        if (user) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }
  }),
  createNewUser: (userInfo) => new Promise((resolve) => {
    const newUser = new USER(userInfo);
    newUser.save((err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  }),
  getUserNumber: () => new Promise((resolve) => {
    USER.countDocuments({}, (error, count) => {
      if (error || Number.isNaN(count)) {
        resolve(-1);
      } else {
        resolve(count);
      }
    });
  }),
  isUserPasswordCorrect: (email, password) => new Promise((resolve) => {
    USER.findOne({ email }, 'password', { lean: true }, (err, user) => {
      if (!err && user.password === password) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }),
  changeUserPassword: (email, password) => new Promise((resolve) => {
    USER.findOne({ email }, 'password', (err, user) => {
      if (!err && user) {
        Object.assign(user, { password: CryptoJS.HmacSHA256(password, config.extra.slat).toString() });
        user.save((e) => {
          if (e) {
            resolve(false);
            return;
          }
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  }),
  searchUserInfoByEmail: (email) => new Promise((resolve) => {
    USER.findOne({ email }, '', { lean: true }, (err, user) => {
      if (!err && user) {
        resolve(user);
      } else {
        resolve(false);
      }
    });
  }),
  changeUserVerifiedStatusById: (playerId, status) => new Promise((resolve) => {
    USER.findOne({ id: playerId }, 'verified', (err, user) => {
      if (!err && user) {
        Object.assign(user, { verified: status });
        user.save((e) => {
          if (e) {
            resolve(false);
            return;
          }
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  }),
  changeUserSkinByEmail: (email, skinType, skinData) => new Promise((resolve) => {
    USER.findOne({ email }, '', (err, user) => {
      if (!err && user) {
        // 储存旧皮肤hash
        const oldSkinHash = user.skin.hash;

        // 计算新皮肤hash
        const newSkinHash = utils.getSkinHash(skinData);

        // 拼接皮肤目录
        const skinPath = path.join(utils.getRootPath(), './skin');

        // 检查新皮肤是否已存在
        const isSkinExists = fs.existsSync(`${skinPath}/${newSkinHash}.png`);

        // 皮肤不存在，写入
        if (!isSkinExists) {
          fs.writeFileSync(`${skinPath}/${newSkinHash}.png`, skinData);
        }
        Object.assign(user.skin, { type: skinType, hash: newSkinHash });

        user.save((e) => {
          if (e) {
            resolve(false);
            return;
          }

          // 旧皮肤为默认皮肤
          if (oldSkinHash === '9b155b4668427669ca9ed3828024531bc52fca1dcf8fbde8ccac3d9d9b53e3cf') {
            // 操作完成，返回true
            resolve(true);
            return;
          }

          // 检查旧hash的皮肤是否有人使用
          module.exports.searchUserInfoBySkinHash(oldSkinHash).then(
            (result) => {
              // 无人使用，删除旧皮肤
              if (!result) {
                fs.unlinkSync(`${skinPath}/${oldSkinHash}.png`);
              }

              // 操作完成，返回true
              resolve(true);
            },
          );
        });
      } else {
        resolve(false);
      }
    });
  }),
  searchUserInfoBySkinHash: (hash) => new Promise((resolve) => {
    USER.findOne({ 'skin.hash': hash }, '', { lean: true }, (err, user) => {
      if (!err && user) {
        resolve(user);
      } else {
        resolve(false);
      }
    });
  }),
  searchUserInfoByUUID: (uuid) => new Promise((resolve) => {
    USER.findOne({ uuid }, '', { lean: true }, (err, user) => {
      if (!err && user) {
        resolve(user);
      } else {
        resolve(false);
      }
    });
  }),
  searchUserInfoByID: (id) => new Promise((resolve) => {
    USER.findOne({ id }, '', { lean: true }, (err, user) => {
      if (!err && user) {
        resolve(user);
      } else {
        resolve(false);
      }
    });
  }),
  searchUserInfoByPlayerName: (playername) => new Promise((resolve) => {
    USER.findOne({ playername }, '', { lean: true }, (err, user) => {
      if (!err && user) {
        resolve(user);
      } else {
        resolve(false);
      }
    });
  }),
  letUserLoggedIn: (ctx, email) => new Promise((resolve) => {
    USER.findOne({ email }, 'id email playername verified password uuid tokens skin isBanned ip time', (err, user) => {
      if (err) throw err;
      Object.assign(user.ip, { lastLogged: utils.getUserIp(ctx.req) });
      Object.assign(user.time, { lastLogged: Date.now() });
      user.save((e, updatedUser) => {
        if (e) throw e;
        ctx.session.userInfo = {
          isLoggedIn: true,
          id: updatedUser.id,
          email: updatedUser.email,
          verified: updatedUser.verified,
          playername: updatedUser.playername,
          password: updatedUser.password,
          uuid: updatedUser.uuid,
          skin: updatedUser.skin,
          isAdmin: adminList.includes(updatedUser.email),
          isBanned: updatedUser.isBanned,
          tokens: updatedUser.tokens,
          ip: updatedUser.ip,
          time: updatedUser.time,
        };
        resolve(true);
      });
    });
  }),
  getUserSkin: (email) => new Promise((resolve) => {
    USER.findOne({ email }, 'skin', { lean: true }, (err, user) => {
      if (err) throw err;
      resolve({ skinType: user.skin.type, skin: `${user.skin.hash}.png` });
    });
  }),
  genUserProfile: (userData, isPropertiesContained = true) => {
    let data;
    let textureData;
    if (isPropertiesContained) {
      textureData = {
        timestamp: Date.now(),
        profileId: userData.uuid.replace(/-/g, ''),
        profileName: userData.playername,
        textures: {
          SKIN: {
            url: `${config.common.url}/textures/${userData.skin.hash}`,
            metadata: {
              model: userData.skin.type === 0 ? 'default' : 'slim',
            },
          },
        },
      };
      textureData = Buffer.from(JSON.stringify(textureData)).toString('base64');
    }
    if (isPropertiesContained) {
      data = {
        id: userData.uuid.replace(/-/g, ''),
        name: userData.playername,
        properties: [
          {
            name: 'textures',
            value: textureData,
            signature: utils.genSignedData(textureData),
          },
        ],
      };
    } else {
      data = {
        id: userData.uuid.replace(/-/g, ''),
        name: userData.playername,
      };
    }

    return data;
  },
  genUserList: (filter, currectPage, pageSize = 8) => new Promise((resolve) => {
    USER.countDocuments(filter || {}, (error, count) => {
      if (error) {
        resolve({ code: -1 });
      } else if (filter) {
        USER
          .find(filter, 'id email playername uuid isBanned time.register', { lean: true })
          .skip((currectPage - 1) * pageSize)
          .limit(pageSize)
          .sort({ 'time.register': 1 })
          .exec((err, doc) => {
            if (err) {
              resolve({ code: -1 });
            } else {
              for (let i = 0; i < doc.length; i += 1) {
                Object.assign(doc[i], { isAdmin: adminList.includes(doc[i].email) });
                Object.assign(doc[i], { isAdmin: adminList.includes(doc[i].email) });
                Reflect.deleteProperty(doc[i], '_id');
              }
              resolve({
                total: count,
                data: doc,
              });
            }
          });
      } else {
        USER
          .find({ id: { $gt: (currectPage - 1) * pageSize, $lte: (currectPage) * pageSize } }, 'id email playername uuid isBanned time.register', { lean: true })
          .sort({ 'time.register': 1 })
          .exec((err, doc) => {
            if (err) {
              resolve({ code: -1 });
            } else {
              for (let i = 0; i < doc.length; i += 1) {
                Object.assign(doc[i], { isAdmin: adminList.includes(doc[i].email) });
                Reflect.deleteProperty(doc[i], '_id');
              }
              resolve({
                total: count,
                data: doc,
              });
            }
          });
      }
    });
  }),
  switchUserStatusByUUID: (uuid) => new Promise((resolve) => {
    USER.findOne({ uuid }, 'email isBanned', (err, user) => {
      if (!err && user) {
        // 被操作对象是管理员，操作失败
        if (adminList.includes(user.email)) {
          resolve({ code: -2 });
          return;
        }

        if (user.isBanned === true) {
          Object.assign(user, { isBanned: false });
        } else {
          Object.assign(user, { isBanned: true });
        }

        user.save((e) => {
          if (e) {
            resolve({ code: -1 });
            return;
          }

          resolve({ code: 0 });
        });
      } else {
        resolve({ code: -1 });
      }
    });
  }),
};
