<template>
	<view class="app ad-detail">
		<view class="ad-header" :style="{ background: ad.bgColor || '#f4f5f7' }">
			<text class="ad-title">{{ ad.title }}</text>
			<text class="ad-desc">{{ ad.desc }}</text>
		</view>
		<view class="ad-body">
			<text class="ad-content">{{ ad.content }}</text>
		</view>
		<view v-if="ad.coupon && !claimed" class="coupon-section">
			<view class="coupon-card">
				<text class="coupon-value" v-if="ad.coupon.type === 'duration'">{{ ad.coupon.value }}分钟</text>
				<text class="coupon-value" v-else>¥{{ formatMoney(ad.coupon.value) }}</text>
				<text class="coupon-title">{{ ad.coupon.title }}</text>
			</view>
			<view class="claim-btn" @click="claimCoupon">领取优惠券</view>
		</view>
		<view v-if="claimed" class="coupon-section">
			<text class="claimed-text">优惠券已领取</text>
		</view>
		<view class="ad-footer">
			<view class="back-btn" @click="goBack">返回首页</view>
		</view>
	</view>
</template>

<script>
import { getAdById, getUser, grantCoupon, getMyCoupons, formatMoney } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			ad: {},
			claimed: false
		}
	},
	onLoad(option) {
		const ad = getAdById(option.id)
		if (ad) {
			this.ad = ad
			this.checkClaimed()
		} else {
			uni.showToast({ title: '广告不存在', icon: 'none' })
			setTimeout(() => this.goBack(), 1500)
		}
	},
	methods: {
		checkClaimed() {
			if (!this.ad.coupon) return
			const user = getUser()
			const coupons = getMyCoupons(user.id)
			this.claimed = coupons.some((c) => c.source === 'ad_' + this.ad.id)
		},
		claimCoupon() {
			const user = getUser()
			const coupon = this.ad.coupon
			grantCoupon(user.id, {
				type: coupon.type,
				title: coupon.title,
				value: coupon.value,
				minAmountCents: coupon.minAmountCents || 0,
				source: 'ad_' + this.ad.id
			})
			this.claimed = true
			uni.showToast({ title: '领取成功', icon: 'success' })
		},
		goBack() {
			uni.navigateBack({ delta: 1, fail: () => uni.redirectTo({ url: '/pages/index/index' }) })
		},
		formatMoney
	}
}
</script>

<style>
.ad-detail {
	min-height: 100vh;
	background: #f4f5f7;
}

.ad-header {
	padding: 60rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
}

.ad-title {
	font-size: 44rpx;
	font-weight: 800;
	color: #1a2030;
}

.ad-desc {
	font-size: 26rpx;
	color: #4a5567;
}

.ad-body {
	margin: 32rpx 28rpx;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 36rpx 32rpx;
}

.ad-content {
	font-size: 28rpx;
	color: #3a4355;
	line-height: 1.8;
	white-space: pre-wrap;
}

.coupon-section {
	margin: 0 28rpx;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx 32rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.coupon-card {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.coupon-value {
	font-size: 36rpx;
	font-weight: 800;
	color: #e85d04;
}

.coupon-title {
	font-size: 24rpx;
	color: #6b7280;
}

.claim-btn {
	background: #f5c23b;
	color: #1a1306;
	padding: 16rpx 32rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
	font-weight: 700;
}

.claimed-text {
	font-size: 26rpx;
	color: #4fb38a;
	font-weight: 600;
}

.ad-footer {
	padding: 40rpx 28rpx;
	display: flex;
	justify-content: center;
}

.back-btn {
	background: #1a2030;
	color: #ffffff;
	padding: 20rpx 60rpx;
	border-radius: 999rpx;
	font-size: 28rpx;
	font-weight: 700;
}
</style>
