/* controller/yggdrasil.js */

const config = require("../../config");
const package = require("../../package.json");
const utils = require("../../utils");
const suser = require("../../service/user");
const stoken = require("../../service/token");
const CryptoJS = require("crypto-js");
const user = require("../../service/user");

module.exports = {
    yggdrasil: async (ctx, next) => {
        ctx.set("Content-Type", "application/json");
        let data = {
            "meta": {
                "implementationName": config.common.sitename + "GHAuth Yggdrasil", // Yggdrasil协议名称
                "implementationVersion": package.version, // Yggdrasil协议版本
                "serverName": config.common.sitename, // Yggdrasil认证站点名称
                "links": {
                    "homepage": config.common.url,
                    "register": `${config.common.url}/register`
                },
            },
            "skinDomains": config.extra.skinDomains, // 可信域（皮肤加载所信任的域名）
            "signaturePublickey": config.extra.signature.public // 签名公钥
        }
        ctx.body = data;
    },
    authserver: {
        authenticate: async (ctx, next) => {
            const data = ctx.request.body;
            ctx.set("Content-Type", "application/json");

            // 用户名/密码不存在，返回403
            if (!data["username"] || !data["password"]) {
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid credentials. Invalid username or password."
                };
                return;
            }
            let username = data["username"];
            let password = data["password"];
            let clientToken = data["clientToken"] || utils.genUUID().replace(/-/g, "");
            let requestUser = data["requestUser"] || false;

            // 密码预处理
            password = password + "dKfkZh";
            password = CryptoJS.SHA3(password);
            password = password.toString(CryptoJS.enc.Hex);
            password = CryptoJS.HmacSHA256(password, config.extra.slat).toString();

            // 查找用户信息
            let userData = await suser.searchUserInfoByEmail(username).then(result => { return result; });

            // 未找到用户
            if (!userData) {
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid credentials. Invalid username or password."
                };
                return;
            }

            //用户被封禁
            if (userData.isBanned) {
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid credentials. Invalid username or password."
                };
                return;
            }

            //用户密码不正确
            if (userData.password != password) {
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid credentials. Invalid username or password."
                };
                return;
            }

            // 生成accessToken
            let accessToken = await stoken.genAccessToken(username, clientToken).then(result => { return result; });
            let profileData = {
                "id": userData.uuid.replace(/-/g, ""),
                "name": userData.playername,
            }
            let responseData = {
                "accessToken": accessToken,
                "clientToken": clientToken,
                "availableProfiles": [
                    profileData
                ],
                "selectedProfile": profileData,
            }
            if (requestUser) {
                responseData["user"] = {
                    id: userData.uuid.replace(/-/g, "")
                }
            }
            ctx.body = responseData;
        },
        refresh: async (ctx, next) => {
            const data = ctx.request.body;
            ctx.set("Content-Type", "application/json");
            console.log(ctx.body)
            // 属性accessToken不存在，返回403
            if (!data["accessToken"]) {
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid token."
                };
                return;
            }

            let accessToken = data["accessToken"];
            let clientToken = data["clientToken"];
            let requestUser = data["requestUser"] || false;

            // 刷新令牌
            let result = await stoken.refreshAccessToken(accessToken, clientToken).then(result => { return result; });

            // 刷新操作失败
            if (!result) {
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid token."
                };
                return;
            }

            let profileData = {
                "id": result.uuid.replace(/-/g, ""),
                "name": result.playername,
            }

            let responseData = {
                "accessToken": result.accessToken,
                "clientToken": result.clientToken,
                "selectedProfile": profileData,
            }
            if (requestUser) {
                responseData["user"] = {
                    id: result.uuid.replace(/-/g, "")
                }
            }
            ctx.body = responseData;
        },
        validate: async (ctx, next) => {
            const data = ctx.request.body;

            // 属性accessToken不存在
            if (!data["accessToken"]) {
                ctx.set("Content-Type", "application/json");
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid token."
                };
                return;
            }

            let accessToken = data["accessToken"];
            let clientToken = data["clientToken"];

            // 验证令牌
            let result = await stoken.validateAccessToken(accessToken, clientToken).then(result => { return result; });

            // 验证失败或令牌无效
            if (!result) {
                ctx.set("Content-Type", "application/json");
                ctx.status = 403;
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid token."
                };
                return;
            }

            // 令牌有效，返回204
            ctx.status = 204;
        },
        invalidate: async (ctx, next) => {
            const data = ctx.request.body;

            if (data["accessToken"]) {
                await stoken.invalidateAccessToken(data["accessToken"]);
            }

            // 吊销令牌（无论如何都返回204）
            ctx.status = 204;
        },
        signout: async (ctx, next) => {
            const data = ctx.request.body;
            if (!data["username"] || !data["password"]) {
                ctx.status = 403;
                ctx.set("Content-Type", "application/json");
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid credentials. Invalid username or password."
                };
                return;
            }
            let username = data["username"];
            let password = data["password"];

            // 密码预处理
            password = password + "dKfkZh";
            password = CryptoJS.SHA3(password);
            password = password.toString(CryptoJS.enc.Hex);
            password = CryptoJS.HmacSHA256(password, config.extra.slat).toString();

            // 删除用户所有token
            let result = await stoken.invalidateAllAccessToken(username, password).then(result => { return result; });

            // 操作失败，返回403
            if (!result) {
                ctx.status = 403;
                ctx.set("Content-Type", "application/json");
                ctx.body = {
                    "error": "ForbiddenOperationException",
                    "errorMessage": "Invalid credentials. Invalid username or password."
                };
                return;
            }

            // 操作成功，返回204
            ctx.status = 204;
        }
    },
    sessionserver: {
        session: {
            minecraft: {
                join: async (ctx, next) => {
                    const data = ctx.request.body;
                    if (!data["accessToken"] || !data["selectedProfile"] || !data["serverId"] || data["selectedProfile"].length != 32 || data["accessToken"].length != 32) {
                        ctx.status = 403;
                        ctx.set("Content-Type", "application/json");
                        ctx.body = {
                            "error": "ForbiddenOperationException",
                            "errorMessage": "Invalid token."
                        };
                        return;
                    }
                    let accessToken = data["accessToken"];
                    let selectedProfile = data["selectedProfile"];
                    let serverId = data["serverId"];
                    let clientIP = utils.getUserIp(ctx.req);

                    // 比对并储存数据
                    let result = await stoken.clientToServerValidate(accessToken, selectedProfile, serverId, clientIP).then(result => { return result; });

                    // 操作失败，返回403
                    if (!result) {
                        ctx.status = 403;
                        ctx.set("Content-Type", "application/json");
                        ctx.body = {
                            "error": "ForbiddenOperationException",
                            "errorMessage": "Invalid token."
                        };
                        return;
                    }

                    // 操作成功，返回204
                    ctx.status = 204;
                },
                hasJoined: async (ctx, next) => {
                    let username = ctx.query["username"];
                    let serverId = ctx.query["serverId"];
                    let ip = ctx.query["ip"];

                    // 比对授权 生成玩家信息
                    let result = await stoken.serverToClientValidate(username, serverId, ip).then(result => { return result; });

                    if (!result) {
                        // 操作失败，返回204
                        ctx.status = 204;
                        return;
                    }

                    // 操作成功 返回完整玩家信息
                    ctx.set("Content-Type", "application/json");
                    ctx.body = result;

                },
                profile: async (ctx, next) => {
                    // 获取uuid参数
                    let uuid = ctx.params.uuid;

                    //uuid格式错误，返回204
                    if (uuid.length != 32) {
                        ctx.status = 204;
                        return;
                    }

                    //处理无符号uuid为有符号uuid
                    uuid = utils.convertUUIDwithHyphen(uuid);

                    // 根据UUID获取玩家信息
                    let userData = await suser.searchUserInfoByUUID(uuid).then(result => { return result; });

                    //玩家不存在，返回204
                    if (!userData) {
                        ctx.status = 204;
                        return;
                    }

                    ctx.set("Content-Type", "application/json");
                    ctx.body = user.genUserProfile(userData);
                }
            }
        }
    }
}