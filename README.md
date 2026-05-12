# 共享钓场用户端

共享钓场用户端是面向钓场用户的 uni-app / 微信小程序应用，核心流程包括微信登录、扫码入场、开始计时、计时中状态查看、扫码结束、订单结算、支付结果、历史订单、活动报名和优惠券查看。项目聚焦户外钓场场景，强调路径短、信息清晰和移动端可用性。

## 技术栈

- uni-app
- Vue 3
- JavaScript
- 微信小程序
- HBuilderX / uni-app CLI
- 后端 `/app/**` 接口

## 关联仓库

| 子项目 | 仓库 | 说明 |
| --- | --- | --- |
| 后端服务 | [shared-fishing-backend](https://github.com/jiangyi3265/shared-fishing-backend) | 提供业务接口、权限、订单、计时和系统管理能力 |
| 管理后台 | [shared-fishing-admin](https://github.com/jiangyi3265/shared-fishing-admin) | 面向钓场管理员的 Web 管理端 |
| 用户端 | [shared-fishing-app](https://github.com/jiangyi3265/shared-fishing-app) | 面向钓场用户的 uni-app / 微信小程序端 |

## 快速启动

1. 使用 HBuilderX 打开当前目录。
2. 在 `manifest.json` 中确认微信小程序 AppID。
3. 运行到微信小程序开发者工具。
4. 在 `utils/config.js` 中配置接口地址。开发版、体验版和正式版默认都走 `https://dy.oksja.cn`；本地联调时再临时改为本机后端地址。

最小开发流程：

```text
HBuilderX -> 导入项目 -> 运行 -> 运行到小程序模拟器 -> 微信开发者工具
```

## 生产配置

正式发布前必须完成：

- `manifest.json` 中 `mp-weixin.appid` 使用真实小程序 AppID。
- `utils/config.js` 中 `trial` 和 `release` 填写正式 HTTPS API 域名。
- 微信公众平台把该 HTTPS API 域名加入 request 合法域名。
- 后端配置 `WX_SECRET`，并保持 `WX_MOCK_ENABLED=false`。
- 开通支付时后端配置 `WX_PAY_ENABLED=true`、商户号、APIv3 密钥、证书私钥和支付回调域名。

## 简历描述示例

基于 uni-app 和 Vue3 实现共享钓场用户端小程序，覆盖扫码计时、订单结算、支付结果、活动报名和优惠券等核心用户流程。围绕户外使用场景优化页面路径与信息展示，提升扫码入场和离场结算效率。
