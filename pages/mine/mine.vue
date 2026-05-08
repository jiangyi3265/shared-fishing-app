<template>
	<view class="app mine">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<view class="profile">
					<view class="avatar">
						<text class="avatar-text">{{ avatarLetter }}</text>
					</view>
					<view class="profile-text">
						<text class="nickname">{{ user ? (user.nickname || user.name || '钓友') : '游客' }}</text>
						<view class="meta-row">
							<view class="vip-chip">
								<text class="vip-emoji">👑</text>
								<text>普通会员</text>
							</view>
							<view class="login-chip" v-if="!loggedIn" @click="goLogin">未登录 ›</view>
							<view class="login-chip login-chip-ok" v-else>已授权</view>
						</view>
					</view>
					<view class="set-btn" @click="goSettings">⚙️</view>
				</view>

				<view class="wallet">
					<view class="wallet-item">
						<text class="wallet-num">{{ stats.pendingCount }}</text>
						<text class="wallet-label">待支付</text>
					</view>
					<view class="wallet-sep"></view>
					<view class="wallet-item">
						<text class="wallet-num">{{ stats.paidCount }}</text>
						<text class="wallet-label">已完成</text>
					</view>
					<view class="wallet-sep"></view>
					<view class="wallet-item">
						<text class="wallet-num">¥{{ formatMoney(stats.totalAmount) }}</text>
						<text class="wallet-label">累计消费</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="stats.pendingCount > 0" class="alert" @click="goPay">
			<view class="alert-icon">⚠️</view>
			<view class="alert-text">
				<text class="alert-title">您有 {{ stats.pendingCount }} 笔待支付订单</text>
				<text class="alert-desc">请尽快完成支付，点击查看详情</text>
			</view>
			<text class="alert-arrow">›</text>
		</view>

		<view class="tools">
			<text class="tools-title">常用工具</text>
			<view class="tools-grid">
				<view class="tool" @click="goOrders">
					<view class="tool-icon tool-icon-1">📄</view>
					<text class="tool-name">我的订单</text>
				</view>
				<view class="tool" @click="goPay">
					<view class="tool-icon tool-icon-2">💰</view>
					<text class="tool-name">待支付</text>
				</view>
				<view class="tool" @click="goGuide">
					<view class="tool-icon tool-icon-3">📘</view>
					<text class="tool-name">操作指引</text>
				</view>
				<view class="tool" @click="goCoupons">
					<view class="tool-icon tool-icon-4">🎫</view>
					<text class="tool-name">我的优惠券</text>
				</view>
				<view class="tool" @click="goPromotions">
					<view class="tool-icon tool-icon-5">🎁</view>
					<text class="tool-name">优惠活动</text>
				</view>
				<view class="tool" @click="goRateInfo">
					<view class="tool-icon tool-icon-6">📊</view>
					<text class="tool-name">费率说明</text>
				</view>
				<view class="tool" @click="goContact">
					<view class="tool-icon tool-icon-7">📞</view>
					<text class="tool-name">联系客服</text>
				</view>
				<view class="tool" @click="goAbout">
					<view class="tool-icon tool-icon-8">❓</view>
					<text class="tool-name">关于我们</text>
				</view>
			</view>
		</view>

		<view class="logout" @click="doLogout">
			<text class="logout-icon">🚪</text>
			<text class="logout-text">退出登录</text>
		</view>

		<view class="footer-text">技术支持 · 共享钓场 v1.0</view>

		<view class="tabbar">
			<view class="tabbar-item" @click="goHome">
				<text class="tabbar-icon">🏠</text>
				<text>首页</text>
			</view>
			<view class="tabbar-mid" @click="goCheckout">
				<view class="tabbar-mid-btn">¥</view>
				<text>结算离场</text>
			</view>
			<view class="tabbar-item active">
				<text class="tabbar-icon">👤</text>
				<text>我的</text>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		ORDER_STATUS,
		formatMoney,
		getUser,
		fetchOrders,
		isLoggedIn,
		logout,
		finishOrder,
		fetchRunningOrder,
		fetchPendingOrder
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				user: null,
				loggedIn: false,
				stats: { pendingCount: 0, paidCount: 0, totalAmount: 0 }
			}
		},
		computed: {
			avatarLetter() {
				const name = this.user ? (this.user.nickname || this.user.name || '') : ''
				if (!name) return 'F'
				return name.slice(-2, -1) || name[0] || 'F'
			}
		},
		onShow() {
			this.loggedIn = isLoggedIn()
			this.user = getUser()
			if (!this.loggedIn || !this.user) return
			fetchOrders(this.user.userId).then((orders) => {
				const paid = orders.filter((o) => o.status === ORDER_STATUS.PAID)
				this.stats = {
					pendingCount: orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
					paidCount: paid.length,
					totalAmount: paid.reduce((acc, o) => acc + (o.amountPaid || o.amountCents || 0), 0)
				}
			}).catch(() => {})
		},
		methods: {
			goLogin() {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/mine/mine') })
			},
			goSettings() { uni.navigateTo({ url: '/pages/settings/settings' }) },
			doLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确认退出当前账号？',
					success: (res) => {
						if (!res.confirm) return
						logout()
						uni.redirectTo({ url: '/pages/login/login' })
					}
				})
			},
			goHome() { uni.redirectTo({ url: '/pages/index/index' }) },
			goOrders() { uni.redirectTo({ url: '/pages/orders/orders' }) },
			goPay() {
				const user = getUser()
				if (!user) return
				fetchPendingOrder(user.userId).then((p) => {
					if (!p) { uni.showToast({ title: '暂无待支付订单', icon: 'none' }); return }
					uni.redirectTo({ url: '/pages/pay/pay' })
				})
			},
			goCheckout() {
				const user = getUser()
				if (!user) return
				fetchPendingOrder(user.userId).then((p) => {
					if (p) { uni.redirectTo({ url: '/pages/pay/pay' }); return }
					fetchRunningOrder(user.userId).then((r) => {
						if (!r) { uni.showToast({ title: '未检测到进行中的订单', icon: 'none' }); return }
						finishOrder(user.userId).then(() => uni.redirectTo({ url: '/pages/pay/pay' }))
					})
				})
			},
			goGuide() { uni.navigateTo({ url: '/pages/guide/guide' }) },
			goPromotions() { uni.navigateTo({ url: '/pages/promotions/promotions' }) },
			goRateInfo() { uni.navigateTo({ url: '/pages/rateInfo/rateInfo' }) },
			goContact() { uni.navigateTo({ url: '/pages/contact/contact' }) },
			goAbout() { uni.navigateTo({ url: '/pages/about/about' }) },
			goCoupons() { uni.navigateTo({ url: '/pages/coupons/coupons' }) },
			formatMoney
		}
	}
