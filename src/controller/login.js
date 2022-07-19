/* controller/login.js */

const CryptoJS = require('crypto-js')
const config = require('../config')
const User = require('../service/user')

module.exports = {
  frontend: async (ctx) => {
    const userData = await User.getUserInfo(ctx).then((ret) => ret)
    await ctx.render('login', {
      config: config.common,
      user: userData
    })
  },
  handle: async (ctx) => {
    const data = {}
    const time = Date.now()
    let body = {}
    const userData = await User.getUserInfo(ctx).then((ret) => ret)
    if (userData.isLoggedIn) {
      data.code = -1
      data.msg = '你已登录'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }
    if (!ctx.request.body.data) {
      data.code = -1
      data.msg = '解析数据发生错误'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }
    if (
      !ctx.session.key ||
      !ctx.session.key.secret ||
      !ctx.session.key.iv ||
      !ctx.session.key.ts ||
      time - ctx.session.key.ts > 300000
    ) {
      data.code = -1
      data.msg = '传输凭证无效'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }
    body = ctx.request.body.data
    const secret = CryptoJS.enc.Hex.parse(ctx.session.key.secret)
    const iv = CryptoJS.enc.Hex.parse(ctx.session.key.iv)
    try {
      body = JSON.parse(
        CryptoJS.AES.decrypt(body, secret, { iv, padding: CryptoJS.pad.ZeroPadding }).toString(CryptoJS.enc.Utf8)
      )
    } catch (error) {
      data.code = -1
      data.msg = '解密数据发生错误'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }

    if (
      !ctx.session.captcha ||
      !ctx.session.captcha.text ||
      !ctx.session.captcha.ts ||
      time - ctx.session.captcha.ts > 300000
    ) {
      ctx.session.captcha.text = Math.random()
      data.code = -1
      data.msg = '验证码超时/无效'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }

    if (body.captcha !== ctx.session.captcha.text) {
      ctx.session.captcha.text = Math.random()
      data.code = -1
      data.msg = '验证码无效'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }
    if (!body.email || !body.password) {
      data.code = -1
      data.msg = '邮箱/密码不能为空'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }

    if (
      !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        body.email
      )
    ) {
      data.code = -1
      data.msg = '邮箱格式不正确'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
      return
    }

    try {
      const emailExists = await User.isUserExists('email', body.email).then((exists) => exists)
      if (!emailExists) {
        data.code = -1
        data.msg = '该邮箱还未注册'
        ctx.set('Content-Type', 'application/json')
        ctx.body = JSON.stringify(data)
        return
      }

      const pwCorrect = await User.isUserPasswordCorrect(
        body.email,
        CryptoJS.HmacSHA256(body.password, config.extra.slat).toString()
      ).then((ret) => ret)
      if (!pwCorrect) {
        data.code = -1
        data.msg = '密码不正确'
        ctx.set('Content-Type', 'application/json')
        ctx.body = JSON.stringify(data)
        return
      }
      ctx.session.captcha.text = Math.random()
      await User.letUserLoggedIn(ctx, body.email).then((ret) => ret)
      data.code = 1000
      data.msg = '登录成功'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
    } catch (error) {
      data.code = -1
      data.msg = '未知错误'
      ctx.set('Content-Type', 'application/json')
      ctx.body = JSON.stringify(data)
    }
  }
}
