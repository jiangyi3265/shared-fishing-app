<template>
	<view class="app goal-page has-brand-header">
		<brand-header title="冲榜目标" theme="light" layout="compact" :back="true" />
		<view class="goal-tabs">
			<view class="goal-tab" :class="{ active: type === 'weight' }" @click="switchType('weight')">钓王榜</view>
			<view class="goal-tab" :class="{ active: type === 'points' }" @click="switchType('points')">积分榜</view>
		</view>

		<view class="goal-panel main-goal">
			<view class="goal-panel-head"><view class="target-icon"></view><text class="goal-panel-title">我的目标</text><text class="current-rank">本月排行：<text>{{ myRankText }}</text></text></view>
			<view class="goal-metrics">
				<view class="goal-metric">
					<text class="metric-label">目标进度</text>
					<view class="progress-number"><text>{{ progressPercent }}</text><text>%</text></view>
					<view class="progress-track"><view :style="{ width: progressPercent + '%' }"></view></view>
					<text class="metric-note">目标：进入前三</text><text class="metric-note">本月剩余：{{ daysLeft }} 天</text>
				</view>
				<view class="goal-metric current-score">
					<text class="metric-label">当前成绩</text>
					<view class="score-number"><text>{{ formatNumber(myValue) }}</text><text>{{ unit }}</text></view>
					<view class="score-divider"></view>
					<text class="metric-note">距前三名还差</text><text class="gap-number">{{ gapText }}</text>
				</view>
			</view>
		</view>

		<view class="goal-panel advice-panel">
			<text class="goal-panel-title">本周建议</text>
			<view class="advice-row"><text class="check-dot">✓</text><text>{{ gapText }}</text></view>
			<view class="advice-row"><text class="check-dot">✓</text><text>{{ type === 'weight' ? '称鱼记录审核通过后自动计入钓王榜' : '消费、签到与活动积分到账后自动计入积分榜' }}</text></view>
			<view class="advice-row"><text class="check-dot">✓</text><text>榜单只统计本月后台确认的真实数据</text></view>
		</view>

		<view class="goal-panel rule-panel">
			<view class="goal-panel-head"><text class="goal-panel-title">排行说明</text></view>
			<text class="rule-panel-text">钓王榜按本月累计审核称鱼重量排序；积分榜按本月到账积分排序。若钓场发布奖励活动，以活动详情和后台配置为准。</text>
		</view>

		<view class="goal-actions">
			<view class="goal-action" @click="goWeigh"><view class="action-symbol scale-symbol"></view><text>称鱼冲榜</text><text>去称重计成绩</text></view>
			<view class="goal-action" @click="goPoints"><view class="action-symbol medal-symbol">★</view><text>赚积分</text><text>做任务换积分</text></view>
			<view class="goal-action" @click="goReserve"><view class="action-symbol people-symbol"></view><text>预订钓位</text><text>提前选好钓位</text></view>
		</view>
		<view class="goal-primary-btn" @click="goWeigh">去钓鱼，完成目标</view>
		<view id="goal-rule" class="goal-rule-note">钓王榜按当月累计钓获重量排序，积分榜按当月获得积分排序；数据每日更新。</view>
		<community-tabbar active="rank" />
	</view>
</template>

