const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const yaml = require('js-yaml');
const RSA = require('node-rsa');
const Print = require('../libs/print');

// 获取启动参数 -generate-cert
const generateCert = process.argv.indexOf('-generate-cert') > -1;

const isInstallLocked = fs.existsSync('./install.lock');

function run() {
  if (generateCert) {
    if (isInstallLocked) {
      const questions = [
        {
          type: 'list',
          name: 'signaturesize',
          filter: Number,
          message: '签名密钥长度：',
          default: 1,
          choices: [1024, 2048, 4096],
        },
      ];
      inquirer.prompt(questions).then((answers) => {
        const configFile = fs.readFileSync('./config/config.yml', 'utf8');
        const config = yaml.load(configFile);

        Print.info(`生成RSA签名公私钥(${answers.signaturesize})中，可能需要花费较长时间，请耐心等待...`);
        const key = new RSA({ b: answers.signaturesize });
        key.setOptions({ encryptionScheme: 'pkcs1' });
        const publicPem = key.exportKey('pkcs8-public-pem');
        const privatePem = key.exportKey('pkcs8-private-pem');
        config.extra.signature.private = privatePem;
        config.extra.signature.public = publicPem;

        Print.info('更新配置文件中，请稍等...');
        // 生成 config.yml
        const final = yaml.dump(config);
        fs.writeFileSync(path.join(__dirname, '../config/config.yml'), final);

        Print.success('公私钥更新完成。');
      });
    } else {
      Print.error('请先安装GHAuth，然后再生成证书');
      process.exit(1);
    }
    return;
  }

  if (isInstallLocked) {
    Print.error('GHAuth的首次安装配置已经完成，无需再次进入安装引导。');
  } else {
    const genRandomString = (length) => {
      let result = '';
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = length; i > 0; i -= 1) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    };

    const questions = [
      {
        type: 'input',
        name: 'sitename',
        message: '站点名称：',
        default: 'GHAuth',
      },
      {
        type: 'input',
        name: 'description',
        message: '站点描述：',
        default: '轻量的MC服务器yggdrasil验证',
      },
      {
        type: 'confirm',
        name: 'showAnnouncement',
        message: '站点公告：',
        default: true,
      },
      {
        type: 'confirm',
        name: 'ignoreEmailVerification',
        message: '不强制进行邮箱验证：',
        default: false,
      },
      {
        type: 'input',
        name: 'port',
        message: '监听端口：',
        filter: Number,
        default: 3000,
        validate(value) {
          const pass = !Number.isNaN(value) && value >= 1024 && value <= 65535;
          if (pass) {
            return true;
          }

          return '请输入有效的端口（1024-65535）';
        },
      },
      {
        type: 'input',
        name: 'url',
        message: '站点链接：',
        default(answers) {
          return `http://127.0.0.1:${answers.port}`;
        },
      },
      {
        type: 'input',
        name: 'adminEmail',
        message: '管理员邮箱：',
        default: 'example@example.com',
        validate(value) {
          const pass = value.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
          if (pass) {
            return true;
          }

          return '请输入有效的邮箱地址';
        },
      },
      {
        type: 'input',
        name: 'mongodb.host',
        message: 'MongoDB 主机：',
        default: '127.0.0.1',
      },
      {
        type: 'input',
        name: 'mongodb.port',
        message: 'MongoDB 端口：',
        filter: Number,
        default: 27017,
        validate(value) {
          const pass = !Number.isNaN(value) && value >= 1024 && value <= 65535;
          if (pass) {
            return true;
          }

          return '请输入有效的端口（1024-65535）';
        },
      },
      {
        type: 'input',
        name: 'mongodb.db',
        message: 'MongoDB 数据库名称：',
        default: 'ghauth',
      },
      {
        type: 'confirm',
        name: 'mongodb.hasAuth',
        message: 'MongoDB 是否有身份验证：',
        default: false,
      },
      {
        type: 'input',
        name: 'mongodb.username',
        message: 'MongoDB 用户名：',
        when(answers) {
          return answers.mongodb.hasAuth;
        },
      },
      {
        type: 'password',
        name: 'mongodb.password',
        message: 'MongoDB 密码：',
        mask: '*',
        when(answers) {
          return answers.mongodb.hasAuth;
        },
      },
      {
        type: 'input',
        name: 'redis.host',
        message: 'Redis 主机：',
        default: '127.0.0.1',
      },
      {
        type: 'input',
        name: 'redis.port',
        message: 'Redis 端口：',
        filter: Number,
        default: 6379,
        validate(value) {
          const pass = !Number.isNaN(value) && value >= 1024 && value <= 65535;
          if (pass) {
            return true;
          }

          return '请输入有效的端口（1024-65535）';
        },
      },
      {
        type: 'input',
        name: 'redis.sessiondb',
        filter: Number,
        message: 'Redis 数据库(储存会话数据)：',
        default: 1,
      },
      {
        type: 'input',
        name: 'redis.authdb',
        filter: Number,
        message: 'Redis 数据库(储存入服验证数据)：',
        default: 1,
      },
      {
        type: 'list',
        name: 'signaturesize',
        filter: Number,
        message: '签名密钥长度：',
        default: 1,
        choices: [1024, 2048, 4096],
      },
    ];

    inquirer.prompt(questions).then((answers) => {
      const configFile = fs.readFileSync('./config/config.sample.yml', 'utf8');
      const config = yaml.load(configFile);

      config.common.sitename = answers.sitename;
      config.common.description = answers.description;
      config.common.showAnnouncement = answers.showAnnouncement;
      config.common.ignoreEmailVerification = answers.ignoreEmailVerification;
      config.common.url = answers.url;

      config.extra.port = answers.port;

      config.extra.mongodb.host = answers.mongodb.host;
      config.extra.mongodb.port = answers.mongodb.port;
      config.extra.mongodb.db = answers.mongodb.db;
      config.extra.mongodb.hasAuth = answers.mongodb.hasAuth;
      config.extra.mongodb.username = answers.mongodb.username || '';
      config.extra.mongodb.password = answers.mongodb.password || '';

      config.extra.redis.host = answers.redis.host;
      config.extra.redis.port = answers.redis.port;
      config.extra.redis.sessiondb = answers.redis.sessiondb;
      config.extra.redis.authdb = answers.redis.authdb;

      Print.info('生成slat中，请稍后...');
      config.extra.slat = genRandomString(38);

      Print.info('生成会话密钥中，请稍后...');
      config.extra.session.key = genRandomString(40);

      Print.info(`生成RSA签名公私钥(${answers.signaturesize})中，可能需要花费较长时间，请耐心等待...`);
      const key = new RSA({ b: answers.signaturesize });
      key.setOptions({ encryptionScheme: 'pkcs1' });
      const publicPem = key.exportKey('pkcs8-public-pem');
      const privatePem = key.exportKey('pkcs8-private-pem');
      config.extra.signature.private = privatePem;
      config.extra.signature.public = publicPem;

      Print.info('生成配置文件中，请稍等...');
      // 生成 config.yml
      const final = yaml.dump(config);
      fs.writeFileSync(path.join(__dirname, '../config/config.yml'), final);

      // 生成 adminList.yml
      const adminList = [answers.adminEmail];
      const adminListFile = yaml.dump(adminList);
      fs.writeFileSync(path.join(__dirname, '../config/adminList.yml'), adminListFile);

      // 复制 announcement.sample.md 到 announcement.md
      fs.copyFileSync(path.join(__dirname, '../config/announcement.sample.md'), path.join(__dirname, '../config/announcement.md'));

      // 写入 install.lock
      fs.writeFileSync(path.join(__dirname, '../install.lock'), '1');

      Print.success('基础配置全部完成，高级配置(页脚配置、邮件服务器配置、资源可信域配置)请修改 /config/config.yml');
    });
  }
}

run();
