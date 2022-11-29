# GHAuth

![GitHub package.json version](https://img.shields.io/github/package-json/v/daidr/ghauth?style=flat-square)
[![GitHub commit](https://img.shields.io/github/last-commit/daidr/ghauth?style=flat-square)](https://github.com/daidr/ghauth/commit/master)
[![MIT License](https://img.shields.io/badge/license-MIT-yellowgreen.svg?style=flat-square)](https://github.com/daidr/ghauth/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/daidr/ghauth?style=flat-square)](https://github.com/daidr/ghauth/issues)

轻量的 MC 服务器 yggdrasil 验证/皮肤加载解决方案

[GHAuth](https://auth.daidr.me)

[更改日志](/CHANGELOG.md)

## 功能

- 完整的 yggdrasil 协议支持
- 完整的皮肤管理
- 简易的用户管理
- 邮箱验证

## 暂未实现

- 站点的可视化设置
- 玩家名称修改
- 修改邮箱功能
- FIDO 支持

## 环境

- MongoDB
- Redis
- NodeJS v16+
- pnpm (请不要使用另外的包管理器 npm/cnpm/yarn)

## 部署(辅助配置)

- 克隆本仓库 `git clone https://github.com/GHAuth-Team/ghauth.git`
- 安装依赖 `pnpm install`
- 启动配置程序 `pnpm helper`
- 根据提示完成基础配置
- 进入 `config` 目录
- 修改 `config.yml` (配置项注释可参考`config.sample.yml`)以完成高级配置(页脚配置、邮件服务器配置、资源可信域配置)
- [可选] 进入 `adminList.yml` 以添加更多管理员
- 启动 `pnpm start`

## 部署(Docker compose)

> 请确保您已经安装了 Docker 和 Docker Compose，视情况而定是否使用sudo提升权限

- 克隆本仓库 `git clone https://github.com/GHAuth-Team/ghauth.git`
- 进入仓库目录`cd ghauth`
- 编译Docker镜像并自动运行`docker compose up -d`，如果遇到镜像编译网络问题参见下方的说明
- 运行辅助配置助手`docker exec -it gh-app pnpm helper`，您可以与下方范例填写值不同，但需要同时修改docker-compose.yml中的容器名称
  - MongoDB 主机: `gh-db`
  - Redis 主机: `gh-redis`
- 销毁镜像重载配置`docker compose down && docker compose up -d`

> 如果遇到这样的问题，禁用buildkit
>
> - `export DOCKER_BUILDKIT=0 && export COMPOSE_DOCKER_CLI_BUILD=0`

```shell
 => ERROR [internal] load metadata for docker.io/library/node:lts          0.3s
------
 > [internal] load metadata for docker.io/library/node:lts:
------
failed to solve: rpc error: code = Unknown desc = failed to solve with frontend dockerfile.v0: failed to create LLB definition: unexpected status code [manifests lts]: 403 Forbidden
```

## 部署(手动配置)

- 克隆本仓库 `git clone https://github.com/GHAuth-Team/ghauth.git`
- 安装依赖 `pnpm install`
- 进入 `config` 目录
- 复制一份 `config.sample.yml` 并将其重命名为 `config.yml`
- 修改 `config.yml` 以完成站点配置
- 复制一份 `adminList.sample.yml` 并将其重命名为 `adminList.yml`
- 修改 `adminList.yml` 以定义管理员邮箱列表
- 启动 `pnpm start`

## 常用命令

- 启动: `pnpm start`
- 停止: `pnpm stop`
- 重启: `pnpm restart`
- 查看日志: `pnpm logs`
- 实时监控: `pnpm monit`

## 关于管理权限

- 具有管理权限的账号由 `config/adminList.yml` 控制
- 用户管理 Widget 会对拥有管理权限的用户显示

## 站点公告

- 站点公告默认**关闭**
- 进入 `config` 目录
- 复制一份 `announcement.sample.md` 并将其重命名为 `announcement.md`
- 修改 `announcement.md`
- 修改 `config.yml` 内 `common` 配置节点的 `showAnnouncement` 配置项为 `true` 来启用公告
- 支持 Markdown 语法

## NodeJS 版本兼容

- 建议 NodeJS 版本 >= v16.0.0
- 倘若系统 OpenSSL 版本 >= v3.0.0, 则要求 NodeJS 版本 >= v18.0.0

## 版本差异

GHAuth v0.7.2 版本之后(不包含 v0.7.2)，将使用 pnpm 进行依赖管理。

## 建议

- 建议使用 nginx 等类似服务器代理程序代理 public 目录，减轻后端压力

## 安全警告

- yggdrasil 验证时明文传递密码（协议限制），你需要启用 https 以提升安全性

## 生成签名验证密钥

- 从 `0.6.1` 版本开始辅助配置程序能够自动生成密钥。倘若需要手动配置 rsa 公私钥，可以参考下面的内容。

> 以下内容引用自[https://github.com/yushijinhun/authlib-injector/wiki/签名密钥对#密钥对的生成和处理](https://github.com/yushijinhun/authlib-injector/wiki/%E7%AD%BE%E5%90%8D%E5%AF%86%E9%92%A5%E5%AF%B9#%E5%AF%86%E9%92%A5%E5%AF%B9%E7%9A%84%E7%94%9F%E6%88%90%E5%92%8C%E5%A4%84%E7%90%86)

> 开始引用

### 密钥对的生成和处理

下面对 OpenSSL 的调用都是使用标准输入和标准输出进行输入输出的。
如果要使用文件，可使用参数 `-in <file>` 和 `-out <file>`。

#### 生成私钥

密钥算法为 RSA，推荐长度为 4096 位。

```
openssl genrsa 4096
```

生成的私钥将输出到标准输出。

#### 从私钥生成公钥

```
openssl rsa -pubout
```

私钥从标准输入读入，公钥将输出到标准输出。

> 结束引用

## 交流

Q 群：850093647（同时也是“基佬之家”基友服交流群）

## 协议

MIT Licence
