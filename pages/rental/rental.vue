<template>
	<view class="app rental-page">
		<view class="page-head"><text class="page-head-title">装备租赁</text></view>
		<view class="rental-list">
			<view class="rental-card" v-for="g in goods" :key="g.goodsId">
				<image v-if="g.image" :src="g.image" class="rental-img" mode="aspectFill" />
				<view class="rental-img rental-placeholder" v-else>🎣</view>
				<view class="rental-info">
					<text class="rental-name">{{ g.name }}</text>
					<text class="rental-cat">{{ g.category }}</text>
					<view class="rental-prices">
						<text class="rental-rent">租金 ¥{{ (g.rentCents/100).toFixed(2) }}/{{ g.rentUnit==='per_hour'?'小时':'次' }}</text>
						<text v-if="g.depositCents" class="rental-deposit">押金 ¥{{ (g.depositCents/100).toFixed(2) }}</text>
					</view>
				</view>
				<view class="rental-btn" @click="doRent(g)">租借</view>
			</view>
		</view>
		<view class="section-title" v-if="myOrders.length">我的租赁</view>
		<view class="my-list">
			<view class="my-item" v-for="o in myOrders" :key="o.orderId">
				<text class="my-name">{{ o.goodsName }}</text>
				<text class="my-status">{{ {0:'租借中',1:'已归还',2:'已取消',3:'押金扣除'}[o.status] }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchRentalList, rentEquipment, fetchMyRentals } from '../../utils/fishingStore.js'
export default {
	data() { return { goods: [], myOrders: [] } },
	onShow() { this.loadData() },
	methods: {
		loadData() {
			fetchRentalList().then(rows => { this.goods = rows })
			fetchMyRentals().then(rows => { this.myOrders = rows }).catch(() => {})
		},
		doRent(g) {
			uni.showModal({ title: '确认租借', content: `租借「${g.name}」？租金¥${(g.rentCents/100).toFixed(2)}${g.depositCents?'，押金¥'+(g.depositCents/100).toFixed(2):''}`, success: res => {
				if (res.confirm) rentEquipment(g.goodsId).then(() => { uni.showToast({title:'租借成功'}); this.loadData() }).catch(e => uni.showToast({title:e.message||'失败',icon:'none'}))
			}})
		}
	}
}
</script>

<style scoped>
.rental-page { padding: 0 24rpx 40rpx; }
.page-head { padding: 30rpx 0 20rpx; }
.page-head-title { font-size: 36rpx; font-weight: bold; }
.rental-list { display: flex; flex-direction: column; gap: 16rpx; }
.rental-card { background: #fff; border-radius: 12rpx; padding: 20rpx; display: flex; align-items: center; gap: 16rpx; }
.rental-img { width: 100rpx; height: 100rpx; border-radius: 8rpx; }
.rental-placeholder { display: flex; align-items: center; justify-content: center; background: #f5f5f5; font-size: 40rpx; }
.rental-info { flex: 1; }
.rental-name { font-size: 28rpx; font-weight: bold; display: block; }
.rental-cat { font-size: 22rpx; color: #999; }
.rental-prices { margin-top: 8rpx; }
.rental-rent { font-size: 26rpx; color: #f5a623; }
.rental-deposit { font-size: 22rpx; color: #666; margin-left: 12rpx; }
.rental-btn { background: #3b82f6; color: #fff; padding: 12rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin: 24rpx 0 12rpx; }
.my-list { display: flex; flex-direction: column; gap: 10rpx; }
.my-item { background: #fff; border-radius: 8rpx; padding: 16rpx 20rpx; display: flex; justify-content: space-between; }
.my-name { font-size: 26rpx; }
.my-status { font-size: 24rpx; color: #999; }
</style>
