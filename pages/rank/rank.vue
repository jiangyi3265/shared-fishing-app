<template>
	<view class="app rank-page has-brand-header">
		<brand-header title="钓王榜" theme="light" layout="compact" :back="true" />
		<view class="rank-hero">
			<view class="rank-hero-glow"></view>
			<view class="rank-tabs">
				<view class="rank-tab" :class="{ active: type === 'weight' }" @click="switchType('weight')">钓王榜</view>
				<view class="rank-tab" :class="{ active: type === 'points' }" @click="switchType('points')">积分榜</view>
			</view>
			<view class="rank-filter"><text>本月排行</text><text>{{ currentMonth }}</text></view>
			<view v-if="loading || loadError" class="rank-load-state" @click="load"><text>{{ loading ? '正在同步真实榜单…' : loadError + ' · 点击重试' }}</text></view>

			<view v-if="rows.length" class="podium">
				<view class="podium-col" v-if="podium[0]">
					<view class="podium-avatar rank2"><text class="podium-avatar-text">{{ avatarText(podium[0]) }}</text></view>
					<text class="podium-name">{{ podium[0].nickname }}</text>
					<view class="podium-stand stand-2">
						<text class="podium-rankno">2</text>
						<text class="podium-value">{{ formatValue(podium[0]) }}<text class="podium-unit">{{ unit }}</text></text>
					</view>
				</view>

				<view class="podium-col podium-first" v-if="podium[1]">
					<view class="podium-crown"></view>
					<view class="podium-avatar rank1"><text class="podium-avatar-text">{{ avatarText(podium[1]) }}</text></view>
					<text class="podium-name">{{ podium[1].nickname }}</text>
					<view class="podium-stand stand-1">
						<text class="podium-rankno">1</text>
						<text class="podium-value">{{ formatValue(podium[1]) }}<text class="podium-unit">{{ unit }}</text></text>
					</view>
				</view>

				<view class="podium-col" v-if="podium[2]">
					<view class="podium-avatar rank3"><text class="podium-avatar-text">{{ avatarText(podium[2]) }}</text></view>
					<text class="podium-name">{{ podium[2].nickname }}</text>
					<view class="podium-stand stand-3">
						<text class="podium-rankno">3</text>
						<text class="podium-value">{{ formatValue(podium[2]) }}<text class="podium-unit">{{ unit }}</text></text>
					</view>
				</view>
			</view>

		</view>

		<view v-if="rows.length" class="rank-list">
			<view class="rank-row" v-for="(r, i) in restList" :key="r.userId">
				<text class="rank-row-no">{{ i + 4 }}</text>
				<view class="rank-row-avatar"><text>{{ avatarText(r) }}</text></view>
				<view class="rank-row-copy">
					<text class="rank-row-name">{{ r.nickname }}</text>
					<text class="rank-row-sub">{{ subtitle(r) }}</text>
				</view>
				<text class="rank-row-value">{{ formatValue(r) }}<text class="rank-row-unit">{{ unit }}</text></text>
			</view>
			<view v-if="!restList.length" class="rank-empty"><text>暂无更多上榜数据</text></view>
		</view>
		<view v-else-if="!loading && !loadError" class="rank-empty standalone-empty"><text>本月还没有上榜记录，完成称鱼或积分任务后即可参与排行</text></view>

		<view class="rank-reward-callout">
			<view class="gift-icon"></view>
			<text>榜单仅展示后台审核后的真实称鱼与积分数据</text>
			<text class="callout-arrow">›</text>
		</view>

		<view class="rank-me">
			<view class="rank-me-info">
				<text class="rank-me-label">我的排名</text>
				<text class="rank-me-value">{{ myRankText }}</text>
			</view>
			<view class="rank-me-btn" @click="goFish">去钓鱼冲榜 ›</view>
		</view>
		<community-tabbar active="rank" />
	</view>
</template>

<script>
import { fetchLeaderboard, getUser, getCachedVenue, seedHomeIfAlone } from '../../utils/fishingStore.js'

