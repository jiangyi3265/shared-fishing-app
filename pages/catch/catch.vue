<template>
	<view class="app catch-page has-brand-header">
		<brand-header title="我的钓获" theme="light" layout="compact" :back="true" />

		<view class="privacy-note">
			<view class="privacy-icon"><view></view></view>
			<view class="privacy-copy">
				<text>仅自己可见</text>
				<text>称重和活动审核后的钓获会自动归档，不对其他用户公开</text>
			</view>
		</view>

		<view class="record-summary">
			<view><text>{{ list.length }}</text><text>钓获记录</text></view>
			<view class="summary-divider"></view>
			<view><text>{{ approvedCount }}</text><text>已确认</text></view>
			<view class="summary-divider"></view>
			<view><text>{{ totalWeight }}</text><text>累计斤数</text></view>
		</view>

		<view v-if="loadError && !loading" class="empty-state">
			<view class="empty-mark"><view class="empty-fish"></view></view>
			<text class="empty-title">钓获记录加载失败</text>
			<text class="empty-desc">{{ loadError }}</text>
			<view class="empty-btn" @click="loadData">重新加载</view>
		</view>
		<view v-else-if="list.length === 0 && !loading" class="empty-state">
			<view class="empty-mark"><view class="empty-fish"></view></view>
			<text class="empty-title">还没有钓获记录</text>
			<text class="empty-desc">完成现场称重或活动审核后，记录会自动出现在这里</text>
			<view class="empty-btn" @click="goWeigh">去称重</view>
		</view>

		<view v-else class="record-list">
			<view class="record-row" v-for="(item, index) in list" :key="item.catchId">
				<image
					v-if="primaryImage(item)"
					class="record-image"
					:src="primaryImage(item)"
					mode="aspectFill"
					@click="previewImage(item)"
				/>
				<view v-else class="record-image record-placeholder"><view class="mini-fish"></view></view>
				<view class="record-main">
					<view class="record-head">
						<text class="record-name">{{ item.fishSpecies || '现场钓获' }}</text>
						<text class="record-status" :class="'status-' + statusKey(item.status)">{{ statusText(item.status) }}</text>
					</view>
					<view class="record-meta">
						<text v-if="item.weightJin">{{ formatWeight(item.weightJin) }}斤</text>
						<text>{{ item.venueName || '共享钓场' }}</text>
					</view>
					<text class="record-time">{{ formatTime(item.createTime) }}</text>
					<text v-if="item.status === 2 && item.rejectReason" class="record-reason">未通过：{{ item.rejectReason }}</text>
				</view>
			</view>
		</view>

		<community-tabbar active="catch" />
	</view>
</template>

<script>
import { fetchMyCatch, getUser } from '../../utils/fishingStore.js'

export default {
	data() {
		return { list: [], loading: true, loadError: '' }
	},
	computed: {
		approvedCount() {
			return this.list.filter((item) => Number(item.status) === 1).length
		},
		totalWeight() {
			const value = this.list.reduce((sum, item) => sum + Number(item.weightJin || 0), 0)
			return value % 1 === 0 ? String(value) : value.toFixed(1)
		}
	},
	onShow() {
		if (!getUser()) {
			uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/catch/catch') })
			return
		}
		this.loadData()
	},
	methods: {
		loadData() {
			this.loading = true
			this.loadError = ''
			fetchMyCatch().then((rows) => { this.list = rows || [] }).catch((error) => {
				this.list = []
				this.loadError = (error && (error.msg || error.message)) || '请检查网络后重试'
			}).finally(() => { this.loading = false })
		},
		statusKey(status) {
			return Number(status) === 1 ? 'approved' : Number(status) === 2 ? 'rejected' : 'pending'
		},
		statusText(status) {
			return Number(status) === 1 ? '已确认' : Number(status) === 2 ? '未通过' : '待确认'
		},
		formatWeight(value) {
			const number = Number(value || 0)
			return number % 1 === 0 ? String(number) : number.toFixed(1)
		},
		formatTime(value) {
			return value ? String(value).replace('T', ' ').substring(0, 16) : '--'
		},
		imageList(item) {
			return String((item && item.images) || '').split(',').map((url) => url.trim()).filter(Boolean)
		},
		primaryImage(item) {
			return this.imageList(item)[0] || ''
		},
		previewImage(item) {
			const urls = this.imageList(item)
			if (urls.length) uni.previewImage({ urls, current: urls[0] })
		},
		goWeigh() {
			uni.navigateTo({ url: '/pages/weighFish/weighFish' })
		}
	}
}
</script>

