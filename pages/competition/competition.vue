<template>
	<view class="app comp-page has-brand-header">
		<brand-header title="钓王争霸" theme="light" layout="compact" :back="true" />
		<view v-if="loading" class="empty">
			<view class="empty-mark loading-mark"><view class="loading-ring"></view></view>
			<text class="empty-title">正在读取赛事</text>
			<text class="empty-desc">报名信息和奖池马上就来</text>
		</view>
		<view v-else-if="list.length===0" class="empty">
			<view class="empty-mark"><view class="empty-trophy">1</view></view>
			<text class="empty-title">{{ loadError ? '赛事暂时加载失败' : '本期赛事正在筹备' }}</text>
			<text class="empty-desc">{{ loadError || '开放报名后会在这里展示赛制、名额和报名费用' }}</text>
			<view class="empty-retry" @click="loadData">重新加载</view>
		</view>
		<view v-if="featured" class="featured-comp">
			<image class="featured-photo" src="/static/hero-fishing-v2.jpg" mode="aspectFill" />
			<view class="featured-shade"></view>
			<view class="official-tag">官方赛</view>
			<view class="featured-copy">
				<text class="featured-title">{{ featured.title }}</text>
				<text>▣ {{ featured.compDate }}（周日）</text>
				<text>⌖ 共享钓场 · A区</text>
				<text>¥ 报名费：¥{{ featured.entryFeeCents ? (featured.entryFeeCents/100).toFixed(0) : '0' }}</text>
				<text>♙ 剩余名额：{{ featured.entryCount || 0 }}/{{ featured.maxPlayers || 50 }}</text>
			</view>
		</view>
		<view v-if="featured" class="featured-rules">
			<text class="rules-title">赛事规则（简要）</text>
			<text>✓ 3.6米及以下手竿，单钩单线</text>
			<text>✓ 尾数重量计成绩，按总重排名</text>
			<text>✓ 禁止红虫、活饵，限提倡/拉饵</text>
			<text>✓ 比赛时长4小时，中途不得换位</text>
		</view>
		<view v-if="featured" class="featured-actions">
			<view class="feature-btn primary" @click="doEnter(featured)"><view class="cup-mini"></view><text>立即报名</text></view>
			<view class="feature-btn" @click="showRank(featured)"><view class="bars-mini"></view><text>排行榜</text></view>
		</view>
		<view v-if="list.length" class="list-head"><text>赛事列表</text></view>
		<view v-if="list.length" class="comp-tabs"><text class="active">全部</text><text>报名中</text><text>进行中</text><text>已结束</text></view>
		<view class="comp-list">
			<view class="comp-card" v-for="c in list" :key="c.compId" @click="goDetail(c)">
				<image class="comp-thumb" src="/static/hero-lake.jpg" mode="aspectFill" />
				<view class="comp-card-main">
					<view class="comp-top"><text class="comp-title">{{ c.title }}</text><text class="comp-status" :class="'s'+c.status">{{ statusMap[c.status] }}</text></view>
					<view class="comp-meta"><text>{{ c.compDate }}　{{ c.timeSlot }}</text><text>共享钓场 · A区</text></view>
					<text class="comp-count">{{ c.entryCount || 0 }}/{{ c.maxPlayers || 50 }}</text>
				</view>
			</view>
		</view>

		<!-- 排行榜弹窗 -->
		<view v-if="showRanking" class="ranking-mask" @click.self="showRanking=false">
			<view class="ranking-panel">
				<text class="ranking-title">排行榜</text>
				<view class="ranking-list">
					<view class="ranking-item" v-for="(e,i) in ranking" :key="e.entryId">
						<text class="rank-num" :class="'rank-num-'+(i+1)">{{ i+1 }}</text>
						<text class="rank-name">{{ e.nickname }}</text>
						<text class="rank-weight">{{ (e.weightGram/1000).toFixed(2) }}kg</text>
						<text class="rank-prize" v-if="e.prizeCents">¥{{ (e.prizeCents/100).toFixed(0) }}</text>
					</view>
				</view>
			</view>
		</view>
		<community-tabbar active="rank" />
	</view>
</template>

