const nodemailer = require('nodemailer');
const redis = require('../db/redis');
const config = require('../config');

const getRandomHex = (len = 32) => {
  const chars = 'abcdef0123456789';
  const maxPos = chars.length;
  let pwd = '';
  for (let i = 0; i < len; i += 1) {
    pwd += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
};

const transporter = nodemailer.createTransport(config.extra.smtp);

module.exports = {
  storeVerifyTokenToRedis: (playerId, token) => new Promise((resolve) => {
    // 过期时间5分钟
    const time = 5 * 60;
    // 储存对应玩家的邮箱验证Token
    const storeToken = redis.set(`verifyemail_${playerId}`, token, 'EX', time);
    // 储存对应玩家的邮箱验证Token的到期时间戳(10位)，过期时间5分钟
    const storeTokenTime = redis.set(`verifyemailtime_${playerId}`, Math.floor(new Date().getTime() / 1000) + time, 'EX', time);

    Promise.all([storeToken, storeTokenTime]).then(
      () => {
        resolve(true);
      },
    );
  }),
  genVerifyToken: () => getRandomHex(),
  isVerifyTokenExists: (playerId) => new Promise((resolve) => {
    // 判断对应玩家的邮箱验证字串是否存在
    redis.exists(`verifyemail_${playerId}`)
      .then((result) => {
        resolve(result);
      });
  }),
  isVerifyTokenCorrect: (playerId, token) => new Promise((resolve) => {
    // 判断对应玩家的邮箱验证字串是否正确
    redis.get(`verifyemail_${playerId}`, (err, response) => {
      // 未找到对应玩家的Token
      if (err || !response) {
        resolve(false);
        return;
      }
      if (response === token) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }),
  delVerifyToken: (playerId) => new Promise((resolve) => {
    const storeToken = redis.del(`verifyemail_${playerId}`);
    const storeTokenTime = redis.del(`verifyemailtime_${playerId}`);

    Promise.all([storeToken, storeTokenTime]).then(
      () => {
        resolve(true);
      },
    );
  }),
  getVerifyTokenTime: (playerId) => new Promise((resolve) => {
    redis.get(`verifyemailtime_${playerId}`, (err, response) => {
      // 未找到对应玩家的Token过期时间
      if (err || !response) {
        resolve(false);
        return;
      }

      const result = new Date(parseInt(response, 10)).getTime();
      resolve(result);
    });
  }),
  sendVerifyUrl: (email, playername, playerId, token) => new Promise((resolve) => {
    const mailOptions = {
      from: `"${config.common.sitename}" <${config.extra.smtp.auth.user}>`,
      to: email,
      subject: `[${config.common.sitename}] Email 地址验证`,
      text: `您好，${playername}
            \n这是来自 ${config.common.sitename} 的一封账户验证邮件
            \n如果这不是您本人的操作，请忽略这封邮件
            \n如果这是您本人的操作，请访问下面的链接来进行验证
            \n${config.common.url}/api/emailcheck/${token}/${playerId}
            \n链接有效期5分钟，请及时验证
            \n此致
            \n${config.common.sitename} 管理团队.`,
      html: `您好，${playername}
            <br>这是来自 ${config.common.sitename} 的一封账户验证邮件
            <br>如果这不是您本人的操作，请忽略这封邮件
            <br>如果这是您本人的操作，请访问下面的链接来进行验证
            <br><a href="${config.common.url}/api/emailcheck/${token}/${playerId}">${config.common.url}/api/emailcheck/${token}/${playerId}</a>
            <br>链接有效期5分钟，请及时验证
            <br>此致
            <br>${config.common.sitename} 管理团队.`,
    };

    // 发送函数
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.info(error);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  }),
};
