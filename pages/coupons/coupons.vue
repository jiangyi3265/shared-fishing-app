<template>
	<view class="app coupons-page has-brand-header">
		<brand-header title="我的优惠券" theme="teal" layout="stacked" :back-on-title="true" />
		<view class="coupon-tabs">
			<view class="coupon-tab" :class="{ active: tab === 'available' }" @click="tab = 'available'">可使用（{{ availableCount }}）</view>
			<view class="coupon-tab" :class="{ active: tab === 'used' }" @click="tab = 'used'">已使用/过期（{{ usedCount }}）</view>
		</view>

		<view v-if="list.length === 0" class="coupon-empty">
			<text class="coupon-empty-text">暂无优惠券</text>
		</view>

		<view v-else class="coupon-list">
			<view v-for="item in list" :key="item.couponId" class="coupon-item" :class="{ disabled: item.used || expired(item) }">
				<view class="coupon-left">
					<text class="coupon-value" v-if="item.couponType === 'duration'">{{ item.couponValue }}分钟</text>
					<text class="coupon-value" v-else>¥{{ formatMoney(item.couponValue) }}</text>
					<text class="coupon-condition" v-if="item.couponType === 'amount' && item.minAmountCents > 0">满¥{{ formatMoney(item.minAmountCents) }}可用</text>
					<text class="coupon-condition" v-else>无门槛</text>
				</view>
				<view class="coupon-right">
					<text class="coupon-name">{{ item.title }}</text>
					<text class="coupon-scope">适用于钓场订单</text>
					<text class="coupon-expire">有效期至 {{ formatDate(item.expireTime) }}</text>
					<text v-if="item.used" class="coupon-status used">已使用</text>
					<text v-else-if="expired(item)" class="coupon-status expired">已过期</text>
				</view>
				<view v-if="!item.used && !expired(item)" class="coupon-use" @click="useCoupon">去使用</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getUser, isLoggedIn, fetchMyCoupons, formatMoney } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			tab: 'available',
			allCoupons: [],
			now: Date.now()
		}
	},
	computed: {
		list() {
			if (this.tab === 'available') {
				return this.allCoupons.filter((c) => !c.used && !this.expired(c))
			}
			return this.allCoupons.filter((c) => c.used || this.expired(c))
		},
		availableCount() { return this.allCoupons.filter((c) => !c.used && !this.expired(c)).length },
		usedCount() { return this.allCoupons.length - this.availableCount }
	},
	onShow() {
		if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/coupons/coupons') }); return }
		const user = getUser()
		if (!user) return
		this.now = Date.now()
		fetchMyCoupons(user.userId).then((list) => { this.allCoupons = list }).catch(() => {})
	},
	methods: {
		formatMoney,
		expired(item) {
			if (!item.expireTime) return false
			const t = typeof item.expireTime === 'number' ? item.expireTime : new Date(item.expireTime).getTime()
			return t < this.now
		},
		formatDate(ts) {
			if (!ts) return '--'
			const d = ts instanceof Date ? ts : new Date(ts)
			const p = (n) => String(n).padStart(2, '0')
			return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
		},
		useCoupon() { uni.reLaunch({ url: '/pages/index/index' }) }
	}
}
</script>

<style>
.coupons-page {
	min-height: 100vh;
	background: var(--surface-2);
	padding: 0 28rpx 160rpx;
	box-sizing: border-box;
	overflow: visible;
}

.coupons-page .page-head {
	padding: 36rpx 0 20rpx;
	min-height: 104rpx;
	box-sizing: border-box;
}

.coupons-page .page-head-title {
	font-size: 38rpx;
	font-weight: 600;
	color: var(--text-main);
	line-height: 1.25;
	letter-spacing: 0.5rpx;
}

.coupon-tabs {
	display: flex;
	margin: 0 0 22rpx;
	padding: 8rpx;
	min-height: 88rpx;
	background: var(--surface);
	border-radius: var(--r);
	overflow: hidden;
	border: 1rpx solid var(--border-color);
	box-sizing: border-box;
}

