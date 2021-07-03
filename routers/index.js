/* routers/index.js */

const router = require('koa-router')();

/* ---------- ROUTES START ---------- */

// ./
const indexController = require('../controller/index');

router.get('/', indexController.index);

/* ---------- ROUTES END ---------- */

module.exports = router;
