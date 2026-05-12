<template>
	<view class="app checkout">
		<view class="card">
			<text class="card-title">商品清单 ({{ totalQty }})</text>
			<view v-for="it in items" :key="it.goodsId" class="line">
				<text class="line-cover">{{ it.cover }}</text>
				<view class="line-info">
					<text class="line-name">{{ it.name }}</text>
					<text class="line-sub">{{ it.subtitle }} · ×{{ it.qty }}</text>
				</view>
				<text class="line-price">¥{{ formatMoney(it.priceCents * it.qty) }}</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">取货方式</text>
			<view class="pickup">
				<view class="pickup-icon">📍</view>
				<view class="pickup-info">
					<text class="pickup-label">到店自取</text>
					<text class="pickup-desc">付款后凭核销码到钓场吧台/小卖部领取</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="card-title">备注</text>
			<textarea class="remark" v-model="remark" placeholder="例如：要冰镇的、辣酱多放、留给老王 ..." maxlength="100" />
		</view>

		<view v-if="walletBalance > 0" class="balance-card" @click="toggleBalance">
			<view class="balance-left">
				<view class="balance-icon">💰</view>
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
			<view v-if="balanceUsed > 0" class="sum-row"><text>余额抵扣</text><text style="color:#e85d04;">-¥{{ formatMoney(balanceUsed) }}</text></view>
			<view class="sum-row big"><text>应付</text><text class="sum-amount">¥{{ formatMoney(wxPayAmount) }}</text></view>
		</view>

		<view class="footer">
			<view class="footer-info">
				<text class="footer-label">应付</text>
				<text class="footer-amount">¥{{ formatMoney(wxPayAmount) }}</text>
			</view>
			<button class="pay-btn" :disabled="submitting || !items.length" @click="submit">
				{{ submitting ? '提交中...' : (wxPayAmount === 0 ? (balanceUsed > 0 ? '余额支付' : '提交订单') : '微信支付') }}
			</button>
		</view>
	</view>
</template>

<script>
	import {
		readCart,
		cartTotalCents,
		submitMallOrder,
		clearCart
	} from '../../utils/mallStore.js'
	import { formatMoney } from '../../utils/fishingStore.js'
	import { fetchWallet } from '../../utils/walletStore.js'

	export default {
		data() {
			return { items: [], remark: '', submitting: false, walletBalance: 0, useBalance: false }
		},
		computed: {
			totalCents() { return cartTotalCents(this.items) },
			totalQty() { return this.items.reduce((acc, i) => acc + (i.qty || 0), 0) },
			balanceUsed() {
				if (!this.useBalance) return 0
				return Math.min(this.walletBalance || 0, this.totalCents)
			},
			wxPayAmount() { return Math.max(0, this.totalCents - this.balanceUsed) }
		},
		onShow() {
			this.items = readCart()
			fetchWallet().then((d) => { this.walletBalance = (d && d.balance && d.balance.balanceCents) || 0 }).catch(() => {})
		},
		methods: {
			formatMoney,
			toggleBalance() { this.useBalance = !this.useBalance },
			submit() {
				if (this.submitting) return
				if (!this.items.length) { uni.showToast({ title: '购物车为空', icon: 'none' }); return }
				this.submitting = true
				submitMallOrder({ items: this.items, remark: this.remark, useBalance: this.useBalance })
					.then((order) => {
						clearCart()
						uni.showToast({ title: '下单成功', icon: 'success' })
						setTimeout(() => uni.redirectTo({ url: '/pages/mall/voucher?mallOrderId=' + order.mallOrderId }), 600)
					})
					.catch((e) => uni.showToast({ title: (e && e.msg) || '下单失败', icon: 'none' }))
					.finally(() => { this.submitting = false })
			}
		}
	}
</script>

<style>
	.checkout { padding: 20rpx 28rpx 200rpx; }
	.card { background: #fff; border-radius: 22rpx; padding: 24rpx; margin-bottom: 18rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.card-title { display: block; font-size: 28rpx; font-weight: 800; color: #1a2030; margin-bottom: 16rpx; }

	.line { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx dashed #eef0f5; }
	.line:last-child { border-bottom: 0; }
	.line-cover { font-size: 56rpx; width: 80rpx; text-align: center; }
	.line-info { flex: 1; display: flex; flex-direction: column; }
	.line-name { color: #1a2030; font-size: 26rpx; font-weight: 700; }
	.line-sub { color: #9aa3b2; font-size: 22rpx; margin-top: 4rpx; }
	.line-price { color: #1a2030; font-size: 26rpx; font-weight: 700; font-variant-numeric: tabular-nums; }

	.pickup { display: flex; gap: 18rpx; align-items: center; padding: 12rpx 0; }
	.pickup-icon { width: 64rpx; height: 64rpx; border-radius: 50%; background: #fff7e0; display: flex; align-items: center; justify-content: center; font-size: 32rpx; }
	.pickup-info { display: flex; flex-direction: column; }
	.pickup-label { color: #1a2030; font-weight: 700; font-size: 26rpx; }
	.pickup-desc { color: #9aa3b2; font-size: 22rpx; margin-top: 4rpx; }

	.remark { width: 100%; min-height: 160rpx; background: #f6f7fa; border-radius: 16rpx; padding: 18rpx; font-size: 26rpx; box-sizing: border-box; }

	.summary .sum-row { display: flex; justify-content: space-between; padding: 10rpx 0; color: #6b7280; font-size: 26rpx; }
	.summary .sum-row.big { padding-top: 18rpx; border-top: 1rpx dashed #eef0f5; color: #1a2030; font-weight: 800; font-size: 30rpx; }
	.sum-amount { color: #b8860b; font-size: 36rpx; font-weight: 800; }

	.balance-card {
		background: #fff;
		border-radius: 22rpx;
		padding: 24rpx;
		margin-bottom: 18rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}
	.balance-left { display: flex; align-items: center; gap: 18rpx; flex: 1; }
	.balance-icon { width: 68rpx; height: 68rpx; border-radius: 18rpx; background: #fff8e0; display: flex; align-items: center; justify-content: center; font-size: 36rpx; }
	.balance-text { display: flex; flex-direction: column; gap: 6rpx; }
	.balance-title { font-size: 28rpx; font-weight: 700; color: #1a2030; }
	.balance-desc { font-size: 22rpx; color: #6b7280; }
	.balance-switch { width: 88rpx; height: 48rpx; border-radius: 999rpx; background: #dcdfe6; position: relative; }
	.balance-switch.on { background: #f5c23b; }
	.balance-dot { position: absolute; top: 4rpx; left: 4rpx; width: 40rpx; height: 40rpx; border-radius: 50%; background: #fff; box-shadow: 0 2rpx 6rpx rgba(0,0,0,.15); transition: left .2s; }
	.balance-switch.on .balance-dot { left: 44rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: #fff; display: flex; align-items: center; gap: 20rpx; box-shadow: 0 -6rpx 20rpx rgba(26,32,48,.06); }
	.footer-info { flex: 1; display: flex; flex-direction: column; }
	.footer-label { color: #9aa3b2; font-size: 22rpx; }
	.footer-amount { color: #b8860b; font-size: 40rpx; font-weight: 800; }
	.pay-btn { background: #1a2030; color: #f5c23b; padding: 0 60rpx; height: 88rpx; line-height: 88rpx; border-radius: 999rpx; font-size: 30rpx; font-weight: 800; }
	.pay-btn[disabled] { opacity: .5; }
</style>
