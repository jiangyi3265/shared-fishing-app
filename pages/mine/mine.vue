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
								<text class="vip-mark"></text>
								<text>普通会员</text>
							</view>
							<view class="login-chip" v-if="!loggedIn" @click="goLogin">未登录 ›</view>
							<view class="login-chip login-chip-ok" v-else>已授权</view>
						</view>
					</view>
					<view class="set-btn" @click="goSettings">
						<text class="set-icon"></text>
					</view>
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

		<view v-if="isStaff" class="staff-card" @click="goWorkbench">
			<view class="staff-icon">核</view>
			<view class="staff-text">
				<text class="staff-title">商家工作台</text>
				<text class="staff-desc">进入扫码核销 / 查看待核销订单</text>
			</view>
			<text class="staff-arrow">›</text>
		</view>

		<view v-if="stats.pendingCount > 0" class="alert" @click="goPay">
			<view class="alert-icon"></view>
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
					<view class="tool-icon tool-icon-1">单</view>
					<text class="tool-name">我的订单</text>
				</view>
				<view class="tool" @click="goPay">
					<view class="tool-icon tool-icon-2">付</view>
					<text class="tool-name">待支付</text>
				</view>
				<view class="tool" @click="goGuide">
					<view class="tool-icon tool-icon-3">引</view>
					<text class="tool-name">操作指引</text>
				</view>
				<view class="tool" @click="goCoupons">
					<view class="tool-icon tool-icon-4">券</view>
					<text class="tool-name">我的优惠券</text>
				</view>
				<view class="tool" @click="goWallet">
					<view class="tool-icon tool-icon-11">包</view>
					<text class="tool-name">我的钱包</text>
				</view>
				<view class="tool" @click="goMall">
					<view class="tool-icon tool-icon-9">商</view>
					<text class="tool-name">钓场商城</text>
				</view>
				<view class="tool" @click="goMallOrders">
					<view class="tool-icon tool-icon-10">购</view>
					<text class="tool-name">商城订单</text>
				</view>
				<view class="tool" @click="goCheckin">
					<view class="tool-icon">签</view>
					<text class="tool-name">签到日历</text>
				</view>
				<view class="tool" @click="goReserve">
					<view class="tool-icon">位</view>
					<text class="tool-name">我的预订</text>
				</view>
				<view class="tool" @click="goRental">
					<view class="tool-icon">租</view>
					<text class="tool-name">我的租赁</text>
				</view>
				<view class="tool" @click="goCompetition">
					<view class="tool-icon">赛</view>
					<text class="tool-name">钓王争霸</text>
				</view>
				<view class="tool" @click="goGroup">
					<view class="tool-icon">约</view>
					<text class="tool-name">我的拼场</text>
				</view>
				<view class="tool" @click="goPromotions">
					<view class="tool-icon tool-icon-5">惠</view>
					<text class="tool-name">优惠活动</text>
				</view>
				<view class="tool" @click="goRateInfo">
					<view class="tool-icon tool-icon-6">费</view>
					<text class="tool-name">费率说明</text>
				</view>
				<view class="tool" @click="goContact">
					<view class="tool-icon tool-icon-7">客</view>
					<text class="tool-name">联系客服</text>
				</view>
				<view class="tool" @click="goAbout">
					<view class="tool-icon tool-icon-8">关</view>
					<text class="tool-name">关于我们</text>
				</view>
			</view>
		</view>

		<view class="logout" @click="doLogout">
			<text class="logout-icon"></text>
			<text class="logout-text">退出登录</text>
		</view>

		<view class="footer-text">技术支持 · 共享钓场 v1.0</view>

		<view class="tabbar">
			<view class="tabbar-item" @click="goHome">
				<text class="tabbar-icon tabbar-icon-home"></text>
				<text>首页</text>
			</view>
			<view class="tabbar-mid" @click="goCheckout">
				<view class="tabbar-mid-btn"></view>
				<text>结算离场</text>
			</view>
			<view class="tabbar-item active">
				<text class="tabbar-icon tabbar-icon-user"></text>
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
		fetchPendingOrder,
		fetchStaffInfo
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				user: null,
				loggedIn: false,
				isStaff: false,
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
			fetchStaffInfo().then((data) => { this.isStaff = !!(data && data.isStaff) }).catch(() => {})
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
			goMall() { uni.navigateTo({ url: '/pages/mall/index' }) },
			goMallOrders() { uni.navigateTo({ url: '/pages/mall/orders' }) },
			goWorkbench() { uni.navigateTo({ url: '/pages/staff/workbench' }) },
			goWallet() { uni.navigateTo({ url: '/pages/wallet/wallet' }) },
			goCheckin() { uni.navigateTo({ url: '/pages/checkin/checkin' }) },
			goReserve() { uni.navigateTo({ url: '/pages/reserve/reserve' }) },
			goRental() { uni.navigateTo({ url: '/pages/rental/rental' }) },
			goCompetition() { uni.navigateTo({ url: '/pages/competition/competition' }) },
			goGroup() { uni.navigateTo({ url: '/pages/group/group' }) },
			formatMoney
		}
	}