export default {
	data() {
		return { type: 'weight', rows: [], user: null, loading: true, loadError: '' }
	},
	computed: {
		unit() { return this.type === 'weight' ? '斤' : '分' },
		podium() { return [this.rows[1], this.rows[0], this.rows[2]] },
		restList() { return this.rows.slice(3) },
		myRankText() {
			if (!this.user) return '登录后查看'
			const idx = this.rows.findIndex((r) => String(r.userId) === String(this.user.userId))
			return idx >= 0 ? '第 ' + (idx + 1) + ' 名' : '未上榜'
		},
		currentMonth() { const d = new Date(); return `${d.getFullYear()}年${d.getMonth() + 1}月` }
	},
	onShow() {
		if (seedHomeIfAlone('/pages/rank/rank')) return
		this.user = getUser()
		this.load()
	},
	methods: {
		load() {
			this.loading = true
			this.loadError = ''
			const cached = getCachedVenue()
			const venueId = cached && cached.venue ? cached.venue.venueId : null
			fetchLeaderboard(this.type, venueId).then((rows) => { this.rows = rows || [] }).catch((error) => {
				this.rows = []
				this.loadError = (error && (error.msg || error.message)) || '榜单加载失败'
			}).finally(() => { this.loading = false })
		},
		switchType(t) {
			if (this.type === t) return
			this.type = t
			this.load()
		},
		formatValue(r) {
			if (!r) return '0'
			if (this.type === 'weight') return (Number(r.weightGram || 0) / 500).toFixed(1)
			return String(r.points || 0)
		},
		subtitle(r) {
			if (this.type === 'weight') return '钓获 ' + (r.catchCount || 0) + ' 尾'
			return 'Lv.' + (r.level || 1)
		},
		avatarText(r) {
			const name = (r && r.nickname) || ''
			return name ? name.slice(0, 1) : '钓'
		},
		goFish() { uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) }) }
	}
}
</script>

<style scoped>
.rank-page {
	min-height: 100vh;
	padding-bottom: 200rpx;
	background: var(--bg);
}

/* ---------------- 顶部榜单 + 领奖台 ---------------- */
.rank-hero {
	position: relative;
	padding: 36rpx 32rpx 48rpx;
	background: linear-gradient(160deg, var(--g-900) 0%, var(--g-950) 60%, var(--g-950) 100%);
	border-bottom-left-radius: 48rpx;
	border-bottom-right-radius: 48rpx;
	overflow: hidden;
}

.rank-hero-glow {
	position: absolute;
	top: -160rpx;
	left: 50%;
	width: 620rpx;
	height: 620rpx;
	margin-left: -310rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(199, 154, 57, 0.28) 0%, rgba(199, 154, 57, 0) 62%);
	pointer-events: none;
}

.rank-tabs {
	position: relative;
	z-index: 2;
	align-self: center;
	margin: 0 auto;
	width: 380rpx;
	height: 68rpx;
	display: flex;
	padding: 6rpx;
	border-radius: 99rpx;
	background: rgba(255, 255, 255, 0.1);
	border: 1rpx solid rgba(245, 210, 133, 0.2);
}

.rank-tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 99rpx;
	font-size: 26rpx;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.7);
	transition: all 0.2s ease;
}

.rank-tab.active {
	background: var(--g-600);
	color: #fff;
}

.rank-title {
	position: relative;
	z-index: 2;
	display: block;
	text-align: center;
	margin-top: 30rpx;
	font-size: 44rpx;
	font-weight: 600;
	color: var(--gold-line);
	letter-spacing: 4rpx;
}

.rank-sub {
	position: relative;
	z-index: 2;
	display: block;
	text-align: center;
	margin-top: 12rpx;
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.55);
	font-weight: 600;
}

.podium {
	position: relative;
	z-index: 2;
	margin-top: 44rpx;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: 16rpx;
}

.podium-col {
	flex: 1;
	max-width: 210rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.podium-crown {
	font-size: 40rpx;
	line-height: 1;
	margin-bottom: 6rpx;
	animation: crown-bob 2.2s ease-in-out infinite;
}

@keyframes crown-bob {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-8rpx); }
}

.podium-avatar {
	width: 108rpx;
	height: 108rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 4rpx solid rgba(255, 255, 255, 0.25);
}

.podium-first .podium-avatar {
	width: 132rpx;
	height: 132rpx;
}

.podium-avatar-text {
	font-size: 44rpx;
	font-weight: 600;
	color: #ffffff;
}

.podium-avatar.rank1 {
	background: linear-gradient(135deg, var(--gold) 0%, var(--gold) 100%);
	border-color: var(--gold-line);
}

.podium-avatar.rank2 {
	background: linear-gradient(135deg, var(--bg) 0%, var(--ink-4) 100%);
	border-color: var(--surface-2);
}

.podium-avatar.rank3 {
	background: linear-gradient(135deg, var(--gold-line) 0%, var(--gold) 100%);
	border-color: var(--gold-line);
}

.podium-name {
	margin-top: 14rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: #ffffff;
	max-width: 190rpx;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.podium-stand {
	margin-top: 16rpx;
	width: 100%;
	border-radius: 20rpx 20rpx 0 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	border: 1rpx solid rgba(245, 210, 133, 0.18);
	border-bottom: 0;
}

.stand-1 {
	height: 168rpx;
	background: linear-gradient(180deg, rgba(245, 210, 133, 0.28) 0%, rgba(199, 154, 57, 0.08) 100%);
}

.stand-2 {
	height: 124rpx;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 100%);
}