<script>
import { fetchLeaderboard, getCachedVenue, getUser, seedHomeIfAlone } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			type: 'weight',
			rows: [],
			user: null,
			statusBarHeight: 20,
			loading: true,
			loadError: ''
		}
	},
	computed: {
		unit() {
			return this.type === 'weight' ? '斤' : '分'
		},
		heroTitle() {
			return this.type === 'weight' ? '本月钓王目标' : '本月积分目标'
		},
		heroDesc() {
			return this.type === 'weight'
				? '称鱼记录自动计入榜单，冲进前三赢限定券包'
				: '签到、消费与活动积分同步计入，持续累积更稳'
		},
		champion() {
			return this.rows[0] || null
		},
		championValue() {
			return this.champion ? this.formatValue(this.champion) : '--'
		},
		podiumCards() {
			return [
				{ rank: 2, row: this.rows[1] || null },
				{ rank: 1, row: this.rows[0] || null },
				{ rank: 3, row: this.rows[2] || null }
			]
		},
		listRows() {
			return this.rows.slice(3, 11)
		},
		myIndex() {
			if (!this.user) return -1
			return this.rows.findIndex((r) => String(r.userId) === String(this.user.userId))
		},
		myRankText() {
			if (!this.user) return '登录后同步战绩'
			if (this.myIndex < 0) return '暂未上榜'
			return '第 ' + (this.myIndex + 1) + ' 名'
		},
		myValue() {
			if (this.myIndex >= 0) return this.valueNumber(this.rows[this.myIndex])
			return 0
		},
		nextTarget() {
			if (!this.rows.length) return null
			if (this.myIndex > 0) return this.rows[this.myIndex - 1]
			return this.rows[Math.min(2, this.rows.length - 1)]
		},
		gapText() {
			if (!this.user) return '登录后查看你距离前三还差多少'
			if (this.myIndex === 0) return '你已经在榜首，保持今日战绩即可'
			if (!this.nextTarget) return '今日还没有可追赶目标'
			const gap = Math.max(0, this.valueNumber(this.nextTarget) - this.myValue)
			return '距离目标还差 ' + this.formatNumber(gap) + this.unit
		},
		progressPercent() {
			if (this.myIndex < 0 || !this.rows.length) return 0
			const target = Math.max(1, this.valueNumber(this.rows[Math.min(2, this.rows.length - 1)]))
			return Math.min(100, Math.max(0, Math.round((this.myValue / target) * 100)))
		},
		daysLeft() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() }
	},
	onLoad() {
		try {
			const info = uni.getSystemInfoSync()
			if (info && info.statusBarHeight) this.statusBarHeight = info.statusBarHeight
		} catch (e) {}
	},
	onShow() {
		if (seedHomeIfAlone('/pages/goal/goal')) return
		this.user = getUser()
		this.load()
	},
	methods: {
		load() {
			this.loading = true
			this.loadError = ''
			const cached = getCachedVenue()
			const venueId = cached && cached.venue ? cached.venue.venueId : null
			fetchLeaderboard(this.type, venueId).then((rows) => {
				this.rows = rows || []
			}).catch((error) => {
				this.rows = []
				this.loadError = (error && (error.msg || error.message)) || '榜单加载失败'
				uni.showToast({ title: this.loadError, icon: 'none' })
			}).finally(() => { this.loading = false })
		},
		switchType(nextType) {
			if (this.type === nextType) return
			this.type = nextType
			this.load()
		},
		valueNumber(row) {
			if (!row) return 0
			if (this.type === 'weight') return Number((Number(row.weightGram || 0) / 500).toFixed(1))
			return Number(row.points || 0)
		},
		formatNumber(value) {
			if (this.type === 'weight') return Number(value || 0).toFixed(1)
			return String(Math.ceil(Number(value || 0)))
		},
		formatValue(row) {
			if (!row) return '--'
			return this.formatNumber(this.valueNumber(row))
		},
		subtitle(row) {
			if (!row) return ''
			if (this.type === 'weight') return '钓获 ' + (row.catchCount || 0) + ' 尾'
			return 'Lv.' + (row.level || 1) + ' 钓友'
		},
		avatarText(row) {
			const name = (row && row.nickname) || ''
			return name ? name.slice(0, 1) : '钓'
		},
		scrollToRule() {
			uni.pageScrollTo({ selector: '#goal-rule', duration: 220 })
		},
		goBack() {
			uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
		},
		goRank() {
			uni.pageScrollTo({ selector: '#goal-leaderboard', duration: 220 })
		},
		goWeigh() {
			uni.navigateTo({ url: '/pages/weighFish/weighFish' })
		},
		goPoints() {
			uni.navigateTo({ url: '/pages/points/points' })
		},
		goReserve() {
			uni.navigateTo({ url: '/pages/reserve/reserve' })
		},
		goMall() {
			uni.navigateTo({ url: '/pages/mall/index' })
		},
		getShareConfig() {
			return {
				title: '共享钓场冲榜目标，本月钓王等你来拿',
				path: '/pages/goal/goal'
			}
		}
	}
}
</script>

<style scoped>
.goal-page {
	min-height: 100vh;
	padding-bottom: calc(210rpx + env(safe-area-inset-bottom));
	background: linear-gradient(180deg, var(--g-950) 0%, var(--g-900) 360rpx, var(--g-50) 720rpx, var(--surface-2) 100%);
	color: var(--ink);
	overflow-x: hidden;
}

