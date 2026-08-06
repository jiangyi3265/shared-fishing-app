<template>
	<view class="app checkin-page has-brand-header">
		<brand-header title="签到日历" theme="teal" layout="stacked" :back-on-title="true" />
		<view class="checkin-header">
			<text class="checkin-title">连续签到</text>
			<view class="checkin-streak"><text>{{ consecutive }}</text><text>天</text></view>
			<text class="checkin-note">坚持签到，积分更多哦！</text>
		</view>

		<view class="calendar">
			<view class="cal-nav">
				<text class="cal-arrow" @click="prevMonth">‹</text>
				<text class="cal-month">{{ currentMonth }}</text>
				<text class="cal-arrow" @click="nextMonth">›</text>
			</view>
			<view class="cal-weekdays">
				<text v-for="w in weekdays" :key="w" class="cal-wd">{{ w }}</text>
			</view>
			<view class="cal-days">
				<view v-for="(d, i) in calendarDays" :key="i" class="cal-day" :class="{checked: d.checked, today: d.isToday, 'cal-empty': !d.day}">
					<text v-if="d.day">{{ d.day }}</text>
					<view v-if="d.checked" class="cal-dot"></view>
				</view>
			</view>
		</view>

		<view class="rewards-section">
			<text class="section-title">签到奖励预览</text>
			<view class="reward-list">
				<view class="reward-item" :class="{achieved: consecutive >= 3}">
					<text class="reward-days">3天</text><text class="reward-pts">+10积分</text>
				</view>
				<view class="reward-item" :class="{achieved: consecutive >= 7}">
					<text class="reward-days">7天</text><text class="reward-pts">+25积分</text>
				</view>
				<view class="reward-item" :class="{achieved: consecutive >= 14}">
					<text class="reward-days">14天</text><text class="reward-pts">+55积分</text>
				</view>
				<view class="reward-item" :class="{achieved: consecutive >= 30}">
					<text class="reward-days">30天</text><text class="reward-pts">+155积分</text>
				</view>
			</view>
		</view>

		<view class="checkin-btn-wrap">
			<view class="checkin-action" :class="{done: todayChecked}" @click="doCheckinAction">
				{{ todayChecked ? '今日已签到' : '今日签到' }}
			</view>
			<text class="today-reward">今日签到可获得 5 积分</text>
		</view>
	</view>
</template>

<script>
import { fetchCheckinCalendar, doCheckin } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			currentMonth: '',
			consecutive: 0,
			todayChecked: false,
			checkedDays: [],
			weekdays: ['日', '一', '二', '三', '四', '五', '六']
		}
	},
	computed: {
		calendarDays() {
			if (!this.currentMonth) return []
			const [y, m] = this.currentMonth.split('-').map(Number)
			const firstDay = new Date(y, m - 1, 1).getDay()
			const daysInMonth = new Date(y, m, 0).getDate()
			const today = new Date()
			const todayStr = today.toISOString().slice(0, 10)
			const days = []
			for (let i = 0; i < firstDay; i++) days.push({ day: 0, checked: false, isToday: false, empty: true })
			for (let d = 1; d <= daysInMonth; d++) {
				const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
				days.push({ day: d, checked: this.checkedDays.includes(dateStr), isToday: dateStr === todayStr })
			}
			return days
		}
	},
	onShow() {
		const now = new Date()
		this.currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
		this.loadCalendar()
	},
	methods: {
		loadCalendar() {
			fetchCheckinCalendar(this.currentMonth).then(data => {
				this.checkedDays = data.days || []
				this.consecutive = data.consecutive || 0
				this.todayChecked = data.todayChecked || false
			}).catch(() => {})
		},
		prevMonth() {
			const [y, m] = this.currentMonth.split('-').map(Number)
			const d = new Date(y, m - 2, 1)
			this.currentMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
			this.loadCalendar()
		},
		nextMonth() {
			const [y, m] = this.currentMonth.split('-').map(Number)
			const d = new Date(y, m, 1)
			this.currentMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
			this.loadCalendar()
		},
		doCheckinAction() {
			if (this.todayChecked) return
			doCheckin().then(r => {
				this.todayChecked = true
				this.consecutive = r.consecutive
				uni.showToast({ title: '签到成功 +' + r.earned + '积分' })
				this.loadCalendar()
			}).catch(e => uni.showToast({ title: e.message || '签到失败', icon: 'none' }))
		}
	}
}
</script>

