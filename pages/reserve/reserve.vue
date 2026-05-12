<template>
	<view class="app reserve-page">
		<view class="page-head">
			<text class="page-head-title">钓位预订</text>
		</view>

		<view v-if="spots.length === 0 && !loading" class="empty">
			<text class="empty-text">暂无可预订钓位</text>
		</view>

		<view class="spot-list">
			<view class="spot-card" v-for="s in spots" :key="s.spotId" :class="{selected: selected === s.spotId}" @click="selectSpot(s)">
				<view class="spot-top">
					<text class="spot-name">{{ s.spotName }}</text>
					<text v-if="s.spotType==='vip'" class="spot-vip">VIP</text>
				</view>
				<text class="spot-fee" v-if="s.extraFeeCents">附加费 ¥{{ (s.extraFeeCents/100).toFixed(2) }}</text>
			</view>
		</view>

		<view v-if="selected" class="form-section">
			<view class="form-item">
				<text class="form-label">预订日期</text>
				<picker mode="date" :start="today" @change="onDateChange">
					<text class="form-value">{{ reserveDate || '请选择日期' }}</text>
				</picker>
			</view>
			<view class="form-item">
				<text class="form-label">时段</text>
				<picker :range="timeSlots" @change="onSlotChange">
					<text class="form-value">{{ timeSlot || '请选择时段' }}</text>
				</picker>
			</view>
			<view class="submit-btn" @click="doSubmit">确认预订</view>
		</view>

		<view class="section-title" v-if="myList.length">我的预订</view>
		<view class="my-list">
			<view class="my-item" v-for="r in myList" :key="r.reservationId">
				<view class="my-top">
					<text class="my-spot">{{ r.spotName }}</text>
					<text class="my-status">{{ statusMap[r.status] }}</text>
				</view>
				<text class="my-date">{{ r.reserveDate }} {{ r.timeSlot }}</text>
				<view v-if="r.status <= 1" class="my-cancel" @click="doCancel(r)">取消</view>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchSpots, submitReservation, fetchMyReservations, cancelReservation, getCachedVenue } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			spots: [], myList: [], loading: true,
			selected: null, reserveDate: '', timeSlot: '',
			today: new Date().toISOString().slice(0, 10),
			timeSlots: ['06:00-12:00', '12:00-18:00', '06:00-18:00', '全天'],
			statusMap: { 0: '待确认', 1: '已确认', 2: '已到场', 3: '已取消', 4: '已过期' }
		}
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			const cached = getCachedVenue()
			const venueId = cached && cached.venue ? cached.venue.venueId : 1
			fetchSpots(venueId).then(rows => { this.spots = rows }).catch(() => {}).finally(() => { this.loading = false })
			fetchMyReservations().then(rows => { this.myList = rows }).catch(() => {})
		},
		selectSpot(s) { this.selected = s.spotId },
		onDateChange(e) { this.reserveDate = e.detail.value },
		onSlotChange(e) { this.timeSlot = this.timeSlots[e.detail.value] },
		doSubmit() {
			if (!this.reserveDate) { uni.showToast({ title: '请选择日期', icon: 'none' }); return }
			const cached = getCachedVenue()
			submitReservation({
				venueId: cached && cached.venue ? cached.venue.venueId : 1,
				spotId: this.selected,
				reserveDate: this.reserveDate,
				timeSlot: this.timeSlot
			}).then(() => {
				uni.showToast({ title: '预订成功' })
				this.selected = null
				this.loadData()
			}).catch(e => uni.showToast({ title: e.message || '预订失败', icon: 'none' }))
		},
		doCancel(r) {
			uni.showModal({ title: '提示', content: '确认取消预订？', success: res => {
				if (res.confirm) cancelReservation(r.reservationId).then(() => this.loadData())
			}})
		}
	}
}
</script>

<style scoped>
.reserve-page { padding: 0 24rpx 40rpx; }
.page-head { padding: 30rpx 0 20rpx; }
.page-head-title { font-size: 36rpx; font-weight: bold; color: #1a2030; }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: #999; font-size: 28rpx; }
.spot-list { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 30rpx; }
.spot-card { background: #fff; border-radius: 12rpx; padding: 20rpx; width: calc(50% - 8rpx); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05); border: 2rpx solid transparent; }
.spot-card.selected { border-color: #f5a623; background: #fffbf0; }
.spot-top { display: flex; align-items: center; gap: 8rpx; }
.spot-name { font-size: 28rpx; font-weight: bold; }
.spot-vip { font-size: 20rpx; }
.spot-fee { font-size: 24rpx; color: #f5a623; margin-top: 8rpx; }
.form-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 30rpx; }
.form-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.form-label { font-size: 28rpx; color: #333; }
.form-value { font-size: 28rpx; color: #666; }
.submit-btn { margin-top: 24rpx; background: #f5a623; color: #fff; text-align: center; padding: 20rpx; border-radius: 12rpx; font-size: 30rpx; font-weight: bold; }
.section-title { font-size: 30rpx; font-weight: bold; margin: 20rpx 0 12rpx; }
.my-list { display: flex; flex-direction: column; gap: 12rpx; }
.my-item { background: #fff; border-radius: 12rpx; padding: 20rpx; position: relative; }
.my-top { display: flex; justify-content: space-between; }
.my-spot { font-weight: bold; font-size: 28rpx; }
.my-status { font-size: 24rpx; color: #999; }
.my-date { font-size: 24rpx; color: #666; margin-top: 8rpx; }
.my-cancel { position: absolute; right: 20rpx; bottom: 20rpx; font-size: 24rpx; color: #e74c3c; }
</style>
