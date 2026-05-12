<template>
	<view class="app comp-page">
		<view class="page-head"><text class="page-head-title">钓王争霸</text></view>
		<view v-if="list.length===0" class="empty"><text class="empty-text">暂无比赛</text></view>
		<view class="comp-list">
			<view class="comp-card" v-for="c in list" :key="c.compId" @click="goDetail(c)">
				<view class="comp-top">
					<text class="comp-title">{{ c.title }}</text>
					<text class="comp-status" :class="'s'+c.status">{{ statusMap[c.status] }}</text>
				</view>
				<view class="comp-meta">
					<text>📅 {{ c.compDate }} {{ c.timeSlot }}</text>
					<text v-if="c.fishSpecies">🐟 {{ c.fishSpecies }}</text>
				</view>
				<view class="comp-bottom">
					<text class="comp-prize" v-if="c.prizePoolCents">奖池 ¥{{ (c.prizePoolCents/100).toFixed(0) }}</text>
					<text class="comp-count">{{ c.entryCount || 0 }}{{ c.maxPlayers ? '/'+c.maxPlayers : '' }}人</text>
				</view>
				<view v-if="c.status===0" class="comp-enter" @click.stop="doEnter(c)">报名</view>
			</view>
		</view>

		<!-- 排行榜弹窗 -->
		<view v-if="showRanking" class="ranking-mask" @click.self="showRanking=false">
			<view class="ranking-panel">
				<text class="ranking-title">🏆 排行榜</text>
				<view class="ranking-list">
					<view class="ranking-item" v-for="(e,i) in ranking" :key="e.entryId">
						<text class="rank-num">{{ i+1 }}</text>
						<text class="rank-name">{{ e.nickname }}</text>
						<text class="rank-weight">{{ (e.weightGram/1000).toFixed(2) }}kg</text>
						<text class="rank-prize" v-if="e.prizeCents">¥{{ (e.prizeCents/100).toFixed(0) }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchCompetitionList, fetchCompetitionRanking, enterCompetition, getCachedVenue } from '../../utils/fishingStore.js'
export default {
	data() {
		return {
			list: [], ranking: [], showRanking: false,
			statusMap: {0:'报名中',1:'进行中',2:'称重中',3:'已结束',4:'已取消'}
		}
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			const cached = getCachedVenue()
			fetchCompetitionList(cached && cached.venue ? cached.venue.venueId : null).then(rows => { this.list = rows })
		},
		goDetail(c) {
			if (c.status >= 2) {
				fetchCompetitionRanking(c.compId).then(rows => { this.ranking = rows; this.showRanking = true })
			}
		},
		doEnter(c) {
			uni.showModal({ title: '报名比赛', content: `确认报名「${c.title}」？${c.entryFeeCents?'报名费¥'+(c.entryFeeCents/100).toFixed(2):'免费'}`, success: res => {
				if (res.confirm) enterCompetition(c.compId, {}).then(() => { uni.showToast({title:'报名成功'}); this.loadData() }).catch(e => uni.showToast({title:e.message||'失败',icon:'none'}))
			}})
		}
	}
}
</script>

<style scoped>
.comp-page { padding: 0 24rpx 40rpx; }
.page-head { padding: 30rpx 0 20rpx; }
.page-head-title { font-size: 36rpx; font-weight: bold; }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: #999; }
.comp-list { display: flex; flex-direction: column; gap: 20rpx; }
.comp-card { background: #fff; border-radius: 16rpx; padding: 24rpx; position: relative; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05); }
.comp-top { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.comp-title { font-size: 30rpx; font-weight: bold; flex: 1; }
.comp-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx; background: #e8f5e9; color: #2e7d32; }
.comp-status.s3 { background: #f5f5f5; color: #999; }
.comp-meta { font-size: 24rpx; color: #666; display: flex; gap: 20rpx; margin-bottom: 12rpx; }
.comp-bottom { display: flex; justify-content: space-between; }
.comp-prize { font-size: 28rpx; color: #f5a623; font-weight: bold; }
.comp-count { font-size: 24rpx; color: #666; }
.comp-enter { position: absolute; right: 24rpx; bottom: 24rpx; background: #e74c3c; color: #fff; padding: 10rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; }
.ranking-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.ranking-panel { background: #fff; width: 85%; border-radius: 20rpx; padding: 40rpx 30rpx; max-height: 70vh; overflow-y: auto; }
.ranking-title { font-size: 34rpx; font-weight: bold; display: block; text-align: center; margin-bottom: 24rpx; }
.ranking-list { display: flex; flex-direction: column; gap: 12rpx; }
.ranking-item { display: flex; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.rank-num { width: 50rpx; font-size: 28rpx; font-weight: bold; color: #f5a623; }
.rank-name { flex: 1; font-size: 28rpx; }
.rank-weight { font-size: 26rpx; color: #333; margin-right: 16rpx; }
.rank-prize { font-size: 24rpx; color: #e74c3c; font-weight: bold; }
</style>