.stand-3 {
	height: 96rpx;
	background: linear-gradient(180deg, rgba(232, 176, 136, 0.2) 0%, rgba(193, 125, 74, 0.05) 100%);
}

.podium-rankno {
	font-size: 40rpx;
	font-weight: 600;
	color: var(--gold-line);
	line-height: 1;
}

.stand-2 .podium-rankno, .stand-3 .podium-rankno {
	color: rgba(255, 255, 255, 0.85);
}

.podium-value {
	font-size: 26rpx;
	font-weight: 600;
	color: #ffffff;
	font-variant-numeric: tabular-nums;
}

.podium-unit {
	font-size: 18rpx;
	font-weight: 500;
	color: rgba(255, 255, 255, 0.7);
	margin-left: 2rpx;
}

/* ---------------- 上榜奖励 ---------------- */
.rank-rewards {
	position: relative;
	z-index: 2;
	margin-top: 38rpx;
	display: flex;
	gap: 12rpx;
}

.reward-chip {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	padding: 18rpx 8rpx;
	border-radius: var(--r-sm);
	background: rgba(255, 255, 255, 0.06);
	border: 1rpx solid rgba(245, 210, 133, 0.16);
}

.reward-rank {
	font-size: 22rpx;
	font-weight: 600;
	padding: 3rpx 18rpx;
	border-radius: 99rpx;
}