<style scoped>
.checkin-page { padding: 0 24rpx 180rpx; overflow: visible; box-sizing: border-box; }
.checkin-header { display: flex; justify-content: space-between; align-items: center; gap: 20rpx; padding: 30rpx 0 20rpx; min-height: 104rpx; box-sizing: border-box; }
.checkin-title { font-size: 38rpx; font-weight: 600; line-height: 1.25; color: var(--text-main); letter-spacing: 0.5rpx; }
.checkin-streak { font-size: 26rpx; color: var(--gold); font-weight: 500; white-space: nowrap; }
.calendar { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: var(--r); padding: 24rpx; margin-bottom: 24rpx; overflow: hidden; box-sizing: border-box; }
.cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.cal-arrow { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 42rpx; line-height: 1; color: var(--text-muted); background: var(--surface-soft); }
.cal-month { font-size: 30rpx; font-weight: 600; color: var(--text-main); }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; margin-bottom: 8rpx; }
.cal-wd { font-size: 24rpx; color: var(--text-light); padding: 8rpx 0; }
.cal-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8rpx; }
.cal-day { width: 100%; height: 68rpx; min-height: 68rpx; text-align: center; padding: 0; font-size: 26rpx; color: var(--text-main); border-radius: var(--r-xs); position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
.cal-day.cal-empty { visibility: hidden; background: transparent; border: 0; box-shadow: none; }
.cal-day.today { background: var(--g-50); font-weight: 600; color: var(--jade); }
.cal-day.checked { background: var(--g-50); color: var(--ink); }
.cal-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: var(--g-600); margin-top: 4rpx; }
.rewards-section { margin-bottom: 24rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: var(--text-main); margin-bottom: 16rpx; }
.reward-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12rpx; }
.reward-item { min-width: 0; background: var(--surface); border: 1rpx solid var(--border-color); border-radius: var(--r); padding: 22rpx 6rpx; text-align: center; box-sizing: border-box; }
.reward-item.achieved { background: var(--g-50); border: 2rpx solid var(--g-600); }
.reward-days { font-size: 24rpx; color: var(--text-muted); display: block; }
.reward-pts { font-size: 22rpx; color: var(--jade); font-weight: 600; }
.checkin-btn-wrap { padding: 20rpx 0; }
.checkin-action { background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; text-align: center; padding: 24rpx; border-radius: 99rpx; font-size: 32rpx; font-weight: 600; }
.checkin-action:active { transform: scale(0.97); }
.checkin-action.done { background: var(--ink-3); box-shadow: none; }
</style>

<style scoped>
.checkin-page{min-height:100vh;padding:0 20rpx 40rpx;background:#f7fbfb}.checkin-header{min-height:188rpx;margin-top:14rpx;padding:24rpx;box-sizing:border-box;display:block;border:1rpx solid #d7e5e4;border-radius:14rpx;background:#fff}.checkin-title{font-size:23rpx;font-weight:400;color:#687c7e}.checkin-streak{display:flex;align-items:baseline;margin-top:7rpx;color:#0aa6a3}.checkin-streak text:first-child{font-size:60rpx;line-height:1;font-weight:800}.checkin-streak text:last-child{margin-left:8rpx;font-size:26rpx}.checkin-note{display:block;margin-top:10rpx;color:#667a7c;font-size:21rpx}.calendar{margin:14rpx 0 0;padding:17rpx 20rpx;border-radius:14rpx}.cal-nav{height:58rpx;margin-bottom:6rpx;border-top:1rpx solid #dce7e6}.cal-arrow{width:36rpx;height:36rpx;background:transparent;font-size:34rpx}.cal-month{font-size:25rpx}.cal-wd{font-size:19rpx}.cal-days{gap:2rpx}.cal-day{height:54rpx;min-height:54rpx;font-size:22rpx;border-radius:50%}.cal-day.checked{background:transparent;color:#173f42}.cal-day.checked .cal-dot{width:22rpx;height:22rpx;position:absolute;left:50%;bottom:0;margin-left:-11rpx;background:#0aa9a5}.cal-day.checked .cal-dot::after{content:'✓';display:flex;align-items:center;justify-content:center;color:#fff;font-size:13rpx}.cal-day.today{background:#d9f0ef}.rewards-section{margin-top:14rpx;padding:20rpx 0;border-top:1rpx solid #dce7e6}.section-title{margin-bottom:20rpx;font-size:24rpx}.reward-list{position:relative;gap:8rpx}.reward-list::before{content:'';position:absolute;left:11%;right:11%;top:28rpx;border-top:3rpx dotted #0aa6a3}.reward-item{position:relative;z-index:2;padding:0;border:0;background:transparent}.reward-item::before{content:'★';width:52rpx;height:52rpx;margin:0 auto 7rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#e4eceb;color:#7f9394;font-size:18rpx}.reward-item.achieved{border:0;background:transparent}.reward-item.achieved::before{background:#fff0c9;color:#e99d00}.reward-days{font-size:21rpx}.reward-pts{font-size:18rpx}.checkin-btn-wrap{padding:0}.checkin-action{padding:0;height:76rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#0bafab;font-size:27rpx}.today-reward{display:block;margin-top:10rpx;text-align:center;color:#748789;font-size:19rpx}
</style>

<style scoped>
.checkin-page{padding-bottom:calc(40rpx + env(safe-area-inset-bottom))}
@media (max-width:360px){.calendar{padding-left:12rpx;padding-right:12rpx}.cal-day{height:50rpx;min-height:50rpx}.reward-item::before{width:46rpx;height:46rpx}.reward-list::before{top:25rpx}}
</style>
