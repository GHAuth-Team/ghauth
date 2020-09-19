module.exports = {
    common: {
        sitename: "GHAuth", // 站点名称
        description: "轻量的MC服务器yggdrasil验证", //站点描述
        showAnnouncement: true, //是否显示站点公告，公告文件请编辑announcement.md，支持markdown语法
        url: "http://example.com", //站点链接，主要用于Yggdrasil认证（末尾不加/）
        footer: {
            copyright: `Powered By DaiDR.`,

            // 页末链接列表
            links: [{
                title: "GHAuth",
                link: "/",
                target: "_self"
            }, {
                title: "Blog",
                link: "https://daidr.me",
                target: "_blank"
            },
            {
                title: "Status",
                link: "https://status.daidr.me",
                target: "_blank"
            }]
        }
    },
    extra: {
        slat: "aQ7LU7stHKd0GaYfL64JRpH791keAumQTFCXE0", //密码加盐，使用前务必修改为随机字串
        mongodb: {
            host: "127.0.0.1",
            port: 27017,
            db: "ghauth",
            hasAuth: false, //数据库是否身份验证
            username: "",
            password: ""
        },
        session: {
            key: "V7tf9zzIxryQfRSDEpL8pboBmbx340pfJOoSwswK", //会话密钥，使用前务必修改为随机字串
        },
        redis: {
            host: "127.0.0.1",
            port: 6379,
            sessiondb: 1,//储存session使用的数据库
            authdb: 1 //储存入服验证使用的数据库
        },
        signature: {// 签名所需要的密钥字串，生成方式请阅读README
            private: "-----BEGIN RSA PRIVATE KEY-----\n假装是私钥\n-----END RSA PRIVATE KEY-----",
            public: "-----BEGIN PUBLIC KEY-----\n假装是公钥\n-----END PUBLIC KEY-----",
        },
        skinDomains: [// 可信域列表，删除样例域名，然后将你网站的域名加入到下面列表中
            "auth.daidr.me",
            "example.com",
            ".example2.com"
        ]
    }
}