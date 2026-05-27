<template>
	<view class="app mall-orders">
		<view v-if="!list.length" class="empty">
			<text class="empty-emoji">🛍️</text>
			<text class="empty-title">暂无商品订单</text>
			<button class="empty-btn" @click="goMall">去选购</button>
		</view>

		<view v-for="o in list" :key="o.mallOrderId" class="order" @click="goVoucher(o)">
			<view class="order-head">
				<text class="order-no">{{ o.mallOrderNo }}</text>
				<view class="pill" :class="pillClass(o.status)">{{ statusLabel[o.status] || '未知' }}</view>
			</view>
			<view class="order-items">
				<text v-for="it in o.items" :key="it.goodsId" class="cover">{{ it.cover }}</text>
			</view>
			<view class="order-foot">
				<text class="order-time">{{ formatDatetime(o.createTime) }}</text>
				<text class="order-amount">¥{{ formatMoney(o.totalCents) }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { fetchMyMallOrders, MALL_ORDER_STATUS } from '../../utils/mallStore.js'
	import { formatMoney, formatDatetime } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				list: [],
				statusLabel: {
					[MALL_ORDER_STATUS.UNPAID]: '待支付',
					[MALL_ORDER_STATUS.PAID]: '可使用',
					[MALL_ORDER_STATUS.REDEEMED]: '已领取',
					[MALL_ORDER_STATUS.CANCELED]: '已取消'
				}
			}
		},
		onShow() { fetchMyMallOrders().then((rows) => this.list = rows) },
		methods: {
			formatMoney,
			formatDatetime,
			pillClass(s) {
				if (s === MALL_ORDER_STATUS.UNPAID) return 'pill-pending'
				if (s === MALL_ORDER_STATUS.PAID) return 'pill-running'
				if (s === MALL_ORDER_STATUS.REDEEMED) return 'pill-paid'
				return 'pill-cancel'
			},
			goVoucher(o) {
				uni.navigateTo({ url: '/pages/mall/voucher?mallOrderId=' + o.mallOrderId })
			},
			goMall() { uni.redirectTo({ url: '/pages/mall/index' }) }
		}
	}
</script>

<style>
	.mall-orders { padding: 20rpx 28rpx 60rpx; }
	.empty { margin: 80rpx 0; padding: 80rpx 40rpx; background: #fff; border-radius: 24rpx; text-align: center; }
	.empty-emoji { display: block; font-size: 100rpx; margin-bottom: 16rpx; }
	.empty-title { display: block; font-size: 32rpx; font-weight: 800; color: #1a2030; }
	.empty-btn { margin-top: 32rpx; height: 80rpx; line-height: 80rpx; border-radius: 999rpx; background: #f5c23b; color: #1a1306; font-weight: 800; font-size: 28rpx; }

	.order { background: #fff; border-radius: 22rpx; padding: 24rpx; margin-bottom: 18rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.order-head { display: flex; justify-content: space-between; align-items: center; }
	.order-no { color: #6b7280; font-size: 24rpx; }
	.pill { padding: 6rpx 18rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 700; }
	.pill-pending { background: #fff7e0; color: #b8860b; }
	.pill-running { background: #e0f0ff; color: #1976d2; }
	.pill-paid    { background: #e3f7e3; color: #2e7d32; }
	.pill-cancel  { background: #ffe6e6; color: #c62828; }
	.order-items { display: flex; gap: 12rpx; flex-wrap: wrap; padding: 18rpx 0; }
	.cover { width: 80rpx; height: 80rpx; border-radius: 18rpx; background: #fafbfd; display: flex; align-items: center; justify-content: center; font-size: 44rpx; }
	.order-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 14rpx; border-top: 1rpx dashed #eef0f5; }
	.order-time { color: #9aa3b2; font-size: 22rpx; }
	.order-amount { color: #b8860b; font-size: 30rpx; font-weight: 800; }
</style>
