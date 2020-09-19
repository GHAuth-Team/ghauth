/* routers/logout.js */

const router = require('koa-router')();

/* ---------- ROUTES START ---------- */

// ./logout/
const logoutController = require('../controller/logout');
router.get('/', logoutController.logout);

/* ---------- ROUTES END ---------- */

module.exports = router;