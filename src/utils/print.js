const color = require('colors/safe')

module.exports = {
  info(...args) {
    console.log(color.blue.bold(`[信息] `), ...args)
  },
  success(...args) {
    console.log(color.green.bold(`[成功] `), ...args)
  },
  warn(...args) {
    console.log(color.yellow.bold(`[警告] `), ...args)
  },
  error(...args) {
    console.log(color.red.bold(`[错误] `), ...args)
  },
  debug: {
    info(...args) {
      if (process.env.NODE_ENV === 'development') {
        console.log(color.blue.bold(`[调试][信息] `), ...args)
      }
    },
    success(...args) {
      if (process.env.NODE_ENV === 'development') {
        console.log(color.green.bold(`[调试][成功] `), ...args)
      }
    },
    warn(...args) {
      if (process.env.NODE_ENV === 'development') {
        console.log(color.yellow.bold(`[调试][警告] `), ...args)
      }
    },
    error(...args) {
      if (process.env.NODE_ENV === 'development') {
        console.log(color.red.bold(`[调试][错误] `), ...args)
      }
    }
  }
}
