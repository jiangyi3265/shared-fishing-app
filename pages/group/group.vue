<template>
	<view class="app group-page">
		<view class="page-head">
			<text class="page-head-title">拼场约钓</text>
			<view class="create-btn" @click="showCreate = true">发起拼场</view>
		</view>

		<view v-if="list.length === 0 && !loading" class="empty">
			<text class="empty-text">暂无拼场活动，快来发起第一个</text>
		</view>

		<view class="group-list">
			<view class="group-card" v-for="g in list" :key="g.groupId" @click="goDetail(g)">
				<view class="group-top">
					<text class="group-title">{{ g.title }}</text>
					<text class="group-status" :class="'s' + g.status">{{ statusMap[g.status] }}</text>
				</view>
				<view class="group-meta">
					<text>📅 {{ g.fishingDate }} {{ g.timeSlot }}</text>
					<text v-if="g.spotName">📍 {{ g.spotName }}</text>
				</view>
				<view class="group-bottom">
					<text class="group-creator">{{ g.nickname }} 发起</text>
					<text class="group-count">{{ g.currentCount }}/{{ g.maxMembers }}人</text>
				</view>
				<view v-if="g.status === 0" class="group-join" @click.stop="doJoin(g)">加入</view>
			</view>
		</view>

		<!-- 发起弹窗 -->
		<view v-if="showCreate" class="create-mask" @click.self="showCreate = false">
			<view class="create-panel">
				<text class="create-title">发起拼场</text>
				<input class="c-input" v-model="createForm.title" placeholder="标题(如：周六上午拼鲤鱼)" />
				<picker mode="date" :start="today" @change="e => createForm.fishingDate = e.detail.value">
					<view class="c-input">{{ createForm.fishingDate || '选择日期' }}</view>
				</picker>
				<picker :range="timeSlots" @change="e => createForm.timeSlot = timeSlots[e.detail.value]">
					<view class="c-input">{{ createForm.timeSlot || '选择时段' }}</view>
				</picker>
				<input class="c-input" v-model="createForm.maxMembers" placeholder="最大人数(默认4)" type="number" />
				<textarea class="c-textarea" v-model="createForm.description" placeholder="描述/要求(选填)" />
				<view class="c-submit" @click="doCreate">发布</view>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchGroupList, joinGroup, createGroup, getCachedVenue } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			list: [], loading: true, showCreate: false,
			today: new Date().toISOString().slice(0, 10),
			timeSlots: ['06:00-12:00', '12:00-18:00', '06:00-18:00', '全天'],
			statusMap: { 0: '招募中', 1: '已满员', 2: '已完成', 3: '已取消' },
			createForm: { title: '', fishingDate: '', timeSlot: '', maxMembers: '', description: '' }
		}
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			const cached = getCachedVenue()
			const venueId = cached && cached.venue ? cached.venue.venueId : null
			fetchGroupList(venueId).then(rows => { this.list = rows; this.loading = false }).catch(() => { this.loading = false })
		},
		goDetail(g) {
			// 可扩展为独立详情页
		},
		doJoin(g) {
			joinGroup(g.groupId).then(() => {
				uni.showToast({ title: '加入成功' })
				this.loadData()
			}).catch(e => uni.showToast({ title: e.message || '加入失败', icon: 'none' }))
		},
		doCreate() {
			if (!this.createForm.title) { uni.showToast({ title: '请输入标题', icon: 'none' }); return }
			if (!this.createForm.fishingDate) { uni.showToast({ title: '请选择日期', icon: 'none' }); return }
			const cached = getCachedVenue()
			const data = {
				...this.createForm,
				venueId: cached && cached.venue ? cached.venue.venueId : 1,
				maxMembers: parseInt(this.createForm.maxMembers) || 4
			}
			createGroup(data).then(() => {
				uni.showToast({ title: '发起成功' })
				this.showCreate = false
				this.createForm = { title: '', fishingDate: '', timeSlot: '', maxMembers: '', description: '' }
				this.loadData()
			}).catch(e => uni.showToast({ title: e.message || '发起失败', icon: 'none' }))
		}
	}
}
</script>

<style scoped>
.group-page { padding: 0 24rpx 40rpx; }
.page-head { display: flex; justify-content: space-between; align-items: center; padding: 30rpx 0 20rpx; }
.page-head-title { font-size: 36rpx; font-weight: bold; color: #1a2030; }
.create-btn { background: #3b82f6; color: #fff; padding: 12rpx 28rpx; border-radius: 30rpx; font-size: 26rpx; }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: #999; font-size: 28rpx; }
.group-list { display: flex; flex-direction: column; gap: 20rpx; }
.group-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05); position: relative; }
.group-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.group-title { font-size: 30rpx; font-weight: bold; flex: 1; }
.group-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx; }
.group-status.s0 { background: #e8f5e9; color: #2e7d32; }
.group-status.s1 { background: #fff3e0; color: #e65100; }
.group-status.s3 { background: #f5f5f5; color: #999; }
.group-meta { font-size: 24rpx; color: #666; display: flex; gap: 20rpx; margin-bottom: 12rpx; }
.group-bottom { display: flex; justify-content: space-between; align-items: center; }
.group-creator { font-size: 24rpx; color: #999; }
.group-count { font-size: 26rpx; color: #3b82f6; font-weight: bold; }
.group-join { position: absolute; right: 24rpx; bottom: 24rpx; background: #3b82f6; color: #fff; padding: 10rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; }
.create-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 999; }
.create-panel { background: #fff; width: 100%; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx; }
.create-title { font-size: 32rpx; font-weight: bold; margin-bottom: 24rpx; }
.c-input { border: 1rpx solid #eee; border-radius: 8rpx; padding: 16rpx; margin-bottom: 16rpx; font-size: 28rpx; color: #333; }
.c-textarea { border: 1rpx solid #eee; border-radius: 8rpx; padding: 16rpx; height: 100rpx; font-size: 28rpx; margin-bottom: 24rpx; width: 100%; }
.c-submit { background: #3b82f6; color: #fff; text-align: center; padding: 20rpx; border-radius: 12rpx; font-size: 30rpx; font-weight: bold; }
</style>
