/* controller/ownskin.js */
const user = require("../../service/user");
const path = require("path");
const fs = require("fs");
const utils = require("../../utils");

module.exports = {
    ownskin: async (ctx, next) => {
        let data = {};
        let userInfo = await user.getUserInfo(ctx).then(result => { return result; });
        if (userInfo.isLoggedIn) {
            let result = await user.getUserSkin(userInfo.email).then(result => { return result; });
            let skinPath = path.join(utils.getRootPath(), "./skin");
            result.skin = fs.readFileSync(path.join(skinPath, result.skin));
            result.skin = Buffer.from(result.skin).toString("base64");
            result.skin = "data:image/png;base64," + result.skin;
            data.data = result;
            data.code = 1000;
        } else {
            data.code = -1;
            data.msg = "你还没有登录";
        }
        ctx.set("Content-Type", "application/json");
        ctx.body = JSON.stringify(data);
    }
}