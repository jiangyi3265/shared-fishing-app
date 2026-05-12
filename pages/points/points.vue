<template>
	<view class="app points-page">
		<view class="points-header">
			<view class="points-card">
				<text class="points-label">我的积分</text>
				<text class="points-value">{{ myPoints }}</text>
				<view class="checkin-btn" @click="doCheckinAction">{{ checkedIn ? '已签到' : '签到 +5' }}</view>
			</view>
		</view>

		<view class="section-title">积分商城</view>
		<view class="goods-list">
			<view class="goods-card" v-for="g in goods" :key="g.goodsId">
				<image v-if="g.image" :src="g.image" class="goods-img" mode="aspectFill" />
				<view class="goods-img goods-img-placeholder" v-else>🎁</view>
				<view class="goods-info">
					<text class="goods-name">{{ g.name }}</text>
					<text class="goods-cost">{{ g.pointsCost }} 积分</text>
				</view>
				<view class="goods-btn" :class="{disabled: myPoints < g.pointsCost}" @click="doExchange(g)">兑换</view>
			</view>
		</view>

		<view class="section-title" v-if="exchanges.length">兑换记录</view>
		<view class="exchange-list">
			<view class="exchange-item" v-for="e in exchanges" :key="e.exchangeId">
				<text class="ex-name">{{ e.goodsName }}</text>
				<text class="ex-cost">-{{ e.pointsCost }}积分</text>
				<text class="ex-status">{{ {0:'待发放',1:'已发放',2:'已取消'}[e.status] }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchMyPoints, fetchPointsGoods, doCheckin, exchangePoints } from '../../utils/fishingStore.js'

export default {
	data() {
		return { myPoints: 0, goods: [], exchanges: [], checkedIn: false }
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			fetchMyPoints().then(data => {
				this.myPoints = data.points || 0
				this.exchanges = data.exchanges || []
			}).catch(() => {})
			fetchPointsGoods().then(rows => { this.goods = rows })
		},
		doCheckinAction() {
			if (this.checkedIn) return
			doCheckin().then(r => {
				this.checkedIn = true
				this.myPoints = r.totalPoints
				uni.showToast({ title: '签到成功 +' + r.earned + '积分' })
			}).catch(e => uni.showToast({ title: e.message || '签到失败', icon: 'none' }))
		},
		doExchange(g) {
			if (this.myPoints < g.pointsCost) { uni.showToast({ title: '积分不足', icon: 'none' }); return }
			uni.showModal({ title: '确认兑换', content: `消耗 ${g.pointsCost} 积分兑换「${g.name}」？`, success: res => {
				if (res.confirm) {
					exchangePoints(g.goodsId).then(() => {
						uni.showToast({ title: '兑换成功' })
						this.loadData()
					}).catch(e => uni.showToast({ title: e.message || '兑换失败', icon: 'none' }))
				}
			}})
		}
	}
}
</script>

<style scoped>
.points-page { padding: 0 24rpx 40rpx; }
.points-header { margin: 30rpx 0; }
.points-card { background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 20rpx; padding: 40rpx 30rpx; color: #fff; display: flex; align-items: center; }
.points-label { font-size: 26rpx; opacity: 0.8; }
.points-value { font-size: 56rpx; font-weight: bold; flex: 1; margin-left: 16rpx; }
.checkin-btn { background: rgba(255,255,255,0.2); padding: 14rpx 28rpx; border-radius: 30rpx; font-size: 26rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin: 24rpx 0 16rpx; color: #1a2030; }
.goods-list { display: flex; flex-direction: column; gap: 16rpx; }
.goods-card { background: #fff; border-radius: 12rpx; padding: 20rpx; display: flex; align-items: center; gap: 16rpx; }
.goods-img { width: 80rpx; height: 80rpx; border-radius: 8rpx; }
.goods-img-placeholder { display: flex; align-items: center; justify-content: center; background: #f5f5f5; font-size: 36rpx; }
.goods-info { flex: 1; }
.goods-name { font-size: 28rpx; font-weight: bold; display: block; }
.goods-cost { font-size: 24rpx; color: #764ba2; }
.goods-btn { background: #764ba2; color: #fff; padding: 10rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; }
.goods-btn.disabled { background: #ccc; }
.exchange-list { display: flex; flex-direction: column; gap: 10rpx; }
.exchange-item { background: #fff; border-radius: 8rpx; padding: 16rpx 20rpx; display: flex; align-items: center; }
.ex-name { flex: 1; font-size: 26rpx; }
.ex-cost { font-size: 24rpx; color: #e74c3c; margin-right: 16rpx; }
.ex-status { font-size: 22rpx; color: #999; }
</style>
