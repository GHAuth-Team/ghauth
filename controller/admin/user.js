/* controller/user.js */

const Uuid = require('uuid');
const User = require('../../service/user');

module.exports = {
  getUserList: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    if (!userData.isAdmin) {
      // 非法访问
      ctx.status = 403;
      ctx.set('Content-Type', 'application/json');
      ctx.body = {
        error: 'ForbiddenOperationException',
        errorMessage: 'No permissions.',
      };
      return;
    }
    const currectPage = Number.parseInt(ctx.request.query.currectPage, 10) || 1;
    const pageSize = Number.parseInt(ctx.request.query.pageSize, 10) || 5;
    let { filter } = ctx.request.query;
    if (filter) {
      filter = {
        $or: [
          { playername: { $regex: new RegExp(filter.toString()) } },
          { email: { $regex: new RegExp(filter.toString()) } },
        ],
      };
    }
    const userList = await User.genUserList(filter, currectPage, pageSize).then((ret) => ret);
    ctx.status = 200;
    ctx.set('Content-Type', 'application/json');
    ctx.body = userList;
  },
  switchUserStatus: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    if (!userData.isAdmin) {
      // 非法访问
      ctx.status = 403;
      ctx.set('Content-Type', 'application/json');
      ctx.body = {
        error: 'ForbiddenOperationException',
        errorMessage: 'No permissions.',
      };
      return;
    }
    const { uuid } = ctx.request.query;
    if (!Uuid.validate(uuid)) {
      // uuid不合法
      ctx.status = 403;
      ctx.set('Content-Type', 'application/json');
      ctx.body = {
        error: 'ForbiddenOperationException',
        errorMessage: 'Invalid uuid.',
      };
      return;
    }
    const result = await User.switchUserStatusByUUID(uuid).then((ret) => ret);

    ctx.status = 200;
    ctx.body = result;
    ctx.set('Content-Type', 'application/json');
  },
};
