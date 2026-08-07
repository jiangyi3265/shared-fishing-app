<template>
	<view class="app checkout has-brand-header">
		<brand-header title="确认订单" theme="light" layout="compact" :back="true" />
		<view v-if="refreshing" class="price-state">正在核对最新价格与库存…</view>
		<view v-else-if="priceError" class="price-state price-error" @click="refreshCart">
			<text>{{ priceError }}</text><text class="retry-link">重新核对</text>
		</view>
		<view class="card product-card">
			<text class="card-title">商品清单 ({{ totalQty }})</text>
			<view v-for="it in items" :key="it.goodsId" class="line">
				<view class="line-cover"><product-thumb :name="it.name" :goods-id="it.goodsId" /></view>
				<view class="line-info">
					<text class="line-name">{{ it.name }}</text>
					<text class="line-sub">{{ it.subtitle }} · x{{ it.qty }}</text>
				</view>
				<text class="line-price">¥{{ formatMoney(it.priceCents * it.qty) }}</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">取货方式</text>
			<view class="pickup">
				<view class="pickup-icon hic-nav"></view>
				<view class="pickup-info">
					<text class="pickup-label">到店自取</text>
					<text class="pickup-desc">付款后可直接到钓场吧台/小卖部领取，无需核销码</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="card-title">备注</text>
			<textarea class="remark" v-model="remark" placeholder="例如：要冰镇的、辣酱多放、留给前台 ..." maxlength="100" />
		</view>

		<view v-if="myPoints > 0" class="balance-card" @click="togglePoints">
			<view class="balance-left">
				<view class="balance-icon hic-coin"></view>
				<view class="balance-text">
					<text class="balance-title">积分抵扣</text>
					<text class="balance-desc">可用 {{ myPoints }} 积分（100积分=1元）{{ usePoints && pointsDeduct > 0 ? '，本单抵 ¥' + formatMoney(pointsDeduct) : '' }}</text>
				</view>
			</view>
			<view class="balance-switch" :class="{ on: usePoints }"><view class="balance-dot"></view></view>
		</view>

		<view v-if="walletBalance > 0" class="balance-card" @click="toggleBalance">
			<view class="balance-left">
				<view class="balance-icon hic-wxpay"></view>
				<view class="balance-text">
					<text class="balance-title">储值余额抵扣</text>
					<text class="balance-desc">当前余额 ¥{{ formatMoney(walletBalance) }}{{ useBalance && balanceUsed > 0 ? '，本单抵扣 ¥' + formatMoney(balanceUsed) : '' }}</text>
				</view>
			</view>
			<view class="balance-switch" :class="{ on: useBalance }"><view class="balance-dot"></view></view>
		</view>

		<view class="card summary">
			<view class="sum-row"><text>商品合计</text><text>¥{{ formatMoney(totalCents) }}</text></view>
			<view class="sum-row"><text>包装/服务费</text><text>¥0.00</text></view>
			<view v-if="pointsDeduct > 0" class="sum-row"><text>积分抵扣</text><text class="deduct-value">-¥{{ formatMoney(pointsDeduct) }}</text></view>
			<view v-if="balanceUsed > 0" class="sum-row"><text>余额抵扣</text><text class="deduct-value">-¥{{ formatMoney(balanceUsed) }}</text></view>
			<view class="sum-row big"><text>应付</text><text class="sum-amount">¥{{ formatMoney(wxPayAmount) }}</text></view>
		</view>

		<view class="footer">
			<view class="footer-info">
				<text class="footer-label">应付</text>
				<text class="footer-amount">¥{{ formatMoney(wxPayAmount) }}</text>
			</view>
			<button class="pay-btn" :disabled="submitting || refreshing || !!priceError || !items.length" @click="submit">
				{{ submitting ? '提交中...' : (wxPayAmount === 0 ? ((pointsDeduct > 0 || balanceUsed > 0) ? '确认支付' : '提交订单') : '微信支付') }}
			</button>
		</view>
	</view>
</template>