.rank-gold { color: #12383a; background: linear-gradient(135deg, var(--gold), var(--gold)); }
.rank-silver { color: var(--ink); background: linear-gradient(135deg, var(--bg), var(--ink-4)); }
.rank-bronze { color: #ffffff; background: linear-gradient(135deg, #f2a516, #b96800); }

.reward-text {
	font-size: 19rpx;
	color: rgba(255, 255, 255, 0.72);
	font-weight: 600;
	text-align: center;
	line-height: 1.35;
}

/* ---------------- 榜单列表 ---------------- */
.rank-list {
	margin: 28rpx 28rpx 0;
	padding: 8rpx 8rpx;
	background: var(--surface);
	border: 1rpx solid var(--border-color);
	border-radius: var(--r);
}

.rank-row {
	display: flex;
	align-items: center;
	gap: 22rpx;
	padding: 22rpx 20rpx;
	border-bottom: 1rpx solid var(--border-color);
}

.rank-row:last-child {
	border-bottom: 0;
}

.rank-row:active {
	background: var(--surface-soft);
}

.rank-row-no {
	width: 46rpx;
	text-align: center;
	font-size: 30rpx;
	font-weight: 600;
	color: var(--text-light);
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
}

.rank-row-avatar {
	width: 74rpx;
	height: 74rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, var(--g-700) 0%, var(--g-800) 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.rank-row-avatar text {
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
}

.rank-row-copy {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.rank-row-name {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-main);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.rank-row-sub {
	font-size: 22rpx;
	color: var(--text-muted);
	font-weight: 600;
}

.rank-row-value {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--jade);
	font-variant-numeric: tabular-nums;
	flex-shrink: 0;
}

.rank-row-unit {
	font-size: 20rpx;
	font-weight: 500;
	color: var(--text-light);
	margin-left: 2rpx;
}

.rank-empty {
	text-align: center;
	padding: 60rpx 0;
	color: var(--text-light);
	font-size: 26rpx;
}

/* ---------------- 规则 ---------------- */
.rank-rule {
	margin: 24rpx 28rpx 0;
	padding: 28rpx;
	background: var(--surface);
	border: 1rpx solid var(--border-color);
	border-radius: var(--r);
}

.rank-rule-title {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: var(--text-main);
	margin-bottom: 12rpx;
}

.rank-rule-text {
	display: block;
	font-size: 23rpx;
	color: var(--text-muted);
	line-height: 1.7;
	font-weight: 500;
}

/* ---------------- 我的排名（悬浮底栏）---------------- */
.rank-me {
	position: fixed;
	left: 28rpx;
	right: 28rpx;
	bottom: calc(24rpx + env(safe-area-inset-bottom));
	height: 108rpx;
	padding: 0 20rpx 0 34rpx;
	border-radius: var(--r-lg);
	background: linear-gradient(135deg, var(--g-900) 0%, var(--g-950) 100%);
	border: 1rpx solid rgba(245, 210, 133, 0.2);
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.rank-me-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.rank-me-label {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.6);
	font-weight: 600;
}

.rank-me-value {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--gold-line);
}

.rank-me-btn {
	padding: 16rpx 32rpx;
	border-radius: 99rpx;
	background: var(--g-600);
	color: #fff;
	font-size: 26rpx;
	font-weight: 600;
}

.rank-me-btn:active {
	transform: scale(0.96);
}
</style>

<style scoped>
.rank-page{padding-bottom:calc(124rpx + env(safe-area-inset-bottom));background:#f7fbfb;color:#073f45}.rank-hero{margin:0 20rpx;padding:14rpx 0 0;background:transparent;border-radius:0;overflow:visible}.rank-hero-glow{display:none}.rank-tabs{width:100%;height:68rpx;padding:5rpx;box-sizing:border-box;border:1rpx solid #dce8e7;background:#eef4f4;border-radius:13rpx}.rank-tab{color:#6f8082;border-radius:10rpx;font-size:25rpx}.rank-tab.active{background:#fff;color:#153f43;box-shadow:0 2rpx 6rpx rgba(10,65,67,.08)}.rank-filter{display:flex;align-items:center;justify-content:space-between;margin-top:18rpx;font-size:23rpx;color:#607476}.rank-filter text:first-child{padding:10rpx 16rpx;border-radius:10rpx;background:#ebf2f2;color:#244e51}.rank-title,.rank-sub,.rank-rewards{display:none}.podium{height:340rpx;margin:14rpx 0 0;gap:0;align-items:flex-end}.podium-col{max-width:none}.podium-avatar{width:92rpx;height:92rpx;background:#cce8e8;border:4rpx solid #8abfc0;box-shadow:none}.podium-avatar.rank1{width:110rpx;height:110rpx;border-color:#eda900;background:#f2dfb6}.podium-avatar.rank3{border-color:#d68762;background:#f4ddd2}.podium-avatar-text{color:#174b4e;font-size:33rpx}.podium-name{font-size:23rpx;color:#173f42;margin-top:8rpx}.podium-first{transform:none}.podium-crown{width:38rpx;height:26rpx;margin-bottom:6rpx;position:relative;background:#eca600;clip-path:polygon(0 100%,0 18%,28% 54%,50% 0,72% 54%,100% 18%,100% 100%)}.podium-stand{width:100%;margin-top:8rpx;border-radius:15rpx 15rpx 0 0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:12rpx;box-sizing:border-box}.stand-2{height:136rpx;background:#d7f2f3}.stand-1{height:190rpx;background:#fff0cd;border:1rpx solid #e6b550}.stand-3{height:126rpx;background:#f9e2d8}.podium-rankno{order:2;font-size:29rpx;color:#718082}.podium-value{font-size:27rpx;color:#163f42}.podium-unit{font-size:18rpx}.rank-list{margin:0 20rpx;padding:0 20rpx;border-radius:0 0 14rpx 14rpx;border:1rpx solid #dbe7e6;border-top:0;background:#fff;box-shadow:none}.rank-row{height:74rpx;padding:0;border-bottom:1rpx solid #e1eae9}.rank-row-no{font-size:24rpx;color:#173f42}.rank-row-avatar{width:46rpx;height:46rpx;background:#dcefee}.rank-row-avatar text{font-size:20rpx}.rank-row-name{font-size:24rpx;color:#153f42}.rank-row-sub{font-size:18rpx}.rank-row-value{font-size:26rpx;color:#173f42}.rank-row-unit{font-size:17rpx}.rank-reward-callout{height:94rpx;margin:22rpx 20rpx 0;padding:0 22rpx;display:flex;align-items:center;gap:18rpx;border:1rpx solid #eed8a1;border-radius:14rpx;background:#fffaf0;color:#264a4c;font-size:25rpx}.gift-icon{width:44rpx;height:38rpx;border-radius:5rpx;background:#efa900;position:relative}.gift-icon::before{content:'';position:absolute;left:19rpx;top:-9rpx;width:7rpx;height:54rpx;background:#fff3cc}.gift-icon::after{content:'';position:absolute;left:-4rpx;top:7rpx;width:52rpx;height:7rpx;background:#fff3cc}.callout-arrow{margin-left:auto;font-size:34rpx}.rank-me{position:static;margin:18rpx 20rpx 0;padding:0;background:transparent;box-shadow:none}.rank-me-info{display:none}.rank-me-btn{width:100%;height:84rpx;border-radius:12rpx;display:flex;align-items:center;justify-content:center;background:#0bafab;color:#fff;font-size:29rpx;font-weight:800}.rank-empty{padding:34rpx 0;text-align:center;color:#879899;font-size:22rpx}
.rank-load-state{height:120rpx;margin-top:14rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid #dce8e7;border-radius:12rpx;background:#fff;color:#687d7f;font-size:22rpx}.rank-reward-callout text:nth-child(2){flex:1;font-size:21rpx;line-height:1.5}
.standalone-empty{margin:16rpx 20rpx 0;padding:54rpx 32rpx;border:1rpx solid #dce8e7;border-radius:13rpx;background:#fff;line-height:1.7}
@media (max-height:700px){.podium{height:300rpx}.stand-1{height:160rpx}.stand-2{height:116rpx}.stand-3{height:108rpx}.rank-row{height:66rpx}}
</style>