</script>

<style>
	.mine {
		padding-bottom: 200rpx;
	}

	.hero {
		position: relative;
		margin: 0;
		padding: 0 28rpx;
	}

	.hero-bg {
		position: absolute;
		top: -20rpx;
		left: 0;
		right: 0;
		height: 380rpx;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
		z-index: 0;
	}

	.hero-content {
		position: relative;
		z-index: 1;
		padding-top: 40rpx;
	}

	.profile {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 20rpx 0 32rpx;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: #f5c23b;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 4rpx solid #ffffff;
		box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.25);
	}

	.avatar-text {
		font-size: 48rpx;
		font-weight: 800;
		color: #1a1306;
	}

	.profile-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.nickname {
		font-size: 36rpx;
		font-weight: 800;
		color: #ffffff;
	}

	.meta-row {
		display: flex;
		gap: 12rpx;
	}

	.vip-chip {
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		background: rgba(245, 194, 59, 0.2);
		color: #f5c23b;
		font-size: 20rpx;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 6rpx;
	}

	.vip-emoji {
		font-size: 22rpx;
	}

	.login-chip {
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.1);
		color: #d8d8d8;
		font-size: 20rpx;
	}

	.login-chip-ok {
		background: rgba(79, 179, 138, 0.2);
		color: #8fdcb5;
	}

	.set-btn {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
	}

	.wallet {
		background: #ffffff;
		border-radius: 22rpx;
		padding: 32rpx 16rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.15);
	}

	.wallet-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
	}

	.wallet-num {
		font-size: 38rpx;
		font-weight: 800;
		color: #1a2030;
		font-variant-numeric: tabular-nums;
	}

	.wallet-label {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.wallet-sep {
		width: 1rpx;
		height: 60rpx;
		background: #eef0f5;
	}

	.alert {
		margin: 24rpx 28rpx 0;
		padding: 22rpx 24rpx;
		border-radius: 18rpx;
		background: #fff7df;
		border: 1rpx solid #f0d47a;
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.alert-icon {
		font-size: 36rpx;
	}

	.alert-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.alert-title {
		font-size: 26rpx;
		font-weight: 700;
		color: #8a6914;
	}

	.alert-desc {
		font-size: 22rpx;
		color: #b8860b;
	}

	.alert-arrow {
		color: #b8860b;
		font-size: 32rpx;
		font-weight: 700;
	}

	.tools {
		margin: 24rpx 28rpx 0;
		padding: 32rpx 20rpx 24rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.05);
	}

	.tools-title {
		padding: 0 12rpx 24rpx;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
		display: block;
	}

	.tools-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 24rpx 0;
	}

	.tool {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
		padding: 10rpx 0;
	}

	.tool-icon {
		width: 88rpx;
		height: 88rpx;
		border-radius: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 38rpx;
	}

	.tool-icon-1 { background: #fff3d1; }
	.tool-icon-2 { background: #ffe6a8; }
	.tool-icon-3 { background: #e8f1fa; }
	.tool-icon-4 { background: #e4f6ec; }
	.tool-icon-5 { background: #fde9e4; }
	.tool-icon-6 { background: #f0eaff; }
	.tool-icon-7 { background: #e8f5ff; }
	.tool-icon-8 { background: #f4f5f7; }

	.tool-name {
		font-size: 22rpx;
		color: #3a4355;
	}

	.logout {
		margin: 24rpx 28rpx 0;
		padding: 26rpx;
		border-radius: 20rpx;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.logout-icon {
		font-size: 28rpx;
	}

	.logout-text {
		font-size: 28rpx;
		font-weight: 700;
		color: #e86a4b;
	}

	.footer-text {
		text-align: center;
		color: #9aa3b2;
		font-size: 22rpx;
		margin: 40rpx 0 24rpx;
	}
</style>
