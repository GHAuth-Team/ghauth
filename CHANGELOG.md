# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.2] - 2022-06-25

### Added
- 添加配置项 `ignoreEmailVerification` 来忽略邮箱验证
- 一键配置增加了 `ignoreEmailVerification` 选项
- 优化首页模板
- 优化 Yggdrasil Meta 中的 `implementationName` 字段

### Fixed
- 移动设备上 SkinViewer 的交互问题
- 未设定管理员时报错的问题
- 配置项 `extra.port` 未生效的问题

### Changed
- 升级 SkinViewer
- 更新 `README.md` 中对 NodeJS 版本号的说明

## [0.7.1] - 2022-06-17

### Added
- helper 将自动生成 adminList.yml 和 announcement.yml
- 未验证邮箱的用户将显示更加友好的提示

### Fixed
- Redis 过期时间问题 #20

### Changed
- 升级依赖

## [0.7.0] - 2022-02-08

### Added
- 实现忘记密码功能

### Fixed
- 修复一处css路径错误
- 修复几处语法错误
- 修复几处注释错误
- 修复了一处异步处理的问题

## [0.6.1] - 2021-08-19

### Added
- 实现了首次部署配置指引

## [0.6.0] - 2021-07-03

### Added
- 实现邮箱验证功能
- 配置文件增加smtp相关设置

### Changed
- 升级依赖
  - ioredis 4.23.0 -> 4.27.5
  - js-yaml 4.0.0 -> 4.1.0
  - mongoose 5.11.19 -> 5.12.13
  - pm2 4.5.5 -> 5.0.4
  - koa-views 7.0.0 -> 7.0.1
  - koa-session 6.1.0 -> 6.2.0
  - eslint 7.23.0 -> 7.28.0
  - eslint-plugin-import 2.22.1 -> 2.23.4
- 规范代码风格
- 润色注册提示文本
- *[开发]* 使用nodemon代替了supervisor

### Fixed
- 修复 [#11](https://github.com/GHAuth-Team/ghauth/issues/11)

## [0.5.1] - 2021-03-07
### Added
- 添加更改日志([CHANGELOG.md])
- 实现接口 `/api/yggdrasil/api/profiles/minecraft`，修复 [#10](https://github.com/GHAuth-Team/ghauth/issues/10)

### Changed
- 升级依赖
  - ioredis 4.17.3 -> 4.23.0
  - js-yaml 3.14.0 -> 4.0.0
  - koa 2.13.0 -> 2.13.1
  - mongoose 5.9.25 -> 5.11.19
  - pm2 4.5.0 -> 4.5.5
  - pug 3.0.0 -> 3.0.2

## 0.5.0 - 2020-09-21
### Added
- 实现基础的Yggdrasil协议

[CHANGELOG.md]: /CHANGELOG.md
[Unreleased]: https://github.com/GHAuth-Team/ghauth/compare/v0.7.2...main
[0.5.1]: https://github.com/GHAuth-Team/ghauth/releases/tag/v0.5.1
[0.6.0]: https://github.com/GHAuth-Team/ghauth/releases/tag/v0.6.0
[0.6.1]: https://github.com/GHAuth-Team/ghauth/releases/tag/v0.6.1
[0.7.0]: https://github.com/GHAuth-Team/ghauth/releases/tag/v0.7.0
[0.7.1]: https://github.com/GHAuth-Team/ghauth/releases/tag/v0.7.1
[0.7.2]: https://github.com/GHAuth-Team/ghauth/releases/tag/v0.7.2
