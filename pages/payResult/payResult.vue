<template>
	<view class="app result has-brand-header" :class="success ? 'result-ok' : 'result-fail'">
		<brand-header :title="success ? '支付成功' : '支付结果'" theme="teal" layout="stacked" :back-on-title="true" :scene="true" />
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-icon">
				<text class="hero-icon-text">{{ success ? '✓' : '!' }}</text>
			</view>
			<text class="hero-title">{{ success ? '支付成功' : '支付失败' }}</text>
			<text class="hero-sub">{{ success ? successSubtitle : '请重试或联系客服' }}</text>
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

		<view v-if="showPoints" class="pts-inline">
			<view class="pts-card">
				<text class="pts-title">本次获得</text>
				<view class="pts-gain">
					<text class="pts-gain-num">{{ earnedPoints }}</text>
					<text class="pts-gain-label">积分</text>
				</view>
				<text class="pts-sub">线上实付每 1 元奖励 5 积分</text>
				<button class="pts-btn" :disabled="claiming" @click="claimPoints">
					{{ claiming ? '领取中…' : '收入囊中' }}
				</button>
			</view>
		</view>

		<view class="spacer"></view>

		<view class="dock">
			<block v-if="success">
				<button class="dock-ghost" @click="goOrders">{{ secondaryActionText }}</button>
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
		fetchOrders,
		fetchOrderDetail,
		fetchConsumePointsReward,
		claimConsumePointsReward,
		ORDER_STATUS
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				success: true,
				order: null,
				sourceNo: '',
				sourceType: 'fishing',
				returnUrl: '',
				showPoints: false,
				earnedPoints: 0,
				reward: null,
				claiming: false
			}
		},
		computed: {
			displayNickname() {
				const user = getUser()
				return (user && (user.nickname || user.name)) || '微信'
			},
			successSubtitle() {
				return this.sourceType === 'mall' ? '支付已完成，记得查看提货凭证' : '本次垂钓已完成，欢迎下次再来'
			},
			secondaryActionText() {
				return this.sourceType === 'mall' ? '提货凭证' : '历史订单'
			}
		},
		onLoad(option = {}) {
			this.success = option.success !== '0'
			this.sourceNo = option.sourceNo ? decodeURIComponent(option.sourceNo) : ''
			this.sourceType = option.sourceType || 'fishing'
			this.returnUrl = option.returnUrl ? decodeURIComponent(option.returnUrl) : ''
			const user = getUser()
			if (!user) return
			if (option.orderId) {
				fetchOrderDetail(option.orderId).then((o) => { this.order = o; this.loadPointsReward() })
			} else if (this.sourceNo) {
				this.loadPointsReward()
			} else if (this.success) {
				fetchOrders(user.userId, 5).then((list) => {
					this.order = list.find((item) => item.status === ORDER_STATUS.PAID) || null
					this.loadPointsReward()
				})
			}
		},
		methods: {
			loadPointsReward() {
				const sourceNo = this.sourceNo || (this.order && this.order.orderNo)
				if (!this.success || !sourceNo) return
				fetchConsumePointsReward(sourceNo).then((reward) => {
					this.reward = reward
					if (reward && reward.status === 0 && reward.points > 0) {
						this.earnedPoints = reward.points
						this.showPoints = true
					}
				}).catch(() => {})
			},
			claimPoints() {
				const sourceNo = this.sourceNo || (this.order && this.order.orderNo)
				if (this.claiming || !sourceNo) return
				this.claiming = true
				claimConsumePointsReward(sourceNo).then(() => {
					this.showPoints = false
					uni.showToast({ title: '积分已收入囊中', icon: 'success' })
				}).catch((e) => {
					uni.showToast({ title: (e && (e.msg || e.message)) || '领取失败，请重试', icon: 'none' })
				}).finally(() => { this.claiming = false })
			},
			goHome() { uni.reLaunch({ url: '/pages/index/index' }) },
			goOrders() {
				if (this.returnUrl) {
					uni.redirectTo({ url: this.returnUrl })
					return
				}
				if (this.sourceType === 'mall') {
					uni.redirectTo({ url: '/pages/mall/orders' })
					return
				}
				// reLaunch 首页 + after 参数，由首页 onReady 跳订单页，保证订单页下方垫着首页（避免左滑退出小程序）
				uni.reLaunch({ url: '/pages/index/index?after=' + encodeURIComponent('/pages/orders/orders') })
			},
			retry() { uni.redirectTo({ url: '/pages/pay/pay' }) },
			formatMoney,
			formatDuration,
			formatDatetime
		}
	}
