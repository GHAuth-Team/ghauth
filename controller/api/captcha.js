/* controller/captcha.js */

const svgCaptcha = require('svg-captcha');

const randomInt = (min, max) => {
    let random = max - min + 1;
    return Math.floor(Math.random() * random + min);
}

module.exports = {
    captcha: async (ctx, next) => {
        let captcha = svgCaptcha.createMathExpr({
            inverse: false,
            fontSize: randomInt(35, 50),
            noise: randomInt(2, 4),
            mathMin: 10,
            mathMax: 30,
            mathOperator: "+"
        });
        ctx.session.captcha = {};
        ctx.session.captcha.ts = Date.now();
        ctx.session.captcha.text = captcha.text.toLocaleLowerCase();
        ctx.set("Content-Type", "image/svg+xml");
        ctx.body = captcha.data;
    }
}