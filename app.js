const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const views = require('koa-views');
const session = require('koa-session');
const path = require('path');
const redisStore = require('koa-redis');

// const cluster = require('cluster');
const config = require('./config');
const logger = require('./libs/koa-logger');
const Print = require('./libs/print');

Print.info('GHAuth 准备初始化，请稍后...');

// const numCPUs = 2;
// // const numCPUs = require('os').cpus().length;
// (function clusterInit() {
//   if (cluster.isMaster) {
//     Print.info(`GHAuth主进程 ${process.pid} 正在运行`);
//     process.title = `GHAuth主进程(${process.pid})`;

//     for (let i = 0; i < numCPUs; i += 1) {
//       cluster.fork();
//     }

//     cluster.on('exit', (worker) => {
//       Print.info(`GHAuth工作进程 ${worker.process.pid} 已退出`);
//     });
//   }
// }());
// Print.info(`GHAuth工作进程 ${process.pid} 已启动`);
// process.title = `GHAuth工作进程(${process.pid})`;

process.on('uncaughtException', (err) => {
  Print.error(err);
});

function init() {
  const app = new Koa();

  app.keys = [config.extra.session.key];
  const sessionCONFIG = {
    key: config.extra.session.key,
    maxAge: 86400000,
  };

  sessionCONFIG.store = redisStore({
    host: config.extra.redis.host,
    port: config.extra.redis.port,
    db: config.extra.redis.db,
  });

  Print.info('载入中间件...');
  app.use(logger()); // 日志记录
  app.use(bodyParser()); // 数据解析
  app.use(session(sessionCONFIG, app)); // session
  app.use(views(path.resolve(__dirname, 'template'), {
    extension: 'pug',
  })); // pug模板引擎

  app.use(async (ctx, next) => {
    // yggdrasil ALI header
    ctx.set('X-Authlib-Injector-API-Location', `${config.common.url}/api/yggdrasil/`);
    await next();
  });

  Print.info('载入路由...');
  const mainRouter = require('./routers/urls'); // 引入根路由
  mainRouter(app);

  app.listen(config.extra.port ? config.extra.port : 3000, () => {
    Print.success(`GHAuth 现已成功运行在 ${config.extra.port ? config.extra.port : 3000} 端口上`);
  });
}

Print.info('尝试连接到MongoDB...');
require('./db/mongodb')
  .init()
  .then(() => {
    init();
  });