<style scoped>
.catch-page{min-height:100vh;padding:0 22rpx calc(126rpx + env(safe-area-inset-bottom));background:#f5faf9;color:#143f42;box-sizing:border-box}
.privacy-note{margin:20rpx 0 18rpx;padding:20rpx;display:flex;align-items:center;border:1rpx solid #cce4e1;border-radius:16rpx;background:#eaf7f5}
.privacy-icon{width:56rpx;height:56rpx;flex-shrink:0;position:relative;border-radius:14rpx;background:#0aa5a2}
.privacy-icon::before{content:'';position:absolute;left:17rpx;top:25rpx;width:22rpx;height:20rpx;border:3rpx solid #f8fbfa;border-radius:5rpx;box-sizing:border-box}
.privacy-icon::after{content:'';position:absolute;left:21rpx;top:13rpx;width:14rpx;height:16rpx;border:3rpx solid #f8fbfa;border-bottom:0;border-radius:10rpx 10rpx 0 0;box-sizing:border-box}
.privacy-copy{min-width:0;margin-left:16rpx;display:flex;flex-direction:column}.privacy-copy text:first-child{font-size:25rpx;font-weight:850}.privacy-copy text:last-child{margin-top:5rpx;color:#637c7e;font-size:20rpx;line-height:1.45}
.record-summary{height:116rpx;display:flex;align-items:center;border:1rpx solid #d9e7e5;border-radius:17rpx;background:#fbfdfc}.record-summary>view:not(.summary-divider){flex:1;display:flex;flex-direction:column;align-items:center;gap:5rpx}.record-summary>view>text:first-child{color:#086d6d;font-size:31rpx;font-weight:900}.record-summary>view>text:last-child{color:#718789;font-size:19rpx}.summary-divider{width:1rpx;height:48rpx;background:#d9e5e4}
.empty-state{margin-top:18rpx;padding:92rpx 34rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid #dbe8e6;border-radius:18rpx;background:#fbfdfc;text-align:center}.empty-mark{width:112rpx;height:112rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#e7f5f3}.empty-fish,.mini-fish{width:48rpx;height:25rpx;position:relative;border-radius:60% 45% 45% 60%;background:#0aa09d}.empty-fish::before,.mini-fish::before{content:'';position:absolute;left:-17rpx;top:3rpx;border-top:10rpx solid transparent;border-bottom:10rpx solid transparent;border-right:18rpx solid #0aa09d}.empty-title{margin-top:24rpx;font-size:29rpx;font-weight:850}.empty-desc{max-width:480rpx;margin-top:10rpx;color:#6d8385;font-size:23rpx;line-height:1.55}.empty-btn{margin-top:28rpx;padding:18rpx 52rpx;border-radius:999rpx;background:#0aa5a2;color:#f8fbfa;font-size:25rpx;font-weight:800}
.record-list{margin-top:18rpx;display:flex;flex-direction:column;gap:14rpx}.record-row{min-height:142rpx;padding:16rpx;display:flex;border:1rpx solid #dbe7e6;border-radius:17rpx;background:#fbfdfc;box-sizing:border-box}.record-image{width:118rpx;height:110rpx;flex-shrink:0;border-radius:13rpx;background:#e7f3f2}.record-placeholder{display:flex;align-items:center;justify-content:center}.mini-fish{transform:scale(.68)}.record-main{min-width:0;flex:1;margin-left:18rpx}.record-head{display:flex;align-items:center;justify-content:space-between;gap:14rpx}.record-name{overflow:hidden;color:#173f42;font-size:27rpx;font-weight:850;white-space:nowrap;text-overflow:ellipsis}.record-status{flex-shrink:0;padding:5rpx 10rpx;border-radius:6rpx;font-size:18rpx;font-weight:750}.status-approved{background:#e5f6ed;color:#16764a}.status-pending{background:#fff3d9;color:#98620b}.status-rejected{background:#f8e9e6;color:#a24b3e}.record-meta{margin-top:10rpx;display:flex;gap:16rpx;color:#416366;font-size:22rpx}.record-meta text:first-child{font-weight:800}.record-time{display:block;margin-top:8rpx;color:#7a8e90;font-size:19rpx}.record-reason{display:block;margin-top:7rpx;color:#9c554b;font-size:20rpx;line-height:1.4}
</style>
