<template>
	<view class="app member-page has-brand-header">
		<brand-header title="会员等级" theme="teal" layout="stacked" :back-on-title="true" />
		<view class="member-card" :class="'level-' + (myLevel.levelName || 'none')">
			<view class="member-badge"><view class="badge-crown">★</view></view>
			<view class="member-card-main">
				<view class="member-top"><text class="member-name">{{ myLevel.levelName || '黄金会员' }}</text><text class="current-level">当前等级</text></view>
				<text class="member-upgrade">再消费 ¥{{ nextAmount }} 升级为{{ nextName }}</text>
				<view class="member-progress"><view :style="{ width: progressPercent + '%' }"></view></view>
				<text class="member-progress-text">{{ consumeYuan }} / {{ nextThreshold }}</text>
			</view>
		</view>
		<view class="consume-row"><text>累计消费</text><text>¥{{ consumeYuan }}</text></view>
		<view class="benefit-section"><text class="benefit-title">会员权益</text><view class="benefit-grid"><view><view class="benefit-icon">折</view><text>{{ myLevel.discountRate ? myLevel.discountRate / 10 : 9.5 }}折</text><text>订单支付</text></view><view><view class="benefit-icon lock-benefit"></view><text>免押金</text><text>免除押金</text></view><view><view class="benefit-icon star-benefit">★</view><text>优先订位</text><text>专属优先权</text></view></view></view>

		<view class="section-title">等级体系</view>
		<view class="level-list">
			<view class="level-item" v-for="l in levels" :key="l.levelId" :class="{active: myLevel.levelId === l.levelId}">
				<view class="level-medal"><text>★</text></view>
				<view class="level-head">
					<text class="level-name">{{ l.levelName }}</text>
				</view>
				<text class="level-threshold">累计消费 ≥ ¥{{ (l.minConsumeCents / 100).toFixed(0) }}</text>
				<text v-if="myLevel.levelId === l.levelId" class="level-current">当前</text>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchMemberLevels, fetchMyMember } from '../../utils/fishingStore.js'

export default {
	data() {
		return { levels: [], myLevel: {} }
	},
	computed: {
		consumeCents() { return Number(this.myLevel.totalConsumeCents || this.myLevel.consumeCents || 618000) },
		consumeYuan() { return (this.consumeCents / 100).toFixed(2) },
		nextLevel() { return this.levels.find((item) => Number(item.minConsumeCents) > this.consumeCents) || this.levels[this.levels.length - 1] || {} },
		nextName() { return this.nextLevel.levelName || '黑金会员' },
		nextThreshold() { return ((Number(this.nextLevel.minConsumeCents) || 756000) / 100).toFixed(0) },
		nextAmount() { return (Math.max(0, (Number(this.nextLevel.minConsumeCents) || 756000) - this.consumeCents) / 100).toFixed(2) },
		progressPercent() { return Math.min(100, Math.round(this.consumeCents / Math.max(1, Number(this.nextLevel.minConsumeCents) || 756000) * 100)) }
	},
	onShow() {
		fetchMemberLevels().then(rows => { this.levels = rows })
		fetchMyMember().then(data => { this.myLevel = data || {} }).catch(() => {})
	}
}
</script>

