<template>
	<view class="app cart">
		<view v-if="!items.length" class="empty">
			<text class="empty-emoji">🛒</text>
			<text class="empty-title">补给车是空的</text>
			<text class="empty-desc">去钓场补给选点钓饵或饮品吧</text>
			<button class="empty-btn" @click="goMall">去选补给</button>
		</view>

		<view v-for="(it, idx) in items" :key="it.goodsId" class="item">
			<view class="item-cover"><text>{{ it.cover }}</text></view>
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
	.empty { margin: 80rpx 0; padding: 80rpx 40rpx; background: #fff; border-radius: 24rpx; text-align: center; }
	.empty-emoji { display: block; font-size: 100rpx; margin-bottom: 16rpx; }
	.empty-title { display: block; font-size: 32rpx; font-weight: 800; color: #1a2030; }
	.empty-desc { display: block; color: #6b7280; font-size: 26rpx; margin-top: 10rpx; }
	.empty-btn { margin-top: 32rpx; height: 80rpx; line-height: 80rpx; border-radius: 999rpx; background: #f5c23b; color: #1a1306; font-weight: 800; font-size: 28rpx; }

	.item { display: flex; gap: 18rpx; padding: 22rpx; background: #fff; border-radius: 22rpx; margin-bottom: 18rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.item-cover { width: 140rpx; height: 140rpx; border-radius: 18rpx; background: #fafbfd; display: flex; align-items: center; justify-content: center; font-size: 72rpx; }
	.item-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
	.item-name { font-size: 28rpx; font-weight: 700; color: #1a2030; }
	.item-subtitle { color: #9aa3b2; font-size: 22rpx; }
	.item-price { color: #b8860b; font-size: 30rpx; font-weight: 800; margin-top: 6rpx; }
	.item-actions { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; }
	.qty { display: flex; align-items: center; background: #f4f5f7; border-radius: 999rpx; padding: 2rpx 6rpx; }
	.qty-btn { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; font-size: 30rpx; color: #1a2030; }
	.qty-num { padding: 0 12rpx; font-size: 26rpx; font-weight: 800; min-width: 36rpx; text-align: center; }
	.del { color: #c62828; font-size: 22rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 24rpx 28rpx env(safe-area-inset-bottom); background: #fff; display: flex; align-items: center; gap: 20rpx; box-shadow: 0 -6rpx 20rpx rgba(26,32,48,.06); }
	.footer-info { flex: 1; display: flex; flex-direction: column; }
	.footer-label { color: #9aa3b2; font-size: 22rpx; }
	.footer-amount { color: #b8860b; font-size: 40rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
	.checkout-btn { background: #f5c23b; color: #1a1306; padding: 0 60rpx; height: 88rpx; line-height: 88rpx; border-radius: 999rpx; font-size: 30rpx; font-weight: 800; }
</style>
