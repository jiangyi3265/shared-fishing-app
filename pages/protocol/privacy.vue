<template>
	<view class="app protocol-page">
		<view class="protocol-header">
			<text class="protocol-title">隐私政策</text>
			<text class="protocol-sub">共享钓场小程序个人信息保护说明</text>
		</view>

		<view class="protocol-section">
			<text class="section-title">一、我们收集的信息</text>
			<text class="section-text">在用户主动授权登录或使用相关服务时，我们可能收集微信 openid、订单信息、支付状态、活动报名信息、联系电话和用户主动提交的备注内容。昵称、头像仅在用户主动提供时用于账号展示。</text>
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
	</view>
</template>

<script>
	export default {}
</script>

<style>
	.protocol-page {
		padding: 32rpx 28rpx 80rpx;
		background: #f6f7f8;
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
		font-weight: 800;
		color: #10231f;
	}

	.protocol-sub {
		font-size: 24rpx;
		color: #7a8380;
	}

	.protocol-section {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(16, 35, 31, 0.04);
	}

	.section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 800;
		color: #10231f;
		margin-bottom: 16rpx;
	}

	.section-text {
		display: block;
		font-size: 26rpx;
		line-height: 1.8;
		color: #4f5b57;
	}
</style>
