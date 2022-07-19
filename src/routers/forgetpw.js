/* routers/forgetpw.js */

const router = require('koa-router')()
const forgetpwController = require('../controller/forgetpw') // Controller

/* ---------- ROUTES START ---------- */

// GET ./forgetpw/
// Front-end
router.get('/', forgetpwController.frontend)

// POST ./forgetpw/
// Back-end
router.post('/', forgetpwController.handle)

// GET ./forgetpw/:token/:id
// 修改密码前端
router.get('/:token/:id', forgetpwController.changeFrontend)

// POST ./forgetpw/:token/:id
// 修改密码后端
router.post('/:token/:id', forgetpwController.changeHandle)

/* ---------- ROUTES END ---------- */

module.exports = router
