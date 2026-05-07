<template>
	<view class="app orders">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">我的订单</text>
				<text class="hero-sub">SHARED · FISHING HISTORY</text>
				<view class="hero-stats">
					<view class="hero-stat">
						<text class="hero-stat-value">{{ stats.count }}</text>
						<text class="hero-stat-label">已完成</text>
					</view>
					<view class="hero-stat-sep"></view>
					<view class="hero-stat">
						<text class="hero-stat-value">{{ formatDuration(stats.duration) }}</text>
						<text class="hero-stat-label">累计时长</text>
					</view>
					<view class="hero-stat-sep"></view>
					<view class="hero-stat">
						<text class="hero-stat-value">¥{{ formatMoney(stats.amount) }}</text>
						<text class="hero-stat-label">累计消费</text>
					</view>
				</view>
			</view>
		</view>

		<view class="tabs">
			<view class="tab" :class="{ active: filter === 'all' }" @click="filter = 'all'">
				<text class="tab-name">全部</text>
				<text class="tab-count">{{ counts.all }}</text>
			</view>
			<view class="tab" :class="{ active: filter === 'pending' }" @click="filter = 'pending'">
				<text class="tab-name">待支付</text>
				<text class="tab-count">{{ counts.pending }}</text>
			</view>
			<view class="tab" :class="{ active: filter === 'paid' }" @click="filter = 'paid'">
				<text class="tab-name">已完成</text>
				<text class="tab-count">{{ counts.paid }}</text>
			</view>
		</view>

		<view v-if="!filteredOrders.length" class="empty">
			<text class="empty-emoji">🪣</text>
			<text class="empty-title">暂无相关订单</text>
			<text class="empty-desc">扫码入场即可开始第一次计时</text>
		</view>

		<view v-for="item in filteredOrders" :key="item.id" class="order" @click="viewOrder(item)">
			<view class="order-head">
				<text class="order-no">{{ item.orderNo }}</text>
				<view class="pill" :class="pillClass(item.status)">{{ statusLabel[item.status] || '未知' }}</view>
			</view>
			<view class="order-body">
				<view class="order-amount">
					<text class="order-currency">¥</text>
					<text class="order-number">{{ formatMoney(item.amountCents || 0) }}</text>
				</view>
				<view class="order-duration">
					<text class="order-duration-label">计费时长</text>
					<text class="order-duration-value">{{ formatDuration(item.durationSeconds || 0) }}</text>
				</view>
			</view>
			<view class="order-foot">
				<text class="order-time">{{ formatDatetime(item.startTime) }}</text>
				<text class="order-arrow">详情 ›</text>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		ORDER_STATUS,
		formatMoney,
		formatDuration,
		formatDatetime,
		getUser,
		getLatestOrders,
		isLoggedIn
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				orders: [],
				filter: 'all',
				statusLabel: {
					[ORDER_STATUS.READY]: '待处理',
					[ORDER_STATUS.RUNNING]: '计时中',
					[ORDER_STATUS.PENDING]: '待支付',
					[ORDER_STATUS.PAID]: '已完成',
					[ORDER_STATUS.CANCELED]: '已取消'
				}
			}
		},
		computed: {
			counts() {
				return {
					all: this.orders.length,
					pending: this.orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
					paid: this.orders.filter((o) => o.status === ORDER_STATUS.PAID).length
				}
			},
			filteredOrders() {
				if (this.filter === 'pending') {
					return this.orders.filter((o) => o.status === ORDER_STATUS.PENDING)
				}
				if (this.filter === 'paid') {
					return this.orders.filter((o) => o.status === ORDER_STATUS.PAID)
				}
				return this.orders
			},
			stats() {
				const paid = this.orders.filter((item) => item.status === ORDER_STATUS.PAID)
				return {
					count: paid.length,
					duration: paid.reduce((acc, item) => acc + (item.durationSeconds || 0), 0),
					amount: paid.reduce((acc, item) => acc + (item.amountCents || 0), 0)
				}
			}
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/orders/orders') })
				return
			}
			const user = getUser()
			this.orders = getLatestOrders(user.id, 20)
		},
		methods: {
			pillClass(status) {
				if (status === ORDER_STATUS.RUNNING) return 'pill-running'
				if (status === ORDER_STATUS.PENDING) return 'pill-pending'
				if (status === ORDER_STATUS.PAID) return 'pill-paid'
				if (status === ORDER_STATUS.CANCELED) return 'pill-cancel'
				return 'pill-idle'
			},
			viewOrder(item) {
				if (item.status === ORDER_STATUS.PENDING) {
					uni.redirectTo({ url: '/pages/pay/pay' })
					return
				}
				if (item.status === ORDER_STATUS.RUNNING) {
					uni.redirectTo({ url: '/pages/session/session' })
					return
				}
				uni.showToast({ title: '订单已归档', icon: 'none' })
			},
			formatMoney,
			formatDuration,
			formatDatetime
		}
	}
