<template>
	<view class="app mall">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">钓场商城</text>
				<text class="hero-sub">FISHING · MALL</text>
				<view class="hero-search">
					<text class="hero-search-icon">🔍</text>
					<input class="hero-search-input" v-model="keyword" placeholder="搜索商品 / 鱼饵 / 渔具" confirm-type="search" />
				</view>
			</view>
		</view>

		<scroll-view class="cats" scroll-x>
			<view v-for="c in categories" :key="c.catId" class="cat" :class="{ active: c.catId === activeCat }" @click="switchCat(c.catId)">
				<text class="cat-icon">{{ c.icon }}</text>
				<text class="cat-name">{{ c.name }}</text>
			</view>
		</scroll-view>

		<view v-if="!filteredGoods.length" class="empty">
			<text class="empty-emoji">📦</text>
			<text class="empty-title">暂无商品</text>
		</view>

		<view class="goods-grid">
			<view v-for="g in filteredGoods" :key="g.goodsId" class="goods" @click="goDetail(g)">
				<view class="goods-cover">
					<text class="goods-cover-emoji">{{ g.cover }}</text>
					<view v-if="g.stock < 10" class="goods-tag">仅剩 {{ g.stock }}</view>
				</view>
				<text class="goods-name">{{ g.name }}</text>
				<text class="goods-subtitle">{{ g.subtitle }}</text>
				<view class="goods-foot">
					<text class="goods-price">¥{{ formatMoney(g.priceCents) }}</text>
					<view class="goods-add" @click.stop="quickAdd(g)">+</view>
				</view>
				<text class="goods-sales">已售 {{ g.sales }}</text>
			</view>
		</view>

		<view class="cart-fab" @click="goCart">
			<view class="cart-fab-icon">🛒</view>
			<view v-if="cartTotal > 0" class="cart-fab-badge">{{ cartTotal }}</view>
		</view>

		<view v-if="cartTotal > 0" class="cart-bar" @click="goCart">
			<view class="cart-bar-info">
				<text class="cart-bar-count">购物车 {{ cartTotal }} 件</text>
				<text class="cart-bar-amount">¥{{ formatMoney(cartAmount) }}</text>
			</view>
			<view class="cart-bar-btn">去结算</view>
		</view>
	</view>
</template>

<script>
	import {
		fetchCategories,
		fetchGoodsByCategory,
		addToCart,
		cartCount,
		cartTotalCents,
		readCart
	} from '../../utils/mallStore.js'
	import { formatMoney } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				categories: [],
				activeCat: 1,
				goods: [],
				keyword: '',
				cartTotal: 0,
				cartAmount: 0
			}
		},
		computed: {
			filteredGoods() {
				const k = (this.keyword || '').trim()
				if (!k) return this.goods
				return this.goods.filter((g) => g.name.includes(k) || (g.subtitle || '').includes(k))
			}
		},
		onShow() { this.refreshCart() },
		onLoad() {
			fetchCategories().then((cats) => {
				this.categories = cats
				if (cats[0]) this.switchCat(cats[0].catId)
			})
		},
		methods: {
			formatMoney,
			switchCat(catId) {
				this.activeCat = catId
				fetchGoodsByCategory(catId).then((g) => this.goods = g)
			},
			goDetail(g) {
				uni.navigateTo({ url: '/pages/mall/detail?goodsId=' + g.goodsId })
			},
			quickAdd(g) {
				addToCart(g, 1)
				this.refreshCart()
				uni.showToast({ title: '已加入购物车', icon: 'none' })
			},
			refreshCart() {
				this.cartTotal = cartCount()
				this.cartAmount = cartTotalCents(readCart())
			},
			goCart() { uni.navigateTo({ url: '/pages/mall/cart' }) }
		}
	}
</script>

