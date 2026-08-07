<template>
	<view class="app promotions has-brand-header">
		<brand-header title="优惠活动" theme="teal" layout="stacked" :back-on-title="true" />

		<view v-if="loading || loadError || !ads.length" class="empty">
			<view class="empty-emoji hic-gift"></view>
			<text class="empty-title">{{ loading ? '正在读取活动' : (loadError ? '活动加载失败' : '暂无活动') }}</text>
			<text class="empty-desc">{{ loadError || (keyword ? '没有找到匹配的活动' : '后台发布活动后会在这里展示') }}</text>
			<view v-if="loadError" class="empty-retry" @click="loadAds">重新加载</view>
		</view>

		<view v-for="(ad,index) in ads" :key="ad.id" class="ad-card" :class="{ featured: index === 0 }" @click="onAdClick(ad)">
			<view class="ad-photo-wrap"><image class="ad-photo" :src="ad.image || ad.cover || (index === 0 ? '/static/hero-fishing-v2.jpg' : '/static/hero-lake.jpg')" mode="aspectFill" /><text class="ad-status">{{ ad.type === 'activity' ? '开放报名' : '活动公告' }}</text><view v-if="index===0" class="photo-copy"><text class="ad-title">{{ ad.title }}</text><text class="ad-desc">{{ ad.desc }}</text></view></view>
			<view class="ad-body-copy">
				<view v-if="index!==0"><text class="ad-title">{{ ad.title }}</text><text class="ad-desc">{{ ad.desc }}</text><text v-if="activityDate(ad)" class="ad-period">活动时间：{{ activityDate(ad) }}</text></view>
				<view v-else-if="ad.type==='activity'" class="featured-meta"><text>◷ {{ activityDate(ad) || '时间待公布' }}</text><text>⌖ {{ activityLocation(ad) || '地点待公布' }}</text></view>
				<text class="ad-action">{{ ad.type === 'activity' ? '去报名' : '查看详情' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { fetchAds } from '../../utils/fishingStore.js'

	export default {
		data() {
			return { ads: [], allAds: [], keyword: '', loading: true, loadError: '' }
		},
		onLoad(option) {
			if (option && option.keyword) this.keyword = decodeURIComponent(option.keyword)
		},
		onShow() {
			this.loadAds()
		},
		methods: {
			loadAds() {
				this.loading = true
				this.loadError = ''
			fetchAds().then((list) => {
				this.allAds = list
				this.filterAds()
			}).catch((error) => {
				this.ads = []
				this.allAds = []
				this.loadError = (error && (error.msg || error.message)) || '请检查网络后重试'
			}).finally(() => { this.loading = false })
			},
			activityDate(ad) { return ad && ad.activityInfo && ad.activityInfo.date ? ad.activityInfo.date : '' },
			activityLocation(ad) { return ad && ad.activityInfo && ad.activityInfo.location ? ad.activityInfo.location : '' },
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
		margin: 0;
		padding: 40rpx 32rpx 36rpx;
		border-radius: 0;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, var(--g-900) 0%, var(--g-950) 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 600;
		color: #ffffff;
		letter-spacing: 2rpx;
		display: block;
	}

	.hero-sub {
		font-size: 22rpx;
		color: var(--gold);
		letter-spacing: 4rpx;
		display: block;
		margin-top: 8rpx;
	}

	.empty {
		margin: 60rpx 28rpx;
		padding: 80rpx 40rpx;
		background: var(--surface);
		border-radius: var(--r);
		text-align: center;
	}

	.empty-emoji {
		display: block;
		font-size: 72rpx;
		margin-bottom: 16rpx;
	}

	.empty-title {
		display: block;
		font-size: 30rpx;
		font-weight: 500;
		color: var(--ink);
	}

	.empty-desc {
		display: block;
		color: var(--ink-2);
		font-size: 26rpx;
		margin-top: 10rpx;
	}

	.ad-card {
		margin: 20rpx 28rpx 0;
		border-radius: var(--r);
		background: var(--surface);
		overflow: hidden;
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
		font-weight: 600;
		color: var(--ink);
	}

	.ad-desc {
		font-size: 24rpx;
		color: var(--ink-2);
	}

	.ad-footer {
		padding: 20rpx 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.ad-tag {
		padding: 6rpx 18rpx;
		border-radius: var(--r-pill);
		font-size: 22rpx;
		font-weight: 500;
	}

	.ad-tag-activity {
		background: rgba(245, 194, 59, 0.18);
		color: var(--gold);
	}

	.ad-tag-info {
		background: var(--bg);
		color: var(--ink-2);
	}

	.ad-action {
		font-size: 24rpx;
		color: var(--gold);
		font-weight: 500;
	}
</style>

<style>
.promotions{padding-bottom:calc(50rpx + env(safe-area-inset-bottom))!important}
.promotions .empty-retry{margin:26rpx auto 0;width:210rpx;height:68rpx;display:flex;align-items:center;justify-content:center;border-radius:9rpx;background:#0aa9a5;color:#fff;font-size:23rpx;font-weight:700}
@media (max-width:360px){.promotions{padding-left:16rpx!important;padding-right:16rpx!important}.featured .ad-photo-wrap{height:320rpx}.ad-photo-wrap{width:38%}.ad-body-copy{padding:14rpx}.ad-action{position:static;align-self:flex-start;margin-top:12rpx}}
</style>

<style>
.promotions{min-height:100vh;padding:14rpx 20rpx 50rpx;background:#f7fbfb}.promotions>.hero{display:none}.ad-card{min-height:184rpx;margin:14rpx 0 0;display:flex;overflow:hidden;border:1rpx solid #d6e4e3;border-radius:13rpx;background:#fff}.ad-card.featured{display:block}.ad-photo-wrap{position:relative;width:42%;min-height:184rpx;flex-shrink:0}.featured .ad-photo-wrap{width:100%;height:360rpx}.ad-photo{width:100%;height:100%;display:block}.ad-status{position:absolute;left:12rpx;top:12rpx;padding:7rpx 12rpx;border-radius:6rpx;background:#0aa09d;color:#fff;font-size:19rpx}.photo-copy{position:absolute;left:0;right:0;bottom:0;padding:64rpx 22rpx 18rpx;background:linear-gradient(transparent,rgba(3,39,40,.75));color:#fff}.photo-copy .ad-title{color:#fff;font-size:36rpx}.photo-copy .ad-desc{color:rgba(255,255,255,.85);font-size:23rpx}.ad-body-copy{flex:1;min-width:0;padding:18rpx;display:flex;flex-direction:column;position:relative}.featured .ad-body-copy{min-height:120rpx;padding:18rpx 20rpx}.ad-title{display:block;color:#153f42;font-size:27rpx;font-weight:800}.ad-desc{display:block;margin-top:7rpx;color:#607577;font-size:21rpx}.ad-period{display:block;margin-top:11rpx;color:#829394;font-size:18rpx}.featured-meta{display:flex;flex-direction:column;gap:12rpx;color:#466466;font-size:21rpx}.ad-action{position:absolute;right:16rpx;bottom:16rpx;padding:10rpx 24rpx;border-radius:8rpx;background:#0aa9a5;color:#fff;font-size:21rpx;font-weight:700}.ad-footer,.ad-header{display:none}
</style>
