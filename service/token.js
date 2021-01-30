const User = require("../db/models/user");
const user = require("./user");
const utils = require("../utils");
const redis = require("../db/redis");

module.exports = {
    genAccessToken: (email, clientToken) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, 'tokens isBanned', function (err, user) {
                if (err) throw err;
                if (user && !user.isBanned) {
                    let tokens = user.tokens;

                    // 遍历所有旧token并使其暂时失效
                    for (let i = 0; i < tokens.length; i++) {
                        tokens[i]["status"] = 0;
                    }

                    // 遍历所有旧token并删除过期token
                    for (let i = 0; i < tokens.length; i++) {
                        if (Date.now() - tokens[i]["createAt"] >= 432000000) {
                            tokens[i].remove();
                        }
                    }

                    // 生成新token
                    let newToken = {
                        accessToken: utils.genUUID().replace(/-/g, ""),
                        clientToken: clientToken
                    }
                    tokens.push(newToken);
                    user.tokens = tokens;
                    user.save();
                    resolve(newToken.accessToken);
                } else {
                    resolve(false);
                }
            });
        })
    },
    searchUserByAccessToken: (accessToken) => {
        return new Promise((resolve, reject) => {
            let query = { tokens: { $elemMatch: { accessToken: accessToken } } };
            User.findOne(query, '', function (err, user) {
                if (err) throw err;
                if (user) {
                    resolve(user);
                } else {
                    resolve(false);
                }
            });
        })
    },
    refreshAccessToken: (accessToken, clientToken) => {
        return new Promise((resolve, reject) => {
            let query = { tokens: { $elemMatch: { accessToken: accessToken } } };
            User.findOne(query, 'tokens uuid playername', function (err, user) {
                if (err) throw err;
                if (user && !user.isBanned) {
                    let tokenIndex = -1;
                    for (let i = 0; i < user.tokens.length; i++) {
                        if (user.tokens[i].accessToken == accessToken) {
                            tokenIndex = i;
                            break;
                        }
                    }

                    // 未找到指定accessToken
                    if (tokenIndex == -1) {
                        resolve(false);
                        return;
                    }

                    // clientToken不匹配
                    if (clientToken) {
                        if (clientToken != user.tokens[tokenIndex].clientToken) {
                            resolve(false);
                            return;
                        }
                    }

                    // accessToken已过期
                    if (Date.now() - user.tokens[tokenIndex]["createAt"] >= 432000000) {
                        user.tokens[tokenIndex].remove();
                        user.save();
                        resolve(false);
                        return;
                    }

                    user.tokens[tokenIndex]["status"] = 1;
                    user.save();
                    resolve({
                        accessToken: user.tokens[tokenIndex]["accessToken"],
                        clientToken: user.tokens[tokenIndex]["clientToken"],
                        uuid: user.uuid,
                        playername: user.playername,
                    });
                    return;
                }
                resolve(false);

            });
        })
    },
    validateAccessToken: (accessToken, clientToken) => {
        return new Promise((resolve, reject) => {
            let query = { tokens: { $elemMatch: { accessToken: accessToken } } };
            User.findOne(query, 'tokens uuid playername', function (err, user) {
                if (err) throw err;
                if (user && !user.isBanned) {
                    let tokenIndex = -1;
                    for (let i = 0; i < user.tokens.length; i++) {
                        if (user.tokens[i].accessToken == accessToken) {
                            tokenIndex = i;
                            break;
                        }
                    }

                    // 未找到指定accessToken
                    if (tokenIndex == -1) {
                        resolve(false);
                        return;
                    }

                    // clientToken不匹配
                    if (clientToken) {
                        if (clientToken != user.tokens[tokenIndex].clientToken) {
                            resolve(false);
                            return;
                        }
                    }

                    // accessToken已过期
                    if (Date.now() - user.tokens[tokenIndex]["createAt"] >= 432000000) {
                        user.tokens[tokenIndex].remove();
                        user.save();
                        resolve(false);
                        return;
                    }

                    // accessToken暂时失效
                    if (user.tokens[tokenIndex]["status"] != 1) {
                        resolve(false);
                        return;
                    }

                    resolve(true);
                    return;
                }
                resolve(false);
            });
        })
    },
    invalidateAccessToken: (accessToken) => {
        return new Promise((resolve, reject) => {
            let query = { tokens: { $elemMatch: { accessToken: accessToken } } };
            User.findOne(query, 'tokens _id', function (err, user) {
                if (err) throw err;
                if (user && !user.isBanned) {
                    let tokenIndex = -1;
                    for (let i = 0; i < user.tokens.length; i++) {
                        if (user.tokens[i].accessToken == accessToken) {
                            tokenIndex = i;
                            break;
                        }
                    }

                    // 未找到指定accessToken
                    if (tokenIndex == -1) {
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
        })
    },
    invalidateAllAccessToken: (email, password) => {
        return new Promise((resolve, reject) => {
            User.findOne({ 'email': email }, 'tokens password', function (err, user) {
                if (err) throw err;
                if (user && !user.isBanned) {
                    let tokens = user.tokens;

                    // 密码不正确
                    if (password != user.password) {
                        resolve(false);
                    }

                    // 遍历所有token并删除
                    for (let i = 0; i < tokens.length; i++) {
                        tokens[i].remove();
                    }
                    user.tokens = tokens;
                    user.save();
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        })
    },
    clientToServerValidate: (accessToken, selectedProfile, serverId, ip) => {
        return new Promise((resolve, reject) => {
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

                // 令牌对应玩家uuid不一致
                if (result.uuid.replace(/-/g, "") != selectedProfile) {
                    resolve(false);
                    return;
                }

                let data = {
                    accessToken: accessToken,
                    selectedProfile: selectedProfile,
                    username: result.playername,
                    ip: ip
                }

                data = JSON.stringify(data);
                // 将授权信息储存至redis，15秒过期
                redis.set(serverId, data, "EX", 15).then(
                    result => {
                        resolve(true);
                    }
                );
                
            });
        })

    },
    serverToClientValidate: (username, serverId, ip) => {
        return new Promise((resolve, reject) => {

            // 根据serverId获取对应授权信息
            redis.get(serverId, function (err, response) {
                // 未找到对应授权信息或发生错误
                if (err || !response) {
                    resolve(false);
                    return;
                }

                let clientData = JSON.parse(response);

                // 玩家名称与授权不对应
                if (clientData.username != username) {
                    resolve(false);
                    return;
                }

                //若提供了客户端ip，则需要判断储存的客户端ip与其是否一致
                if (ip) {
                    if (clientData.ip != ip) {
                        resolve(false);
                        return;
                    }
                }

                // 根据accessToken获取玩家资料
                module.exports.searchUserByAccessToken(clientData.accessToken).then((result) => {
                    // 生成玩家完整Profile
                    let data = user.genUserProfile(result);
                    resolve(data);
                });

            })
        })

    }
}