<script>
	import {
		readCart,
		refreshCartItems,
		cartTotalCents,
		submitMallOrder,
		clearCart
	} from '../../utils/mallStore.js'
	import { formatMoney, fetchMyPoints } from '../../utils/fishingStore.js'
	import { fetchWallet } from '../../utils/walletStore.js'

	export default {
		data() {
			return { items: [], remark: '', submitting: false, refreshing: true, priceError: '', walletBalance: 0, useBalance: false, myPoints: 0, usePoints: false }
		},
		computed: {
			totalCents() { return cartTotalCents(this.items) },
			totalQty() { return this.items.reduce((acc, i) => acc + (i.qty || 0), 0) },
			pointsDeduct() {
				// 积分抵现：100 积分 = 1 元（1 积分 = 1 分），可全额抵，最多抵到订单总额
				if (!this.usePoints) return 0
				return Math.min(this.myPoints || 0, this.totalCents)
			},
			balanceUsed() {
				if (!this.useBalance) return 0
				return Math.min(this.walletBalance || 0, Math.max(0, this.totalCents - this.pointsDeduct))
			},
			wxPayAmount() { return Math.max(0, this.totalCents - this.pointsDeduct - this.balanceUsed) }
		},
		onShow() {
			this.items = readCart()
			this.refreshCart()
			fetchWallet().then((d) => { this.walletBalance = (d && d.balance && d.balance.balanceCents) || 0 }).catch(() => {})
			fetchMyPoints().then((d) => { this.myPoints = (d && d.points) || 0 }).catch(() => {})
		},
		methods: {
			formatMoney,
			refreshCart() {
				this.refreshing = true
				this.priceError = ''
				return refreshCartItems().then((items) => {
					this.items = items
				}).catch((error) => {
					this.items = readCart()
					this.priceError = (error && (error.msg || error.message)) || '价格核对失败，请检查网络后重试'
				}).finally(() => { this.refreshing = false })
			},
			toggleBalance() { this.useBalance = !this.useBalance },
			togglePoints() { this.usePoints = !this.usePoints },
			submit() {
				if (this.submitting) return
				if (this.refreshing || this.priceError) { uni.showToast({ title: '请先完成价格与库存核对', icon: 'none' }); return }
				if (!this.items.length) { uni.showToast({ title: '购物车为空', icon: 'none' }); return }
				this.submitting = true
				const onlinePayCents = this.wxPayAmount
				submitMallOrder({ items: this.items, remark: this.remark, useBalance: this.useBalance, pointsToUse: this.pointsDeduct })
					.then((order) => {
						clearCart()
						uni.showToast({ title: '下单成功', icon: 'success' })
						const voucherUrl = '/pages/mall/voucher?mallOrderId=' + order.mallOrderId
						if (onlinePayCents >= 100 && order.mallOrderNo) {
							const resultUrl = '/pages/payResult/payResult?success=1'
								+ '&sourceType=mall'
								+ '&sourceNo=' + encodeURIComponent(order.mallOrderNo)
								+ '&returnUrl=' + encodeURIComponent(voucherUrl)
							setTimeout(() => uni.redirectTo({ url: resultUrl }), 600)
						} else {
							setTimeout(() => uni.redirectTo({ url: voucherUrl }), 600)
						}
					})
					.catch((e) => {
						if (e && e.order && e.order.mallOrderId) {
							clearCart()
							this.items = []
							uni.showModal({
								title: '支付尚未完成',
								content: '订单已安全保留，没有重复扣库存。可在补给订单中继续支付。',
								showCancel: false,
								confirmText: '查看订单',
								success: () => uni.redirectTo({ url: '/pages/mall/orders' })
							})
							return
						}
						uni.showToast({ title: (e && (e.msg || e.message)) || '下单失败', icon: 'none' })
					})
					.finally(() => { this.submitting = false })
			}
		}
	}
</script>