.goal-page::before,
.goal-page::after {
	display: none;
	content: none;
}

.goal-hero {
	position: relative;
	min-height: 760rpx;
	padding: 0 30rpx 44rpx;
	overflow: hidden;
	color: var(--surface-2);
}

.goal-hero-img,
.goal-hero-shade {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 100%;
}

.goal-hero-img {
	z-index: 0;
}

.goal-hero-shade {
	z-index: 1;
	background:
		linear-gradient(180deg, rgba(4, 19, 16, 0.80) 0%, rgba(5, 26, 21, 0.30) 36%, rgba(5, 26, 21, 0.82) 100%),
		linear-gradient(90deg, rgba(4, 19, 16, 0.58) 0%, rgba(4, 19, 16, 0.06) 52%, rgba(4, 19, 16, 0.38) 100%);
}

.goal-status-space,
.goal-nav,
.hero-copy,
.goal-tabs,
.hero-strip {
	position: relative;
	z-index: 2;
}

.goal-nav {
	display: grid;
	grid-template-columns: 66rpx 1fr 76rpx;
	align-items: center;
	gap: 18rpx;
	padding: 18rpx 0 0;
}

.nav-back,
.nav-rule {
	height: 64rpx;
	border-radius: var(--r-sm);
	background: rgba(251, 255, 250, 0.14);
	border: 1rpx solid rgba(251, 255, 250, 0.18);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--surface-2);
	font-weight: 600;
}

.nav-back {
	font-size: 54rpx;
	line-height: 1;
	padding-bottom: 8rpx;
}

.nav-rule {
	font-size: 24rpx;
}

.nav-search {
	height: 74rpx;
	border-radius: var(--r);
	background: var(--surface);
	color: var(--ink);
	display: flex;
	align-items: center;
	padding: 0 26rpx;
	gap: 14rpx;
}

.nav-search-icon {
	width: 22rpx;
	height: 22rpx;
	border: 4rpx solid rgba(23, 61, 53, 0.55);
	border-radius: 50%;
	position: relative;
}

.nav-search-icon::after {
	content: '';
	position: absolute;
	width: 12rpx;
	height: 4rpx;
	border-radius: 99rpx;
	background: rgba(23, 61, 53, 0.55);
	right: -10rpx;
	bottom: -6rpx;
	transform: rotate(45deg);
}

.nav-search-text {
	font-size: 28rpx;
	font-weight: 600;
}

.hero-copy {
	margin-top: 106rpx;
	width: 520rpx;
}

.hero-title {
	display: block;
	margin-top: 14rpx;
	font-size: 64rpx;
	font-weight: 950;
	line-height: 1.04;
}

.hero-desc {
	display: block;
	margin-top: 18rpx;
	font-size: 25rpx;
	line-height: 1.55;
	color: rgba(248, 255, 249, 0.78);
	font-weight: 650;
	max-width: 460rpx;
}

.goal-tabs {
	margin-top: 48rpx;
	width: 386rpx;
	height: 70rpx;
	padding: 6rpx;
	display: flex;
	border-radius: var(--r);
	background: rgba(6, 27, 23, 0.52);
	border: 1rpx solid rgba(255, 227, 163, 0.18);
}

.goal-tab {
	flex: 1;
	border-radius: var(--r-sm);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 25rpx;
	font-weight: 600;
	color: rgba(248, 255, 249, 0.66);
	transition: all 0.2s ease-out;
}

.goal-tab.active {
	background: var(--g-600);
	color: var(--ink);
}

.hero-strip {
	margin-top: 42rpx;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12rpx;
}