.coupon-tab {
	flex: 1;
	min-width: 0;
	min-height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 16rpx;
	font-size: 26rpx;
	color: var(--text-muted);
	font-weight: 500;
	line-height: 1.2;
	text-align: center;
	border-radius: var(--r-sm);
	box-sizing: border-box;
}

.coupon-tab.active {
	background: var(--g-50);
	color: var(--jade);
}

.coupon-empty {
	min-height: 300rpx;
	padding: 58rpx 24rpx;
	background: var(--surface);
	border: 1rpx solid var(--border-color);
	border-radius: var(--r);
	text-align: center;
	box-sizing: border-box;
}

.coupon-empty-text {
	font-size: 28rpx;
	color: var(--text-light);
}

.coupon-list {
	padding: 0 0 160rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.coupon-item {
	background: var(--surface);
	border: 1rpx solid var(--border-color);
	border-radius: var(--r);
	display: flex;
	overflow: hidden;
}

.coupon-item:active {
	transform: scale(0.97);
}

.coupon-item.disabled {
	opacity: 0.5;
}

.coupon-left {
	width: 200rpx;
	background: var(--gold-line);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24rpx 16rpx;
	gap: 8rpx;
}

.coupon-value {
	font-size: 36rpx;
	font-weight: 600;
	color: var(--gold);
}

.coupon-condition {
	font-size: 20rpx;
	color: var(--text-muted);
}

.coupon-right {
	flex: 1;
	padding: 24rpx;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 8rpx;
}

.coupon-name {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-main);
}

.coupon-expire {
	font-size: 22rpx;
	color: var(--text-light);
}

.coupon-status {
	font-size: 22rpx;
	font-weight: 600;
}

.coupon-status.used {
	color: var(--text-light);
}

.coupon-status.expired {
	color: var(--gold);
}
</style>

<style>
.coupons-page{padding-bottom:calc(40rpx + env(safe-area-inset-bottom))!important}
@media (max-width:360px){.coupons-page{padding-left:16rpx!important;padding-right:16rpx!important}.coupon-item{padding-left:14rpx;padding-right:14rpx}.coupon-left{width:112rpx}.coupon-right{padding-left:14rpx!important;padding-right:82rpx!important}.coupon-value{font-size:42rpx}.coupon-use{right:14rpx;padding-left:12rpx;padding-right:12rpx}}
</style>

<style>
.coupons-page{padding:14rpx 20rpx 40rpx;background:#f7fbfb}.coupon-tabs{height:76rpx;min-height:0;margin:0 0 16rpx;padding:0;border-radius:14rpx 14rpx 0 0;border-color:#d8e5e4;background:#fff}.coupon-tab{min-height:76rpx;border-radius:0;font-size:22rpx;position:relative}.coupon-tab.active{background:#fff;color:#08a4a1;font-weight:800}.coupon-tab.active::after{content:'';position:absolute;left:50%;bottom:0;width:70rpx;height:5rpx;margin-left:-35rpx;border-radius:99rpx;background:#08a4a1}.coupon-list{padding:0;gap:16rpx}.coupon-item{min-height:154rpx;padding:0 18rpx;border-radius:12rpx;display:flex;align-items:center;position:relative}.coupon-left{width:128rpx;padding:0;border-right:1rpx dashed #d5e3e2;align-self:stretch;display:flex;flex-direction:column;align-items:center;justify-content:center}.coupon-value{color:#079f9d;font-size:48rpx;font-weight:700}.coupon-condition{margin-top:4rpx;font-size:18rpx}.coupon-right{padding:0 94rpx 0 20rpx;display:flex;flex-direction:column;justify-content:center}.coupon-name{font-size:23rpx}.coupon-scope{margin-top:7rpx;color:#667a7c;font-size:19rpx}.coupon-expire{margin-top:7rpx;font-size:17rpx}.coupon-use{position:absolute;right:18rpx;bottom:22rpx;padding:9rpx 16rpx;border-radius:7rpx;background:#0aa9a5;color:#fff;font-size:19rpx}.coupon-status{right:18rpx;bottom:22rpx}.coupon-empty{border-radius:12rpx}.page-head{display:none}
</style>
