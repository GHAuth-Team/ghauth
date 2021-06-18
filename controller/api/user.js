/* controller/user.js */
const CryptoJS = require('crypto-js');
const config = require('../../config');
const User = require('../../service/user');
const utils = require('../../utils');

module.exports = {
  changepassword: async (ctx) => {
    const data = {};
    const time = Date.now();
    let body = {};
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    if (!userData.isLoggedIn) {
      data.code = -1;
      data.msg = '你未登录';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    if (!ctx.request.body.data) {
      data.code = -1;
      data.msg = '解析数据发生错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    if (!ctx.session.key || !ctx.session.key.secret || !ctx.session.key.iv || !ctx.session.key.ts || time - ctx.session.key.ts > 300000) {
      data.code = -1;
      data.msg = '传输凭证无效';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    body = ctx.request.body.data;
    const secret = CryptoJS.enc.Hex.parse(ctx.session.key.secret);
    const iv = CryptoJS.enc.Hex.parse(ctx.session.key.iv);
    try {
      body = JSON.parse(CryptoJS.AES.decrypt(body, secret, { iv, padding: CryptoJS.pad.ZeroPadding }).toString(CryptoJS.enc.Utf8));
    } catch (error) {
      data.code = -1;
      data.msg = '解密数据发生错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    if (!body.oldPassword || !body.newPassword) {
      data.code = -1;
      data.msg = '旧密码/新密码不能为空';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    // 检查旧密码是否正确
    const pwCorrect = await User.isUserPasswordCorrect(userData.email, CryptoJS.HmacSHA256(body.oldPassword, config.extra.slat).toString()).then((ret) => ret);
    if (!pwCorrect) {
      data.code = -1;
      data.msg = '旧密码不正确';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    // 修改用户密码
    const result = await User.changeUserPassword(userData.email, body.newPassword).then((ret) => ret);

    if (!result) {
      data.code = -1;
      data.msg = '未知错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    data.code = 1000;
    data.msg = '密码修改成功';
    ctx.set('Content-Type', 'application/json');
    ctx.body = JSON.stringify(data);
  },
  uploadskin: async (ctx) => {
    const data = {};
    const time = Date.now();
    let body = {};
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    if (!userData.isLoggedIn) {
      data.code = -1;
      data.msg = '你未登录';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    if (!ctx.request.body.data) {
      data.code = -1;
      data.msg = '解析数据发生错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    if (!ctx.session.key || !ctx.session.key.secret || !ctx.session.key.iv || !ctx.session.key.ts || time - ctx.session.key.ts > 300000) {
      data.code = -1;
      data.msg = '传输凭证无效';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    body = ctx.request.body.data;
    const secret = CryptoJS.enc.Hex.parse(ctx.session.key.secret);
    const iv = CryptoJS.enc.Hex.parse(ctx.session.key.iv);
    try {
      body = JSON.parse(CryptoJS.AES.decrypt(body, secret, { iv, padding: CryptoJS.pad.ZeroPadding }).toString(CryptoJS.enc.Utf8));
    } catch (error) {
      data.code = -1;
      data.msg = '解密数据发生错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(body, 'type') || !body.skin) {
      data.code = -1;
      data.msg = '参数错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    if (body.type !== 0 && body.type !== 1) {
      data.code = -1;
      data.msg = '皮肤模型选择错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    // 处理皮肤图片
    const skinData = utils.handleSkinImage(Buffer.from(body.skin, 'base64'));

    if (!skinData) {
      data.code = -1;
      data.msg = '服务器无法处理你的皮肤';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    // 修改用户皮肤
    const result = await User.changeUserSkinByEmail(userData.email, body.type, skinData).then((ret) => ret);

    if (!result) {
      data.code = -1;
      data.msg = '未知错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    data.code = 1000;
    data.msg = '皮肤修改成功';
    ctx.set('Content-Type', 'application/json');
    ctx.body = JSON.stringify(data);
  },
};