<style>
	.mall { padding-bottom: 200rpx; }

	.hero { position: relative; padding: 40rpx 28rpx 32rpx; }
	.hero-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg,#1a1a1a,#2e2e2e); }
	.hero-content { position: relative; z-index: 1; color: #fff; }
	.hero-title { display: block; font-size: 44rpx; font-weight: 800; letter-spacing: 2rpx; }
	.hero-sub { display: block; color: #f5c23b; font-size: 22rpx; letter-spacing: 4rpx; margin-top: 8rpx; }
	.hero-search { margin-top: 28rpx; height: 72rpx; border-radius: 999rpx; background: rgba(255,255,255,.12); display: flex; align-items: center; padding: 0 24rpx; gap: 12rpx; }
	.hero-search-icon { font-size: 26rpx; }
	.hero-search-input { flex: 1; color: #fff; font-size: 26rpx; }

	.cats { white-space: nowrap; padding: 24rpx 28rpx 12rpx; background: #fff; }
	.cat { display: inline-flex; flex-direction: column; align-items: center; gap: 6rpx; padding: 12rpx 24rpx; border-radius: 18rpx; margin-right: 16rpx; background: #f4f5f7; }
	.cat.active { background: #f5c23b; }
	.cat-icon { font-size: 36rpx; }
	.cat-name { font-size: 22rpx; color: #1a2030; font-weight: 700; }

	.empty { margin: 80rpx 28rpx; padding: 80rpx 40rpx; background: #fff; border-radius: 24rpx; text-align: center; }
	.empty-emoji { display: block; font-size: 72rpx; margin-bottom: 16rpx; }
	.empty-title { display: block; font-size: 30rpx; font-weight: 700; color: #1a2030; }

	.goods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx; padding: 20rpx 28rpx; }
	.goods { background: #fff; border-radius: 22rpx; padding: 20rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); position: relative; }
	.goods-cover { height: 200rpx; border-radius: 18rpx; background: #fafbfd; display: flex; align-items: center; justify-content: center; position: relative; }
	.goods-cover-emoji { font-size: 100rpx; }
	.goods-tag { position: absolute; top: 12rpx; right: 12rpx; padding: 4rpx 12rpx; border-radius: 999rpx; background: #ffe6e6; color: #c62828; font-size: 20rpx; font-weight: 700; }
	.goods-name { display: block; margin-top: 16rpx; font-size: 28rpx; font-weight: 700; color: #1a2030; }
	.goods-subtitle { display: block; color: #9aa3b2; font-size: 22rpx; margin-top: 6rpx; }
	.goods-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 14rpx; }
	.goods-price { color: #b8860b; font-size: 32rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
	.goods-add { width: 48rpx; height: 48rpx; border-radius: 50%; background: #1a2030; color: #f5c23b; display: flex; align-items: center; justify-content: center; font-size: 36rpx; font-weight: 800; }
	.goods-sales { display: block; margin-top: 6rpx; color: #9aa3b2; font-size: 20rpx; }

	.cart-fab { position: fixed; right: 28rpx; bottom: 220rpx; width: 96rpx; height: 96rpx; border-radius: 50%; background: #1a2030; display: flex; align-items: center; justify-content: center; box-shadow: 0 10rpx 30rpx rgba(0,0,0,.25); }
	.cart-fab-icon { font-size: 48rpx; }
	.cart-fab-badge { position: absolute; top: -6rpx; right: -6rpx; min-width: 36rpx; height: 36rpx; padding: 0 8rpx; border-radius: 999rpx; background: #f5c23b; color: #1a1306; font-size: 22rpx; font-weight: 800; display: flex; align-items: center; justify-content: center; }

	.cart-bar { position: fixed; left: 28rpx; right: 28rpx; bottom: 40rpx; height: 96rpx; background: #1a2030; border-radius: 999rpx; padding: 0 12rpx 0 32rpx; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 12rpx 30rpx rgba(0,0,0,.25); }
	.cart-bar-info { display: flex; flex-direction: column; }
	.cart-bar-count { color: #d8d8d8; font-size: 22rpx; }
	.cart-bar-amount { color: #f5c23b; font-size: 32rpx; font-weight: 800; }
	.cart-bar-btn { background: #f5c23b; color: #1a1306; height: 72rpx; padding: 0 36rpx; border-radius: 999rpx; display: flex; align-items: center; font-size: 28rpx; font-weight: 800; }
</style>
