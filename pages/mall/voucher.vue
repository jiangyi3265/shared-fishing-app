<template>
	<view class="app voucher" v-if="order">
		<view class="hero">
			<text class="hero-status">{{ statusLabel[order.status] || '订单' }}</text>
			<text class="hero-no">订单号 {{ order.mallOrderNo }}</text>
		</view>

		<view class="card">
			<text class="card-title">核销码</text>
			<view class="code-box">
				<view class="code-pattern">
					<view v-for="n in 64" :key="n" class="code-cell" :class="{ filled: cells[n - 1] }"></view>
				</view>
				<text class="code-text">{{ order.redeemCode }}</text>
			</view>
			<text class="code-tip">到店出示此核销码 / 编号给老板核销</text>
		</view>

		<view class="card">
			<text class="card-title">商品清单</text>
			<view v-for="it in order.items" :key="it.goodsId" class="line">
				<text class="line-cover">{{ it.cover }}</text>
				<view class="line-info">
					<text class="line-name">{{ it.name }}</text>
					<text class="line-sub">{{ it.subtitle }} · ×{{ it.qty }}</text>
				</view>
				<text class="line-price">¥{{ formatMoney(it.priceCents * it.qty) }}</text>
			</view>
		</view>

		<view class="card">
			<view class="row"><text class="k">下单时间</text><text class="v">{{ formatDatetime(order.createTime) }}</text></view>
			<view class="row"><text class="k">支付时间</text><text class="v">{{ formatDatetime(order.paidTime) || '--' }}</text></view>
			<view class="row" v-if="order.remark"><text class="k">备注</text><text class="v dim">{{ order.remark }}</text></view>
			<view class="row" v-if="order.balanceCents > 0"><text class="k">余额抵扣</text><text class="v">-¥{{ formatMoney(order.balanceCents) }}</text></view>
			<view class="row big"><text class="k">实付</text><text class="v price">¥{{ formatMoney(order.amountPaid || order.totalCents) }}</text></view>
		</view>

		<view class="footer">
			<button class="btn ghost" @click="goOrders">订单列表</button>
			<button v-if="canRefund" class="btn warn" @click="goRefund">申请退款</button>
			<button class="btn primary" @click="goMall">继续购物</button>
		</view>
	</view>
</template>

<script>
	import { fetchMallOrderDetail, MALL_ORDER_STATUS } from '../../utils/mallStore.js'
	import { formatMoney, formatDatetime } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				order: null,
				statusLabel: {
					[MALL_ORDER_STATUS.UNPAID]: '待支付',
					[MALL_ORDER_STATUS.PAID]: '待核销',
					[MALL_ORDER_STATUS.REDEEMED]: '已核销',
					[MALL_ORDER_STATUS.CANCELED]: '已取消'
				}
			}
		},
		computed: {
			// 用核销码做种子生成 8x8 伪二维码格子，纯装饰
			cells() {
				const code = this.order ? String(this.order.redeemCode || '0') : '0'
				const arr = []
				for (let i = 0; i < 64; i++) {
					const c = code.charCodeAt(i % code.length) || 0
					arr.push(((c >> (i % 8)) & 1) === 1)
				}
				return arr
			},
			canRefund() {
				return this.order && this.order.status === MALL_ORDER_STATUS.PAID
			}
		},
		onLoad(query) {
			fetchMallOrderDetail(query.mallOrderId).then((o) => {
				if (!o) { uni.showToast({ title: '订单不存在', icon: 'none' }); return }
				this.order = o
			})
		},
		methods: {
			formatMoney,
			formatDatetime,
			goOrders() { uni.redirectTo({ url: '/pages/mall/orders' }) },
			goMall() { uni.redirectTo({ url: '/pages/mall/index' }) },
			goRefund() {
				uni.navigateTo({ url: '/pages/refund/apply?orderType=mall&mallOrderId=' + this.order.mallOrderId })
			}
		}
	}
</script>

<style>
	.voucher { padding-bottom: 200rpx; }
	.hero { padding: 50rpx 28rpx 32rpx; background: linear-gradient(135deg,#1a1a1a,#2e2e2e); }
	.hero-status { display: block; color: #f5c23b; font-size: 44rpx; font-weight: 800; }
	.hero-no { display: block; color: #d8d8d8; font-size: 24rpx; margin-top: 12rpx; letter-spacing: 1rpx; }

	.card { margin: 20rpx 28rpx; padding: 28rpx; background: #fff; border-radius: 22rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.card-title { display: block; font-size: 28rpx; font-weight: 800; color: #1a2030; margin-bottom: 18rpx; }

	.code-box { display: flex; flex-direction: column; align-items: center; padding: 30rpx 0; background: #fafbfd; border-radius: 22rpx; }
	.code-pattern { width: 320rpx; height: 320rpx; display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); gap: 4rpx; padding: 12rpx; background: #fff; border: 6rpx solid #1a2030; border-radius: 18rpx; }
	.code-cell { background: #fff; }
	.code-cell.filled { background: #1a2030; border-radius: 4rpx; }
	.code-text { margin-top: 24rpx; font-size: 56rpx; font-weight: 800; letter-spacing: 12rpx; color: #1a2030; font-variant-numeric: tabular-nums; }
	.code-tip { display: block; text-align: center; color: #9aa3b2; font-size: 24rpx; margin-top: 18rpx; }

	.line { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx dashed #eef0f5; }
	.line:last-child { border-bottom: 0; }
	.line-cover { font-size: 56rpx; width: 80rpx; text-align: center; }
	.line-info { flex: 1; display: flex; flex-direction: column; }
	.line-name { color: #1a2030; font-size: 26rpx; font-weight: 700; }
	.line-sub { color: #9aa3b2; font-size: 22rpx; margin-top: 4rpx; }
	.line-price { color: #1a2030; font-size: 26rpx; font-weight: 700; }

	.row { display: flex; justify-content: space-between; padding: 12rpx 0; }
	.row.big { padding-top: 18rpx; border-top: 1rpx dashed #eef0f5; margin-top: 6rpx; }
	.k { color: #9aa3b2; font-size: 26rpx; }
	.v { color: #1a2030; font-size: 26rpx; font-weight: 700; }
	.v.dim { color: #6b7280; font-weight: 400; max-width: 60%; text-align: right; }
	.v.price { color: #b8860b; font-size: 36rpx; font-weight: 800; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: #fff; display: flex; gap: 16rpx; box-shadow: 0 -6rpx 20rpx rgba(26,32,48,.06); }
	.btn { flex: 1; height: 88rpx; border-radius: 999rpx; font-size: 30rpx; font-weight: 800; }
	.btn.ghost { background: #f4f5f7; color: #6b7280; }
	.btn.warn  { background: #fff0f0; color: #c62828; }
	.btn.primary { background: #f5c23b; color: #1a1306; }
</style>
