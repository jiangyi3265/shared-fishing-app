<template>
	<view class="app cart has-brand-header">
		<brand-header title="补给车" theme="light" layout="compact" :back="true" />
		<view v-if="items.length" class="cart-manage"><text class="select-mark">✓</text><text>全选</text><text class="manage-link">管理</text></view>
		<view v-if="!items.length" class="empty">
			<text class="empty-title">补给车是空的</text>
			<text class="empty-desc">去钓场补给选点钓饵或饮品吧</text>
			<button class="empty-btn" @click="goMall">去选补给</button>
		</view>

		<view v-for="(it, idx) in items" :key="it.goodsId" class="item">
			<text class="item-check">✓</text><view class="item-cover"><product-thumb :name="it.name" :goods-id="it.goodsId" /></view>
			<view class="item-info">
				<text class="item-name">{{ it.name }}</text>
				<text class="item-subtitle">{{ it.subtitle }}</text>
				<text class="item-price">¥{{ formatMoney(it.priceCents) }}</text>
			</view>
			<view class="item-actions">
				<view class="qty">
					<view class="qty-btn" @click="setQty(it, it.qty - 1)">-</view>
					<text class="qty-num">{{ it.qty }}</text>
					<view class="qty-btn" @click="setQty(it, it.qty + 1)">+</view>
				</view>
				<text class="del" @click="remove(it)">删除</text>
			</view>
		</view>

		<view v-if="items.length" class="footer">
			<view class="footer-info">
				<text class="footer-label">合计</text>
				<text class="footer-amount">¥{{ formatMoney(totalCents) }}</text>
			</view>
			<button class="checkout-btn" @click="goCheckout">去结算 ({{ totalQty }})</button>
		</view>
	</view>
</template>

<script>
	import {
		readCart,
		updateCartQty,
		removeFromCart,
		cartTotalCents
	} from '../../utils/mallStore.js'
	import { formatMoney } from '../../utils/fishingStore.js'

	export default {
		data() { return { items: [] } },
		computed: {
			totalCents() { return cartTotalCents(this.items) },
			totalQty() { return this.items.reduce((acc, i) => acc + (i.qty || 0), 0) }
		},
		onShow() { this.items = readCart() },
		methods: {
			formatMoney,
			setQty(it, qty) { this.items = updateCartQty(it.goodsId, qty) },
			remove(it) {
				uni.showModal({ title: '移除补给', content: '确定从补给车移除？', success: (res) => {
					if (res.confirm) this.items = removeFromCart(it.goodsId)
				}})
			},
			goMall() { uni.redirectTo({ url: '/pages/mall/index' }) },
			goCheckout() { uni.navigateTo({ url: '/pages/mall/checkout' }) }
		}
	}
</script>

<style>
	.cart { padding: 20rpx 28rpx 200rpx; }
	.empty { margin: 80rpx 0; padding: 80rpx 40rpx; background: var(--surface); border-radius: var(--r); text-align: center; }
	.empty-emoji { display: block; font-size: 100rpx; margin-bottom: 16rpx; }
	.empty-title { display: block; font-size: 32rpx; font-weight: 600; color: var(--ink); }
	.empty-desc { display: block; color: var(--ink-2); font-size: 26rpx; margin-top: 10rpx; }
	.empty-btn { margin-top: 32rpx; height: 80rpx; line-height: 80rpx; border-radius: var(--r-pill); background: var(--g-600); color: #fff; font-weight: 600; font-size: 28rpx; }

	.item { display: flex; gap: 18rpx; padding: 22rpx; background: var(--surface); border-radius: var(--r); margin-bottom: 18rpx; }
	.item-cover { width: 140rpx; height: 140rpx; border-radius: var(--r-sm); background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 72rpx; }
	.item-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
	.item-name { font-size: 28rpx; font-weight: 500; color: var(--ink); }
	.item-subtitle { color: var(--ink-3); font-size: 22rpx; }
	.item-price { color: var(--gold); font-size: 30rpx; font-weight: 600; margin-top: 6rpx; }
	.item-actions { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; }
	.qty { display: flex; align-items: center; background: var(--surface-2); border-radius: var(--r-pill); padding: 2rpx 6rpx; }
	.qty-btn { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; font-size: 30rpx; color: var(--ink); }
	.qty-num { padding: 0 12rpx; font-size: 26rpx; font-weight: 600; min-width: 36rpx; text-align: center; }
	.del { color: var(--danger); font-size: 22rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 24rpx 28rpx env(safe-area-inset-bottom); background: var(--surface); display: flex; align-items: center; gap: 20rpx; }
	.footer-info { flex: 1; display: flex; flex-direction: column; }
	.footer-label { color: var(--ink-3); font-size: 22rpx; }
	.footer-amount { color: var(--gold); font-size: 40rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
	.checkout-btn { background: var(--g-600); color: #fff; padding: 0 60rpx; height: 88rpx; line-height: 88rpx; border-radius: var(--r-pill); font-size: 30rpx; font-weight: 600; }
</style>

<style>
.cart{min-height:100vh;padding:0 20rpx calc(120rpx + env(safe-area-inset-bottom));background:#f7fbfb}.cart-manage{height:78rpx;display:flex;align-items:center;gap:12rpx;color:#536e70;font-size:22rpx}.select-mark,.item-check{width:34rpx;height:34rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#0aa9a5;color:#fff;font-size:20rpx}.manage-link{margin-left:auto}.cart .item{min-height:176rpx;margin:0 0 14rpx;padding:18rpx;display:flex;align-items:center;gap:12rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.item-check{width:32rpx;height:32rpx;flex-shrink:0}.cart .item-cover{width:132rpx;height:132rpx;border-radius:9rpx;overflow:hidden;flex-shrink:0}.cart .item-info{align-self:stretch}.cart .item-name{font-size:24rpx}.cart .item-subtitle{font-size:19rpx}.cart .item-price{margin-top:auto;font-size:27rpx;color:#ed8c00}.cart .item-actions{align-self:stretch;justify-content:space-between}.cart .del{font-size:19rpx}.cart .qty-btn{width:42rpx;height:39rpx}.cart .footer{height:calc(100rpx + env(safe-area-inset-bottom));padding:10rpx 20rpx env(safe-area-inset-bottom)}.cart .checkout-btn{height:70rpx;padding:0 44rpx;border-radius:10rpx;background:#0aa9a5}.empty-emoji{display:none}
</style>
