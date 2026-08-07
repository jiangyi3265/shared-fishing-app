<template>
	<view class="app reserve-page has-brand-header">
		<brand-header title="钓位预订" theme="light" layout="compact" :back="true" />
		<view v-if="loading" class="page-state">
			<view class="state-spinner"></view>
			<text class="state-title">正在加载钓位</text>
			<text class="state-desc">马上为你展示今日可预订位置</text>
		</view>
		<view v-else-if="spots.length === 0" class="page-state">
			<view class="state-icon"><view class="state-pin"></view></view>
			<text class="state-title">{{ loadError ? '钓位暂时加载失败' : '今日暂无开放钓位' }}</text>
			<text class="state-desc">{{ loadError || '钓场正在整理可预约位置，请稍后再来看' }}</text>
			<view class="state-retry" @click="loadData">重新加载</view>
		</view>

		<view v-if="spots.length" class="pond-panel">
			<image class="pond-photo" src="/static/venue-aerial-v1.jpg" mode="aspectFill" />
			<view
				v-for="(s, index) in spots.slice(0, 20)"
				:key="s.spotId"
				class="pond-spot"
				:class="['spot-pos-' + ((index % 20) + 1), { selected: selected === s.spotId, booked: Number(s.status) === 1, vip: s.spotType === 'vip' }]"
				@click="selectSpot(s)"
			>
				<text>{{ formatSpot(s, index) }}</text>
			</view>
			<view class="pond-legend">
				<view class="legend-item"><text class="legend-dot available"></text><text>可预订</text></view>
				<view class="legend-item"><text class="legend-dot booked"></text><text>已预订</text></view>
				<view class="legend-item"><text class="legend-dot vip"></text><text>VIP</text></view>
			</view>
		</view>

		<view v-if="selected" class="form-section">
			<scroll-view class="date-strip" scroll-x :show-scrollbar="false">
				<view class="date-strip-inner">
					<view v-for="d in quickDates" :key="d.value" class="date-chip" :class="{ active: reserveDate === d.value }" @click="selectDate(d.value)">
						<text class="date-label">{{ d.label }}</text>
						<text class="date-value">{{ d.short }}</text>
					</view>
					<picker mode="date" :start="today" @change="onDateChange">
						<view class="date-chip calendar-chip"><text class="calendar-icon"></text><text class="date-value">选择日期</text></view>
					</picker>
				</view>
			</scroll-view>

			<view class="slot-section">
				<text class="form-label">选择时段</text>
				<scroll-view class="slot-strip" scroll-x :show-scrollbar="false">
					<view class="slot-strip-inner">
						<view v-for="slot in timeSlots" :key="slot" class="slot-chip" :class="{ active: timeSlot === slot }" @click="selectSlot(slot)">{{ slot }}</view>
					</view>
				</scroll-view>
			</view>

			<view class="selected-row">
				<view>
					<text class="selected-label">已选钓位</text>
					<text class="selected-name">{{ selectedSpot ? selectedSpot.spotName : '' }}</text>
					<text class="selected-type">{{ selectedSpot && selectedSpot.spotType === 'vip' ? 'VIP 区' : '标准区' }}</text>
				</view>
				<text class="change-link">更换钓位 ›</text>
			</view>

			<view class="confirm-row">
				<view class="cost-block">
					<text class="cost-label">预计费用</text>
					<view><text class="cost-num">{{ estimatedFee }}</text><text class="cost-unit">元</text></view>
					<text class="cost-note">{{ timeSlot || '请选择时段' }}</text>
				</view>
				<view class="submit-btn" @click="doSubmit">确认预订</view>
			</view>
		</view>

		<view class="section-title" v-if="myList.length">我的预订（{{ myList.length }}）</view>
		<view class="my-list">
			<view class="my-item" v-for="r in myList" :key="r.reservationId">
				<view class="my-spot-badge">{{ formatReservationSpot(r.spotName) }}</view>
				<view class="my-main">
					<text class="my-date">{{ r.reserveDate }}　{{ r.timeSlot }}</text>
					<text class="my-spot">{{ r.spotName }}　标准区</text>
					<text class="my-created">预订状态：{{ statusMap[r.status] }}</text>
				</view>
				<view class="my-actions">
					<text class="my-status">{{ statusMap[r.status] }}</text>
					<view v-if="r.status <= 1" class="my-cancel" @click="doCancel(r)">取消</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchSpots, submitReservation, fetchMyReservations, cancelReservation, getCachedVenue, isLoggedIn } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			spots: [], myList: [], loading: true,
			loadError: '',
			selected: null, reserveDate: '', timeSlot: '',
			today: new Date().toISOString().slice(0, 10),
			timeSlots: ['06:00-12:00', '12:00-18:00', '06:00-18:00', '全天'],
			statusMap: { 0: '待确认', 1: '已确认', 2: '已到场', 3: '已取消', 4: '已过期' }
		}
	},
	computed: {
		quickDates() {
			const weekdays = ['周日','周一','周二','周三','周四','周五','周六']
			return [0,1,2,3,4].map((offset, index) => {
				const d = new Date()
				d.setDate(d.getDate() + offset)
				const value = d.toISOString().slice(0, 10)
				const label = index === 0 ? '今天' : index === 1 ? '明天' : index === 2 ? '后天' : weekdays[d.getDay()]
				return { label, value, short: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
			})
		},
		selectedSpot() {
			return this.spots.find((item) => item.spotId === this.selected) || null
		},
		estimatedFee() {
			const fee = this.selectedSpot && Number(this.selectedSpot.extraFeeCents)
			return ((Number.isFinite(fee) && fee > 0 ? fee : 0) / 100).toFixed(2)
		}
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			this.loadError = ''
			const cached = getCachedVenue()
			const venueId = cached && cached.venue ? cached.venue.venueId : 1
			fetchSpots(venueId).then(rows => {
				this.spots = Array.isArray(rows) ? rows : []
				if (this.spots.length && !this.selected) {
					this.selected = this.spots[Math.min(11, this.spots.length - 1)].spotId
					this.reserveDate = this.today
					this.timeSlot = this.timeSlots[0]
				}
			}).catch((e) => {
				this.spots = []
				this.loadError = (e && (e.msg || e.message)) || '请检查网络后重试'
			}).finally(() => { this.loading = false })
			if (isLoggedIn()) {
				fetchMyReservations().then(rows => { this.myList = Array.isArray(rows) ? rows : [] }).catch(() => {})
			} else {
				this.myList = []
			}
		},
		selectSpot(s) {
			if (Number(s.status) === 1) return
			this.selected = s.spotId
		},
		formatSpot(s, index) {
			const match = String(s.spotName || '').match(/\d+/)
			return match ? match[0].padStart(2, '0') : String(index + 1).padStart(2, '0')
		},
		formatReservationSpot(name) {
			const match = String(name || '').match(/\d+/)
			return match ? match[0].padStart(2, '0') : '位'
		},
		selectDate(value) { this.reserveDate = value },
		selectSlot(value) { this.timeSlot = value },
		onDateChange(e) { this.reserveDate = e.detail.value },
		onSlotChange(e) { this.timeSlot = this.timeSlots[e.detail.value] },
		doSubmit() {
			if (!this.reserveDate) { uni.showToast({ title: '请选择日期', icon: 'none' }); return }
			if (!this.timeSlot) { uni.showToast({ title: '请选择时段', icon: 'none' }); return }
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
.reserve-page { min-height: 100vh; padding: 0 0 calc(34rpx + env(safe-area-inset-bottom)); background: #f7fbfb; color: #073f45; }
.page-state { margin: 28rpx 24rpx; min-height: 430rpx; padding: 72rpx 42rpx; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1rpx solid #d9e8e7; border-radius: 24rpx; background: #fff; text-align: center; }
.state-icon { width: 112rpx; height: 112rpx; display: flex; align-items: center; justify-content: center; border-radius: 32rpx; background: #e8f8f7; }
.state-pin { position: relative; width: 38rpx; height: 38rpx; border: 7rpx solid #0caaa6; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); }
.state-pin::after { content: ''; position: absolute; left: 10rpx; top: 10rpx; width: 10rpx; height: 10rpx; border-radius: 50%; background: #0caaa6; }
.state-spinner { width: 50rpx; height: 50rpx; border: 6rpx solid #d9efed; border-top-color: #0caaa6; border-radius: 50%; animation: state-spin .8s linear infinite; }
@keyframes state-spin { to { transform: rotate(360deg); } }
.state-title { margin-top: 26rpx; color: #123f43; font-size: 32rpx; font-weight: 800; }
.state-desc { max-width: 500rpx; margin-top: 12rpx; color: #789092; font-size: 24rpx; line-height: 1.6; }
.state-retry { margin-top: 30rpx; min-width: 210rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 12rpx; background: #0bafab; color: #fff; font-size: 26rpx; font-weight: 700; }
.pond-panel { position: relative; height: 470rpx; overflow: hidden; background: #dcefed; }
.pond-photo { width: 100%; height: 420rpx; display: block; }
.pond-panel::after { content: ''; position: absolute; left: 0; right: 0; bottom: 48rpx; height: 72rpx; background: linear-gradient(180deg, transparent, rgba(5, 40, 42, .2)); pointer-events: none; }
.pond-spot { position: absolute; z-index: 2; width: 54rpx; height: 54rpx; display: flex; align-items: center; justify-content: center; border: 3rpx solid #fff; border-radius: 50%; color: #fff; font-size: 22rpx; font-weight: 700; background: #18a8a4; box-shadow: 0 4rpx 12rpx rgba(0,0,0,.28); }
.pond-spot.selected { width: 62rpx; height: 62rpx; margin: -4rpx; border-width: 6rpx; background: #00a9a5; }
.pond-spot.booked { background: #9b9e9d; }
.pond-spot.vip { background: #df9b00; }
.spot-pos-1{left:15%;top:24rpx}.spot-pos-2{left:31%;top:18rpx}.spot-pos-3{left:47%;top:16rpx}.spot-pos-4{left:63%;top:18rpx}.spot-pos-5{left:78%;top:25rpx}
.spot-pos-6{right:5%;top:62rpx}.spot-pos-7{right:2%;top:128rpx}.spot-pos-8{right:1%;top:196rpx}.spot-pos-9{right:2%;top:264rpx}.spot-pos-10{right:6%;top:322rpx}
.spot-pos-11{right:20%;top:350rpx}.spot-pos-12{right:36%;top:358rpx}.spot-pos-13{left:49%;top:360rpx}.spot-pos-14{left:33%;top:358rpx}.spot-pos-15{left:17%;top:348rpx}
.spot-pos-16{left:5%;top:316rpx}.spot-pos-17{left:2%;top:254rpx}.spot-pos-18{left:1%;top:188rpx}.spot-pos-19{left:2%;top:122rpx}.spot-pos-20{left:5%;top:60rpx}
.pond-legend { position: absolute; z-index: 3; left: 0; right: 0; bottom: 0; height: 58rpx; padding: 0 32rpx; display: flex; align-items: center; gap: 30rpx; color: #345d60; font-size: 24rpx; background: rgba(255,255,255,.96); }
.legend-item { display:flex; align-items:center; gap:10rpx; }.legend-dot{width:20rpx;height:20rpx;border-radius:50%;}.legend-dot.available{background:#18a8a4}.legend-dot.booked{background:#9b9e9d}.legend-dot.vip{background:#df9b00}
.form-section { background: #fff; }
.date-strip { width: 100%; border-bottom: 1rpx solid #dcebea; }
.date-strip-inner { display: inline-flex; min-width: 100%; padding: 18rpx 18rpx 16rpx; gap: 10rpx; box-sizing: border-box; }
.date-chip { width: 104rpx; height: 84rpx; flex-shrink: 0; border: 1rpx solid #d7e4e3; border-radius: 9rpx; display:flex;flex-direction:column;align-items:center;justify-content:center;color:#3e5557;background:#fff; }
.date-chip.active { color:#fff; background:#0db0ac; border-color:#0db0ac; }.date-label{font-size:23rpx;line-height:1.2}.date-value{font-size:22rpx;margin-top:5rpx}.calendar-chip{width:116rpx;border:0;color:#168f91}.calendar-icon{width:30rpx;height:28rpx;border:3rpx solid currentColor;border-radius:4rpx;position:relative}.calendar-icon::after{content:'';position:absolute;left:4rpx;right:4rpx;top:8rpx;border-top:3rpx solid currentColor}
.slot-section { padding: 20rpx 20rpx 18rpx; border-bottom:1rpx solid #dcebea; }.form-label{font-size:28rpx;font-weight:700;display:block;margin-bottom:16rpx}.slot-strip{width:100%}.slot-strip-inner{display:inline-flex;gap:12rpx}.slot-chip{padding:16rpx 20rpx;border:1rpx solid #bdcece;border-radius:8rpx;font-size:23rpx;color:#405657;white-space:nowrap}.slot-chip.active{color:#fff;background:#0db0ac;border-color:#0db0ac}
.selected-row { min-height: 112rpx; padding: 20rpx 22rpx; display:flex;align-items:center;justify-content:space-between;border-bottom:1rpx solid #dcebea; }.selected-label,.selected-name,.selected-type{display:block}.selected-label{font-size:27rpx;font-weight:700}.selected-name{font-size:31rpx;font-weight:800;margin-top:6rpx}.selected-type{font-size:22rpx;color:#738e90;margin-top:3rpx}.change-link{font-size:24rpx;color:#109c9a}
.confirm-row{display:flex;align-items:stretch;padding:20rpx 22rpx;gap:24rpx;border-bottom:1rpx solid #dcebea}.cost-block{width:210rpx;display:flex;flex-direction:column;justify-content:center}.cost-label{font-size:22rpx;color:#5e7779}.cost-num{font-size:42rpx;line-height:1;color:#df9300;font-weight:800}.cost-unit{font-size:21rpx;color:#df9300;margin-left:5rpx}.cost-note{font-size:20rpx;color:#809798;margin-top:6rpx}.submit-btn{flex:1;display:flex;align-items:center;justify-content:center;border-radius:12rpx;background:#0db0ac;color:#fff;font-size:31rpx;font-weight:700}.submit-btn:active{opacity:.86}
.section-title{font-size:29rpx;font-weight:800;margin:20rpx 22rpx 12rpx}.my-list{margin:0 20rpx;display:flex;flex-direction:column;gap:12rpx}.my-item{display:flex;align-items:center;gap:18rpx;background:#fff;border:1rpx solid #d7e5e4;border-radius:12rpx;padding:18rpx}.my-spot-badge{width:60rpx;height:60rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:10rpx;background:#0ba9a6;color:#fff;font-size:28rpx;font-weight:800}.my-main{flex:1;min-width:0}.my-date,.my-spot,.my-created{display:block}.my-date{font-size:24rpx;font-weight:700;color:#173f42}.my-spot{font-size:22rpx;color:#4f6b6d;margin-top:5rpx}.my-created{font-size:20rpx;color:#91a2a3;margin-top:4rpx}.my-actions{display:flex;flex-direction:column;align-items:flex-end;gap:10rpx}.my-status{font-size:22rpx;color:#0a9d9a}.my-cancel{font-size:22rpx;border:1rpx solid #bacbca;border-radius:6rpx;padding:10rpx 22rpx;color:#274547}
@media (max-height: 700px) { .pond-panel{height:406rpx}.pond-photo{height:356rpx}.pond-spot{transform:scale(.86)}.spot-pos-11,.spot-pos-12,.spot-pos-13,.spot-pos-14,.spot-pos-15{top:292rpx}.spot-pos-10,.spot-pos-16{top:270rpx} }
</style>
