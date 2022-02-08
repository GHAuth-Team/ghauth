/* controller/forgetpw.js */

const CryptoJS = require('crypto-js');
const config = require('../config');
const User = require('../service/user');
const Forgetpw = require('../service/forgetpw');

module.exports = {
  frontend: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    await ctx.render('forgetpw', {
      config: config.common,
      user: userData,
    });
  },
  handle: async (ctx) => {
    const data = {};
    const time = Date.now();
    let body = {};
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    if (userData.isLoggedIn) {
      data.code = -1;
      data.msg = '你已登录';
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

    if (!ctx.session.captcha || !ctx.session.captcha.text || !ctx.session.captcha.ts || time - ctx.session.captcha.ts > 300000) {
      ctx.session.captcha.text = Math.random();
      data.code = -1;
      data.msg = '验证码超时/无效';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    if (body.captcha !== ctx.session.captcha.text) {
      ctx.session.captcha.text = Math.random();
      data.code = -1;
      data.msg = '验证码无效';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    if (!body.email) {
      data.code = -1;
      data.msg = '邮箱不能为空';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(body.email)) {
      data.code = -1;
      data.msg = '邮箱格式不正确';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    try {
      const emailExists = await User.isUserExists('email', body.email).then((exists) => exists);
      if (!emailExists) {
        data.code = -1;
        data.msg = '该邮箱还未注册';
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }

      const userInfo = await User.searchUserInfoByEmail(body.email).then((ret) => ret);

      const isVerifyTokenExists = await Forgetpw.isVerifyTokenExists(userInfo.id).then((ret) => ret);

      // 密码重置token还未过期
      if (isVerifyTokenExists) {
        const verifyTokenTime = await Forgetpw.getVerifyTokenTime(userInfo.id).then((ret) => ret);
        if (!verifyTokenTime) {
          data.code = -1;
          data.msg = '未知错误，请稍后重试';
          ctx.set('Content-Type', 'application/json');
          ctx.body = JSON.stringify(data);
          return;
        }
        const timeNow = Math.floor(new Date().getTime() / 1000);
        data.code = -1;
        data.msg = `约${Math.ceil((verifyTokenTime - timeNow) / 60)}分钟后才能再次发送密码重置邮件`;
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }

      const token = Forgetpw.genVerifyToken();
      await Forgetpw.storeVerifyTokenToRedis(userInfo.id, token).then((ret) => ret);

      const result = await Forgetpw.sendVerifyUrl(userInfo.email, userInfo.playername, userInfo.id, token).then((ret) => ret);

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

      ctx.session.captcha.text = Math.random();
    } catch (error) {
      data.code = -1;
      data.msg = '未知错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
    }
  },
  changeFrontend: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    const playerId = ctx.params.id;
    const { token } = ctx.params;
    const result = await Forgetpw.isVerifyTokenCurrect(playerId, token).then((ret) => ret);
    let isCurrect = false;
    if (result) {
      isCurrect = true;
    }

    await ctx.render('forgetpw_change', {
      config: config.common,
      user: userData,
      isCurrect,
    });
  },
  changeHandle: async (ctx) => {
    const data = {};
    const time = Date.now();
    let body = {};
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    if (userData.isLoggedIn) {
      data.code = -1;
      data.msg = '你已登录';
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

    if (!ctx.session.captcha || !ctx.session.captcha.text || !ctx.session.captcha.ts || time - ctx.session.captcha.ts > 300000) {
      ctx.session.captcha.text = Math.random();
      data.code = -1;
      data.msg = '验证码超时/无效';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    if (body.captcha !== ctx.session.captcha.text) {
      ctx.session.captcha.text = Math.random();
      data.code = -1;
      data.msg = '验证码无效';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }
    if (!body.password) {
      data.code = -1;
      data.msg = '密码不能为空';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    if (body.password.length > 150) {
      data.code = -1;
      data.msg = '密码不合法';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    const playerId = ctx.params.id;
    const { token } = ctx.params;
    const result = await Forgetpw.isVerifyTokenCurrect(playerId, token).then((ret) => ret);
    if (!result) {
      data.code = -1;
      data.msg = '链接无效或已过期';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    await Forgetpw.delVerifyToken(playerId);

    try {
      // 获取用户信息
      const userInfo = await User.searchUserInfoByID(playerId).then((ret) => ret);

      const changepwResult = await User.changeUserPassword(userInfo.email, body.password).then((ret) => ret);
      if (!changepwResult) {
        data.code = -1;
        data.msg = '修改密码时发生错误';
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }
      ctx.session.captcha.text = Math.random();
      data.code = 1000;
      data.msg = '密码修改成功';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
    } catch (error) {
      data.code = -1;
      data.msg = '未知错误';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
    }
  },
};
