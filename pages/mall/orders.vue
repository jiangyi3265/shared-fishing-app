<template>
	<view class="app mall-orders has-brand-header">
		<brand-header title="补给订单" theme="light" layout="compact" :back="true" />
		<view class="order-tabs"><text class="active">全部</text><text>待支付</text><text>待领取</text><text>已完成</text></view>
		<view v-if="!list.length" class="empty">
			<view class="empty-emoji hic-shop"></view>
			<text class="empty-title">暂无商品订单</text>
			<button class="empty-btn" @click="goMall">去选购</button>
		</view>

		<view v-for="o in list" :key="o.mallOrderId" class="order" @click="goVoucher(o)">
			<view class="order-head">
				<text class="order-no">订单号：{{ o.mallOrderNo }}</text>
				<view class="pill" :class="pillClass(o.status)">{{ statusLabel[o.status] || '未知' }}</view>
			</view>
			<view class="order-items">
				<view v-for="it in o.items" :key="it.goodsId" class="cover"><product-thumb :name="it.name" :goods-id="it.goodsId" /></view>
			</view>
			<view class="order-foot">
				<text class="order-time">共 {{ o.items.length }} 件商品</text>
				<text class="order-amount">¥{{ formatMoney(o.totalCents) }}</text>
			</view>
			<view class="order-actions"><view class="order-action" @click.stop="goVoucher(o)">{{ o.status === 0 ? '立即支付' : '查看凭证' }}</view></view>
		</view>
		<mall-tabbar active="mall" />
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
	.empty { margin: 80rpx 0; padding: 80rpx 40rpx; background: var(--surface); border-radius: var(--r); text-align: center; }
	.empty-emoji { display: block; font-size: 100rpx; margin-bottom: 16rpx; }
	.empty-title { display: block; font-size: 32rpx; font-weight: 600; color: var(--ink); }
	.empty-btn { margin-top: 32rpx; height: 80rpx; line-height: 80rpx; border-radius: var(--r-pill); background: var(--g-600); color: #fff; font-weight: 600; font-size: 28rpx; }

	.order { background: var(--surface); border-radius: var(--r); padding: 24rpx; margin-bottom: 18rpx; }
	.order-head { display: flex; justify-content: space-between; align-items: center; }
	.order-no { color: var(--ink-2); font-size: 24rpx; }
	.pill { padding: 6rpx 18rpx; border-radius: var(--r-pill); font-size: 22rpx; font-weight: 500; }
	.pill-pending { background: var(--gold-bg); color: var(--gold); }
	.pill-running { background: var(--g-50); color: var(--jade); }
	.pill-paid    { background: var(--g-50); color: var(--ink); }
	.pill-cancel  { background: var(--danger-bg); color: var(--danger); }
	.order-items { display: flex; gap: 12rpx; flex-wrap: wrap; padding: 18rpx 0; }
	.cover { width: 80rpx; height: 80rpx; border-radius: var(--r-sm); background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 44rpx; }
	.order-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 14rpx; border-top: 1rpx dashed var(--bg); }
	.order-time { color: var(--ink-3); font-size: 22rpx; }
	.order-amount { color: var(--gold); font-size: 30rpx; font-weight: 600; }
</style>

<style>
.mall-orders{min-height:100vh;padding:0 20rpx calc(116rpx + env(safe-area-inset-bottom));background:#f7fbfb}.order-tabs{height:76rpx;display:flex;align-items:center;justify-content:space-around;color:#5c7173;font-size:22rpx}.order-tabs text{height:76rpx;display:flex;align-items:center;position:relative}.order-tabs .active{color:#08a4a1;font-weight:800}.order-tabs .active::after{content:'';position:absolute;left:0;right:0;bottom:0;height:5rpx;border-radius:99rpx;background:#08a4a1}.mall-orders .order{margin:14rpx 0;padding:18rpx;border:1rpx solid #d8e5e4;border-radius:12rpx;background:#fff}.order-head{padding:0 0 14rpx}.order-no{font-size:20rpx}.mall-orders .pill{font-size:20rpx}.order-items{height:106rpx;display:flex;gap:12rpx}.order-items .cover{width:104rpx;height:104rpx;border-radius:8rpx;overflow:hidden;background:#f2f4f3}.order-foot{padding:12rpx 0 8rpx}.order-time{font-size:19rpx}.order-amount{font-size:25rpx}.order-actions{display:flex;justify-content:flex-end;border-top:1rpx solid #dce7e6;padding-top:12rpx}.order-action{padding:9rpx 22rpx;border:1rpx solid #0aa6a3;border-radius:99rpx;color:#0a9b99;font-size:20rpx}
</style>
