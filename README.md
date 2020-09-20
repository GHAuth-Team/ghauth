GHAuth
========

![GitHub package.json version](https://img.shields.io/github/package-json/v/daidr/ghauth?style=flat-square)
[![GitHub commit](https://img.shields.io/github/last-commit/daidr/ghauth?style=flat-square)](https://github.com/daidr/ghauth/commit/master)
[![MIT License](https://img.shields.io/badge/license-MIT-yellowgreen.svg?style=flat-square)](https://github.com/daidr/ghauth/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/daidr/ghauth?style=flat-square)](https://github.com/daidr/ghauth/issues)
[![Liberapay patrons](https://img.shields.io/liberapay/patrons/daidr?label=liberapay%20patrons&style=flat-square)](https://liberapay.com/daidr/)

轻量的MC服务器yggdrasil验证/皮肤加载解决方案

[GHAuth](https://auth.daidr.me)

## 功能
* 完整的yggdrasil协议支持
* 完整的皮肤管理

## 暂未实现
* 玩家名称修改
* 用户管理
* 站点的可视化设置

## 环境
* MongoDB
* Redis
* NodeJS
* npm or yarn

## 使用
* 安装依赖 `yarn install` or `npm install`
* 复制一份 `config.sample.js` 并将其重命名为 `config.js`
* 修改 `config.js` 以完成站点配置
* 启动 `yarn start` or `npm run start`

## 关于管理权限
* 具有管理权限的账号由 `adminList.js` 控制
* 目前管理权限功能正在开发，仅提供一个前端展示
* 未来会加入用户管理的功能

## 站点公告
* 站点公告被储存于 `announcement.md` 文件中
* 你可以通过 `config.js` 内的配置项来禁用站点公告功能
* 支持Markdown语法

## 安全警告
* yggdrasil验证时明文传递密码（协议限制），你需要启用https以提升安全性

> 以下内容引用自[https://github.com/yushijinhun/authlib-injector/wiki/签名密钥对#密钥对的生成和处理](https://github.com/yushijinhun/authlib-injector/wiki/%E7%AD%BE%E5%90%8D%E5%AF%86%E9%92%A5%E5%AF%B9#%E5%AF%86%E9%92%A5%E5%AF%B9%E7%9A%84%E7%94%9F%E6%88%90%E5%92%8C%E5%A4%84%E7%90%86)

> 开始引用

## 密钥对的生成和处理

下面对 OpenSSL 的调用都是使用标准输入和标准输出进行输入输出的。
如果要使用文件，可使用参数 `-in <file>` 和 `-out <file>`。

### 生成私钥
密钥算法为 RSA，推荐长度为 4096 位。

```
openssl genrsa 4096
```

生成的私钥将输出到标准输出。

### 从私钥生成公钥
```
openssl rsa -pubout
```

私钥从标准输入读入，公钥将输出到标准输出。

> 结束引用

## 交流
Q群：850093647（同时也是“基佬之家”基友服交流群）

## 协议
MIT Licence
