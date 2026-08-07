<template>
	<view class="app group-page has-brand-header">
		<brand-header title="拼场约钓" theme="light" layout="compact" :back="true" />
		<view class="page-head">
			<view class="create-btn" @click="showCreate = true"><text>＋</text> 发起拼场</view>
		</view>
		<view class="group-filters">
			<picker mode="date" :start="today" @change="filterDate = $event.detail.value"><view>{{ filterDateLabel }}⌄</view></picker>
			<picker :range="filterSlots" @change="filterSlot = filterSlots[$event.detail.value]"><view>{{ filterSlot }}⌄</view></picker>
		</view>

		<view v-if="loadError && !loading" class="empty">
			<view class="empty-mark"><view class="empty-people"></view></view>
			<text class="empty-title">拼场信息加载失败</text><text class="empty-desc">{{ loadError }}</text><view class="empty-btn" @click="loadData">重新加载</view>
		</view>
		<view v-else-if="filteredList.length === 0 && !loading" class="empty">
			<view class="empty-mark"><view class="empty-people"></view></view>
			<text class="empty-title">所选日期还没有拼场</text>
			<text class="empty-desc">约好日期、时段和人数，附近钓友就能加入</text>
			<view class="empty-btn" @click="showCreate = true">发起第一个拼场</view>
		</view>

		<view class="group-list">
			<view class="group-card" v-for="g in filteredList" :key="g.groupId">
				<image class="group-avatar" src="/static/logo-mark.svg" mode="aspectFill" />
				<view class="group-main">
					<view class="group-top"><text class="group-title">{{ g.title }}</text><view class="group-count-block"><text>{{ g.currentCount }}/{{ g.maxMembers }}人</text><text>{{ g.status === 0 ? '可加入' : statusMap[g.status] }}</text></view></view>
					<text class="group-date">{{ g.fishingDate }}　{{ g.timeSlot }}</text>
					<text class="group-type">{{ g.description || '综合鱼塘' }}</text>
					<text class="group-creator">发起人：{{ g.nickname }}</text>
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
		<community-tabbar active="catch" />
	</view>
</template>

