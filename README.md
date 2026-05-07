# 共享钓场用户端

共享钓场用户端是面向钓场用户的 uni-app / 微信小程序应用，核心流程包括微信登录、扫码入场、开始计时、计时中状态查看、扫码结束、订单结算、支付结果、历史订单、活动报名和优惠券查看。项目聚焦户外钓场场景，强调路径短、信息清晰和移动端可用性。

## 技术栈

- uni-app
- Vue 3
- JavaScript
- 微信小程序
- HBuilderX / uni-app CLI
- 本地模拟数据工具

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
4. 如需接入真实后端，将 `utils/fishingStore.js` 中的模拟数据替换为后端接口调用。

最小开发流程：

```text
HBuilderX -> 导入项目 -> 运行 -> 运行到小程序模拟器 -> 微信开发者工具
```

## 简历描述示例

基于 uni-app 和 Vue3 实现共享钓场用户端小程序，覆盖扫码计时、订单结算、支付结果、活动报名和优惠券等核心用户流程。围绕户外使用场景优化页面路径与信息展示，提升扫码入场和离场结算效率。