</script>

<style>
	.orders {
		padding-bottom: 60rpx;
	}

	.hero {
		position: relative;
		margin: 20rpx 28rpx 0;
		padding: 40rpx 32rpx 36rpx;
		border-radius: 28rpx;
		overflow: hidden;
		box-shadow: 0 12rpx 30rpx rgba(26, 32, 48, 0.08);
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		color: #ffffff;
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

	.hero-stats {
		margin-top: 32rpx;
		padding: 28rpx 20rpx;
		border-radius: 20rpx;
		background: rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
	}

	.hero-stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6rpx;
	}

	.hero-stat-value {
		font-size: 32rpx;
		font-weight: 800;
		color: #ffffff;
		font-variant-numeric: tabular-nums;
	}

	.hero-stat-label {
		font-size: 22rpx;
		color: #a8a8a8;
	}

	.hero-stat-sep {
		width: 1rpx;
		height: 50rpx;
		background: rgba(255, 255, 255, 0.12);
	}

	.tabs {
		margin: 24rpx 28rpx 0;
		padding: 8rpx;
		border-radius: 999rpx;
		background: #ffffff;
		display: flex;
		gap: 4rpx;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.tab {
		flex: 1;
		height: 72rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		color: #6b7280;
		font-size: 26rpx;
	}

	.tab.active {
		background: #f5c23b;
		color: #1a1306;
		font-weight: 800;
		box-shadow: 0 6rpx 16rpx rgba(245, 194, 59, 0.3);
	}

	.tab-count {
		font-size: 22rpx;
		opacity: 0.75;
		font-variant-numeric: tabular-nums;
	}

	.empty {
		margin: 60rpx 28rpx;
		padding: 80rpx 40rpx;
		background: #ffffff;
		border-radius: 24rpx;
		text-align: center;
		box-shadow: 0 8rpx 24rpx rgba(26, 32, 48, 0.04);
	}

	.empty-emoji {
		display: block;
		font-size: 72rpx;
		margin-bottom: 16rpx;
	}

	.empty-title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.empty-desc {
		display: block;
		color: #6b7280;
		font-size: 26rpx;
		margin-top: 10rpx;
	}

	.order {
		margin: 20rpx 28rpx 0;
		padding: 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.order-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.order-no {
		font-size: 26rpx;
		color: #6b7280;
		letter-spacing: 1rpx;
	}

	.order-body {
		margin: 18rpx 0 20rpx;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.order-amount {
		display: flex;
		align-items: baseline;
		color: #1a2030;
	}

	.order-currency {
		font-size: 30rpx;
		font-weight: 700;
		margin-right: 4rpx;
	}

	.order-number {
		font-size: 60rpx;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.order-duration {
		text-align: right;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.order-duration-label {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.order-duration-value {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
		font-variant-numeric: tabular-nums;
	}

	.order-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 18rpx;
		border-top: 1rpx dashed #eef0f5;
	}

	.order-time {
		font-size: 24rpx;
		color: #9aa3b2;
		font-variant-numeric: tabular-nums;
	}

	.order-arrow {
		font-size: 24rpx;
		color: #b8860b;
		font-weight: 700;
	}
</style>
