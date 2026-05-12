<template>
	<view class="app checkin-page">
		<view class="checkin-header">
			<text class="checkin-title">签到日历</text>
			<text class="checkin-streak">连续签到 {{ consecutive }} 天</text>
		</view>

		<view class="calendar">
			<view class="cal-nav">
				<text class="cal-arrow" @click="prevMonth">&lt;</text>
				<text class="cal-month">{{ currentMonth }}</text>
				<text class="cal-arrow" @click="nextMonth">&gt;</text>
			</view>
			<view class="cal-weekdays">
				<text v-for="w in weekdays" :key="w" class="cal-wd">{{ w }}</text>
			</view>
			<view class="cal-days">
				<view v-for="(d, i) in calendarDays" :key="i" class="cal-day" :class="{checked: d.checked, today: d.isToday, empty: !d.day}">
					<text v-if="d.day">{{ d.day }}</text>
					<view v-if="d.checked" class="cal-dot"></view>
				</view>
			</view>
		</view>

		<view class="rewards-section">
			<text class="section-title">阶梯奖励</text>
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
				{{ todayChecked ? '今日已签到 ✓' : '立即签到 +5' }}
			</view>
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
.checkin-page { padding: 0 24rpx 40rpx; }
.checkin-header { display: flex; justify-content: space-between; align-items: center; padding: 30rpx 0 20rpx; }
.checkin-title { font-size: 36rpx; font-weight: bold; }
.checkin-streak { font-size: 26rpx; color: #f5a623; }
.calendar { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.cal-arrow { font-size: 32rpx; padding: 10rpx 20rpx; color: #666; }
.cal-month { font-size: 30rpx; font-weight: bold; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 8rpx; }
.cal-wd { font-size: 24rpx; color: #999; padding: 8rpx 0; }
.cal-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4rpx; }
.cal-day { text-align: center; padding: 14rpx 0; font-size: 26rpx; border-radius: 8rpx; position: relative; min-height: 60rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cal-day.today { background: #f0f7ff; font-weight: bold; color: #3b82f6; }
.cal-day.checked { background: #e8f5e9; color: #2e7d32; }
.cal-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: #4caf50; margin-top: 4rpx; }
.rewards-section { margin-bottom: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.reward-list { display: flex; gap: 12rpx; }
.reward-item { flex: 1; background: #f5f5f5; border-radius: 12rpx; padding: 16rpx 8rpx; text-align: center; }
.reward-item.achieved { background: #e8f5e9; border: 2rpx solid #4caf50; }
.reward-days { font-size: 24rpx; color: #666; display: block; }
.reward-pts { font-size: 22rpx; color: #4caf50; font-weight: bold; }
.checkin-btn-wrap { padding: 20rpx 0; }
.checkin-action { background: #4caf50; color: #fff; text-align: center; padding: 24rpx; border-radius: 12rpx; font-size: 32rpx; font-weight: bold; }
.checkin-action.done { background: #ccc; }
</style>
