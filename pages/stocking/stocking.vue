<template>
	<view class="app stocking-page has-brand-header">
		<brand-header title="放鱼动态" theme="light" layout="compact" :back="true" />
		<view class="page-head"><text class="page-head-title">今日放鱼</text></view>

		<view v-if="list.length === 0 && !loading" class="empty">
			<view class="empty-mark"><view class="empty-fish"></view></view>
			<text class="empty-title">今日暂无放鱼记录</text>
			<text class="empty-desc">新的放鱼批次会同步展示鱼种、规格、数量与现场照片</text>
		</view>

		<view class="stocking-list">
			<view class="stocking-entry" v-for="(item, index) in list" :key="item.recordId">
				<view class="timeline-col">
					<text class="stocking-time">{{ formatClock(item.stockingTime) }}</text>
					<text class="stocking-date">{{ formatDate(item.stockingTime) }}</text>
					<text class="timeline-dot"></text>
					<text v-if="index < list.length - 1" class="timeline-line"></text>
				</view>
				<view class="stocking-card">
					<view class="stocking-header">
						<text class="stocking-species">{{ item.fishSpecies }}</text>
						<text class="stocking-total">{{ item.weightJin }}斤</text>
					</view>
					<image class="stocking-img" :src="item.image || defaultStocking(index)" mode="aspectFill" @click="previewImg(item.image || defaultStocking(index))" />
					<view class="stocking-location"><view class="location-pin"></view><text>共享钓场 一号塘</text><text class="species-tag">淡水{{ item.fishSpecies }}</text></view>
					<view class="stocking-spec-row">
						<text>规格：{{ item.content || '0.5-1斤/尾' }}</text>
						<text>{{ item.fishCount ? '共约 ' + item.fishCount + ' 尾' : '共约 ' + item.weightJin + ' 斤' }}</text>
					</view>
				</view>
			</view>
		</view>
		<view v-if="list.length" class="all-records">查看全部放鱼记录 <text>›</text></view>
	</view>
</template>

<script>
import { fetchStockingList, getCachedVenue, loadDefaultVenue } from '../../utils/fishingStore.js'

export default {
	data() {
		return { list: [], loading: true }
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			const cached = getCachedVenue()
			const cachedVenueId = cached && cached.venue ? Number(cached.venue.venueId) : 0
			const venueTask = Number.isInteger(cachedVenueId) && cachedVenueId > 0
				? Promise.resolve(cachedVenueId)
				: loadDefaultVenue().then((data) => Number(data && data.venue && data.venue.venueId))
			venueTask.then((venueId) => fetchStockingList(venueId)).then(rows => {
				this.list = rows
				this.loading = false
			}).catch((error) => {
				this.list = []
				this.loading = false
				if (error && error.msg === '未获取到有效的钓场信息') {
					uni.showToast({ title: error.msg, icon: 'none' })
				}
			})
		},
		formatTime(t) {
			if (!t) return ''
			return t.replace('T', ' ').substring(0, 16)
		},
		formatClock(t) {
			if (!t) return '--:--'
			return String(t).replace('T', ' ').substring(11, 16)
		},
		formatDate(t) {
			if (!t) return ''
			return String(t).replace('T', ' ').substring(5, 10)
		},
		defaultStocking(index) {
			return index % 2 ? '/static/stocking-carp-v1.jpg' : '/static/stocking-crucian-v1.jpg'
		},
		previewImg(url) {
			uni.previewImage({ urls: [url] })
		}
	}
}
</script>

<style scoped>
.stocking-page{min-height:100vh;padding:0 24rpx calc(36rpx + env(safe-area-inset-bottom));background:#f7fbfb;color:#073f45}.page-head{padding:28rpx 0 20rpx}.page-head-title{font-size:32rpx;font-weight:800}.empty{text-align:center;padding:120rpx 0}.empty-text{color:#82999b;font-size:27rpx}.stocking-list{display:flex;flex-direction:column}.stocking-entry{display:flex;align-items:stretch;position:relative}.timeline-col{width:112rpx;flex-shrink:0;position:relative;padding-top:18rpx}.stocking-time,.stocking-date{display:block;margin-left:24rpx}.stocking-time{font-size:25rpx;color:#174d51}.stocking-date{font-size:22rpx;color:#6e8587;margin-top:3rpx}.timeline-dot{position:absolute;left:0;top:28rpx;width:18rpx;height:18rpx;border-radius:50%;background:#158d8e;z-index:2}.timeline-line{position:absolute;left:8rpx;top:45rpx;bottom:-20rpx;width:2rpx;background:#68b7b5}.stocking-card{flex:1;min-width:0;margin-bottom:20rpx;padding:20rpx;background:#fff;border:1rpx solid #d4e4e3;border-radius:15rpx}.stocking-header{display:flex;align-items:baseline;gap:18rpx;margin-bottom:14rpx}.stocking-species{font-size:31rpx;font-weight:800}.stocking-total{font-size:25rpx;color:#5c7173}.stocking-img{width:100%;height:286rpx;display:block;border-radius:9rpx}.stocking-location{display:flex;align-items:center;gap:9rpx;margin-top:15rpx;color:#28575a;font-size:23rpx}.location-pin{width:18rpx;height:24rpx;border:3rpx solid #139595;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-sizing:border-box}.species-tag{margin-left:auto;padding:6rpx 12rpx;border-radius:6rpx;background:#e8f7f5;color:#118f90;font-size:20rpx}.stocking-spec-row{display:flex;justify-content:space-between;gap:12rpx;margin-top:14rpx;color:#607678;font-size:21rpx}.all-records{height:76rpx;display:flex;align-items:center;justify-content:center;margin-top:8rpx;border:1rpx solid #83c6c4;border-radius:12rpx;background:#fff;color:#244f52;font-size:25rpx}.all-records text{margin-left:12rpx;font-size:32rpx}.all-records:active{background:#eef9f8}
@media (max-height:700px){.stocking-img{height:240rpx}.stocking-card{padding:16rpx}.stocking-entry{font-size:95%}}
</style>

<style>
.stocking-page .empty{margin:0;padding:82rpx 36rpx 92rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid #dce9e8;border-radius:18rpx;background:#fff}.stocking-page .empty-desc{max-width:480rpx}
</style>
