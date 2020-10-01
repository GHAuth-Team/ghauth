const color = require('colors/safe');
process.on('uncaughtException', function (err) {
    console.log(color.red('[错误] ') + err);
});

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const views = require("koa-views");
const session = require('koa-session');
const path = require("path");
const redisStore = require('koa-redis');
const config = require("./config");
require("./db/mongodb");

const app = new Koa();

app.keys = [config.extra.session.key];
const sessionCONFIG = {
    key: config.extra.session.key,
    maxAge: 86400000,
};

sessionCONFIG["store"] = redisStore({
    host: config.extra.redis.host,
    port: config.extra.redis.port,
    db: config.extra.redis.db
})

app.use(logger()); //日志记录
app.use(bodyParser()); //数据解析
app.use(session(sessionCONFIG, app)); //session
app.use(views(path.resolve(__dirname, "template"), {
    extension: "pug"
})); //pug模板引擎

app.use(async (ctx, next) => {
    //yggdrasil ALI header
    ctx.set("X-Authlib-Injector-API-Location", config.common.url + "/api/yggdrasil/");
    await next();
})

const mainRouter = require('./routers/urls'); //引入根路由
mainRouter(app);

app.listen(config.extra.port ? config.extra.port : 3000, () => {
    console.log(`GHAuth 现已成功运行在 ${config.extra.port ? config.extra.port : 3000} 端口上`);
});