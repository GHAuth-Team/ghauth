/* routers/urls.js */

const Router = require('koa-router');
const staticCache = require('koa-static-cache');

module.exports = (app) => {
  const rootRouter = new Router();

  // ./
  const indexRouter = require('./index');
  rootRouter.use('/', indexRouter.routes(), indexRouter.allowedMethods());

  // ./login/
  const loginRouter = require('./login');
  rootRouter.use('/login', loginRouter.routes(), loginRouter.allowedMethods());

  // ./logout/
  const logoutRouter = require('./logout');
  rootRouter.use('/logout', logoutRouter.routes(), logoutRouter.allowedMethods());

  // ./register/
  const registerRouter = require('./register');
  rootRouter.use('/register', registerRouter.routes(), registerRouter.allowedMethods());

  // ./api/
  const apiRouter = require('./api');
  rootRouter.use('/api', apiRouter.routes(), apiRouter.allowedMethods());

  // ./admin/
  const adminRouter = require('./admin');
  rootRouter.use('/admin', adminRouter.routes(), adminRouter.allowedMethods());

  // ./textures/
  const texturesRouter = require('./textures');
  rootRouter.use('/textures', texturesRouter.routes(), texturesRouter.allowedMethods());

  // ./forgetpw/
  const forgetpwRouter = require('./forgetpw');
  rootRouter.use('/forgetpw', forgetpwRouter.routes(), forgetpwRouter.allowedMethods());

  // 静态文件路由
  app.use(staticCache('./public', {
    gzip: true,
    buffer: false,
  }));

  app.use(rootRouter.routes());
};
