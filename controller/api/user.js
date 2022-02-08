/* controller/user.js */
const CryptoJS = require('crypto-js');
const config = require('../../config');
const User = require('../../service/user');
const Email = require('../../service/email');
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
    if (userData.verified) {
      data.code = -1;
      data.msg = '邮箱未验证，无法上传皮肤';
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
  sendverifyemail: async (ctx) => {
    const data = {};
    const userData = await User.getUserInfo(ctx).then((ret) => ret);

    // 未登录账号
    if (!userData.isLoggedIn) {
      data.code = -1;
      data.msg = '你未登录';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    // 账号已经通过验证
    if (userData.verified) {
      data.code = -1;
      data.msg = '无需重复验证';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    const isVerifyTokenExists = await Email.isVerifyTokenExists(userData.id).then((ret) => ret);

    // 账号的验证token还未过期
    if (isVerifyTokenExists) {
      const verifyTokenTime = await Email.getVerifyTokenTime(userData.id).then((ret) => ret);
      if (!verifyTokenTime) {
        data.code = -1;
        data.msg = '未知错误，请稍后重试';
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }
      const timeNow = Math.floor(new Date().getTime() / 1000);
      data.code = -1;
      data.msg = `约${Math.floor((verifyTokenTime - timeNow) / 60)}分钟后才能再次发送验证邮件`;
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    const token = Email.genVerifyToken();
    await Email.storeVerifyTokenToRedis(userData.id, token).then((ret) => ret);

    const result = await Email.sendVerifyUrl(userData.email, userData.playername, userData.id, token).then((ret) => ret);

    if (!result) {
      data.code = -1;
      data.msg = '未知错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    data.code = 1000;
    data.msg = '邮件已发送，请查看您的收件箱';
    ctx.set('Content-Type', 'application/json');
    ctx.body = JSON.stringify(data);
  },
  emailcheck: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    const playerId = ctx.params.id;
    const { token } = ctx.params;
    const result = await Email.isVerifyTokenCurrect(playerId, token).then((ret) => ret);
    let isCurrect = false;
    if (result) {
      isCurrect = true;
      await Email.delVerifyToken(playerId);
      await User.changeUserVerifiedStatusById(playerId, true);
    }

    await ctx.render('emailcheck', {
      config: config.common,
      user: userData,
      isCurrect,
    });
  },
};
