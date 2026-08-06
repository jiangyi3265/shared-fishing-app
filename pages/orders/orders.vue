<template>
	<view class="app orders has-brand-header">
		<brand-header title="我的订单" theme="teal" layout="stacked" :back-on-title="true" :scene="true" />
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">我的订单</text>
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
			<text class="empty-desc">点击首页“下竿计时”即可开始第一次计时</text>
		</view>

		<view v-for="item in filteredOrders" :key="item.orderId" class="order">
			<view class="order-clickable" @click="viewOrder(item)">
				<view class="order-head">
					<text class="order-no">{{ item.orderNo }}</text>
					<view class="pill" :class="pillClass(item.status)">{{ statusLabel[item.status] || '未知' }}</view>
				</view>
				<text v-if="item.spotName" class="order-spot">{{ item.venueName || '共享钓场' }} · {{ item.spotName }}</text>
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
		isLoggedIn,
		seedHomeIfAlone
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
			// 订单页若是栈底唯一页（如已登录冷启动直达），先垫一层首页，避免安卓左滑退出小程序
			if (seedHomeIfAlone('/pages/orders/orders')) return
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

<style scoped>
.orders{min-height:100vh;padding-bottom:48rpx;background:#f6fbfa;color:#0b3134}
.hero{padding:0 18rpx 16rpx;background:#08b8b2}
.hero-bg,.hero-title{display:none}
.hero-content{position:relative}
.hero-stats{height:112rpx;padding:0 8rpx;display:flex;align-items:center;border-radius:14rpx;background:#fff;box-shadow:0 10rpx 24rpx rgba(4,92,93,.10)}
.hero-stat{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6rpx}
.hero-stat-value{max-width:100%;overflow:hidden;color:#078f91;font-size:28rpx;font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap;text-overflow:ellipsis}
.hero-stat-label{color:#657b7d;font-size:19rpx}
.hero-stat-sep{width:1rpx;height:58rpx;background:#dce9e8}
.tabs{height:76rpx;padding:0 20rpx;display:flex;border-bottom:1rpx solid #dce9e8;background:#fff}
.tab{position:relative;flex:1;display:flex;align-items:center;justify-content:center;gap:6rpx;color:#667a7c;font-size:23rpx}
.tab.active{color:#079d9b;font-weight:800}.tab.active:after{content:'';position:absolute;left:50%;bottom:0;width:54rpx;height:5rpx;border-radius:99rpx;background:#08b8b2;transform:translateX(-50%)}
.tab-count{font-size:18rpx;opacity:.75}
.empty{margin:26rpx 20rpx;padding:86rpx 32rpx;display:flex;align-items:center;flex-direction:column;border:1rpx solid #d9e7e6;border-radius:14rpx;background:#fff;text-align:center}
.empty-mark{width:82rpx;height:82rpx;border:3rpx solid #9dc6c4;border-radius:14rpx;position:relative}.empty-mark:after{content:'';position:absolute;left:18rpx;right:18rpx;top:22rpx;height:5rpx;border-radius:99rpx;background:#08a5a2;box-shadow:0 15rpx 0 #08a5a2,0 30rpx 0 #08a5a2}
.empty-title{margin-top:22rpx;font-size:28rpx;font-weight:900}.empty-desc{margin-top:8rpx;color:#75898b;font-size:21rpx}
.order{margin:14rpx 18rpx 0;padding:19rpx 20rpx 16rpx;border:1rpx solid #d6e4e3;border-radius:12rpx;background:#fff}
.order-clickable{width:100%}.order-head{display:flex;align-items:center;justify-content:space-between}.order-no{color:#566d6f;font-size:21rpx}.pill{padding:3rpx 9rpx;border-radius:5rpx;background:#e7f7f1;color:#098e75;font-size:19rpx}.pill-warn,.pill-pending{background:#fff4df;color:#e47e00}.pill-ok,.pill-paid{background:#e7f7f1;color:#079d8a}
.order-spot{display:block;margin-top:8rpx;color:#087f7e;font-size:21rpx;font-weight:800}
.order-body{margin-top:11rpx;display:flex;align-items:center;justify-content:space-between}.order-amount{display:flex;align-items:baseline;color:#0b3134}.order-currency{font-size:20rpx}.order-number{font-size:30rpx;font-weight:900;font-variant-numeric:tabular-nums}
.order-duration{display:flex;align-items:center;gap:12rpx}.order-duration-label{color:#698082;font-size:20rpx}.order-duration-value{font-size:22rpx;font-weight:800;font-variant-numeric:tabular-nums}
.order-foot{margin-top:10rpx;padding-top:10rpx;display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid #e2eceb}.order-time{color:#788b8d;font-size:19rpx}.order-arrow{color:#079b99;font-size:20rpx;font-weight:700}
.order-actions{margin-top:10rpx;padding-top:10rpx;display:flex;justify-content:flex-end;border-top:1rpx solid #e1ebea}.order-action{padding:7rpx 18rpx;border:1rpx solid #09a5a2;border-radius:8rpx;color:#079b99;font-size:20rpx}
.footer-link{height:74rpx;margin:14rpx 18rpx 0;display:flex;align-items:center;justify-content:center;color:#078f91;font-size:21rpx}
@media (max-width:360px){.hero-stat-value{font-size:25rpx}.order{margin-left:14rpx;margin-right:14rpx}}
</style>

<style scoped>
.orders{padding-bottom:calc(48rpx + env(safe-area-inset-bottom))}
@media (max-width:360px){.order-top,.order-meta,.order-actions{gap:10rpx}.order-no,.order-status{font-size:19rpx}.order-actions{flex-wrap:wrap}.order-actions button{min-width:140rpx;flex:1}}
</style>
