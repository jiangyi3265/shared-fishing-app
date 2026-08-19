<template>
	<view class="app protocol-page has-account-tabbar has-brand-header">
		<brand-header title="隐私政策" theme="light" layout="compact" :back="true" />
		<view class="protocol-section">
			<text class="section-title">一、我们收集的信息</text>
			<text class="section-text">在用户主动授权登录或使用相关服务时，我们可能收集微信 openid、订单信息、支付状态、活动报名信息、联系电话和用户主动提交的备注内容。昵称、头像仅在用户主动填写或选择后用于账号、订单、积分及排行榜展示，小程序不会在未经操作的情况下静默读取微信昵称。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">二、信息使用目的</text>
			<text class="section-text">上述信息仅用于账号识别、扫码入场、计时计费、离场结算、订单查询、售后退款、活动报名、优惠核销和客服联系等钓场服务场景。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">三、授权方式</text>
			<text class="section-text">用户进入首页可先浏览钓场内容。需要登录的功能会在用户主动点击后提示授权，用户可自主阅读并勾选协议后再决定是否登录。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">四、信息存储与保护</text>
			<text class="section-text">我们会采取合理安全措施保护个人信息，除法律法规要求、支付结算、订单履约或用户授权外，不会向无关第三方提供用户个人信息。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">五、用户权利</text>
			<text class="section-text">用户可通过小程序内设置、客服或相关页面查询订单与账号信息。如需更正、删除信息或撤回授权，可联系钓场工作人员处理。</text>
		</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	export default {}
</script>

<style>
	.protocol-page {
		padding: 32rpx 28rpx 80rpx;
		background: var(--surface-2);
		min-height: 100vh;
		box-sizing: border-box;
	}

	.protocol-header {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		margin-bottom: 28rpx;
	}

	.protocol-title {
		font-size: 42rpx;
		font-weight: 600;
		color: var(--ink);
	}

	.protocol-sub {
		font-size: 24rpx;
		color: var(--ink-2);
	}

	.protocol-section {
		background: var(--surface);
		border-radius: var(--r);
		padding: 28rpx;
		margin-bottom: 20rpx;
	}

	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--ink);
		margin-bottom: 16rpx;
	}

	.section-text {
		display: block;
		font-size: 26rpx;
		line-height: 1.8;
		color: var(--ink);
	}
</style>

<style>
.protocol-page{min-height:100vh;padding:24rpx 24rpx calc(122rpx + env(safe-area-inset-bottom));background:#fff}.protocol-header{text-align:center;margin-bottom:24rpx}.protocol-title{font-size:31rpx}.protocol-sub{display:none}.protocol-section{padding:0;margin-bottom:22rpx;background:transparent}.protocol-section .section-title{font-size:24rpx;color:#078f8e;margin-bottom:10rpx}.protocol-section .section-text{font-size:20rpx;line-height:1.75;color:#536e70}
</style>
