<template>
	<view class="app ad-detail">
		<view class="ad-header" :style="{ background: ad.bgColor || '#f4f5f7' }">
			<text class="ad-title">{{ ad.title }}</text>
			<text class="ad-desc">{{ ad.description || ad.desc }}</text>
		</view>
		<view class="ad-body">
			<text class="ad-content">{{ ad.content }}</text>
		</view>
		<view v-if="couponTemplate && !claimed" class="coupon-section">
			<view class="coupon-card">
				<text class="coupon-value" v-if="couponTemplate.couponType === 'duration'">{{ couponTemplate.couponValue }}分钟</text>
				<text class="coupon-value" v-else>¥{{ formatMoney(couponTemplate.couponValue) }}</text>
				<text class="coupon-title">{{ couponTemplate.title }}</text>
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
import { fetchAdById, getUser, isLoggedIn, grantCoupon, fetchMyCoupons, formatMoney } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			ad: {},
			couponTemplate: null,
			claimed: false
		}
	},
	onLoad(option) {
		if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/adDetail/adDetail?id=' + option.id) }); return }
		fetchAdById(option.id).then((ad) => {
			if (!ad) {
				uni.showToast({ title: '广告不存在', icon: 'none' })
				setTimeout(() => this.goBack(), 1500)
				return
			}
			this.ad = ad
			if (ad.couponTemplateId) this.loadCoupon(ad.couponTemplateId)
		}).catch(() => this.goBack())
	},
	methods: {
		loadCoupon(templateId) {
			const user = getUser()
			if (!user) return
			fetchMyCoupons(user.userId).then((list) => {
				const existing = list.find((c) => c.templateId === templateId)
				if (existing) { this.couponTemplate = existing; this.claimed = true; return }
				this.couponTemplate = { templateId, title: '领取优惠券', couponType: 'amount', couponValue: 0 }
			})
		},
		claimCoupon() {
			const user = getUser()
			if (!user) return
			grantCoupon(user.userId, this.ad.couponTemplateId, 'ad_' + this.ad.adId).then(() => {
				this.claimed = true
				uni.showToast({ title: '领取成功', icon: 'success' })
			})
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
