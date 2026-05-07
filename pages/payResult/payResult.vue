<template>
	<view class="app result" :class="success ? 'result-ok' : 'result-fail'">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-icon">
				<text class="hero-icon-text">{{ success ? '✓' : '!' }}</text>
			</view>
			<text class="hero-title">{{ success ? '支付成功' : '支付失败' }}</text>
			<text class="hero-sub">{{ success ? '本次垂钓已完成，欢迎下次再来' : '请重试或联系客服' }}</text>
			<view v-if="order && success" class="hero-amount">
				<text class="hero-currency">¥</text>
				<text class="hero-number">{{ formatMoney(order.amountCents || 0) }}</text>
			</view>
		</view>

		<view v-if="order" class="sheet">
			<view class="sheet-head">
				<text class="sheet-title">订单回执</text>
				<text class="sheet-tag" :class="success ? 'sheet-tag-ok' : 'sheet-tag-fail'">{{ success ? '已完成' : '支付失败' }}</text>
			</view>
			<view class="sheet-row">
				<text class="sheet-key">订单号</text>
				<text class="sheet-val">{{ order.orderNo }}</text>
			</view>
			<view class="sheet-row">
				<text class="sheet-key">计费时长</text>
				<text class="sheet-val">{{ formatDuration(order.durationSeconds || 0) }}</text>
			</view>
			<view class="sheet-row">
				<text class="sheet-key">支付方式</text>
				<text class="sheet-val">微信支付</text>
			</view>
			<view class="sheet-row">
				<text class="sheet-key">支付时间</text>
				<text class="sheet-val">{{ formatDatetime(order.paidTime || order.endTime) }}</text>
			</view>
		</view>

		<view class="spacer"></view>

		<view class="dock">
			<block v-if="success">
				<button class="dock-ghost" @click="goOrders">历史订单</button>
				<button class="dock-primary" @click="goHome">返回首页</button>
			</block>
			<block v-else>
				<button class="dock-ghost" @click="goHome">返回首页</button>
				<button class="dock-primary" @click="retry">重新支付</button>
			</block>
		</view>
	</view>
</template>

<script>
	import {
		formatMoney,
		formatDuration,
		formatDatetime,
		getUser,
		getLatestOrders,
		ORDER_STATUS
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return { success: true, order: null }
		},
		onLoad(option = {}) {
			this.success = option.success !== '0'
			const user = getUser()
			const list = getLatestOrders(user.id, 5)
			if (option.orderId) {
				this.order = list.find((item) => item.id === option.orderId) || null
			}
			if (!this.order && this.success) {
				this.order = list.find((item) => item.status === ORDER_STATUS.PAID) || null
			}
		},
		methods: {
			goHome() { uni.reLaunch({ url: '/pages/index/index' }) },
			goOrders() { uni.redirectTo({ url: '/pages/orders/orders' }) },
			retry() { uni.redirectTo({ url: '/pages/pay/pay' }) },
			formatMoney,
			formatDuration,
			formatDatetime
		}
	}
</script>

<style>
	.result {
		padding-bottom: 200rpx;
	}

	.hero {
		position: relative;
		margin: 20rpx 28rpx 0;
		padding: 60rpx 36rpx 40rpx;
		border-radius: 28rpx;
		overflow: hidden;
		text-align: center;
		box-shadow: 0 12rpx 30rpx rgba(26, 32, 48, 0.08);
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.result-ok .hero-bg {
		background: linear-gradient(135deg, #fff7df 0%, #ffe29a 100%);
	}

	.result-fail .hero-bg {
		background: linear-gradient(135deg, #fde2d7 0%, #f8c2a8 100%);
	}

	.hero > * {
		position: relative;
		z-index: 1;
	}

	.hero-icon {
		width: 140rpx;
		height: 140rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 24rpx;
		box-shadow: 0 12rpx 24rpx rgba(26, 32, 48, 0.12);
	}

	.result-ok .hero-icon {
		background: #4fb38a;
	}

	.result-fail .hero-icon {
		background: #e86a4b;
	}

	.hero-icon-text {
		color: #ffffff;
		font-size: 80rpx;
		font-weight: 800;
		line-height: 1;
	}

	.hero-title {
		display: block;
		font-size: 44rpx;
		font-weight: 800;
		color: #1a1306;
	}

	.hero-sub {
		display: block;
		margin-top: 12rpx;
		color: #6b5b2a;
		font-size: 26rpx;
	}

	.result-fail .hero-sub {
		color: #6b2f1a;
	}

	.hero-amount {
		margin-top: 24rpx;
		display: flex;
		justify-content: center;
		align-items: baseline;
		color: #1a1306;
	}

	.hero-currency {
		font-size: 30rpx;
		font-weight: 700;
		margin-right: 4rpx;
	}

	.hero-number {
		font-size: 68rpx;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.sheet {
		margin: 24rpx 28rpx 0;
		padding: 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.05);
	}

	.sheet-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 14rpx;
	}

	.sheet-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.sheet-tag {
		padding: 4rpx 16rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
		font-weight: 700;
	}

	.sheet-tag-ok {
		background: rgba(79, 179, 138, 0.14);
		color: #2fa273;
	}

	.sheet-tag-fail {
		background: rgba(232, 106, 75, 0.14);
		color: #c9482b;
	}

	.sheet-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-top: 1rpx dashed #eef0f5;
		font-size: 26rpx;
	}

	.sheet-key {
		color: #6b7280;
	}

	.sheet-val {
		color: #1a2030;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.spacer {
		height: 40rpx;
	}

	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
		background: rgba(244, 245, 247, 0.96);
		backdrop-filter: blur(12px);
		display: flex;
		gap: 16rpx;
		box-shadow: 0 -8rpx 20rpx rgba(26, 32, 48, 0.06);
	}

	.dock-ghost {
		flex: 0 0 240rpx;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 20rpx;
		background: #ffffff;
		color: #3a4355;
		border: 1rpx solid #e4e7ee;
		font-size: 30rpx;
		font-weight: 700;
	}

	.dock-ghost::after {
		border: 0;
	}

	.dock-primary {
		flex: 1;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 20rpx;
		background: #f5c23b;
		color: #1a1306;
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
		box-shadow: 0 12rpx 24rpx rgba(245, 194, 59, 0.3);
	}

	.dock-primary::after {
		border: 0;
	}
</style>