<style>
	.checkout { padding: 20rpx 28rpx 200rpx; }
	.card { background: var(--surface); border-radius: var(--r); padding: 24rpx; margin-bottom: 18rpx; }
	.card-title { display: block; font-size: 28rpx; font-weight: 600; color: var(--ink); margin-bottom: 16rpx; }

	.line { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx dashed var(--bg); }
	.line:last-child { border-bottom: 0; }
	.line-cover { font-size: 56rpx; width: 80rpx; text-align: center; }
	.line-info { flex: 1; display: flex; flex-direction: column; }
	.line-name { color: var(--ink); font-size: 26rpx; font-weight: 500; }
	.line-sub { color: var(--ink-3); font-size: 22rpx; margin-top: 4rpx; }
	.line-price { color: var(--ink); font-size: 26rpx; font-weight: 500; font-variant-numeric: tabular-nums; }

	.pickup { display: flex; gap: 18rpx; align-items: center; padding: 12rpx 0; }
	.pickup-icon { width: 64rpx; height: 64rpx; border-radius: 50%; background: var(--gold-bg); display: flex; align-items: center; justify-content: center; font-size: 32rpx; }
	.pickup-info { display: flex; flex-direction: column; }
	.pickup-label { color: var(--ink); font-weight: 500; font-size: 26rpx; }
	.pickup-desc { color: var(--ink-3); font-size: 22rpx; margin-top: 4rpx; }

	.remark { width: 100%; min-height: 160rpx; background: var(--surface-2); border-radius: var(--r-sm); padding: 18rpx; font-size: 26rpx; box-sizing: border-box; }

	.summary .sum-row { display: flex; justify-content: space-between; padding: 10rpx 0; color: var(--ink-2); font-size: 26rpx; }
	.summary .sum-row.big { padding-top: 18rpx; border-top: 1rpx dashed var(--bg); color: var(--ink); font-weight: 600; font-size: 30rpx; }
	.deduct-value { color: var(--gold); font-weight: 600; }
	.sum-amount { color: var(--gold); font-size: 36rpx; font-weight: 600; }

	.balance-card {
		background: var(--surface);
		border-radius: var(--r);
		padding: 24rpx;
		margin-bottom: 18rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.balance-left { display: flex; align-items: center; gap: 18rpx; flex: 1; }
	.balance-icon { width: 68rpx; height: 68rpx; border-radius: var(--r-sm); background: var(--gold-bg); display: flex; align-items: center; justify-content: center; font-size: 36rpx; }
	.balance-text { display: flex; flex-direction: column; gap: 6rpx; }
	.balance-title { font-size: 28rpx; font-weight: 500; color: var(--ink); }
	.balance-desc { font-size: 22rpx; color: var(--ink-2); }
	.balance-switch { width: 88rpx; height: 48rpx; border-radius: var(--r-pill); background: var(--bg); position: relative; }
	.balance-switch.on { background: var(--g-600); }
	.balance-dot { position: absolute; top: 4rpx; left: 4rpx; width: 40rpx; height: 40rpx; border-radius: 50%; background: var(--surface); transition: left .2s; }
	.balance-switch.on .balance-dot { left: 44rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: var(--surface); display: flex; align-items: center; gap: 20rpx; }
	.footer-info { flex: 1; display: flex; flex-direction: column; }
	.footer-label { color: var(--ink-3); font-size: 22rpx; }
	.footer-amount { color: var(--gold); font-size: 40rpx; font-weight: 600; }
	.pay-btn { background: var(--g-900); color: var(--gold); padding: 0 60rpx; height: 88rpx; line-height: 88rpx; border-radius: var(--r-pill); font-size: 30rpx; font-weight: 600; }
	.pay-btn[disabled] { opacity: .5; }
	.pickup-icon { background-size: 36rpx 36rpx; }
	.balance-icon { background-size: 40rpx 40rpx; }
</style>

<style>
.checkout{min-height:100vh;padding:14rpx 20rpx calc(118rpx + env(safe-area-inset-bottom));background:#f7fbfb}.checkout .price-state{margin-bottom:14rpx;padding:18rpx 22rpx;border:1rpx solid #cde3e1;border-radius:12rpx;background:#eff9f8;color:#347073;font-size:22rpx}.checkout .price-error{display:flex;align-items:center;justify-content:space-between;gap:16rpx;border-color:#f0d3a4;background:#fff8ea;color:#86590d}.checkout .retry-link{flex-shrink:0;color:#079f9d;font-weight:700}.checkout .card,.checkout .balance-card{margin:0 0 14rpx;padding:22rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.checkout .product-card{display:block}.checkout .product-card .line{min-height:92rpx}.checkout .line-cover{width:76rpx;height:76rpx;border-radius:8rpx;overflow:hidden;flex-shrink:0}.checkout .line-name{font-size:23rpx}.checkout .line-sub{font-size:19rpx}.checkout .line-price{font-size:23rpx}.checkout .card-title{font-size:27rpx}.checkout .pickup{margin-top:15rpx;padding:18rpx;border-radius:10rpx;background:#f4f8f8}.checkout .remark{height:56rpx;padding:0;font-size:21rpx}.checkout .balance-card{min-height:116rpx}.checkout .balance-icon{display:none}.checkout .balance-title{font-size:24rpx}.checkout .balance-desc{font-size:19rpx}.checkout .balance-switch{width:52rpx;height:31rpx}.checkout .summary{padding:18rpx 22rpx}.checkout .sum-row{min-height:52rpx;font-size:22rpx}.checkout .sum-row.big{margin-top:8rpx;padding-top:14rpx}.checkout .sum-amount{color:#ef8b00;font-size:34rpx}.checkout .footer{height:calc(100rpx + env(safe-area-inset-bottom));padding:10rpx 20rpx env(safe-area-inset-bottom)}.checkout .footer-info{display:none}.checkout .pay-btn{width:100%;height:72rpx;border-radius:10rpx;background:#0aa9a5;font-size:27rpx}
</style>
