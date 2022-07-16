const mongoose = require('mongoose')
const Print = require('../utils/print')
const config = require('../config')

const connect = () => {
  mongoose
    .connect(
      `mongodb://${
        config.extra.mongodb.hasAuth ? `${config.extra.mongodb.username}:${config.extra.mongodb.password}@` : ''
      }${config.extra.mongodb.host}:${config.extra.mongodb.port}/${config.extra.mongodb.db}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000
      }
    )
    .catch()
}

const init = () => {
  // 连接数据库
  connect()

  const maxConnectTimes = 3
  let connectTimes = 0
  let lastConnectTime = 0

  return new Promise((resolve) => {
    mongoose.connection.on('disconnected', () => {
      Print.error('mongoDB断开连接')
      if (Date.now() - lastConnectTime < 1000) {
        lastConnectTime = Date.now()
        return
      }
      if (connectTimes < maxConnectTimes) {
        connectTimes += 1
        Print.info(`mongoDB尝试重连...(${connectTimes}/${maxConnectTimes})`)
        connect()
      } else {
        throw new Error('无法连接至MongoDB，请尝试修复问题后再次启动GHAuth')
      }
    })

    mongoose.connection.on('error', (err) => {
      Print.error('mongoDB数据库错误', err)
      if (Date.now() - lastConnectTime < 1000) {
        lastConnectTime = Date.now()
        return
      }
      if (connectTimes < maxConnectTimes) {
        connectTimes += 1
        Print.info(`mongoDB尝试重连...(${connectTimes}/${maxConnectTimes})`)
        connect()
      } else {
        throw new Error('无法连接至MongoDB，请尝试修复问题后再次启动GHAuth')
      }
    })

    mongoose.connection.once('open', () => {
      mongoose.connection.on('connected', () => {
        Print.success('mongoDB连接成功')
      })
      Print.success('mongoDB连接成功')
      resolve()
    })
  })
}

exports.init = init
