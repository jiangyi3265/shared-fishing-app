<template>
	<view class="app protocol-page">
		<view class="protocol-header">
			<text class="protocol-title">用户服务协议</text>
			<text class="protocol-sub">共享钓场小程序服务说明</text>
		</view>

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
