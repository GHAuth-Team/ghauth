const color = require('colors/safe');

module.exports = {
  info(...args) {
    console.log(color.bold(color.blue(`[信息 | ${process.pid}] `)), ...args);
  },
  success(...args) {
    console.log(color.bold(color.green(`[成功 | ${process.pid}] `)), ...args);
  },
  warn(...args) {
    console.log(color.bold(color.yellow(`[警告 | ${process.pid}] `)), ...args);
  },
  error(...args) {
    console.log(color.bold(color.red(`[错误 | ${process.pid}] `)), ...args);
  },
};