.hero-strip-item {
	min-height: 116rpx;
	padding: 18rpx 10rpx;
	border-radius: var(--r-sm);
	background: rgba(248, 255, 249, 0.12);
	border: 1rpx solid rgba(248, 255, 249, 0.16);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.strip-num {
	font-size: 36rpx;
	font-weight: 950;
	color: var(--gold-ink);
	font-variant-numeric: tabular-nums;
	line-height: 1;
}

.strip-label {
	font-size: 20rpx;
	font-weight: 500;
	color: rgba(248, 255, 249, 0.66);
}

.goal-summary {
	margin: -58rpx 28rpx 0;
	position: relative;
	z-index: 4;
	padding: 30rpx 28rpx;
	border-radius: var(--r);
	background: var(--g-50);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
}

.summary-copy {
	flex: 1;
	min-width: 0;
}

.summary-kicker {
	display: block;
	font-size: 20rpx;
	font-weight: 600;
	letter-spacing: 4rpx;
	color: var(--gold-ink);
}

.summary-title {
	display: block;
	margin-top: 8rpx;
	font-size: 42rpx;
	font-weight: 950;
	color: var(--ink);
	line-height: 1.14;
}

.summary-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 23rpx;
	color: var(--ink-2);
	line-height: 1.45;
	font-weight: 650;
}

.summary-meter {
	width: 150rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	flex-shrink: 0;
}

.meter-ring {
	width: 124rpx;
	height: 124rpx;
	border-radius: 50%;
	background: var(--g-600);
	border: 1rpx solid rgba(16, 47, 40, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	font-variant-numeric: tabular-nums;
}

.meter-value {
	font-size: 34rpx;
	font-weight: 950;
	color: var(--ink);
}

.meter-unit {
	margin-left: 2rpx;
	font-size: 18rpx;
	font-weight: 600;
	color: var(--ink-2);
}

.meter-label {
	font-size: 20rpx;
	font-weight: 600;
	color: var(--ink-2);
}

.meter-track {
	width: 118rpx;
	height: 8rpx;
	border-radius: 99rpx;
	background: rgba(16, 47, 40, 0.10);
	overflow: hidden;
}

.meter-fill {
	height: 100%;
	border-radius: 99rpx;
	background: var(--g-600);
}

.target-row {
	margin: 22rpx 28rpx 0;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18rpx;
}

.target-cell {
	min-height: 132rpx;
	padding: 26rpx 24rpx;
	border-radius: var(--r);
	background: var(--g-50);
	border: 1rpx solid rgba(23, 61, 53, 0.06);
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 10rpx;
}

.target-cell.is-gold {
	background: var(--gold-bg);
	border-color: rgba(181, 138, 45, 0.12);
}

.target-label {
	font-size: 21rpx;
	font-weight: 600;
	color: var(--ink-2);
}

.target-value {
	font-size: 32rpx;
	font-weight: 950;
	color: var(--ink);
	line-height: 1.15;
}

.podium-section,
.leaderboard,
.rule-panel {
	margin: 34rpx 28rpx 0;
}

.section-head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	padding: 0 4rpx 22rpx;
}

.section-head.compact {
	padding-bottom: 14rpx;
}

.section-title {
	display: block;
	margin-top: 9rpx;
	font-size: 34rpx;
	font-weight: 950;
	color: var(--ink);
	line-height: 1.1;
}

.section-link {
	font-size: 23rpx;
	font-weight: 600;
	color: var(--ink-2);
}

.podium-stage {
	display: grid;
	grid-template-columns: 0.88fr 1.08fr 0.88fr;
	gap: 14rpx;
	align-items: end;
}

.podium-card {
	min-width: 0;
	padding: 24rpx 14rpx 0;
	border-radius: 24rpx 24rpx 16rpx 16rpx;
	background: linear-gradient(180deg, var(--g-50) 0%, var(--g-50) 100%);
	border: 1rpx solid rgba(23, 61, 53, 0.06);
	display: flex;
	flex-direction: column;
	align-items: center;
	overflow: hidden;
}

.podium-card.is-rank-1 {
	padding-top: 18rpx;
	background: var(--surface);
	border-color: rgba(181, 138, 45, 0.18);
	transform: translateY(-18rpx);
}

.podium-avatar {
	width: 90rpx;
	height: 90rpx;
	border-radius: var(--r-lg);
	background: var(--g-800);
	display: flex;
	align-items: center;
	justify-content: center;
	border: 4rpx solid rgba(255, 255, 255, 0.68);
}

.is-rank-1 .podium-avatar {
	width: 112rpx;
	height: 112rpx;
	background: linear-gradient(135deg, var(--gold) 0%, var(--gold-ink) 100%);
}

