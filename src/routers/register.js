/* routers/register.js */

const router = require('koa-router')()
const registerController = require('../controller/register') // Controller

/* ---------- ROUTES START ---------- */

// GET ./register/
// Front-end
router.get('/', registerController.frontend)

// POST ./register/
// Back-end
router.post('/', registerController.handle)

/* ---------- ROUTES END ---------- */

module.exports = router
