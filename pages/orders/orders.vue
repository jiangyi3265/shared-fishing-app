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
			<view class="empty-mark"></view>
			<text class="empty-title">暂无相关订单</text>
			<text class="empty-desc">扫码入场即可开始第一次计时</text>
		</view>

		<view v-for="item in filteredOrders" :key="item.orderId" class="order">
			<view class="order-clickable" @click="viewOrder(item)">
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
			<view class="order-actions" v-if="item.status === ORDER_STATUS.PAID">
				<text class="order-action" @click.stop="goRefundApply(item)">申请退款</text>
			</view>
		</view>

		<view v-if="orders.length" class="footer-link" @click="goRefundList">
			<text>查看退款记录 ›</text>
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
		fetchOrders,
		isLoggedIn
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				orders: [],
				filter: 'all',
				ORDER_STATUS,
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
				if (this.filter === 'pending') return this.orders.filter((o) => o.status === ORDER_STATUS.PENDING)
				if (this.filter === 'paid') return this.orders.filter((o) => o.status === ORDER_STATUS.PAID)
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
			if (!user) return
			fetchOrders(user.userId, 20).then((list) => { this.orders = list }).catch(() => {})
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
			goRefundApply(item) {
				uni.navigateTo({ url: '/pages/refund/apply?orderId=' + item.orderId })
			},
			goRefundList() {
				uni.navigateTo({ url: '/pages/refund/list' })
			},
			formatMoney,
			formatDuration,
			formatDatetime
		}
	}
</script>