.is-rank-2 .podium-avatar {
	background: linear-gradient(135deg, var(--ink-3) 0%, var(--ink-2) 100%);
}

.is-rank-3 .podium-avatar {
	background: linear-gradient(135deg, var(--gold) 0%, var(--gold-ink) 100%);
}

.podium-avatar text {
	font-size: 38rpx;
	font-weight: 950;
	color: #fff;
}

.is-rank-1 .podium-avatar text {
	font-size: 46rpx;
}

.podium-name {
	margin-top: 15rpx;
	max-width: 100%;
	font-size: 25rpx;
	font-weight: 950;
	color: var(--ink);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.podium-sub {
	margin-top: 7rpx;
	font-size: 19rpx;
	font-weight: 500;
	color: var(--ink-2);
	white-space: nowrap;
}

.podium-score {
	margin-top: 14rpx;
	display: flex;
	align-items: baseline;
	justify-content: center;
	font-variant-numeric: tabular-nums;
}

.podium-score text:first-child {
	font-size: 34rpx;
	font-weight: 950;
	color: var(--ink);
}

.podium-unit {
	margin-left: 4rpx;
	font-size: 18rpx;
	font-weight: 600;
	color: var(--ink-2);
}

.podium-base {
	margin-top: 20rpx;
	width: calc(100% + 28rpx);
	height: 82rpx;
	background: var(--g-800);
	display: flex;
	align-items: center;
	justify-content: center;
}

.is-rank-1 .podium-base {
	height: 112rpx;
	background: linear-gradient(180deg, var(--gold) 0%, var(--gold-ink) 100%);
}

.is-rank-2 .podium-base {
	height: 94rpx;
	background: linear-gradient(180deg, var(--ink-3) 0%, var(--ink-2) 100%);
}

.is-rank-3 .podium-base {
	background: linear-gradient(180deg, var(--gold) 0%, var(--gold-ink) 100%);
}

.podium-base text {
	font-size: 42rpx;
	font-weight: 950;
	color: rgba(255, 255, 255, 0.86);
	font-variant-numeric: tabular-nums;
}

.reward-band {
	margin: 6rpx 28rpx 0;
	min-height: 150rpx;
	padding: 28rpx;
	border-radius: var(--r);
	background: linear-gradient(135deg, var(--g-800) 0%, var(--g-950) 100%);
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
}

.reward-copy {
	flex: 1;
	min-width: 0;
}

.reward-title {
	display: block;
	font-size: 31rpx;
	font-weight: 950;
	color: var(--gold-line);
}

.reward-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 23rpx;
	font-weight: 650;
	line-height: 1.45;
	color: rgba(251, 253, 249, 0.72);
}

.reward-stack {
	width: 142rpx;
	height: 82rpx;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8rpx;
	align-items: end;
	flex-shrink: 0;
}

.reward-stack text {
	height: 58rpx;
	border-radius: 16rpx 16rpx 10rpx 10rpx;
	background: var(--gold);
	color: var(--ink);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	font-weight: 950;
}

.reward-stack text:nth-child(1) {
	height: 76rpx;
}

.reward-stack text:nth-child(2) {
	height: 64rpx;
	background: var(--g-100);
}

.reward-stack text:nth-child(3) {
	height: 52rpx;
	background: var(--gold);
}

.action-grid {
	margin: 30rpx 28rpx 0;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 18rpx;
}

.action-tile {
	min-height: 182rpx;
	padding: 24rpx;
	border-radius: var(--r);
	background: var(--g-50);
	border: 1rpx solid rgba(17, 49, 40, 0.06);
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	transition: all 0.2s ease-out;
}

.action-tile:active,
.rank-row:active,
.dock-btn:active,
.nav-back:active,
.nav-rule:active {
	transform: scale(0.97);
	opacity: 0.9;
}

.action-tile.is-primary {
	background: var(--g-900);
	color: #fff;
	border-color: rgba(255, 227, 163, 0.18);
}

.tile-icon {
	width: 58rpx;
	height: 58rpx;
	border-radius: var(--r-sm);
	background: var(--g-50);
	position: relative;
}

.is-primary .tile-icon {
	background: rgba(255, 227, 163, 0.18);
}

.tile-icon::before,
.tile-icon::after {
	content: '';
	position: absolute;
	background: var(--g-800);
}