<script>
import { fetchGroupList, joinGroup, createGroup, getCachedVenue, loadDefaultVenue } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			list: [], loading: true, loadError: '', showCreate: false,
			today: new Date().toISOString().slice(0, 10),
			timeSlots: ['06:00-12:00', '12:00-18:00', '06:00-18:00', '全天'],
			filterSlots: ['全天', '06:00-12:00', '12:00-18:00', '06:00-18:00'],
			filterDate: new Date().toISOString().slice(0, 10), filterSlot: '全天',
			statusMap: { 0: '招募中', 1: '已满员', 2: '已完成', 3: '已取消' },
			createForm: { title: '', fishingDate: '', timeSlot: '', maxMembers: '', description: '' }
		}
	},
	computed: {
		filterDateLabel() {
			const date = new Date(this.filterDate + 'T00:00:00')
			const weekdays = ['周日','周一','周二','周三','周四','周五','周六']
			return `${String(date.getMonth()+1).padStart(2,'0')}月${String(date.getDate()).padStart(2,'0')}日（${weekdays[date.getDay()]}）`
		},
		filteredList() {
			return this.list.filter((item) => String(item.fishingDate || '').slice(0,10) === this.filterDate && (this.filterSlot === '全天' || item.timeSlot === this.filterSlot))
		}
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			this.loadError = ''
			const cached = getCachedVenue()
			const venueTask = cached && cached.venue && cached.venue.venueId ? Promise.resolve(cached) : loadDefaultVenue()
			venueTask.then((data) => {
				const venueId = data && data.venue ? data.venue.venueId : null
				if (!venueId) throw new Error('未获取到有效钓场')
				return fetchGroupList(venueId)
			}).then(rows => { this.list = rows || [] }).catch((error) => {
				this.list = []
				this.loadError = (error && (error.msg || error.message)) || '请检查网络后重试'
			}).finally(() => { this.loading = false })
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
			const venueTask = cached && cached.venue && cached.venue.venueId ? Promise.resolve(cached) : loadDefaultVenue()
			venueTask.then((venueData) => {
				const venueId = venueData && venueData.venue ? venueData.venue.venueId : null
				if (!venueId) throw new Error('未获取到有效钓场')
				return createGroup({ ...this.createForm, venueId, maxMembers: parseInt(this.createForm.maxMembers) || 4 })
			}).then(() => {
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
.page-head-title { font-size: 38rpx; font-weight: 600; color: var(--text-main); letter-spacing: 0.5rpx; }
.create-btn { background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; padding: 12rpx 28rpx; border-radius: 99rpx; font-size: 26rpx; font-weight: 600; }
.create-btn:active { transform: scale(0.97); }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: var(--text-light); font-size: 28rpx; }
.group-list { display: flex; flex-direction: column; gap: 20rpx; }
.group-card { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: var(--r); padding: 24rpx; position: relative; }
.group-card:active { transform: scale(0.97); }
.group-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.group-title { font-size: 30rpx; font-weight: 600; color: var(--text-main); flex: 1; }
.group-status { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 99rpx; background: var(--surface-soft); color: var(--text-muted); }
.group-status.s0 { background: var(--g-50); color: var(--ink); }
.group-status.s1 { background: var(--gold-bg); color: var(--gold-ink); }
.group-status.s3 { background: var(--surface-soft); color: var(--text-light); }
.group-meta { font-size: 24rpx; color: var(--text-muted); display: flex; gap: 20rpx; margin-bottom: 12rpx; }
.group-bottom { display: flex; justify-content: space-between; align-items: center; }
.group-creator { font-size: 24rpx; color: var(--text-light); }
.group-count { font-size: 26rpx; color: var(--jade); font-weight: 600; }
.group-join { position: absolute; right: 24rpx; bottom: 24rpx; background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; padding: 10rpx 24rpx; border-radius: 99rpx; font-size: 24rpx; font-weight: 600; }
.group-join:active { transform: scale(0.97); }
.create-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(11, 31, 25, 0.5); display: flex; align-items: flex-end; z-index: 999; }
.create-panel { background: var(--surface); width: 100%; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx; }
.create-title { font-size: 32rpx; font-weight: 600; color: var(--text-main); margin-bottom: 24rpx; }
.c-input { border: 1rpx solid var(--border-color); border-radius: var(--r-xs); padding: 16rpx; margin-bottom: 16rpx; font-size: 28rpx; color: var(--text-main); }
.c-textarea { border: 1rpx solid var(--border-color); border-radius: var(--r-xs); padding: 16rpx; height: 100rpx; font-size: 28rpx; color: var(--text-main); margin-bottom: 24rpx; width: 100%; }
.c-submit { background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; text-align: center; padding: 20rpx; border-radius: 99rpx; font-size: 30rpx; font-weight: 600; }
.c-submit:active { transform: scale(0.97); }
</style>

<style>
.group-page .empty{margin:0;padding:76rpx 36rpx 86rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid #dce9e8;border-radius:18rpx;background:#fff}.group-page .empty-desc{max-width:480rpx}.group-page .empty-btn{margin-top:26rpx}
</style>

<style scoped>
.group-page{min-height:100vh;padding:0 20rpx calc(126rpx + env(safe-area-inset-bottom));background:#f8fbfb}.page-head{height:76rpx;padding:0;justify-content:flex-end}.page-head-title{display:none}.create-btn{padding:11rpx 22rpx;background:#0aa9a5;font-size:24rpx}.create-btn text{font-size:30rpx;line-height:1}.group-filters{display:flex;gap:15rpx;margin-bottom:18rpx}.group-filters view{height:62rpx;padding:0 18rpx;display:flex;align-items:center;border:1rpx solid #d5e3e2;border-radius:9rpx;background:#fff;color:#415e60;font-size:22rpx}.group-list{gap:14rpx}.group-card{min-height:190rpx;padding:22rpx;display:flex;align-items:flex-start;gap:17rpx;border-radius:13rpx}.group-card:active{transform:none;background:#f4faf9}.group-avatar{width:64rpx;height:64rpx;border-radius:50%;flex-shrink:0}.group-main{flex:1;min-width:0}.group-top{margin:0;align-items:flex-start}.group-title{padding-right:100rpx;font-size:26rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.group-count-block{position:absolute;right:22rpx;top:22rpx;display:flex;flex-direction:column;align-items:flex-end;gap:4rpx}.group-count-block text:first-child{color:#129796;font-size:27rpx;font-weight:800}.group-count-block text:last-child{color:#08a6a3;font-size:21rpx}.group-date,.group-type,.group-creator{display:block}.group-date{margin-top:7rpx;color:#607678;font-size:21rpx}.group-type{width:max-content;margin-top:9rpx;padding:4rpx 9rpx;border-radius:5rpx;background:#f0f4f4;color:#647779;font-size:18rpx}.group-creator{margin-top:9rpx;color:#718486;font-size:19rpx}.group-join{right:22rpx;bottom:20rpx;padding:8rpx 26rpx;border:2rpx solid #0ba4a2;background:#fff;color:#0a9d9a;font-size:22rpx}.group-meta,.group-bottom,.group-status{display:none}.create-panel{padding-bottom:calc(36rpx + env(safe-area-inset-bottom))}
</style>
