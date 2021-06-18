/* routers/textures.js */

const router = require('koa-router')();
const texturesController = require('../controller/textures'); // texturesController

/* ---------- ROUTES START ---------- */

// GET ./textures/
// 根据材质hash返回对应材质
router.get('/:hash', texturesController.textures);

/* ---------- ROUTES END ---------- */

module.exports = router;