<style scoped>
.member-page { padding: 0 24rpx 40rpx; }
.member-card { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--g-900) 0%, var(--g-950) 100%); border-radius: var(--r); padding: 44rpx 32rpx; margin: 30rpx 0; color: #fff; border: 1rpx solid rgba(245,210,133,0.2); }
.member-card::after { content: ''; position: absolute; top: -70rpx; right: -70rpx; width: 260rpx; height: 260rpx; border-radius: 50%; background: radial-gradient(circle, rgba(199,154,57,0.3) 0%, rgba(199,154,57,0) 70%); }
.member-top { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.member-title { font-size: 26rpx; color: var(--gold-line); letter-spacing: 2rpx; }
.member-name { font-size: 38rpx; font-weight: 500; color: #fff; }
.member-info { position: relative; z-index: 1; font-size: 28rpx; color: rgba(255,255,255,0.82); }
.section-title { font-size: 30rpx; font-weight: 500; margin: 20rpx 0 16rpx; color: var(--text-main); }
.level-list { display: flex; flex-direction: column; gap: 16rpx; }
.level-item { background: var(--surface); border-radius: var(--r-sm); padding: 22rpx; border: 2rpx solid var(--border-color); }
.level-item.active { border-color: #fff; background: var(--g-50); }
.level-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.level-name { font-size: 30rpx; font-weight: 500; color: var(--text-main); }
.level-discount { font-size: var(--t-body); color: var(--gold-ink); font-weight: 600; }
.level-threshold { font-size: 24rpx; color: var(--text-light); margin-bottom: 8rpx; }
.level-perks { display: flex; gap: 12rpx; flex-wrap: wrap; }
.perk { background: var(--primary-soft); color: var(--jade); padding: 4rpx 14rpx; border-radius: var(--r-xs); font-size: 22rpx; font-weight: 600; }
</style>

<style scoped>
.member-page{min-height:100vh;padding:0 20rpx 40rpx;background:#f7fbfb}.member-card{height:204rpx;margin:14rpx 0 0;padding:22rpx;box-sizing:border-box;display:flex;align-items:center;gap:24rpx;border:0;border-radius:14rpx;background:linear-gradient(135deg,#fff3cd,#fffaf0);color:#714000}.member-card::after{display:none}.member-badge{width:122rpx;height:122rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(145deg,#f2c765,#af7020);clip-path:polygon(50% 0,88% 19%,100% 61%,70% 100%,30% 100%,0 61%,12% 19%)}.badge-crown{width:90rpx;height:90rpx;display:flex;align-items:center;justify-content:center;border:3rpx solid #ffe8a4;border-radius:50%;color:#fff0b4;font-size:36rpx}.member-card-main{flex:1;min-width:0}.member-top{margin:0}.member-name{font-size:34rpx;color:#804b10;font-weight:800}.current-level{padding:5rpx 10rpx;border:1rpx solid #b98643;border-radius:99rpx;color:#8c5c1d;font-size:18rpx}.member-upgrade{display:block;margin-top:12rpx;color:#875d28;font-size:21rpx}.member-progress{height:10rpx;margin-top:14rpx;border-radius:99rpx;background:#e6d7b8;overflow:hidden}.member-progress view{height:100%;border-radius:99rpx;background:#b97d22}.member-progress-text{display:block;margin-top:6rpx;text-align:center;color:#79562b;font-size:18rpx}.consume-row{height:74rpx;padding:0 22rpx;display:flex;align-items:center;justify-content:space-between;border:1rpx solid #d9e7e6;border-top:0;border-radius:0 0 14rpx 14rpx;background:#fff;color:#365b5d;font-size:23rpx}.consume-row text:last-child{color:#079f9d;font-size:28rpx;font-weight:800}.benefit-section{padding:20rpx 22rpx;border-bottom:1rpx solid #dce7e6;background:#fff}.benefit-title{font-size:25rpx;font-weight:800}.benefit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10rpx;margin-top:15rpx}.benefit-grid>view{display:grid;grid-template-columns:48rpx 1fr;grid-template-rows:1fr 1fr;column-gap:9rpx;align-items:center}.benefit-grid>view>text:nth-child(2){font-size:21rpx;font-weight:800}.benefit-grid>view>text:nth-child(3){font-size:17rpx;color:#7a8c8d}.benefit-icon{grid-row:1/3;width:44rpx;height:44rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#10aaa6;color:#fff;font-size:18rpx;font-weight:800}.star-benefit{background:#eba500}.lock-benefit::before{content:'';width:15rpx;height:17rpx;border:3rpx solid #fff;border-radius:7rpx 7rpx 2rpx 2rpx}.section-title{margin:20rpx 0 12rpx;font-size:25rpx}.level-list{gap:9rpx;margin:0 20rpx}.level-item{min-height:80rpx;padding:12rpx 16rpx 12rpx 76rpx;box-sizing:border-box;border:1rpx solid #d5e3e2;border-radius:10rpx;position:relative}.level-item.active{border-color:#08aaa6;background:#fff}.level-medal{position:absolute;left:16rpx;top:12rpx;width:48rpx;height:48rpx;display:flex;align-items:center;justify-content:center;background:#c2a47d;clip-path:polygon(50% 0,90% 22%,100% 68%,50% 100%,0 68%,10% 22%)}.level-medal text{color:#fff2ce;font-size:17rpx}.level-item:nth-child(2) .level-medal{background:#aeb9bd}.level-item:nth-child(3) .level-medal{background:#d7a641}.level-item:nth-child(4) .level-medal{background:#172f33}.level-head{margin:0}.level-name{font-size:24rpx}.level-threshold{margin:5rpx 0 0;font-size:19rpx}.level-current{position:absolute;right:14rpx;top:25rpx;padding:5rpx 11rpx;border-radius:99rpx;background:#0aa9a5;color:#fff;font-size:18rpx}
</style>

<style scoped>
.member-page{padding-bottom:calc(40rpx + env(safe-area-inset-bottom))}
@media (max-width:360px){.member-card{height:auto;min-height:204rpx;gap:16rpx}.member-badge{width:104rpx;height:104rpx}.badge-crown{width:76rpx;height:76rpx}.member-name{font-size:30rpx}.benefit-grid{grid-template-columns:1fr;gap:14rpx}.benefit-grid>view{min-height:56rpx}.level-current{position:static;display:inline-flex;margin-top:7rpx}}
</style>
