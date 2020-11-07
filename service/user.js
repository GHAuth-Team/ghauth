const User = require("../db/models/user");
const utils = require("../utils");
const config = require("../config");
const adminList = require("../adminList");
const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");

module.exports = {
    getUserInfo: (ctx) => {
        return new Promise((resolve, reject) => {
            if (!ctx.session || !ctx.session.userInfo || !ctx.session.userInfo.isLoggedIn) {
                resolve({ isLoggedIn: false });
                return;
            }

            User.findOne({ 'email': ctx.session.userInfo.email }, 'email password playername uuid tokens skin isBanned ip time', function (err, user) {
                if (err) {
                    resolve({ isLoggedIn: false });
                    return;
                };
                if (!user) {
                    ctx.session.userInfo = null;
                    resolve({ isLoggedIn: false });
                    return;
                };

                let userInfo = {
                    isLoggedIn: true,
                    email: user.email,
                    password: user.password,
                    playername: user.playername,
                    uuid: user.uuid,
                    skin: user.skin,
                    isAdmin: adminList.includes(user.email),
                    isBanned: user.isBanned,
                    tokens: user.tokens,
                    ip: user.ip,
                    time: user.time
                };

                // 修改密码需要重新登录，uuid只用于验证是否为首次信息初始化
                if (ctx.session.userInfo.uuid == user.uuid && ctx.session.userInfo.password != user.password) {
                    ctx.session.userInfo = null;
                    resolve({ isLoggedIn: false });
                    return;
                }

                // 异地登陆需要重新登录
                if (ctx.session.userInfo.uuid == user.uuid && ctx.session.userInfo.time["lastLogged"] != user.time["lastLogged"]) {
                    ctx.session.userInfo = null;
                    resolve({ isLoggedIn: false });
                    return;
                }

                ctx.session.userInfo = userInfo;
                resolve(ctx.session.userInfo);
            });
        })
    },
    isUserExists: (type, text) => {
        return new Promise((resolve, reject) => {
            if (type == "email") {
                User.findOne({ 'email': text }, '', function (err, user) {
                    if (err) throw err;
                    if (user) {
                        resolve(true);
                    } else {
                        resolve(false);
                    };
                });
            } else {
                User.findOne({ 'playername': text }, '', function (err, user) {
                    if (err) throw err;
                    if (user) {
                        resolve(true);
                    } else {
                        resolve(false);
                    };
                });
            }
        })
    },
    createNewUser: (userInfo) => {
        return new Promise((resolve, reject) => {
            let newUser = new User(userInfo);
            newUser.save(function (err) {
                if (err) {
                    resolve(false)
                } else {
                    resolve(true)
                }
            })
        })
    },
    getUserNumber: () => {
        return new Promise((resolve, reject) => {
            User.countDocuments({}, (error, count) => {
                if (error || isNaN(count)) {
                    resolve(-1);
                } else {
                    resolve(count);
                }
            })
        })
    },
    isUserPasswordCorrect: (email, password) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, 'password', function (err, user) {
                if (!err && user.password == password) {
                    resolve(true);
                } else {
                    resolve(false);
                };
            });
        })
    },
    changeUserPassword: (email, password) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, 'password', function (err, user) {
                if (!err && user) {
                    user.password = CryptoJS.HmacSHA256(password, config.extra.slat).toString();
                    user.save(function (err) {
                        if (err) {
                            resolve(false);
                            return;
                        }
                        resolve(true);
                    })
                } else {
                    resolve(false);
                };
            });
        })
    },
    searchUserInfoByEmail: (email) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, '', function (err, user) {
                if (!err && user) {
                    resolve(user);
                } else {
                    resolve(false);
                }
            });
        })
    },
    changeUserSkinByEmail: (email, skinType, skinData) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, '', function (err, user) {
                if (!err && user) {

                    // 储存旧皮肤hash
                    let oldSkinHash = user.skin.hash;

                    // 计算新皮肤hash
                    let newSkinHash = utils.getSkinHash(skinData);

                    // 拼接皮肤目录
                    let skinPath = path.join(utils.getRootPath(), "./skin");

                    // 检查新皮肤是否已存在
                    let isSkinExists = fs.existsSync(`${skinPath}/${newSkinHash}.png`);

                    // 皮肤不存在，写入
                    if (!isSkinExists) {
                        fs.writeFileSync(`${skinPath}/${newSkinHash}.png`, skinData);
                    }

                    user.skin.type = skinType;
                    user.skin.hash = newSkinHash;

                    user.save(function (err) {
                        if (err) {
                            resolve(false);
                            return;
                        }

                        // 旧皮肤为默认皮肤
                        if (oldSkinHash == "9b155b4668427669ca9ed3828024531bc52fca1dcf8fbde8ccac3d9d9b53e3cf") {
                            // 操作完成，返回true
                            resolve(true);
                            return;
                        }

                        // 检查旧hash的皮肤是否有人使用
                        module.exports.searchUserInfoBySkinHash(oldSkinHash).then(
                            result => {
                                // 无人使用，删除旧皮肤
                                if (!result) {
                                    fs.unlinkSync(`${skinPath}/${oldSkinHash}.png`);
                                }

                                // 操作完成，返回true
                                resolve(true);
                            })
                    });
                } else {
                    resolve(false);
                }
            });
        })
    },
    searchUserInfoBySkinHash: (hash) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'skin.hash': hash }, '', function (err, user) {
                if (!err && user) {
                    resolve(user);
                } else {
                    resolve(false);
                }
            });
        })
    },
    searchUserInfoByUUID: (uuid) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'uuid': uuid }, '', function (err, user) {
                if (!err && user) {
                    resolve(user);
                } else {
                    resolve(false);
                }
            });
        })
    },
    letUserLoggedIn: (ctx, email) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, 'email playername password uuid tokens skin isBanned ip time', function (err, user) {
                if (err) throw err;
                user.ip.lastLogged = utils.getUserIp(ctx.req);
                user.time.lastLogged = new Date().getTime();
                user.save(function (err, updatedUser) {
                    if (err) throw err;
                    ctx.session.userInfo = {
                        isLoggedIn: true,
                        email: updatedUser.email,
                        playername: updatedUser.playername,
                        password: updatedUser.password,
                        uuid: updatedUser.uuid,
                        skin: updatedUser.skin,
                        isAdmin: adminList.includes(updatedUser.email),
                        isBanned: updatedUser.isBanned,
                        tokens: updatedUser.tokens,
                        ip: updatedUser.ip,
                        time: updatedUser.time
                    };
                    resolve(true);
                });
            });
        })
    },
    getUserSkin: (email) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, 'skin', function (err, user) {
                if (err) throw err;
                resolve({ "skinType": user.skin.type, "skin": user.skin.hash + ".png" });
            });
        })
    },
    genUserProfile: (userData) => {
        let textureData = {
            timestamp: new Date().getTime(),
            profileId: userData.uuid.replace(/-/g, ""),
            profileName: userData.playername,
            textures: {
                SKIN: {
                    url: `${config.common.url}/textures/${userData.skin.hash}`,
                    metadata: {
                        model: userData.skin.type == 0 ? "default" : "slim"
                    }
                }
            }
        }
        textureData = Buffer.from(JSON.stringify(textureData)).toString("base64");
        let data = {
            id: userData.uuid.replace(/-/g, ""),
            name: userData.playername,
            properties: [
                {
                    "name": "textures",
                    "value": textureData,
                    "signature": utils.genSignedData(textureData)
                }
            ]
        }
        return data;
    },
    genUserList: (filter, currectPage, pageSize) => {
        return new Promise((resolve, reject) => {
            User.countDocuments(filter || {}, (error, count) => {
                if (error) {
                    reject({ code: -1 });
                } else {
                    pageSize = pageSize || 8;
                    if (filter) {
                        User
                            .find(filter, 'email playername uuid isBanned time.register')
                            .skip((currectPage - 1) * pageSize)
                            .limit(pageSize)
                            .sort({ 'time.register': 1 })
                            .exec((err, doc) => {
                                if (err) {
                                    reject({ code: -1 });
                                } else {
                                    for (let i = 0; i < doc.length; i++) {
                                        doc[i]["_doc"]["isAdmin"] = adminList.includes(doc[i]["email"]);
                                        delete doc[i]["_doc"]["_id"];
                                    }
                                    resolve({
                                        total: count,
                                        data: doc
                                    })
                                }
                            })
                    } else {
                        User
                            .find({ id: { $gt: (currectPage - 1) * pageSize, $lte: (currectPage) * pageSize } }, 'email playername uuid isBanned time.register')
                            .sort({ 'time.register': 1 })
                            .exec((err, doc) => {
                                if (err) {
                                    reject({ code: -1 });
                                } else {
                                    for (let i = 0; i < doc.length; i++) {
                                        doc[i]["_doc"]["isAdmin"] = adminList.includes(doc[i]["email"]);
                                        delete doc[i]["_doc"]["_id"];
                                    }
                                    resolve({
                                        total: count,
                                        data: doc
                                    })
                                }
                            })
                    }

                }
            })
        })
    },
    switchUserStatusByUUID: (uuid) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'uuid': uuid }, 'email isBanned', function (err, user) {
                if (!err && user) {
                    // 被操作对象是管理员，操作失败
                    if (adminList.includes(user["email"])) {
                        reject({ code: -2 });
                        return;
                    }

                    if (user.isBanned == true) {
                        user.isBanned = false;
                    } else {
                        user.isBanned = true;
                    }

                    user.save(function (err) {
                        if (err) {
                            reject({ code: -1 });
                            return;
                        }

                        resolve({ code: 0 });
                    });
                } else {
                    reject({ code: -1 });
                }
            });
        })
    }
}