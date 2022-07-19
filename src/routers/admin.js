/* routers/admin.js */

const router = require('koa-router')()

/* ---------- ROUTES START ---------- */

const userController = require('../controller/admin/user')
// ./admin/getUserList
router.get('/getUserList', userController.getUserList)
// ./admin/switchUserStatus
router.post('/switchUserStatus', userController.switchUserStatus)

/* ---------- ROUTES END ---------- */

module.exports = router
