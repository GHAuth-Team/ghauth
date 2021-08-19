const fs = require("fs");
const path = require("path");
const Print = require('../libs/print');
const inquirer = require('inquirer');
const yaml = require('js-yaml');
const rsa = require("node-rsa");

const isInstallLocked = fs.existsSync("./install.lock");

if (isInstallLocked) {
    Print.error("GHAuth的首次安装配置已经完成，无需再次进入安装引导。");
} else {
    const genRandomString = (length) => {
        let result = '',
            chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }

    const questions = [
        {
            type: 'input',
            name: 'sitename',
            message: "站点名称：",
            default: "GHAuth"
        },
        {
            type: 'input',
            name: 'description',
            message: "站点描述：",
            default: "轻量的MC服务器yggdrasil验证"
        },
        {
            type: 'confirm',
            name: 'showAnnouncement',
            message: "站点公告：",
            default: true
        },
        {
            type: 'input',
            name: 'port',
            message: "监听端口：",
            filter: Number,
            default: 3000,
            validate(value) {
                const pass = !isNaN(value) && value >= 1024 && value <= 65535;
                if (pass) {
                    return true;
                }

                return '请输入有效的端口（1024-65535）';
            },
        },
        {
            type: 'input',
            name: 'url',
            message: "站点链接：",
            default(answers) {
                return `http://127.0.0.1:${answers.port}`
            },
        },
        {
            type: 'input',
            name: 'mongodb.host',
            message: "MongoDB 主机：",
            default: "127.0.0.1",
        },
        {
            type: 'input',
            name: 'mongodb.port',
            message: "MongoDB 端口：",
            filter: Number,
            default: 27017,
            validate(value) {
                const pass = !isNaN(value) && value >= 1024 && value <= 65535;
                if (pass) {
                    return true;
                }

                return '请输入有效的端口（1024-65535）';
            },
        },
        {
            type: 'input',
            name: 'mongodb.db',
            message: "MongoDB 数据库名称：",
            default: "ghauth",
        },
        {
            type: 'confirm',
            name: 'mongodb.hasAuth',
            message: "MongoDB 是否有身份验证：",
            default: false,
        },
        {
            type: 'input',
            name: 'mongodb.username',
            message: "MongoDB 用户名：",
            when(answers) {
                return answers.mongodb.hasAuth;
            },
        },
        {
            type: 'password',
            name: 'mongodb.password',
            message: "MongoDB 密码：",
            mask: '*',
            when(answers) {
                return answers.mongodb.hasAuth;
            },
        },
        {
            type: 'input',
            name: 'redis.host',
            message: "Redis 主机：",
            default: "127.0.0.1",
        },
        {
            type: 'input',
            name: 'redis.port',
            message: "Redis 端口：",
            filter: Number,
            default: 6379,
            validate(value) {
                const pass = !isNaN(value) && value >= 1024 && value <= 65535;
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
            message: "Redis 数据库(储存会话数据)：",
            default: 1
        },
        {
            type: 'input',
            name: 'redis.authdb',
            filter: Number,
            message: "Redis 数据库(储存入服验证数据)：",
            default: 1
        },
        {
            type: 'list',
            name: 'signaturesize',
            filter: Number,
            message: '签名密钥长度：',
            default: 1,
            choices: [1024, 2048, 4096]
        },
    ];

    inquirer.prompt(questions).then((answers) => {
        const configFile = fs.readFileSync('./config/config.sample.yml', 'utf8');
        let config = yaml.load(configFile);

        config.common.sitename = answers.sitename;
        config.common.description = answers.description;
        config.common.showAnnouncement = answers.showAnnouncement;
        config.common.url = answers.url;

        config.extra.mongodb.host = answers.mongodb.host;
        config.extra.mongodb.port = answers.mongodb.port;
        config.extra.mongodb.db = answers.mongodb.db;
        config.extra.mongodb.hasAuth = answers.mongodb.hasAuth;
        config.extra.mongodb.username = answers.mongodb.username || "";
        config.extra.mongodb.password = answers.mongodb.password || "";

        config.extra.redis.host = answers.redis.host;
        config.extra.redis.port = answers.redis.port;
        config.extra.redis.sessiondb = answers.redis.sessiondb;
        config.extra.redis.authdb = answers.redis.authdb;

        Print.info("生成slat中，请稍后...");
        config.extra.slat = genRandomString(38);

        Print.info("生成会话密钥中，请稍后...");
        config.extra.session.key = genRandomString(40);

        Print.info(`生成RSA签名公私钥(${answers.signaturesize})中，可能需要花费较长时间，请耐心等待...`);
        let key = new rsa({ b: answers.signaturesize });
        key.setOptions({ encryptionScheme: 'pkcs1' });
        let publicPem = key.exportKey('pkcs8-public-pem');
        let privatePem = key.exportKey('pkcs8-private-pem');
        config.extra.signature.private = privatePem;
        config.extra.signature.public = publicPem;

        Print.info("生成配置文件中，请稍等...");
        let final = yaml.dump(config);
        fs.writeFileSync(path.join(__dirname, "../config/config.yml"), final);
        
        Print.success("基础配置全部完成，高级配置(页脚配置、邮件服务器配置、资源可信域配置)请修改 /config/config.yml");
    });
}