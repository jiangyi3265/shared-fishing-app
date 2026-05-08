<template>
	<view class="app guide">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">操作指引</text>
				<text class="hero-sub">SHARED · FISHING GUIDE</text>
			</view>
		</view>

		<view class="steps">
			<view class="step" v-for="(item, idx) in steps" :key="idx">
				<view class="step-num">{{ idx + 1 }}</view>
				<view class="step-body">
					<text class="step-icon">{{ item.icon }}</text>
					<view class="step-text">
						<text class="step-title">{{ item.title }}</text>
						<text class="step-desc">{{ item.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="tips card">
			<text class="tips-title">温馨提示</text>
			<view class="tip-item" v-for="(tip, idx) in tips" :key="idx">
				<text class="tip-dot">•</text>
				<text class="tip-text">{{ tip }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				steps: [
					{ icon: '📱', title: '扫码入场', desc: '到达钓场后，打开小程序扫描入口二维码，系统自动开始计时' },
					{ icon: '⏱️', title: '享受垂钓', desc: '计时期间可随时查看已用时长和预估费用，安心享受垂钓时光' },
					{ icon: '🏷️', title: '扫码出场', desc: '准备离开时，扫描出口二维码，系统自动结束计时并计算费用' },
					{ icon: '💳', title: '在线支付', desc: '确认账单金额后，通过微信支付完成付款，即可离场' }
				],
				tips: [
					'起步时间内按起步价计费，超出后按阶梯递增',
					'如有优惠券可在结算时使用，自动抵扣',
					'计时以服务端时间为准，本地显示仅供参考',
					'如遇问题请联系现场工作人员或在线客服'
				]
			}
		}
	}
</script>

<style>
	.guide {
		padding-bottom: 60rpx;
	}

	.hero {
		position: relative;
		margin: 20rpx 28rpx 0;
		padding: 40rpx 32rpx 36rpx;
		border-radius: 28rpx;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 2rpx;
		display: block;
	}

	.hero-sub {
		font-size: 22rpx;
		color: #f5c23b;
		letter-spacing: 4rpx;
		display: block;
		margin-top: 8rpx;
	}

	.steps {
		margin: 24rpx 28rpx 0;
		background: #ffffff;
		border-radius: 22rpx;
		padding: 20rpx 24rpx;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.step {
		display: flex;
		align-items: flex-start;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #f4f5f7;
	}

	.step:last-child {
		border-bottom: none;
	}

	.step-num {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background: #f5c23b;
		color: #1a1306;
		font-size: 24rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 8rpx;
	}

	.step-body {
		flex: 1;
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
		margin-left: 20rpx;
	}

	.step-icon {
		font-size: 40rpx;
		flex-shrink: 0;
		margin-top: 4rpx;
	}

	.step-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.step-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.step-desc {
		font-size: 24rpx;
		color: #6b7280;
		line-height: 1.5;
	}

	.tips {
		margin-top: 24rpx;
	}

	.tips-title {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
		margin-bottom: 16rpx;
	}

	.tip-item {
		display: flex;
		align-items: flex-start;
		gap: 12rpx;
		padding: 8rpx 0;
	}

	.tip-dot {
		color: #f5c23b;
		font-size: 28rpx;
		font-weight: 700;
		line-height: 1.5;
	}

	.tip-text {
		flex: 1;
		font-size: 24rpx;
		color: #6b7280;
		line-height: 1.5;
	}
</style>
