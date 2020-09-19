const Redis = require('ioredis');
const config = require('../config');
module.exports = new Redis({
    port: config.extra.redis.port,
    host: config.extra.redis.host,
    db: config.extra.redis.authdb
})