.is-primary .tile-icon::before,
.is-primary .tile-icon::after {
	background: var(--gold-line);
}

.tile-scale::before {
	left: 14rpx;
	right: 14rpx;
	top: 18rpx;
	height: 5rpx;
	border-radius: 99rpx;
}

.tile-scale::after {
	left: 25rpx;
	top: 14rpx;
	width: 6rpx;
	height: 28rpx;
	border-radius: 99rpx;
}

.tile-points::before {
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	left: 15rpx;
	top: 15rpx;
	background: transparent;
	border: 5rpx solid var(--gold-ink);
}

.tile-points::after {
	left: 27rpx;
	top: 20rpx;
	width: 5rpx;
	height: 18rpx;
	border-radius: 99rpx;
	background: var(--gold-ink);
	transform: rotate(90deg);
}

.tile-group::before {
	width: 18rpx;
	height: 18rpx;
	border-radius: 50%;
	left: 12rpx;
	top: 15rpx;
}

.tile-group::after {
	display: none;
}

.tile-mall::before {
	left: 13rpx;
	top: 19rpx;
	width: 32rpx;
	height: 24rpx;
	border-radius: var(--r-xs);
	background: transparent;
	border: 5rpx solid var(--g-800);
}

.tile-mall::after {
	left: 21rpx;
	top: 12rpx;
	width: 16rpx;
	height: 12rpx;
	border: 5rpx solid var(--g-800);
	border-bottom: 0;
	border-radius: 12rpx 12rpx 0 0;
	background: transparent;
}

.tile-title {
	margin-top: 8rpx;
	font-size: 29rpx;
	font-weight: 950;
	color: var(--ink);
}

.is-primary .tile-title {
	color: #fff;
}

.tile-desc {
	font-size: 22rpx;
	font-weight: 650;
	color: var(--ink-2);
	line-height: 1.35;
}

.is-primary .tile-desc {
	color: rgba(251, 253, 249, 0.66);
}

.leaderboard {
	padding: 0 0 8rpx;
}

.rank-row {
	min-height: 96rpx;
	padding: 18rpx 4rpx;
	display: flex;
	align-items: center;
	gap: 18rpx;
	border-bottom: 1rpx solid rgba(17, 49, 40, 0.06);
	transition: all 0.2s ease-out;
}

.rank-row:last-child {
	border-bottom: 0;
}

.rank-no {
	width: 42rpx;
	text-align: center;
	font-size: 27rpx;
	font-weight: 950;
	color: var(--ink-2);
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
}