<script>
import { fetchCompetitionList, fetchCompetitionRanking, enterCompetition, getCachedVenue } from '../../utils/fishingStore.js'
export default {
	data() {
		return {
			list: [], ranking: [], showRanking: false, loading: true, loadError: '',
			statusMap: {0:'报名中',1:'进行中',2:'称重中',3:'已结束',4:'已取消'}
		}
	},
	computed: {
		featured() { return this.list[0] || null }
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			this.loadError = ''
			const cached = getCachedVenue()
			fetchCompetitionList(cached && cached.venue ? cached.venue.venueId : null)
				.then(rows => { this.list = Array.isArray(rows) ? rows : [] })
				.catch((e) => {
					this.list = []
					this.loadError = (e && (e.msg || e.message)) || '请检查网络后重试'
				})
				.finally(() => { this.loading = false })
		},
		goDetail(c) {
			if (c.status >= 2) {
				fetchCompetitionRanking(c.compId).then(rows => { this.ranking = rows; this.showRanking = true })
			}
		},
		showRank(c) {
			fetchCompetitionRanking(c.compId).then(rows => { this.ranking = rows; this.showRanking = true })
		},
		getErrorMessage(error) {
			return (error && (error.msg || error.message || error.errMsg)) || '报名失败，请稍后再试'
		},
		isBalanceInsufficient(error) {
			const message = this.getErrorMessage(error)
			return message.includes('余额不足') || message.includes('储值余额不足')
		},
		showRechargePrompt(c) {
			const fee = Number(c && c.entryFeeCents) || 0
			const feeText = fee > 0 ? `本次报名费为 ¥${(fee / 100).toFixed(2)}，` : ''
			uni.showModal({
				title: '余额不足',
				content: `${feeText}当前账户余额不足，请先充值后再报名。`,
				cancelText: '暂不充值',
				confirmText: '去充值',
				success: res => {
					if (res.confirm) uni.navigateTo({ url: '/pages/wallet/recharge' })
				}
			})
		},
		doEnter(c) {
			uni.showModal({ title: '报名比赛', content: `确认报名「${c.title}」？${c.entryFeeCents?'报名费¥'+(c.entryFeeCents/100).toFixed(2):'免费'}`, success: res => {
				if (!res.confirm) return
				enterCompetition(c.compId, {}, { showError: false })
					.then(() => {
						uni.showToast({ title: '报名成功', icon: 'success' })
						this.loadData()
					})
					.catch(error => {
						if (this.isBalanceInsufficient(error)) {
							this.showRechargePrompt(c)
							return
						}
						uni.showToast({ title: this.getErrorMessage(error), icon: 'none' })
					})
			}})
		}
	}
}
</script>

