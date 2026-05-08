<template>
	<view class="app promotions">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">优惠活动</text>
				<text class="hero-sub">SHARED · FISHING EVENTS</text>
			</view>
		</view>

		<view v-if="!ads.length" class="empty">
			<text class="empty-emoji">🎉</text>
			<text class="empty-title">暂无活动</text>
			<text class="empty-desc">敬请期待更多精彩活动</text>
		</view>

		<view v-for="ad in ads" :key="ad.id" class="ad-card" @click="onAdClick(ad)">
			<view class="ad-header" :style="{ background: ad.bgColor || '#e9e2d3' }">
				<text class="ad-title">{{ ad.title }}</text>
				<text class="ad-desc">{{ ad.desc }}</text>
			</view>
			<view class="ad-footer">
				<view class="ad-tag" :class="ad.type === 'activity' ? 'ad-tag-activity' : 'ad-tag-info'">
					{{ ad.type === 'activity' ? '报名活动' : '资讯' }}
				</view>
				<text class="ad-action">{{ ad.type === 'activity' ? '立即报名 ›' : '查看详情 ›' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { fetchAds } from '../../utils/fishingStore.js'

	export default {
		data() {
			return { ads: [], allAds: [], keyword: '' }
		},
		onLoad(option) {
			if (option && option.keyword) this.keyword = decodeURIComponent(option.keyword)
		},
		onShow() {
			fetchAds().then((list) => {
				this.allAds = list
				this.filterAds()
			}).catch(() => {})
		},
		methods: {
			filterAds() {
				if (!this.keyword) {
					this.ads = this.allAds
				} else {
					const kw = this.keyword.toLowerCase()
					this.ads = this.allAds.filter((ad) =>
						(ad.title || '').toLowerCase().includes(kw) ||
						(ad.desc || '').toLowerCase().includes(kw)
					)
				}
			},
			onAdClick(ad) {
				if (ad.type === 'activity') {
					uni.navigateTo({ url: '/pages/activityRegister/activityRegister?id=' + ad.id })
				} else {
					uni.navigateTo({ url: '/pages/adDetail/adDetail?id=' + ad.id })
				}
			}
		}
	}
</script>

<style>
	.promotions {
		padding-bottom: 60rpx;
	}

	.hero {
		position: relative;
		margin: 20rpx 28rpx 0;
		padding: 40rpx 32rpx 36rpx;
		border-radius: 28rpx;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 2rpx;
		display: block;
	}

	.hero-sub {
		font-size: 22rpx;
		color: #f5c23b;
		letter-spacing: 4rpx;
		display: block;
		margin-top: 8rpx;
	}

	.empty {
		margin: 60rpx 28rpx;
		padding: 80rpx 40rpx;
		background: #ffffff;
		border-radius: 24rpx;
		text-align: center;
		box-shadow: 0 8rpx 24rpx rgba(26, 32, 48, 0.04);
	}

	.empty-emoji {
		display: block;
		font-size: 72rpx;
		margin-bottom: 16rpx;
	}

	.empty-title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.empty-desc {
		display: block;
		color: #6b7280;
		font-size: 26rpx;
		margin-top: 10rpx;
	}

	.ad-card {
		margin: 20rpx 28rpx 0;
		border-radius: 22rpx;
		background: #ffffff;
		overflow: hidden;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.ad-header {
		padding: 40rpx 28rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
	}

	.ad-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #1a2030;
	}

	.ad-desc {
		font-size: 24rpx;
		color: #6b7280;
	}

	.ad-footer {
		padding: 20rpx 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.ad-tag {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
		font-weight: 700;
	}

	.ad-tag-activity {
		background: rgba(245, 194, 59, 0.18);
		color: #b8860b;
	}

	.ad-tag-info {
		background: #f0f1f4;
		color: #6b7280;
	}

	.ad-action {
		font-size: 24rpx;
		color: #b8860b;
		font-weight: 700;
	}
</style>
