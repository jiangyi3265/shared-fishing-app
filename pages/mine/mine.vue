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
				<text class="staff-desc">扫码识别订单 / 确认商品领取</text>
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
			<view class="tool-groups">
				<view v-for="group in toolGroups" :key="group.title" class="tool-group">
					<view class="tool-group-head">
						<text class="tool-group-title">{{ group.title }}</text>
						<text class="tool-group-count">{{ group.items.length }} 项</text>
					</view>
					<view
						v-for="item in group.items"
						:key="item.name"
						class="tool-row"
						@click="handleTool(item)"
					>
						<view class="tool-icon" :class="[item.icon, item.tone]"></view>
						<view class="tool-copy">
							<text class="tool-name">{{ item.name }}</text>
							<text class="tool-desc">{{ item.desc }}</text>
						</view>
						<text class="tool-arrow">›</text>
					</view>
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
		fetchRunningOrder,
		fetchPendingOrder,
		fetchStaffInfo,
		goHomeSafely
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				user: null,
				loggedIn: false,
				isStaff: false,
				stats: { pendingCount: 0, paidCount: 0, totalAmount: 0 },
				toolGroups: [
					{
						title: '订单与钱包',
						items: [
							{ name: '我的订单', desc: '钓场计时与历史消费', icon: 'icon-order', tone: 'tone-gold', action: 'goOrders' },
							{ name: '待支付', desc: '处理未完成账单', icon: 'icon-pay', tone: 'tone-gold', action: 'goPay' },
							{ name: '我的钱包', desc: '余额、充值与明细', icon: 'icon-wallet', tone: 'tone-teal', action: 'goWallet' },
							{ name: '补给订单', desc: '钓场补给与领取记录', icon: 'icon-order', tone: 'tone-teal', action: 'goMallOrders' }
						]
					},
					{
						title: '钓场服务',
						items: [
							{ name: '钓场补给', desc: '鱼饵、钓具与现场补给', icon: 'icon-shop', tone: 'tone-gold', action: 'goMall' },
							{ name: '我的预订', desc: '查看已预约钓位', icon: 'icon-pin', tone: 'tone-green', action: 'goReserve' },
							{ name: '我的租赁', desc: '装备租借记录', icon: 'icon-bag', tone: 'tone-green', action: 'goRental' },
							{ name: '我的拼场', desc: '约钓拼场进度', icon: 'icon-group', tone: 'tone-teal', action: 'goGroup' }
						]
					},
					{
						title: '权益与帮助',
						items: [
							{ name: '签到日历', desc: '每日签到领积分', icon: 'icon-calendar', tone: 'tone-green', action: 'goCheckin' },
							{ name: '我的优惠券', desc: '查看可用优惠', icon: 'icon-coupon', tone: 'tone-teal', action: 'goCoupons' },
							{ name: '优惠活动', desc: '近期活动与福利', icon: 'icon-coupon', tone: 'tone-gold', action: 'goPromotions' },
							{ name: '操作指引', desc: '扫码入场与结算说明', icon: 'icon-guide', tone: 'tone-teal', action: 'goGuide' },
							{ name: '钓王争霸', desc: '赛事榜单与报名', icon: 'icon-trophy', tone: 'tone-green', action: 'goCompetition' },
							{ name: '费率说明', desc: '计费规则与封顶说明', icon: 'icon-rate', tone: 'tone-green', action: 'goRateInfo' },
							{ name: '联系客服', desc: '遇到问题及时沟通', icon: 'icon-chat', tone: 'tone-teal', action: 'goContact' },
							{ name: '关于我们', desc: '钓场介绍与服务信息', icon: 'icon-info', tone: 'tone-green', action: 'goAbout' }
						]
					}
				]
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
			goHome() { goHomeSafely() },
			goOrders() { uni.navigateTo({ url: '/pages/orders/orders' }) },
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
						uni.redirectTo({ url: '/pages/session/session' })
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
			handleTool(item) {
				const action = item && item.action
				if (action && typeof this[action] === 'function') this[action]()
			},
			formatMoney
		}
	}
