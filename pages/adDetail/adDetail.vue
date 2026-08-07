<template>
	<view class="app ad-detail has-brand-header">
		<brand-header title="活动详情" theme="teal" layout="stacked" :back-on-title="true" />
		<view v-if="loading || loadError" class="detail-state">
			<text class="state-title">{{ loading ? '正在读取活动详情' : '活动详情加载失败' }}</text>
			<text class="state-desc">{{ loadError || '请稍候…' }}</text>
			<view v-if="loadError" class="state-retry" @click="loadAd">重新加载</view>
		</view>
		<image v-if="!loading && !loadError" class="detail-photo" :src="ad.image || '/static/hero-fishing-v2.jpg'" mode="aspectFill" />
		<view v-if="!loading && !loadError" class="ad-header" :style="{ background: ad.bgColor || '#eef8f7' }">
			<text class="ad-title">{{ ad.title }}</text>
			<text class="ad-desc">{{ ad.description || ad.desc }}</text>
		</view>
		<view v-if="!loading && !loadError" class="ad-body">
			<text class="ad-content">{{ ad.content }}</text>
		</view>
		<view v-if="couponTemplate && !claimed" class="coupon-section">
			<view class="coupon-card">
				<text class="coupon-value" v-if="couponTemplate.couponType === 'duration' && couponTemplate.couponValue">{{ couponTemplate.couponValue }}分钟</text>
				<text class="coupon-value" v-else-if="couponTemplate.couponValue">¥{{ formatMoney(couponTemplate.couponValue) }}</text>
				<text class="coupon-title">{{ couponTemplate.title }}</text>
			</view>
			<view class="claim-btn" @click="claimCoupon">领取优惠券</view>
		</view>
		<view v-if="claimed" class="coupon-section">
			<text class="claimed-text">优惠券已领取</text>
		</view>
		<view v-if="!loading && !loadError" class="ad-footer">
			<view class="back-btn" @click="goBack">返回首页</view>
			<button class="share-btn" open-type="share">转发给好友</button>
		</view>
	</view>
</template>

<script>
import { fetchAdById, getUser, isLoggedIn, grantCoupon, fetchMyCoupons, formatMoney } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			adId: '',
			ad: {},
			couponTemplate: null,
			claimed: false,
			loading: true,
			loadError: ''
		}
	},
	onLoad(option) {
		this.adId = option.id || ''
		if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/adDetail/adDetail?id=' + option.id) }); return }
		this.loadAd()
	},
	methods: {
		loadAd() {
			this.loading = true
			this.loadError = ''
			fetchAdById(this.adId).then((ad) => {
				if (!ad) throw new Error('该活动不存在或已下架')
				this.ad = ad
				if (ad.couponTemplateId) this.loadCoupon(ad.couponTemplateId)
			}).catch((error) => {
				this.ad = {}
				this.loadError = (error && (error.msg || error.message)) || '请检查网络后重试'
			}).finally(() => { this.loading = false })
		},
		loadCoupon(templateId) {
			const user = getUser()
			if (!user) return
			fetchMyCoupons(user.userId).then((list) => {
				const existing = list.find((c) => c.templateId === templateId)
				if (existing) { this.couponTemplate = existing; this.claimed = true; return }
				this.couponTemplate = { templateId, title: '活动优惠券', couponType: 'amount', couponValue: 0 }
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
		getShareConfig() {
			return {
				title: this.ad && this.ad.title ? this.ad.title : '共享钓场活动',
				path: '/pages/adDetail/adDetail?id=' + (this.ad.adId || this.ad.id || this.adId)
			}
		},
		formatMoney
	}
}
</script>

<style>
.ad-detail {
	min-height: 100vh;
	background: var(--surface-2);
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
	font-weight: 600;
	color: var(--ink);
}

.ad-desc {
	font-size: 26rpx;
	color: var(--ink-2);
}

.ad-body {
	margin: 32rpx 28rpx;
	background: var(--surface);
	border-radius: var(--r);
	padding: 36rpx 32rpx;
}

.ad-content {
	font-size: 28rpx;
	color: var(--ink);
	line-height: 1.8;
	white-space: pre-wrap;
}

.coupon-section {
	margin: 0 28rpx;
	background: var(--surface);
	border-radius: var(--r);
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
	font-weight: 600;
	color: var(--gold);
}

.coupon-title {
	font-size: 24rpx;
	color: var(--ink-2);
}

.claim-btn {
	background: var(--g-600);
	color: #fff;
	padding: 16rpx 32rpx;
	border-radius: var(--r-pill);
	font-size: 26rpx;
	font-weight: 500;
}

.claimed-text {
	font-size: 26rpx;
	color: var(--jade);
	font-weight: 600;
}

.ad-footer {
	padding: 40rpx 28rpx;
	display: flex;
	justify-content: center;
	gap: 18rpx;
}

.back-btn,
.share-btn {
	background: var(--g-900);
	color: #ffffff;
	padding: 20rpx 60rpx;
	border-radius: var(--r-pill);
	font-size: 28rpx;
	font-weight: 500;
	line-height: 1.4;
	margin: 0;
	border: 0;
}

.share-btn {
	background: var(--g-600);
	color: #fff;
}

.share-btn::after {
	border: 0;
}
</style>

<style>
.ad-detail{padding-bottom:calc(40rpx + env(safe-area-inset-bottom))!important}
.detail-state{margin:18rpx 20rpx;padding:84rpx 30rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid #d6e5e3;border-radius:14rpx;background:#fff;text-align:center}.detail-state .state-title{font-size:28rpx;font-weight:800;color:#174246}.detail-state .state-desc{margin-top:12rpx;color:#6e8183;font-size:22rpx}.detail-state .state-retry{margin-top:28rpx;width:220rpx;height:72rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#0aa9a5;color:#fff;font-size:24rpx;font-weight:700}
@media (max-width:360px){.ad-detail .ad-header{margin-left:16rpx;margin-right:16rpx;padding-left:20rpx;padding-right:20rpx}.ad-detail .ad-body{margin-left:16rpx;margin-right:16rpx;padding-left:20rpx;padding-right:20rpx}.ad-detail .ad-footer{flex-wrap:wrap}.ad-detail .back-btn,.ad-detail .share-btn{min-width:240rpx}}
</style>

<style>
.ad-detail{padding-bottom:40rpx;background:#f7fbfb}.detail-photo{width:100%;height:310rpx;display:block}.ad-detail .ad-header{margin:-22rpx 20rpx 0;padding:28rpx 24rpx;position:relative;z-index:2;align-items:flex-start;border-radius:20rpx 20rpx 0 0;background:#fff!important}.ad-detail .ad-title{font-size:36rpx;color:#133f42}.ad-detail .ad-desc{font-size:22rpx}.ad-detail .ad-body{margin:0 20rpx;padding:22rpx 24rpx;border-radius:0 0 14rpx 14rpx;border-top:1rpx solid #dce7e6}.ad-detail .ad-content{font-size:23rpx;line-height:1.75;color:#536e70}.ad-detail .coupon-section{margin:14rpx 20rpx;border:1rpx solid #d8e6e5;border-radius:13rpx}.ad-detail .claim-btn{border-radius:9rpx;background:#0aa9a5}.ad-detail .ad-footer{padding:18rpx 20rpx}.ad-detail .back-btn,.ad-detail .share-btn{flex:1;padding:18rpx 0;border-radius:10rpx;text-align:center}.ad-detail .back-btn{border:1rpx solid #0aa6a3;background:#fff;color:#0a9694}.ad-detail .share-btn{background:#0aa9a5}
</style>
