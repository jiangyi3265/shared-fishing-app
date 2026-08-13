<template>
	<exact-mine
		:status-bar-height="statusBarHeight"
		:nav-bar-height="navBarHeight"
		:user="user"
		:logged-in="loggedIn"
		:stats="stats"
		:tools="primaryTools"
		@login="goLogin"
		@settings="goSettings"
		@pay="goPay"
		@tool="handleTool"
		@logout="doLogout"
		@home="goHome"
		@checkout="goCheckout"
	/>
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
				statusBarHeight: 20,
				navBarHeight: 44,
				user: null,
				loggedIn: false,
				isStaff: false,
				stats: { pendingCount: 0, paidCount: 0, totalAmount: 0 }
			}
		},
		computed: {
			primaryTools() {
				return [
					{ name: '全部服务', desc: '查看全部 11 个业务模块', icon: 'hic-services', value: '', action: 'goServices' },
					{ name: '我的订单', desc: '计时账单与消费记录', icon: 'hic-order', value: '', action: 'goOrders' },
					{ name: '我的优惠券', desc: '查看可用优惠权益', icon: 'hic-coupon', value: '', action: 'goCoupons' },
					{ name: '会员中心', desc: '等级成长与专属权益', icon: 'hic-member', value: this.loggedIn ? '普通会员' : '', action: 'goMember' },
					{ name: '积分兑换', desc: '积分明细与好礼兑换', icon: 'hic-coin', value: '', action: 'goPoints' },
					{ name: '储值钱包', desc: '余额、充值与交易明细', icon: 'hic-wallet', value: '', action: 'goWallet' },
					{ name: '商家工作台', desc: '订单核验与现场服务', icon: 'hic-workbench', value: this.isStaff ? '已开通' : '商家', action: 'goWorkbench' }
				]
			}
		},
		onLoad() {
			this.initChrome()
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
			initChrome() {
				const system = uni.getSystemInfoSync()
				this.statusBarHeight = Number(system.statusBarHeight || 20)
				// #ifdef MP-WEIXIN
				const capsule = wx.getMenuButtonBoundingClientRect()
				if (capsule && capsule.height) {
					this.navBarHeight = (capsule.top - this.statusBarHeight) * 2 + capsule.height
				}
				// #endif
			},
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
			goServices() { uni.navigateTo({ url: '/pages/services/services' }) },
			goMallOrders() { uni.navigateTo({ url: '/pages/mall/orders' }) },
			goWorkbench() { uni.navigateTo({ url: '/pages/staff/workbench' }) },
			goWallet() { uni.navigateTo({ url: '/pages/wallet/wallet' }) },
			goMember() { uni.navigateTo({ url: '/pages/member/member' }) },
			goPoints() { uni.navigateTo({ url: '/pages/points/points' }) },
			goCheckin() { uni.navigateTo({ url: '/pages/checkin/checkin' }) },
			goReserve() { uni.navigateTo({ url: '/pages/reserve/reserve' }) },
			goRental() { uni.navigateTo({ url: '/pages/rental/rental' }) },
			goCompetition() { uni.navigateTo({ url: '/pages/competition/competition' }) },
			handleTool(item) {
				const action = item && item.action
				if (action && typeof this[action] === 'function') this[action]()
			},
			formatMoney
		}
	}
</script>

<style>
	page { background: #f5fbfa; }
</style>
