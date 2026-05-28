<template>
	<view class="app coupons-page">
		<view class="page-head">
			<text class="page-head-title">我的优惠券</text>
		</view>

		<view class="coupon-tabs">
			<view class="coupon-tab" :class="{ active: tab === 'available' }" @click="tab = 'available'">可使用</view>
			<view class="coupon-tab" :class="{ active: tab === 'used' }" @click="tab = 'used'">已使用/过期</view>
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
					<text class="coupon-expire">有效期至 {{ formatDate(item.expireTime) }}</text>
					<text v-if="item.used" class="coupon-status used">已使用</text>
					<text v-else-if="expired(item)" class="coupon-status expired">已过期</text>
				</view>
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
		}
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
		}
	}
}
</script>

<style>
.coupons-page {
	min-height: 100vh;
	background: #f4f5f7;
	padding: 0 28rpx 160rpx !important;
	box-sizing: border-box;
	overflow: visible;
}

.coupons-page .page-head {
	padding: 36rpx 0 20rpx !important;
	min-height: 104rpx;
	box-sizing: border-box;
}

.coupons-page .page-head-title {
	font-size: 36rpx;
	font-weight: 800;
	color: #1a2030;
	line-height: 1.25;
}

.coupon-tabs {
	display: flex;
	margin: 0 0 22rpx;
	padding: 8rpx;
	min-height: 88rpx;
	background: #ffffff;
	border-radius: 16rpx;
	overflow: hidden;
	border: 1rpx solid #dfe9e3;
	box-shadow: 0 12rpx 28rpx rgba(17, 49, 40, 0.06);
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
	color: #6b7280;
	font-weight: 700;
	line-height: 1.2;
	text-align: center;
	border-radius: 14rpx;
	box-sizing: border-box;
}

.coupon-tab.active {
	background: #e3f3ec;
	color: #137452;
}

.coupon-empty {
	min-height: 300rpx;
	padding: 58rpx 24rpx;
	background: #ffffff;
	border: 1rpx solid #e4ebe6;
	border-radius: 18rpx;
	box-shadow: 0 16rpx 36rpx rgba(17, 49, 40, 0.06);
	text-align: center;
	box-sizing: border-box;
}

.coupon-empty-text {
	font-size: 28rpx;
	color: #9aa3b2;
}

.coupon-list {
	padding: 0 0 160rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.coupon-item {
	background: #ffffff;
	border-radius: 20rpx;
	display: flex;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.coupon-item.disabled {
	opacity: 0.5;
}

.coupon-left {
	width: 200rpx;
	background: #fff3d1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24rpx 16rpx;
	gap: 8rpx;
}

.coupon-value {
	font-size: 36rpx;
	font-weight: 800;
	color: #e85d04;
}

.coupon-condition {
	font-size: 20rpx;
	color: #6b7280;
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
	font-weight: 700;
	color: #1a2030;
}

.coupon-expire {
	font-size: 22rpx;
	color: #9aa3b2;
}

.coupon-status {
	font-size: 22rpx;
	font-weight: 600;
}

.coupon-status.used {
	color: #9aa3b2;
}

.coupon-status.expired {
	color: #e85d04;
}
</style>
