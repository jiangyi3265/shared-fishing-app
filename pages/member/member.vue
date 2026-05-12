<template>
	<view class="app member-page">
		<view class="member-card" :class="'level-' + (myLevel.levelName || 'none')">
			<view class="member-top">
				<text class="member-title">会员等级</text>
				<text class="member-name">{{ myLevel.levelName || '暂无等级' }}</text>
			</view>
			<view class="member-info">
				<text class="member-discount" v-if="myLevel.discountRate && myLevel.discountRate < 100">享 {{ myLevel.discountRate / 10 }} 折优惠</text>
				<text class="member-discount" v-else>消费即可升级</text>
			</view>
		</view>

		<view class="section-title">等级体系</view>
		<view class="level-list">
			<view class="level-item" v-for="l in levels" :key="l.levelId" :class="{active: myLevel.levelId === l.levelId}">
				<view class="level-head">
					<text class="level-name">{{ l.levelName }}</text>
					<text class="level-discount">{{ l.discountRate }}%</text>
				</view>
				<text class="level-threshold">累计消费 ≥ ¥{{ (l.minConsumeCents / 100).toFixed(0) }}</text>
				<view class="level-perks">
					<text v-if="l.freeDeposit" class="perk">免押金</text>
					<text v-if="l.priorityReserve" class="perk">优先订位</text>
					<text v-if="l.extraBenefits" class="perk">{{ l.extraBenefits }}</text>
				</view>
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
	onShow() {
		fetchMemberLevels().then(rows => { this.levels = rows })
		fetchMyMember().then(data => { this.myLevel = data || {} }).catch(() => {})
	}
}
</script>

<style scoped>
.member-page { padding: 0 24rpx 40rpx; }
.member-card { background: linear-gradient(135deg, #f5a623, #f7c948); border-radius: 20rpx; padding: 40rpx 30rpx; margin: 30rpx 0; color: #fff; }
.member-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.member-title { font-size: 26rpx; opacity: 0.8; }
.member-name { font-size: 36rpx; font-weight: bold; }
.member-info { font-size: 28rpx; opacity: 0.9; }
.section-title { font-size: 30rpx; font-weight: bold; margin: 20rpx 0 16rpx; color: #1a2030; }
.level-list { display: flex; flex-direction: column; gap: 16rpx; }
.level-item { background: #fff; border-radius: 12rpx; padding: 20rpx; border: 2rpx solid transparent; }
.level-item.active { border-color: #f5a623; background: #fffbf0; }
.level-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.level-name { font-size: 30rpx; font-weight: bold; }
.level-discount { font-size: 28rpx; color: #f5a623; font-weight: bold; }
.level-threshold { font-size: 24rpx; color: #999; margin-bottom: 8rpx; }
.level-perks { display: flex; gap: 12rpx; flex-wrap: wrap; }
.perk { background: #f0f7ff; color: #3b82f6; padding: 4rpx 14rpx; border-radius: 6rpx; font-size: 22rpx; }
</style>
