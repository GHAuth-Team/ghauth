/* routers/login.js */

const router = require('koa-router')();
const loginController = require('../controller/login'); // Controller

/* ---------- ROUTES START ---------- */

// GET ./login/
// Front-end
router.get('/', loginController.frontend);

// POST ./login/
// Back-end
router.post('/', loginController.handle);

/* ---------- ROUTES END ---------- */

module.exports = router;