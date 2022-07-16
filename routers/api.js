/* routers/api.js */
const { RateLimit } = require('koa2-ratelimit')
const router = require('koa-router')()

const captchaController = require('../controller/api/captcha') // captchaController
const genkeyController = require('../controller/api/genkey') // genkeyController
const ownskinController = require('../controller/api/ownskin') // ownskinController
const userController = require('../controller/api/user') // userController
const yggdrasilController = require('../controller/api/yggdrasil') // yggdrasilController

// 频率限制中间件
const yggdrasilAuthLimiter = (type) =>
  RateLimit.middleware({
    interval: 60 * 1000,
    delayAfter: 3,
    timeWait: 2 * 1000,
    max: 5, // 每分钟最多5次请求
    async keyGenerator(ctx) {
      const data = ctx.request.body
      const prefixKey = `yggdrasil/${type}`
      if (data.username) {
        return `${prefixKey}|${data.username}`
      }
      return `${prefixKey}|${ctx.request.ip}`
    },
    async handler(ctx) {
      ctx.status = 418
      ctx.set('Content-Type', 'text/html')
      ctx.body = "418 I'm a teapot"
    }
  })

/* ---------- ROUTES START ---------- */

// GET ./api/captcha
// 生成验证码图像
router.get('/captcha', captchaController.captcha)

// POST ./api/genkey
// 生成数据传输所需密钥
router.post('/genkey', genkeyController.genkey)

// GET ./api/ownskin
// 返回登录用户自己的皮肤图片
router.get('/ownskin', ownskinController.ownskin)

// POST ./api/changepassword
// 修改用户密码
router.post('/changepassword', userController.changepassword)

// POST ./api/uploadskin
// 修改用户皮肤
router.post('/uploadskin', yggdrasilAuthLimiter('uploadskin'), userController.uploadskin)

// GET ./api/sendverifyemail
// 发送验证邮件
router.get('/sendverifyemail', userController.sendverifyemail)

// GET ./api/emailcheck/:token/:id
// 邮件验证
router.get('/emailcheck/:token/:id', userController.emailcheck)

// GET ./api/yggdrasil
// Yggdrasil信息获取接口
router.get('/yggdrasil', yggdrasilAuthLimiter('yggdrasil'), yggdrasilController.yggdrasil)

// POST ./api/yggdrasil/authserver/authenticate
// Yggdrasil登录接口
router.post(
  '/yggdrasil/authserver/authenticate',
  yggdrasilAuthLimiter('auth'),
  yggdrasilController.authserver.authenticate
)

// POST ./api/yggdrasil/authserver/refresh
// Yggdrasil令牌刷新接口
router.post('/yggdrasil/authserver/refresh', yggdrasilAuthLimiter('refresh'), yggdrasilController.authserver.refresh)

// POST ./api/yggdrasil/authserver/validate
// Yggdrasil令牌验证接口
router.post('/yggdrasil/authserver/validate', yggdrasilController.authserver.validate)

// POST ./api/yggdrasil/authserver/invalidate
// Yggdrasil单令牌吊销接口
router.post('/yggdrasil/authserver/invalidate', yggdrasilController.authserver.invalidate)

// POST ./api/yggdrasil/authserver/signout
// Yggdrasil登出(吊销所有令牌)接口
router.post('/yggdrasil/authserver/signout', yggdrasilAuthLimiter('signout'), yggdrasilController.authserver.signout)

// POST ./api/yggdrasil/sessionserver/session/minecraft/join
// Yggdrasil客户端请求入服接口
router.post('/yggdrasil/sessionserver/session/minecraft/join', yggdrasilController.sessionserver.session.minecraft.join)

// GET ./api/yggdrasil/sessionserver/session/minecraft/hasJoined?username={username}&serverId={serverId}&ip={ip}
// Yggdrasil服务器验证客户端接口
router.get(
  '/yggdrasil/sessionserver/session/minecraft/hasJoined',
  yggdrasilController.sessionserver.session.minecraft.hasJoined
)

// GET ./api/yggdrasil/sessionserver/session/minecraft/profile/{uuid}
// Yggdrasil角色查询接口
router.get(
  '/yggdrasil/sessionserver/session/minecraft/profile/:uuid',
  yggdrasilController.sessionserver.session.minecraft.profile
)

// POST ./api/yggdrasil/api/profiles/minecraft
// Yggdrasil按名称批量查询角色接口
router.post('/yggdrasil/api/profiles/minecraft', yggdrasilController.api.profiles.minecraft)

/* ---------- ROUTES END ---------- */

module.exports = router