<style scoped>
.comp-page { padding: 0 28rpx 40rpx; }
.page-head { padding: 36rpx 4rpx 20rpx; }
.page-head-title { font-size: 40rpx; font-weight: 600; color: var(--text-main); }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: var(--text-light); }
.comp-list { display: flex; flex-direction: column; gap: 20rpx; }
.comp-card { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: var(--r); padding: 28rpx; position: relative; }
.comp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; gap: 16rpx; }
.comp-title { font-size: 31rpx; font-weight: 600; color: var(--text-main); flex: 1; }
.comp-status { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 99rpx; background: var(--success-bg); color: var(--success); font-weight: 500; flex-shrink: 0; }
.comp-status.s3 { background: var(--info-bg); color: var(--info); }
.comp-meta { font-size: 24rpx; color: var(--text-muted); display: flex; gap: 20rpx; margin-bottom: 14rpx; }
.comp-bottom { display: flex; justify-content: space-between; align-items: center; }
.comp-prize { font-size: 30rpx; color: var(--gold); font-weight: 600; }
.comp-count { font-size: 24rpx; color: var(--text-muted); }
.comp-enter { position: absolute; right: 28rpx; bottom: 28rpx; background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; padding: 12rpx 30rpx; border-radius: 99rpx; font-size: 24rpx; font-weight: 600; }
.ranking-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(6,26,20,0.55); display: flex; align-items: center; justify-content: center; z-index: 999; }
.ranking-panel { background: var(--surface); width: 85%; border-radius: var(--r-lg); padding: 44rpx 32rpx; max-height: 70vh; overflow-y: auto; }
.ranking-title { font-size: 36rpx; font-weight: 600; color: var(--text-main); display: block; text-align: center; margin-bottom: 28rpx; }
.ranking-list { display: flex; flex-direction: column; gap: 4rpx; }
.ranking-item { display: flex; align-items: center; padding: 18rpx 8rpx; border-bottom: 1rpx solid var(--border-color); }
.ranking-item:last-child { border-bottom: 0; }
.rank-num { width: 54rpx; height: 54rpx; margin-right: 16rpx; text-align: center; line-height: 54rpx; font-size: 26rpx; font-weight: 600; color: var(--text-light); border-radius: 50%; flex-shrink: 0; }
.rank-num-1 { background: linear-gradient(135deg,var(--gold),var(--gold)); color: #12383a; }
.rank-num-2 { background: linear-gradient(135deg,var(--bg),var(--ink-4)); color: var(--ink); }
.rank-num-3 { background: linear-gradient(135deg,#f2a516,#b96800); color: #fff; }
.rank-name { flex: 1; font-size: 28rpx; font-weight: 500; color: var(--text-main); }
.rank-weight { font-size: 27rpx; font-weight: 600; color: var(--jade); margin-right: 16rpx; font-variant-numeric: tabular-nums; }
.rank-prize { font-size: 24rpx; color: var(--gold); font-weight: 600; }
</style>

<style>
.comp-page .empty{margin:18rpx 0 0;padding:82rpx 36rpx 92rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid #dce9e8;border-radius:18rpx;background:#fff}.comp-page .empty-desc{max-width:480rpx}.comp-page .loading-mark{display:flex;align-items:center;justify-content:center}.comp-page .loading-ring{width:42rpx;height:42rpx;border:6rpx solid #d9efed;border-top-color:#0caaa6;border-radius:50%;animation:comp-spin .8s linear infinite}.comp-page .empty-retry{margin-top:28rpx;min-width:210rpx;height:72rpx;display:flex;align-items:center;justify-content:center;border-radius:12rpx;background:#0bafab;color:#fff;font-size:26rpx;font-weight:700}@keyframes comp-spin{to{transform:rotate(360deg)}}
</style>

<style scoped>
.comp-page{min-height:100vh;padding:14rpx 20rpx calc(126rpx + env(safe-area-inset-bottom));background:#f8fbfb;color:#073f45}.featured-comp{position:relative;height:310rpx;overflow:hidden;border-radius:14rpx 14rpx 0 0}.featured-photo,.featured-shade{position:absolute;inset:0;width:100%;height:100%}.featured-shade{background:linear-gradient(90deg,rgba(0,121,119,.98) 0%,rgba(0,124,122,.75) 47%,rgba(0,56,58,.05) 100%)}.official-tag{position:absolute;z-index:2;right:14rpx;top:12rpx;padding:7rpx 12rpx;border-radius:7rpx;background:#ffe19a;color:#8b5b00;font-size:19rpx}.featured-copy{position:absolute;z-index:2;left:24rpx;top:22rpx;display:flex;flex-direction:column;gap:10rpx;color:#fff;font-size:23rpx}.featured-title{font-size:37rpx;font-weight:800;margin-bottom:5rpx}.featured-rules{padding:20rpx 22rpx;display:flex;flex-direction:column;gap:9rpx;border:1rpx solid #dce7e6;border-top:0;border-radius:0 0 14rpx 14rpx;background:#fff;color:#5e7274;font-size:22rpx}.rules-title{color:#153f42;font-size:26rpx;font-weight:800;margin-bottom:2rpx}.featured-actions{display:grid;grid-template-columns:1fr 1fr;gap:15rpx;margin-top:16rpx}.feature-btn{height:76rpx;display:flex;align-items:center;justify-content:center;gap:12rpx;border:1rpx solid #0ba6a3;border-radius:11rpx;background:#fff;color:#099b98;font-size:27rpx;font-weight:800}.feature-btn.primary{background:#0bafab;color:#fff}.cup-mini{width:27rpx;height:25rpx;border-radius:3rpx 3rpx 10rpx 10rpx;background:currentColor;position:relative}.bars-mini{width:31rpx;height:31rpx;border-left:7rpx solid currentColor;border-right:7rpx solid currentColor;position:relative}.bars-mini::after{content:'';position:absolute;left:5rpx;bottom:0;width:7rpx;height:23rpx;background:currentColor}.list-head{margin-top:22rpx;font-size:29rpx;font-weight:800}.comp-tabs{height:64rpx;display:flex;align-items:center;justify-content:space-around;color:#637779;font-size:22rpx}.comp-tabs text{height:64rpx;display:flex;align-items:center;position:relative}.comp-tabs .active{color:#08a6a3;font-weight:800}.comp-tabs .active::after{content:'';position:absolute;left:0;right:0;bottom:0;height:5rpx;border-radius:99rpx;background:#08a6a3}.comp-list{gap:12rpx}.comp-card{min-height:126rpx;padding:12rpx;display:flex;gap:16rpx;border-radius:12rpx}.comp-thumb{width:124rpx;height:102rpx;border-radius:9rpx;flex-shrink:0}.comp-card-main{flex:1;min-width:0;position:relative}.comp-title{font-size:25rpx}.comp-status{font-size:19rpx;padding:3rpx 8rpx}.comp-meta{margin:10rpx 0 0;display:flex;flex-direction:column;gap:5rpx;font-size:20rpx}.comp-count{position:absolute;right:2rpx;bottom:0;font-size:20rpx;color:#6f8183}.comp-enter,.comp-bottom{display:none}
</style>