</script>

<style>
	.mine {
		padding-bottom: 220rpx;
		background: transparent;
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
		height: 420rpx;
		background: linear-gradient(135deg, #071f18 0%, #0c352a 50%, #031410 100%);
		z-index: 0;
		border-bottom-left-radius: 64rpx;
		border-bottom-right-radius: 64rpx;
		box-shadow: 0 24rpx 56rpx rgba(10, 46, 36, 0.2);
	}

	.hero-bg::after {
		content: '';
		position: absolute;
		right: -60rpx;
		top: -60rpx;
		width: 240rpx;
		height: 240rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(199, 154, 57, 0.15) 0%, rgba(199, 154, 57, 0) 70%);
		filter: blur(20px);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		padding-top: 48rpx;
	}

	/* ---------------- 个人资料栏 ---------------- */
	.profile {
		display: flex;
		align-items: center;
		gap: 24rpx;
		padding: 20rpx 0 40rpx;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 36rpx 12rpx;
		background: var(--accent-gradient);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 4rpx solid #ffffff;
		box-shadow: 0 16rpx 36rpx rgba(10, 46, 36, 0.25);
		position: relative;
		transition: var(--transition);
	}

	.avatar:active {
		transform: scale(0.95) rotate(-3deg);
	}

	.avatar-text {
		font-size: 46rpx;
		font-weight: 900;
		color: var(--primary);
		text-shadow: 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
	}

	.profile-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		min-width: 0;
	}

	.nickname {
		font-size: 40rpx;
		font-weight: 800;
		color: #ffffff;
		line-height: 1.2;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.vip-chip {
		padding: 6rpx 18rpx;
		border-radius: 99rpx;
		background: rgba(224, 169, 60, 0.22);
		color: #f5d285;
		font-size: 20rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		gap: 10rpx;
		border: 1rpx solid rgba(245, 210, 133, 0.3);
		backdrop-filter: blur(5px);
	}

	.vip-mark {
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #f5d285;
		box-shadow: 0 0 10rpx rgba(245, 210, 133, 0.6);
	}

	.login-chip {
		padding: 6rpx 18rpx;
		border-radius: 99rpx;
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.8);
		font-size: 20rpx;
		font-weight: 700;
		border: 1rpx solid rgba(255, 255, 255, 0.08);
	}

	.login-chip-ok {
		background: rgba(16, 185, 129, 0.2);
		color: #a7f3d0;
		border-color: rgba(16, 185, 129, 0.15);
	}

	.set-btn {
		width: 76rpx;
		height: 76rpx;
		border-radius: 24rpx 10rpx;
		background: rgba(255, 255, 255, 0.08);
		border: 1rpx solid rgba(255, 255, 255, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition);
	}

	.set-btn:active {
		background: rgba(255, 255, 255, 0.18);
		transform: rotate(45deg);
	}

	.set-icon {
		width: 36rpx;
		height: 36rpx;
		background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGZpbGw9J25vbmUnIHZpZXdCb3g9JzAgMCAyNCAyNCcgc3Ryb2tlPScjZmZmZmZmJyBzdHJva2Utd2lkdGg9JzIuMic+PHBhdGggc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJyBkPSdNMTAuMzI1IDQuMzE3Yy40MjYtMS43NTYgMi45MjQtMS43NTYgMy4zNSAwYTEuNzI0IDEuNzI0IDAgMDAyLjU3MyAxLjA2NmMxLjU0My0uOTQgMy4zMS54MmY2IDIuMzcgMi4zN2ExLjcyNCAxLjcyNCAwIDAwMS4wNjUgMi41NzJjMS43NTYuNDI2IDEuNzU2IDIuOTI0IDAgMy4zNWExLjcyNCAxLjcyNCAwIDAwLTEuMDY2IDIuNTczYy45NCAxLjU0My0uODI2IDMuMzEtMi4zNyAyLjM3YTEuNzI0IDEuNzI0IDAgMDAtMi41NzIgMS4wNjVjLS40MjYgMS43NTYtMi45MjQgMS43NTYtMy4zNSAwYTEuNzI0IDEuNzI0IDAgMDAtMi41NzMtMS4wNjZjLTEuNTQzLjk0LTMuMzEtLjgyNi0yLjM3LTIuMzdhMS43MjQgMS43MjQgMCAwMC0xLjA2NS0yLjU3MmMtMS43NTYtLjQyNi0xLjc1Ni0yLjkyNCAgMC0zLjM1YTEuNzI0IDEuNzI0IDAgMDAxLjA2Ni0yLjU3M2MtLjk0LTEuNTQzLjgyNi0zLjMxIDIuMzctMi4zNy45OTYuNjA4IDIuMjk2LjA3IDIuNTcyLTEuMDY1eicvPjxwYXRoIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcgZD0nTTE1IDEyYTMgMyAwIDExLTYgMCAzIDMgMCAwMTYgMHonLz48L3N2Zz4=");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}

	/* ---------------- 钱包概要区 ---------------- */
	.wallet {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(24px);
		border-radius: 48rpx 16rpx 48rpx 16rpx;
		padding: 40rpx 20rpx;
		display: flex;
		align-items: center;
		border: 1rpx solid rgba(255, 255, 255, 0.6);
		box-shadow: 0 20rpx 48rpx rgba(10, 46, 36, 0.06);
	}

	.wallet-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
		min-width: 0;
	}

	.wallet-num {
		font-size: 40rpx;
		font-weight: 800;
		color: var(--primary);
		font-variant-numeric: tabular-nums;
		line-height: 1.15;
	}

	.wallet-label {
		font-size: 22rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.wallet-sep {
		width: 1rpx;
		height: 64rpx;
		background: rgba(10, 46, 36, 0.06);
	}

	/* ---------------- 商家工作台 ---------------- */
	.staff-card {
		margin: 24rpx 32rpx 0;
		padding: 30rpx;
		border-radius: 36rpx 12rpx;
		background: linear-gradient(135deg, #0b2d23 0%, #041a14 100%);
		display: flex;
		align-items: center;
		gap: 24rpx;
		box-shadow: 0 16rpx 36rpx rgba(10, 46, 36, 0.16);
		border: 1rpx solid rgba(245, 210, 133, 0.2);
		transition: var(--transition);
	}

	.staff-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 24rpx;
		background: var(--accent-gradient);
		color: var(--primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 900;
		box-shadow: var(--accent-glow);
	}

	.staff-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		min-width: 0;
	}

	.staff-title {
		color: #ffffff;
		font-size: 30rpx;
		font-weight: 800;
	}

	.staff-desc {
		color: rgba(255, 255, 255, 0.6);
		font-size: 22rpx;
		font-weight: 600;
	}

	.staff-arrow {
		color: #f5d285;
		font-size: 38rpx;
		font-weight: 800;
	}

	/* ---------------- 警报提醒 ---------------- */
	.alert {
		margin: 24rpx 32rpx 0;
		padding: 24rpx 32rpx;
		border-radius: 36rpx 12rpx;
		background: rgba(255, 251, 239, 0.85);
		backdrop-filter: blur(20px);
		border: 1rpx solid rgba(224, 169, 60, 0.25);
		display: flex;
		align-items: center;
		gap: 20rpx;
		box-shadow: 0 12rpx 32rpx rgba(199, 154, 57, 0.04);
	}

	.alert-icon {
		width: 8rpx;
		height: 60rpx;
		border-radius: 99rpx;
		background: var(--accent-gradient);
		box-shadow: var(--accent-glow);
	}

	.alert-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.alert-title {
		font-size: 26rpx;
		font-weight: 800;
		color: #b8860b;
	}

	.alert-desc {
		font-size: 22rpx;
		color: #8a6914;
		font-weight: 600;
	}

	.alert-arrow {
		color: #b8860b;
		font-size: 34rpx;
		font-weight: 800;
	}

	/* ---------------- 常用工具区 ---------------- */
	.tools {
		margin: 24rpx 32rpx 0;
		padding: 24rpx 4rpx;
		background: transparent;
		border: none;
		box-shadow: none;
	}

	.tools-title {
		padding: 0 12rpx 24rpx;
		font-size: 32rpx;
		font-weight: 800;
		color: var(--primary);
		display: block;
	}

	.tool-groups {
		display: flex;
		flex-direction: column;
		gap: 32rpx;
	}

	.tool-group {
		border-radius: 40rpx 16rpx;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(15px);
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(10, 46, 36, 0.015);
	}

	.tool-group-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 28rpx 16rpx;
	}

	.tool-group-title {
		font-size: 26rpx;
		font-weight: 900;
		color: var(--primary);
	}

	.tool-group-count {
		font-size: 21rpx;
		color: var(--text-light);
		font-weight: 700;
	}

	/* 工具行 */
	.tool-row {
		display: flex;
		align-items: center;
		gap: 20rpx;
		min-height: 114rpx;
		padding: 20rpx 28rpx;
		border-bottom: 1rpx solid rgba(10, 46, 36, 0.03);
		min-width: 0;
		transition: var(--transition);
	}

	.tool-row:last-child {
		border-bottom: 0;
	}

	.tool-row:active {
		background: rgba(255, 255, 255, 0.4);
	}

	.tool-icon {
		width: 62rpx;
		height: 62rpx;
		border-radius: 20rpx;
		flex: 0 0 auto;
		background-size: 38rpx 38rpx;
		background-repeat: no-repeat;
		background-position: center;
		transition: var(--transition);
	}

	.tone-gold {
		background: #fff8eb;
		box-shadow: inset 0 0 10rpx rgba(224, 169, 60, 0.05);
	}

	.tone-teal {
		background: #eef7f5;
		box-shadow: inset 0 0 10rpx rgba(46, 186, 133, 0.05);
	}

	.tone-green {
		background: #f0f5f1;
		box-shadow: inset 0 0 10rpx rgba(16, 185, 129, 0.05);
	}

	.tool-copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.tool-name {
		font-size: 28rpx;
		color: var(--text-main);
		font-weight: 800;
		line-height: 1.25;
		white-space: nowrap;
	}

	.tool-desc {
		font-size: 22rpx;
		color: var(--text-muted);
		line-height: 1.35;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 600;
	}

	.tool-arrow {
		color: var(--text-light);
		font-size: 32rpx;
		font-weight: 700;
		flex: 0 0 auto;
	}

	/* ---------------- 退出登录 ---------------- */
	.logout {
		margin: 32rpx 32rpx 0;
		padding: 30rpx;
		border-radius: 99rpx;
		background: rgba(239, 68, 68, 0.06);
		border: 1rpx solid rgba(239, 68, 68, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14rpx;
		box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.02);
		transition: var(--transition);
	}

	.logout:active {
		background: rgba(239, 68, 68, 0.1);
		transform: scale(0.98);
	}

	.logout-icon {
		display: inline-block;
		width: 32rpx;
		height: 32rpx;
		background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGZpbGw9J25vbmUnIHZpZXdCb3g9JzAgMCAyNCAyNCcgc3Ryb2tlPScjZWY0NDQ0JyBzdHJva2Utd2lkdGg9JzIuNSc+PHBhdGggc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJyBkPSdNMTcgMTZsNC00bTAgMGwtNC00bTQgNEg3bTYgNHYxYTMgMyAwIDAxLTMgM0g2YTMgMyAwIDAxLTMtM1Y3YTMgMyAwIDAxMy0zaDRhMyAzIDAgMDEzIDN2MScvPjwvc3ZnPg==");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		box-sizing: border-box;
	}

	.logout-text {
		font-size: 28rpx;
		font-weight: 800;
		color: #ef4444;
	}

	.footer-text {
		text-align: center;
		color: var(--text-light);
		font-size: 22rpx;
		margin: 48rpx 0 24rpx;
	}
</style>