</script>

<style scoped>
.result{min-height:100vh;padding-bottom:calc(30rpx + env(safe-area-inset-bottom));background:#08b8b2;color:#0b3134}
.hero{margin:0 16rpx;padding:28rpx 26rpx 22rpx;border-radius:14rpx 14rpx 0 0;background:#fff;text-align:center}
.hero-bg{display:none}.hero-icon{width:76rpx;height:76rpx;margin:0 auto 15rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#08aaa6;color:#fff}.result-fail .hero-icon{background:#cf4d48}.hero-icon-text{font-size:52rpx;font-weight:900;line-height:1}
.hero-title{display:block;font-size:31rpx;font-weight:900}.hero-sub{display:block;margin-top:5rpx;color:#6d8183;font-size:20rpx}.result-fail .hero-sub{color:#c64c48}
.hero-amount{margin-top:8rpx;display:flex;align-items:baseline;justify-content:center;color:#07999a}.hero-currency{font-size:28rpx;font-weight:800}.hero-number{font-size:58rpx;font-weight:900;font-variant-numeric:tabular-nums}
.sheet{margin:0 16rpx;padding:18rpx 24rpx 20rpx;border-top:1rpx solid #dce8e7;border-radius:0 0 14rpx 14rpx;background:#fff}
.sheet-head{height:54rpx;display:flex;align-items:center;justify-content:space-between}.sheet-title{font-size:25rpx;font-weight:900}.sheet-tag{padding:4rpx 10rpx;border-radius:5rpx;background:#e7f7f1;color:#078f78;font-size:18rpx}.sheet-tag-fail{background:#feeeee;color:#cf4d48}
.sheet-row{min-height:56rpx;display:flex;align-items:center;justify-content:space-between;gap:18rpx;border-top:1rpx solid #e3eceb}.sheet-key{color:#667c7e;font-size:21rpx}.sheet-val{max-width:70%;overflow:hidden;color:#213f42;font-size:21rpx;text-align:right;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.pts-inline{margin:14rpx 16rpx 0}.pts-card{padding:21rpx 22rpx 19rpx;border:1rpx solid #bee0dd;border-radius:13rpx;background:linear-gradient(180deg,#f2fbfa,#eaf8f7);text-align:center}.pts-title{font-size:23rpx;font-weight:800}.pts-gain{margin-top:3rpx;display:flex;align-items:baseline;justify-content:center;gap:8rpx;color:#ec8b00}.pts-gain-num{font-size:56rpx;font-weight:900}.pts-gain-label{color:#0b3134;font-size:25rpx;font-weight:800}.pts-sub{display:block;margin-top:2rpx;color:#6f8385;font-size:19rpx}
.pts-btn{height:76rpx;margin-top:16rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#08aaa6;color:#fff;font-size:26rpx;font-weight:900}.pts-btn:after{border:0}
.spacer{display:none}.dock{margin:14rpx 16rpx 0;padding:0;display:flex;flex-direction:column-reverse;gap:10rpx;background:transparent}.dock-primary,.dock-ghost{width:100%;height:74rpx;margin:0;display:flex;align-items:center;justify-content:center;border-radius:10rpx;font-size:25rpx;font-weight:900}.dock-primary{background:#08aaa6;color:#fff}.dock-ghost{border:1rpx solid #079e9b;background:#fff;color:#078f91}.dock-primary:after,.dock-ghost:after{border:0}
@media (max-width:360px){.hero{padding-top:22rpx}.hero-icon{width:68rpx;height:68rpx}.hero-number{font-size:51rpx}.sheet-row{min-height:52rpx}.pts-card{padding-top:17rpx}.dock-primary,.dock-ghost{height:68rpx}}
</style>
