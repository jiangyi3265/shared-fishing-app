<template>
	<view class="app stocking-page">
		<view class="page-head">
			<text class="page-head-title">放鱼动态</text>
		</view>

		<view v-if="list.length === 0 && !loading" class="empty">
			<text class="empty-text">暂无放鱼记录</text>
		</view>

		<view class="stocking-list">
			<view class="stocking-card" v-for="item in list" :key="item.recordId">
				<view class="stocking-header">
					<text class="stocking-species">{{ item.fishSpecies }}</text>
					<text class="stocking-time">{{ formatTime(item.stockingTime) }}</text>
				</view>
				<view class="stocking-body">
					<view class="stocking-info">
						<text class="stocking-weight">{{ item.weightJin }} 斤</text>
						<text v-if="item.fishCount" class="stocking-count">约 {{ item.fishCount }} 尾</text>
					</view>
					<text v-if="item.content" class="stocking-desc">{{ item.content }}</text>
				</view>
				<image v-if="item.image" class="stocking-img" :src="item.image" mode="aspectFill" @click="previewImg(item.image)" />
			</view>
		</view>
	</view>
</template>

<script>
import { fetchStockingList, getCachedVenue } from '../../utils/fishingStore.js'

export default {
	data() {
		return { list: [], loading: true }
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			const cached = getCachedVenue()
			const venueId = cached && cached.venue ? cached.venue.venueId : null
			fetchStockingList(venueId).then(rows => {
				this.list = rows
				this.loading = false
			}).catch(() => { this.loading = false })
		},
		formatTime(t) {
			if (!t) return ''
			return t.replace('T', ' ').substring(0, 16)
		},
		previewImg(url) {
			uni.previewImage({ urls: [url] })
		}
	}
}
</script>

<style scoped>
.stocking-page { padding: 0 24rpx 40rpx; }
.page-head { padding: 30rpx 0 20rpx; }
.page-head-title { font-size: 36rpx; font-weight: bold; color: #1a2030; }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: #999; font-size: 28rpx; }
.stocking-list { display: flex; flex-direction: column; gap: 20rpx; }
.stocking-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05); }
.stocking-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.stocking-species { font-size: 30rpx; font-weight: bold; color: #1a2030; }
.stocking-time { font-size: 24rpx; color: #999; }
.stocking-body { margin-bottom: 12rpx; }
.stocking-info { display: flex; gap: 20rpx; margin-bottom: 8rpx; }
.stocking-weight { font-size: 28rpx; color: #f5a623; font-weight: bold; }
.stocking-count { font-size: 26rpx; color: #666; }
.stocking-desc { font-size: 26rpx; color: #666; line-height: 1.5; }
.stocking-img { width: 100%; height: 300rpx; border-radius: 12rpx; margin-top: 12rpx; }
</style>
