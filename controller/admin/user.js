/* controller/user.js */

const user = require("../../service/user");
const Uuid = require("uuid");

module.exports = {
    getUserList: async (ctx, next) => {
        let userData = await user.getUserInfo(ctx).then(result => { return result; });
        if (!userData.isAdmin) {
            // 非法访问
            ctx.status = 403;
            ctx.set("Content-Type", "application/json");
            ctx.body = {
                "error": "ForbiddenOperationException",
                "errorMessage": "No permissions."
            };
            return;
        }
        let currectPage = parseInt(ctx.request.query["currectPage"]) || 1;
        let pageSize = parseInt(ctx.request.query["pageSize"]) || 5;
        let filter = ctx.request.query["filter"];
        if (filter) {
            filter = {
                $or: [
                    { playername: { "$regex": new RegExp(filter.toString()) } },
                    { email: { "$regex": new RegExp(filter.toString()) } }
                ]
            }
        }
        let userList = await user.genUserList(filter, currectPage, pageSize).then(result => { return result; });
        ctx.status = 200;
        ctx.set("Content-Type", "application/json");
        ctx.body = userList;
    },
    switchUserStatus: async (ctx, next) => {
        let userData = await user.getUserInfo(ctx).then(result => { return result; });
        if (!userData.isAdmin) {
            // 非法访问
            ctx.status = 403;
            ctx.set("Content-Type", "application/json");
            ctx.body = {
                "error": "ForbiddenOperationException",
                "errorMessage": "No permissions."
            };
            return;
        }
        let uuid = ctx.request.query["uuid"];
        if (!Uuid.validate(uuid)) {
            // uuid不合法
            ctx.status = 403;
            ctx.set("Content-Type", "application/json");
            ctx.body = {
                "error": "ForbiddenOperationException",
                "errorMessage": "Invalid uuid."
            };
            return;
        }
        let result = await user.switchUserStatusByUUID(uuid).then(result => { return result; });

        ctx.status = 200;
        ctx.body = result;
        ctx.set("Content-Type", "application/json");

    },
}