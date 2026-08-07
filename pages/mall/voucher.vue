<template>
	<view class="app voucher has-brand-header">
		<brand-header title="商品使用凭证" theme="light" layout="compact" :back="true" />
		<view v-if="order">
		<view class="hero">
			<text class="hero-status">{{ statusLabel[order.status] || '订单' }}</text>
			<text class="hero-no">到钓场吧台出示此页领取</text>
		</view>

		<view class="card use-card">
			<text class="card-title">商品使用凭证</text>
			<view class="ticket">
				<text class="ticket-main">{{ ticketMain }}</text>
				<text class="ticket-sub">{{ ticketSub }}</text>
			</view>
			<text class="code-tip">已支付订单可直接到钓场吧台/小卖部领取，无需核销码。</text>
		</view>

		<view class="card">
			<text class="card-title">商品清单</text>
			<view v-for="it in order.items" :key="it.goodsId" class="line">
				<view class="line-cover"><product-thumb :name="it.name" :goods-id="it.goodsId" /></view>
				<view class="line-info">
					<text class="line-name">{{ it.name }}</text>
					<text class="line-sub">{{ it.subtitle }} · x{{ it.qty }}</text>
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
			<button v-if="order.status === MALL_ORDER_STATUS.UNPAID" class="btn primary" :disabled="paying" @click="continuePay">{{ paying ? '支付中…' : '继续支付' }}</button>
			<button v-else class="btn primary" @click="goMall">继续选购</button>
		</view>
		</view>
		<view v-else class="empty voucher-empty">
			<text class="empty-title">{{ loadError ? '订单凭证加载失败' : '正在读取订单凭证' }}</text>
			<text class="empty-desc">{{ loadError || '请稍候，或返回补给订单重新进入' }}</text>
			<view v-if="loadError" class="voucher-retry" @click="loadOrder(false)">重新加载</view>
		</view>
	</view>
</template>

<script>
	import { fetchMallOrderDetail, payMallOrder, MALL_ORDER_STATUS } from '../../utils/mallStore.js'
	import { formatMoney, formatDatetime } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				order: null,
				paying: false,
				loadError: '', refreshLeft: 10,
				MALL_ORDER_STATUS,
				refreshTimer: null,
				statusLabel: {
					[MALL_ORDER_STATUS.UNPAID]: '待支付',
					[MALL_ORDER_STATUS.PAID]: '可直接使用',
					[MALL_ORDER_STATUS.REDEEMED]: '已领取',
					[MALL_ORDER_STATUS.CANCELED]: '已取消'
				}
			}
		},
		computed: {
			canRefund() {
				return this.order && this.order.status === MALL_ORDER_STATUS.PAID
			},
			ticketMain() {
				if (!this.order) return ''
				if (this.order.status === MALL_ORDER_STATUS.UNPAID) return '订单待支付'
				if (this.order.status === MALL_ORDER_STATUS.CANCELED) return '订单已取消'
				if (this.order.status === MALL_ORDER_STATUS.REDEEMED) return '商品已领取'
				return '到店直接领取'
			},
			ticketSub() {
				if (!this.order) return ''
				if (this.order.status === MALL_ORDER_STATUS.UNPAID) return '点击下方按钮继续完成微信支付'
				return '向工作人员展示订单号即可'
			}
		},
		onLoad(query) {
			this.mallOrderId = query.mallOrderId
			this.loadOrder(true)
		},
		onUnload() {
			if (this.refreshTimer) clearTimeout(this.refreshTimer)
		},
		methods: {
			formatMoney,
			formatDatetime,
			loadOrder(autoRefresh) {
				this.loadError = ''
				fetchMallOrderDetail(this.mallOrderId).then((o) => {
					if (!o) { uni.showToast({ title: '订单不存在', icon: 'none' }); return }
					this.order = o
					if (autoRefresh && o.status === MALL_ORDER_STATUS.UNPAID && this.refreshLeft > 0) {
						this.refreshLeft--
						this.refreshTimer = setTimeout(() => this.loadOrder(true), 1500)
					}
				}).catch((error) => {
					this.order = null
					this.loadError = (error && (error.msg || error.message)) || '请检查网络后重试'
				})
			},
			goOrders() { uni.redirectTo({ url: '/pages/mall/orders' }) },
			goMall() { uni.redirectTo({ url: '/pages/mall/index' }) },
			continuePay() {
				if (this.paying || !this.order) return
				this.paying = true
				if (this.refreshTimer) clearTimeout(this.refreshTimer)
				payMallOrder(this.order.mallOrderId).then((order) => {
					if (order) this.order = order
					uni.showToast({ title: '支付成功', icon: 'success' })
					this.loadOrder(false)
				}).catch((error) => {
					uni.showToast({ title: (error && (error.msg || error.message)) || '支付未完成', icon: 'none' })
				}).finally(() => { this.paying = false })
			},
			goRefund() {
				uni.navigateTo({ url: '/pages/refund/apply?orderType=mall&mallOrderId=' + this.order.mallOrderId })
			}
		}
	}
