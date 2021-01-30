const color = require('colors/safe');

module.exports = {
    info: function () {
        console.log(color.bold(color.blue('[信息] ')), ...arguments);
    },
    success: function () {
        console.log(color.bold(color.green('[成功] ')), ...arguments);
    },
    warn: function () {
        console.log(color.bold(color.yellow('[警告] ')), ...arguments);
    },
    error: function () {
        console.log(color.bold(color.red('[错误] ')), ...arguments);
    },
}