.rank-avatar {
	width: 66rpx;
	height: 66rpx;
	border-radius: var(--r);
	background: var(--g-100);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.rank-avatar text {
	font-size: 27rpx;
	font-weight: 950;
	color: var(--ink);
}

.rank-copy {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 5rpx;
}

.rank-name {
	font-size: 27rpx;
	font-weight: 600;
	color: var(--ink);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.rank-sub {
	font-size: 21rpx;
	font-weight: 650;
	color: var(--ink-2);
}

.rank-value {
	min-width: 118rpx;
	display: flex;
	align-items: baseline;
	justify-content: flex-end;
	font-variant-numeric: tabular-nums;
}

.rank-value text:first-child {
	font-size: 31rpx;
	font-weight: 950;
	color: var(--ink);
}

.rank-unit {
	margin-left: 3rpx;
	font-size: 18rpx;
	font-weight: 600;
	color: var(--ink-2);
}

.empty-state {
	padding: 56rpx 0;
	text-align: center;
	color: var(--ink-2);
	font-size: 24rpx;
	font-weight: 500;
}

.rule-panel {
	padding: 26rpx 28rpx;
	border-radius: var(--r);
	background: var(--g-50);
	border: 1rpx solid rgba(17, 49, 40, 0.06);
}

.rule-title {
	display: block;
	font-size: 28rpx;
	font-weight: 950;
	color: var(--ink);
}

.rule-text {
	display: block;
	margin-top: 12rpx;
	font-size: 23rpx;
	font-weight: 650;
	color: var(--ink-2);
	line-height: 1.65;
}

.goal-dock {
	position: fixed;
	left: 28rpx;
	right: 28rpx;
	bottom: calc(24rpx + env(safe-area-inset-bottom));
	z-index: 50;
	min-height: 112rpx;
	padding: 18rpx 18rpx 18rpx 28rpx;
	border-radius: var(--r-lg);
	background: rgba(9, 35, 29, 0.94);
	border: 1rpx solid rgba(255, 227, 163, 0.18);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 22rpx;
}

.dock-copy {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 5rpx;
}

.dock-label {
	font-size: 20rpx;
	font-weight: 600;
	color: rgba(251, 253, 249, 0.54);
}

.dock-title {
	font-size: 28rpx;
	font-weight: 950;
	color: var(--gold-ink);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.dock-btn {
	height: 76rpx;
	min-width: 168rpx;
	padding: 0 34rpx;
	border-radius: var(--r);
	background: var(--g-600);
	color: var(--ink);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 950;
	transition: all 0.2s ease-out;
}

@media screen and (max-width: 360px) {
	.goal-hero {
		min-height: 724rpx;
		padding-left: 22rpx;
		padding-right: 22rpx;
	}

	.hero-copy {
		width: 470rpx;
		margin-top: 76rpx;
	}

	.hero-title {
		font-size: 56rpx;
	}

	.goal-summary,
	.target-row,
	.podium-section,
	.reward-band,
	.action-grid,
	.leaderboard,
	.rule-panel,
	.goal-dock {
		margin-left: 22rpx;
		margin-right: 22rpx;
	}

	.podium-stage {
		gap: 10rpx;
	}

	.podium-name {
		font-size: 22rpx;
	}

	.podium-score text:first-child {
		font-size: 30rpx;
	}
}
</style>

<style scoped>
.goal-page{min-height:100vh;padding:14rpx 20rpx calc(130rpx + env(safe-area-inset-bottom));box-sizing:border-box;background:#f7fbfb;color:#073f45;overflow-x:hidden}.goal-tabs{width:100%;height:66rpx;margin:0 0 16rpx;padding:5rpx;display:flex;box-sizing:border-box;border:1rpx solid #dbe7e6;border-radius:12rpx;background:#edf3f3}.goal-tab{flex:1;display:flex;align-items:center;justify-content:center;border-radius:9rpx;color:#738385;font-size:24rpx}.goal-tab.active{background:#fff;color:#153f42;font-weight:800;box-shadow:0 2rpx 7rpx rgba(10,64,65,.08)}.goal-panel{margin-top:14rpx;padding:20rpx;border:1rpx solid #cfe2e0;border-radius:15rpx;background:#fff}.goal-panel-head{display:flex;align-items:center;gap:12rpx}.goal-panel-title{font-size:28rpx;font-weight:800;color:#113f43}.target-icon{width:34rpx;height:34rpx;border:5rpx solid #0ba8a5;border-radius:50%;box-sizing:border-box;position:relative}.target-icon::before{content:'';position:absolute;left:6rpx;top:6rpx;width:8rpx;height:8rpx;border-radius:50%;background:#0ba8a5}.target-icon::after{content:'';position:absolute;right:-7rpx;top:-7rpx;width:14rpx;height:4rpx;border-radius:99rpx;background:#0ba8a5;transform:rotate(-45deg)}.current-rank{margin-left:auto;font-size:21rpx;color:#6a7d7f}.current-rank text{color:#09a4a1;font-size:27rpx;font-weight:800}.goal-metrics{display:grid;grid-template-columns:1fr 1fr;margin-top:16rpx;border:1rpx solid #dce7e6;border-radius:12rpx;overflow:hidden}.goal-metric{min-height:210rpx;padding:20rpx;box-sizing:border-box}.goal-metric+.goal-metric{border-left:1rpx solid #dce7e6}.metric-label,.metric-note{display:block}.metric-label{font-size:22rpx;color:#6d8082}.progress-number,.score-number{display:flex;align-items:baseline;margin:12rpx 0}.progress-number text:first-child{font-size:54rpx;line-height:1;color:#08aaa6;font-weight:800}.progress-number text:last-child{font-size:29rpx;color:#08aaa6;font-weight:700}.progress-track{height:12rpx;border-radius:99rpx;background:#e5eeee;overflow:hidden;margin-bottom:14rpx}.progress-track view{height:100%;border-radius:99rpx;background:#0aaaa6}.metric-note{font-size:20rpx;line-height:1.55;color:#637779}.score-number text:first-child{font-size:43rpx;line-height:1;color:#143f42;font-weight:800}.score-number text:last-child{margin-left:5rpx;font-size:20rpx;color:#617577}.score-divider{height:1rpx;background:#dce7e6;margin:17rpx 0 11rpx}.gap-number{display:block;margin-top:4rpx;color:#09a4a1;font-size:27rpx;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.advice-panel{padding:20rpx 22rpx}.advice-row{display:flex;align-items:center;gap:11rpx;margin-top:16rpx;color:#5d7173;font-size:22rpx}.check-dot{width:22rpx;height:22rpx;border:2rpx solid #0ba6a3;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0ba6a3;font-size:14rpx;font-weight:800;box-sizing:border-box}.small-note{font-size:20rpx;color:#76888a;font-weight:400}.rule-link{margin-left:auto;font-size:21rpx;color:#697d7f}.reward-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx;margin-top:16rpx}.reward-card{height:178rpx;padding:13rpx 8rpx 10rpx;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;border:1rpx solid #dce7e6;border-radius:11rpx;background:#fbfdfd}.reward-name{font-size:22rpx;font-weight:800}.trophy{width:52rpx;height:51rpx;margin-top:10rpx;border-radius:6rpx 6rpx 16rpx 16rpx;background:#e2a400;position:relative;display:flex;align-items:center;justify-content:center}.trophy::before,.trophy::after{content:'';position:absolute;top:7rpx;width:15rpx;height:22rpx;border:5rpx solid currentColor}.trophy::before{left:-15rpx;border-right:0;border-radius:12rpx 0 0 12rpx}.trophy::after{right:-15rpx;border-left:0;border-radius:0 12rpx 12rpx 0}.trophy text{color:#fff4c9;font-size:21rpx}.silver .trophy{background:#aebcbf;color:#aebcbf}.bronze .trophy{background:#bc784d;color:#bc784d}.gold .trophy{color:#e2a400}.reward-note{margin-top:auto;color:#65787a;font-size:17rpx;white-space:nowrap}.goal-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx;margin-top:18rpx}.goal-action{height:164rpx;padding:15rpx 8rpx;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;border:1rpx solid #dce7e6;border-radius:13rpx;background:#fff}.action-symbol{width:48rpx;height:48rpx;margin-bottom:8rpx;display:flex;align-items:center;justify-content:center;color:#0aa6a3;font-size:22rpx;font-weight:800;position:relative}.goal-action>text:nth-child(2){font-size:23rpx;font-weight:800}.goal-action>text:nth-child(3){margin-top:5rpx;font-size:18rpx;color:#728486}.scale-symbol{border:7rpx solid #0aa6a3;border-radius:50% 50% 11rpx 11rpx;box-sizing:border-box}.scale-symbol::after{content:'';position:absolute;top:9rpx;width:4rpx;height:13rpx;background:#0aa6a3;transform:rotate(30deg);transform-origin:bottom}.medal-symbol{border:6rpx solid #0aa6a3;border-radius:50%;box-sizing:border-box}.people-symbol::before,.people-symbol::after{content:'';position:absolute;border-radius:50%;background:#0aa6a3}.people-symbol::before{width:18rpx;height:18rpx;left:4rpx;top:5rpx;box-shadow:23rpx 3rpx 0 #0aa6a3}.people-symbol::after{left:0;right:0;bottom:4rpx;height:23rpx;border-radius:20rpx 20rpx 7rpx 7rpx}.goal-primary-btn{height:76rpx;margin-top:16rpx;display:flex;align-items:center;justify-content:center;border-radius:11rpx;background:#0bafab;color:#fff;font-size:28rpx;font-weight:800}.goal-rule-note{margin-top:14rpx;padding:15rpx 4rpx;color:#7e9091;font-size:19rpx;line-height:1.5}
.rule-panel-text{display:block;margin-top:14rpx;color:#607476;font-size:21rpx;line-height:1.7}
@media (max-height:700px){.goal-panel{padding:16rpx;margin-top:10rpx}.goal-metric{min-height:178rpx;padding:15rpx}.reward-card{height:150rpx}.goal-action{height:140rpx}.goal-primary-btn{height:68rpx}}
</style>