</script>

<style>
	.mine {
		padding-bottom: 210rpx;
		background: #f3f6f1;
	}

	.hero {
		position: relative;
		margin: 0;
		padding: 0 32rpx;
	}

	.hero-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 392rpx;
		background: linear-gradient(145deg, #0d211d 0%, #163b34 62%, #275b55 100%);
		z-index: 0;
	}

	.hero-content {
		position: relative;
		z-index: 1;
		padding-top: 44rpx;
	}

	.profile {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 18rpx 0 34rpx;
	}

	.avatar {
		width: 118rpx;
		height: 118rpx;
		border-radius: 28rpx;
		background: linear-gradient(145deg, #f0d28a 0%, #c79a39 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 4rpx solid rgba(255, 255, 255, 0.72);
		box-shadow: 0 16rpx 34rpx rgba(0, 0, 0, 0.22);
	}

	.avatar-text {
		font-size: 44rpx;
		font-weight: 900;
		color: #10231f;
	}

	.profile-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		min-width: 0;
	}

	.nickname {
		font-size: 38rpx;
		font-weight: 800;
		color: #ffffff;
		line-height: 1.18;
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.vip-chip {
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		background: rgba(199, 154, 57, 0.2);
		color: #f0d28a;
		font-size: 20rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		gap: 8rpx;
		border: 1rpx solid rgba(240, 210, 138, 0.2);
	}

	.vip-mark {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #f0d28a;
		box-shadow: 0 0 0 5rpx rgba(240, 210, 138, 0.16);
	}

	.login-chip {
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.12);
		color: rgba(248, 244, 232, 0.74);
		font-size: 20rpx;
		font-weight: 700;
	}

	.login-chip-ok {
		background: rgba(44, 107, 115, 0.32);
		color: #cce5df;
	}

	.set-btn {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		background: rgba(255, 255, 255, 0.1);
		border: 1rpx solid rgba(255, 255, 255, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.set-icon {
		width: 34rpx;
		height: 24rpx;
		border-top: 4rpx solid #f8f4e8;
		border-bottom: 4rpx solid #f8f4e8;
		position: relative;
		box-sizing: border-box;
	}

	.set-icon::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 8rpx;
		height: 4rpx;
		background: #f8f4e8;
		border-radius: 999rpx;
	}

	.wallet {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 34rpx 16rpx;
		display: flex;
		align-items: center;
		border: 1rpx solid rgba(16, 35, 31, 0.07);
		box-shadow: 0 18rpx 42rpx rgba(16, 35, 31, 0.16);
	}

	.wallet-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		min-width: 0;
	}

	.wallet-num {
		font-size: 38rpx;
		font-weight: 900;
		color: #10231f;
		font-variant-numeric: tabular-nums;
		line-height: 1.15;
	}

	.wallet-label {
		font-size: 22rpx;
		color: #65736c;
	}

	.wallet-sep {
		width: 1rpx;
		height: 62rpx;
		background: #e5ebe4;
	}

	.staff-card {
		margin: 24rpx 32rpx 0;
		padding: 26rpx;
		border-radius: 16rpx;
		background: #10231f;
		display: flex;
		align-items: center;
		gap: 18rpx;
		box-shadow: 0 14rpx 32rpx rgba(16, 35, 31, 0.14);
	}

	.staff-icon {
		width: 78rpx;
		height: 78rpx;
		border-radius: 20rpx;
		background: #f0d28a;
		color: #10231f;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 900;
	}

	.staff-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		min-width: 0;
	}

	.staff-title {
		color: #ffffff;
		font-size: 30rpx;
		font-weight: 800;
	}

	.staff-desc {
		color: rgba(248, 244, 232, 0.66);
		font-size: 22rpx;
	}

	.staff-arrow {
		color: #f0d28a;
		font-size: 36rpx;
		font-weight: 800;
	}

	.alert {
		margin: 24rpx 32rpx 0;
		padding: 22rpx 24rpx;
		border-radius: 16rpx;
		background: #fff8e8;
		border: 1rpx solid rgba(199, 154, 57, 0.32);
		display: flex;
		align-items: center;
		gap: 16rpx;
		box-shadow: 0 12rpx 30rpx rgba(144, 105, 28, 0.08);
	}

	.alert-icon {
		width: 8rpx;
		height: 56rpx;
		border-radius: 999rpx;
		background: #c79a39;
	}

	.alert-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.alert-title {
		font-size: 26rpx;
		font-weight: 800;
		color: #90691c;
	}

	.alert-desc {
		font-size: 22rpx;
		color: #806328;
	}

	.alert-arrow {
		color: #90691c;
		font-size: 32rpx;
		font-weight: 800;
	}

	.tools {
		margin: 24rpx 32rpx 0;
		padding: 30rpx 18rpx 26rpx;
		border-radius: 16rpx;
		background: #ffffff;
		border: 1rpx solid rgba(16, 35, 31, 0.07);
		box-shadow: 0 12rpx 32rpx rgba(16, 35, 31, 0.05);
	}

	.tools-title {
		padding: 0 12rpx 24rpx;
		font-size: 30rpx;
		font-weight: 800;
		color: #10231f;
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
		padding: 6rpx 0;
	}

	.tool-icon {
		width: 76rpx;
		height: 76rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 29rpx;
		font-weight: 900;
		background: #eef3ed;
		color: #243d36;
		border: 1rpx solid rgba(16, 35, 31, 0.06);
		box-sizing: border-box;
	}

	.tool-icon-1,
	.tool-icon-2,
	.tool-icon-5,
	.tool-icon-9,
	.tool-icon-11 {
		background: #f8f0dc;
		color: #90691c;
	}

	.tool-icon-3,
	.tool-icon-4,
	.tool-icon-7,
	.tool-icon-10 {
		background: #e7f0ed;
		color: #1f636a;
	}

	.tool-icon-6,
	.tool-icon-8 {
		background: #edf1ea;
		color: #243d36;
	}

	.tool-name {
		font-size: 22rpx;
		color: #334942;
		font-weight: 700;
		line-height: 1.2;
	}

	.logout {
		margin: 24rpx 32rpx 0;
		padding: 26rpx;
		border-radius: 16rpx;
		background: #ffffff;
		border: 1rpx solid rgba(166, 91, 56, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		box-shadow: 0 10rpx 28rpx rgba(16, 35, 31, 0.04);
	}

	.logout-icon {
		width: 30rpx;
		height: 30rpx;
		border: 4rpx solid #a65b38;
		border-left: 0;
		border-radius: 4rpx;
		position: relative;
		box-sizing: border-box;
	}

	.logout-icon::after {
		content: '';
		position: absolute;
		width: 18rpx;
		height: 4rpx;
		background: #a65b38;
		left: -12rpx;
		top: 9rpx;
		border-radius: 999rpx;
	}

	.logout-text {
		font-size: 28rpx;
		font-weight: 800;
		color: #a65b38;
	}

	.footer-text {
		text-align: center;
		color: #8b978f;
		font-size: 22rpx;
		margin: 40rpx 0 24rpx;
	}
</style>