<style>
	.orders {
		padding-bottom: 80rpx;
		background: transparent;
	}

	.hero {
		position: relative;
		margin: 0;
		padding: 60rpx 32rpx 96rpx;
		border-bottom-left-radius: 64rpx;
		border-bottom-right-radius: 64rpx;
		overflow: hidden;
		box-shadow: 0 24rpx 56rpx rgba(10, 46, 36, 0.2);
	}

	.hero-bg {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background: linear-gradient(135deg, #071f18 0%, #0c352a 50%, #031410 100%);
	}

	.hero-bg::after {
		content: '';
		position: absolute;
		right: -96rpx;
		top: -118rpx;
		width: 330rpx;
		height: 330rpx;
		border-radius: 50%;
		border: 54rpx solid rgba(199, 154, 57, 0.1);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		color: #ffffff;
	}

	.hero-title {
		font-size: 48rpx;
		font-weight: 900;
		color: #ffffff;
		letter-spacing: 1rpx;
		display: block;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	}

	.hero-sub {
		font-size: 22rpx;
		color: var(--accent);
		letter-spacing: 3rpx;
		display: block;
		margin-top: 8rpx;
		font-weight: 800;
		text-transform: uppercase;
	}

	.hero-stats {
		margin-top: 36rpx;
		padding: 28rpx 20rpx;
		border-radius: 32rpx 12rpx;
		background: rgba(255, 255, 255, 0.04);
		border: 1rpx solid rgba(245, 210, 133, 0.22);
		box-shadow: inset 0 0 16rpx rgba(245, 210, 133, 0.08);
		display: flex;
		align-items: center;
		backdrop-filter: blur(10px);
	}

	.hero-stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
	}

	.hero-stat-value {
		font-size: 32rpx;
		font-weight: 800;
		color: #ffffff;
		font-variant-numeric: tabular-nums;
	}

	.hero-stat-label {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 600;
	}

	.hero-stat-sep {
		width: 1rpx;
		height: 52rpx;
		background: rgba(255, 255, 255, 0.12);
	}

	.tabs {
		margin: -40rpx 44rpx 0;
		padding: 8rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.85);
		border: 1rpx solid rgba(255, 255, 255, 0.6);
		display: flex;
		gap: 6rpx;
		box-shadow: 0 20rpx 48rpx rgba(10, 46, 36, 0.08);
		position: relative;
		z-index: 10;
		backdrop-filter: blur(20px);
	}

	.tab {
		flex: 1;
		height: 76rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		color: var(--text-muted);
		font-size: 26rpx;
		font-weight: 700;
		transition: var(--transition);
	}

	.tab.active {
		background: var(--primary-gradient);
		color: #ffffff;
		font-weight: 800;
		box-shadow: 0 8rpx 20rpx rgba(10, 46, 36, 0.15);
	}

	.tab-count {
		font-size: 22rpx;
		opacity: 0.75;
		font-variant-numeric: tabular-nums;
	}

	.empty {
		margin: 60rpx 32rpx;
		padding: 80rpx 40rpx;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(15px);
		border-radius: 48rpx 16rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: var(--card-shadow);
		text-align: center;
	}

	.empty-mark {
		width: 96rpx;
		height: 96rpx;
		border-radius: 32rpx;
		background: #edf3f0;
		margin: 0 auto 18rpx;
		position: relative;
		border: 1rpx solid rgba(10, 46, 36, 0.04);
	}

	.empty-mark::before {
		content: '';
		position: absolute;
		left: 24rpx;
		right: 24rpx;
		top: 28rpx;
		height: 40rpx;
		border: 6rpx solid var(--text-light);
		border-top: 0;
		border-radius: 0 0 16rpx 16rpx;
	}

	.empty-mark::after {
		content: '';
		position: absolute;
		left: 30rpx;
		right: 30rpx;
		top: 24rpx;
		height: 6rpx;
		background: var(--accent);
		border-radius: 999rpx;
	}

	.empty-title {
		display: block;
		font-size: 30rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.empty-desc {
		display: block;
		color: var(--text-muted);
		font-size: 24rpx;
		margin-top: 10rpx;
		font-weight: 600;
	}

	.order {
		margin: 28rpx 32rpx 0;
		padding: 40rpx 32rpx 32rpx;
		border-radius: 48rpx 16rpx;
		background: rgba(255, 255, 255, 0.78);
		backdrop-filter: blur(20px);
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: var(--card-shadow);
		transition: var(--transition);
		position: relative;
	}

	.order:active {
		transform: scale(0.97) translateY(2rpx);
		opacity: 0.95;
	}

	.order-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.order-no {
		font-size: 24rpx;
		color: var(--text-muted);
		letter-spacing: 0.5rpx;
		font-weight: 600;
	}

	.order-body {
		margin: 20rpx 0 24rpx;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.order-amount {
		display: flex;
		align-items: baseline;
		color: var(--primary);
	}

	.order-currency {
		font-size: 30rpx;
		font-weight: 800;
		margin-right: 4rpx;
	}

	.order-number {
		font-size: 60rpx;
		font-weight: 900;
		font-variant-numeric: tabular-nums;
	}

	.order-duration {
		text-align: right;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.order-duration-label {
		font-size: 22rpx;
		color: var(--text-light);
		font-weight: 600;
	}

	.order-duration-value {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
		font-variant-numeric: tabular-nums;
	}

	.order-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 24rpx;
		border-top: 1rpx dashed rgba(10, 46, 36, 0.06);
	}

	.order-time {
		font-size: 24rpx;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.order-arrow {
		font-size: 24rpx;
		color: var(--accent);
		font-weight: 800;
	}

	.order-actions {
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx dashed rgba(10, 46, 36, 0.06);
		display: flex;
		justify-content: flex-end;
	}

	.order-action {
		padding: 12rpx 36rpx;
		border-radius: 999rpx;
		background: rgba(224, 169, 60, 0.1);
		color: #b8860b;
		font-size: 24rpx;
		font-weight: 800;
		border: 1rpx solid rgba(224, 169, 60, 0.15);
		transition: var(--transition);
	}

	.order-action:active {
		background: rgba(224, 169, 60, 0.2);
		transform: scale(0.96);
	}

	.footer-link {
		margin: 36rpx 32rpx;
		padding: 22rpx;
		text-align: center;
		color: var(--text-muted);
		font-size: 26rpx;
		font-weight: 700;
	}
</style>