</script>

<style>
	.voucher { padding-bottom: 200rpx; }
	.hero { padding: 50rpx 28rpx 32rpx; background: linear-gradient(135deg,var(--g-900),var(--g-950)); }
	.hero-status { display: block; color: var(--gold); font-size: 44rpx; font-weight: 600; }
	.hero-no { display: block; color: var(--ink-4); font-size: 24rpx; margin-top: 12rpx; letter-spacing: 1rpx; }

	.card { margin: 20rpx 28rpx; padding: 28rpx; background: var(--surface); border-radius: var(--r); }
	.card-title { display: block; font-size: 28rpx; font-weight: 600; color: var(--ink); margin-bottom: 18rpx; }

	.use-card { border: 2rpx solid var(--gold); }
	.ticket { display: flex; flex-direction: column; align-items: center; padding: 42rpx 20rpx; background: var(--surface-2); border-radius: var(--r); }
	.ticket-main { color: var(--ink); font-size: 46rpx; font-weight: 600; }
	.ticket-sub { color: var(--ink-2); font-size: 26rpx; margin-top: 12rpx; }
	.code-tip { display: block; text-align: center; color: var(--ink-3); font-size: 24rpx; margin-top: 18rpx; }

	.line { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx dashed var(--bg); }
	.line:last-child { border-bottom: 0; }
	.line-cover { font-size: 56rpx; width: 80rpx; text-align: center; }
	.line-info { flex: 1; display: flex; flex-direction: column; }
	.line-name { color: var(--ink); font-size: 26rpx; font-weight: 500; }
	.line-sub { color: var(--ink-3); font-size: 22rpx; margin-top: 4rpx; }
	.line-price { color: var(--ink); font-size: 26rpx; font-weight: 500; }

	.row { display: flex; justify-content: space-between; padding: 12rpx 0; }
	.row.big { padding-top: 18rpx; border-top: 1rpx dashed var(--bg); margin-top: 6rpx; }
	.k { color: var(--ink-3); font-size: 26rpx; }
	.v { color: var(--ink); font-size: 26rpx; font-weight: 500; }
	.v.dim { color: var(--ink-2); font-weight: 400; max-width: 60%; text-align: right; }
	.v.price { color: var(--gold); font-size: 36rpx; font-weight: 600; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: var(--surface); display: flex; gap: 16rpx; }
	.btn { flex: 1; height: 88rpx; border-radius: var(--r-pill); font-size: 30rpx; font-weight: 600; }
	.btn.ghost { background: var(--surface-2); color: var(--ink-2); }
	.btn.warn  { background: var(--danger-bg); color: var(--danger); }
	.btn.primary { background: var(--g-600); color: #fff; }
</style>

<style>
.voucher{min-height:100vh;padding:14rpx 20rpx calc(144rpx + env(safe-area-inset-bottom));background:#f7fbfb}.voucher .hero{margin:0;padding:24rpx 0;background:transparent;text-align:center}.voucher .hero-status{font-size:35rpx;color:#079f9d}.voucher .hero-no{margin-top:7rpx;color:#697d7f;font-size:22rpx}.voucher .card{margin:0 0 14rpx;padding:22rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.voucher .use-card .card-title{text-align:center}.voucher .ticket{margin-top:17rpx;padding:24rpx;border-radius:10rpx;background:#f5f9f8;text-align:center}.voucher .ticket-main{color:#0a8382;font-size:42rpx;letter-spacing:4rpx}.voucher .line-cover{width:80rpx;height:80rpx;border-radius:8rpx;overflow:hidden}.voucher .footer{padding:10rpx 20rpx calc(10rpx + env(safe-area-inset-bottom));display:flex;gap:10rpx}.voucher .btn{padding:16rpx 8rpx;border-radius:10rpx}
.voucher-retry{margin:26rpx auto 0;width:210rpx;height:68rpx;display:flex;align-items:center;justify-content:center;border-radius:9rpx;background:#0aa9a5;color:#fff;font-size:23rpx;font-weight:700}
</style>
