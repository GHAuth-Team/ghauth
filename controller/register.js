/* controller/register.js */

const CryptoJS = require('crypto-js');
const config = require('../config');
const User = require('../service/user');
const utils = require('../utils');

module.exports = {
  frontend: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret);
    await ctx.render('register', {
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
    if (!body.email || !body.password || !body.playername) {
      data.code = -1;
      data.msg = '邮箱/密码/游戏昵称不能为空';
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

    if (body.email.length < 5 || body.email.length > 40) {
      data.code = -1;
      data.msg = '邮箱不合法';
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

    if (!/^[A-Za-z0-9_]+$/.test(body.playername) || body.playername.length < 4 || body.playername.length > 12) {
      data.code = -1;
      data.msg = '游戏昵称不合法';
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify(data);
      return;
    }

    try {
      const emailExists = await User.isUserExists('email', body.email).then((exists) => exists);
      if (emailExists) {
        data.code = -1;
        data.msg = '邮箱地址已存在';
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }

      const playerNameExists = await User.isUserExists('playername', body.playername).then((exists) => exists);
      if (playerNameExists) {
        data.code = -1;
        data.msg = '游戏昵称已存在';
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }

      // 获取用户总数
      const userNumber = await User.getUserNumber().then((ret) => ret);

      if (userNumber === -1) {
        data.code = -1;
        data.msg = '处理用户ID时发生错误';
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }

      const userInfo = {
        id: userNumber + 1,
        email: body.email,
        playername: body.playername,
        uuid: utils.genUUID(),
        password: CryptoJS.HmacSHA256(body.password, config.extra.slat).toString(),
        ip: {
          register: utils.getUserIp(ctx.req),
          lastLogged: utils.getUserIp(ctx.req),
        },
        time: {
          register: Date.now(),
          lastLogged: Date.now(),
        },
      };
      const registerResult = await User.createNewUser(userInfo).then((ret) => ret);
      if (!registerResult) {
        data.code = -1;
        data.msg = '写入用户数据时发生错误';
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(data);
        return;
      }
      ctx.session.captcha.text = Math.random();
      await User.letUserLoggedIn(ctx, body.email).then((ret) => ret);
      data.code = 1000;
      data.msg = '注册成功';
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
