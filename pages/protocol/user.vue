<template>
	<view class="app protocol-page has-account-tabbar has-brand-header">
		<brand-header title="用户服务协议" theme="light" layout="compact" :back="true" />
		<view class="protocol-section">
			<text class="section-title">一、服务内容</text>
			<text class="section-text">共享钓场为用户提供钓场信息浏览、扫码入场、计时计费、离场结算、订单查询、活动报名、优惠券、装备租赁及客服联系等钓场相关服务。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">二、账号与授权</text>
			<text class="section-text">用户可先浏览钓场服务内容。涉及入场计时、订单支付、活动报名、个人订单等需要识别用户身份的功能时，用户可自主选择授权微信登录。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">三、费用与支付</text>
			<text class="section-text">钓场计费以页面展示的计费规则和实际订单为准。用户确认结算后，可按页面提示完成微信支付或使用余额、优惠券等方式抵扣。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">四、用户行为</text>
			<text class="section-text">用户应遵守钓场现场管理要求，不得利用小程序提交虚假信息、恶意下单、干扰系统运行或损害其他用户和商家权益。</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">五、联系我们</text>
			<text class="section-text">如对服务协议或订单有疑问，可通过小程序内“联系客服”页面联系钓场工作人员处理。</text>
		</view>
		<view class="protocol-agree"><text>✓</text><text>我已阅读并同意《用户服务协议》</text></view>
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
.protocol-page{min-height:100vh;padding:24rpx 24rpx calc(122rpx + env(safe-area-inset-bottom));background:#fff}.protocol-header{text-align:center;margin-bottom:24rpx}.protocol-title{font-size:31rpx}.protocol-sub{display:none}.protocol-section{padding:0;margin-bottom:22rpx;background:transparent}.protocol-section .section-title{font-size:24rpx;color:#078f8e;margin-bottom:10rpx}.protocol-section .section-text{font-size:20rpx;line-height:1.75;color:#536e70}.protocol-agree{display:flex;align-items:center;gap:10rpx;color:#079b99;font-size:20rpx}.protocol-agree text:first-child{width:28rpx;height:28rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#14a86f;color:#fff}
</style>
