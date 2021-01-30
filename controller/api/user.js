/* controller/user.js */
const config = require("../../config");
const user = require("../../service/user");
const CryptoJS = require("crypto-js");
const utils = require("../../utils");

module.exports = {
    changepassword: async (ctx, next) => {
        let data = {};
        let time = Date.now();
        body = {};
        let userData = await user.getUserInfo(ctx).then(result => { return result; });
        if (!userData["isLoggedIn"]) {
            data.code = -1;
            data.msg = "你未登录";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }
        if (!ctx.request.body["data"]) {
            data.code = -1;
            data.msg = "解析数据发生错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }
        if (!ctx.session.key || !ctx.session.key.secret || !ctx.session.key.iv || !ctx.session.key.ts || time - ctx.session.key.ts > 300000) {
            data.code = -1;
            data.msg = "传输凭证无效";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }
        body = ctx.request.body["data"];
        let secret = CryptoJS.enc.Hex.parse(ctx.session.key.secret);
        let iv = CryptoJS.enc.Hex.parse(ctx.session.key.iv);
        try {
            body = JSON.parse(CryptoJS.AES.decrypt(body, secret, { iv: iv, padding: CryptoJS.pad.ZeroPadding }).toString(CryptoJS.enc.Utf8));
        } catch (error) {
            data.code = -1;
            data.msg = "解密数据发生错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        if (!body.old_password || !body.new_password) {
            data.code = -1;
            data.msg = "旧密码/新密码不能为空";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        // 检查旧密码是否正确
        let pwCorrect = await user.isUserPasswordCorrect(userData["email"], CryptoJS.HmacSHA256(body.old_password, config.extra.slat).toString()).then(result => { return result });
        if (!pwCorrect) {
            data.code = -1;
            data.msg = "旧密码不正确";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        // 修改用户密码
        let result = await user.changeUserPassword(userData["email"], body.new_password).then(result => { return result; });

        if (!result) {
            data.code = -1;
            data.msg = "未知错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        data.code = 1000;
        data.msg = "密码修改成功";
        ctx.set("Content-Type", "application/json");
        ctx.body = JSON.stringify(data);
    },
    uploadskin: async (ctx, next) => {
        let data = {};
        let time = Date.now();
        body = {};
        let userData = await user.getUserInfo(ctx).then(result => { return result; });
        if (!userData["isLoggedIn"]) {
            data.code = -1;
            data.msg = "你未登录";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }
        if (!ctx.request.body["data"]) {
            data.code = -1;
            data.msg = "解析数据发生错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }
        if (!ctx.session.key || !ctx.session.key.secret || !ctx.session.key.iv || !ctx.session.key.ts || time - ctx.session.key.ts > 300000) {
            data.code = -1;
            data.msg = "传输凭证无效";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }
        body = ctx.request.body["data"];
        let secret = CryptoJS.enc.Hex.parse(ctx.session.key.secret);
        let iv = CryptoJS.enc.Hex.parse(ctx.session.key.iv);
        try {
            body = JSON.parse(CryptoJS.AES.decrypt(body, secret, { iv: iv, padding: CryptoJS.pad.ZeroPadding }).toString(CryptoJS.enc.Utf8));
        } catch (error) {
            data.code = -1;
            data.msg = "解密数据发生错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        if (!body.hasOwnProperty("type") || !body.skin) {
            data.code = -1;
            data.msg = "参数错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        if (body.type != 0 && body.type != 1) {
            data.code = -1;
            data.msg = "皮肤模型选择错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        // 处理皮肤图片
        let skinData = utils.handleSkinImage(Buffer.from(body.skin, 'base64'));

        if (!skinData) {
            data.code = -1;
            data.msg = "服务器无法处理你的皮肤";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }


        // 修改用户皮肤
        let result = await user.changeUserSkinByEmail(userData["email"], body.type, skinData).then(result => { return result; });

        if (!result) {
            data.code = -1;
            data.msg = "未知错误";
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify(data);
            return;
        }

        data.code = 1000;
        data.msg = "皮肤修改成功";
        ctx.set("Content-Type", "application/json");
        ctx.body = JSON.stringify(data);
    }
}