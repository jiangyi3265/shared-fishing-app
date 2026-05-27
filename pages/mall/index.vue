<template>
	<view class="app mall">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">钓场补给</text>
				<text class="hero-sub">FISHING · SUPPLIES</text>
				<view class="hero-search">
					<text class="hero-search-icon"></text>
					<input class="hero-search-input" v-model="keyword" placeholder="搜索鱼饵 / 钓具 / 饮品补给" confirm-type="search" />
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
			<view class="empty-mark"></view>
			<text class="empty-title">暂无补给</text>
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
				<text class="goods-sales">已领用 {{ g.sales }}</text>
			</view>
		</view>

		<view class="cart-fab" @click="goCart">
			<view class="cart-fab-icon"></view>
			<view v-if="cartTotal > 0" class="cart-fab-badge">{{ cartTotal }}</view>
		</view>

		<view v-if="cartTotal > 0" class="cart-bar" @click="goCart">
			<view class="cart-bar-info">
				<text class="cart-bar-count">补给车 {{ cartTotal }} 件</text>
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
	.mall {
		padding-bottom: 220rpx;
		background: transparent;
	}

	.hero {
		position: relative;
		padding: 60rpx 32rpx 96rpx;
		border-bottom-left-radius: 64rpx;
		border-bottom-right-radius: 64rpx;
		overflow: hidden;
		box-shadow: 0 24rpx 56rpx rgba(10, 46, 36, 0.2);
	}

	.hero-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #071f18 0%, #0c352a 50%, #031410 100%);
	}

	.hero-bg::after {
		content: '';
		position: absolute;
		right: -96rpx;
		top: -112rpx;
		width: 320rpx;
		height: 320rpx;
		border-radius: 50%;
		border: 52rpx solid rgba(199, 154, 57, 0.1);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		color: #ffffff;
	}

	.hero-title {
		display: block;
		font-size: 48rpx;
		font-weight: 900;
		letter-spacing: 1rpx;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	}

	.hero-sub {
		display: block;
		color: var(--accent);
		font-size: 22rpx;
		letter-spacing: 4rpx;
		margin-top: 8rpx;
		font-weight: 800;
		text-transform: uppercase;
	}

	.hero-search {
		margin-top: 32rpx;
		height: 84rpx;
		border-radius: 99rpx;
		background: rgba(255, 255, 255, 0.08);
		border: 1rpx solid rgba(255, 255, 255, 0.12);
		display: flex;
		align-items: center;
		padding: 0 28rpx;
		gap: 18rpx;
		box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.hero-search-icon {
		width: 24rpx;
		height: 24rpx;
		border: 4rpx solid rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		position: relative;
		flex: 0 0 auto;
	}

	.hero-search-icon::after {
		content: '';
		position: absolute;
		width: 12rpx;
		height: 4rpx;
		background: rgba(255, 255, 255, 0.6);
		right: -10rpx;
		bottom: -6rpx;
		transform: rotate(45deg);
		border-radius: 999rpx;
	}

	.hero-search-input {
		flex: 1;
		color: #ffffff;
		font-size: 26rpx;
	}

	.cats {
		white-space: nowrap;
		margin: -40rpx 44rpx 0;
		padding: 14rpx 16rpx;
		background: rgba(255, 255, 255, 0.85);
		border-radius: 999rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.6);
		box-shadow: 0 20rpx 48rpx rgba(10, 46, 36, 0.08);
		position: relative;
		z-index: 10;
		backdrop-filter: blur(20px);
	}

	.cat {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		min-width: 118rpx;
		padding: 16rpx 24rpx;
		border-radius: 999rpx;
		margin-right: 14rpx;
		background: rgba(10, 46, 36, 0.03);
		border: 1rpx solid transparent;
		transition: var(--transition);
	}

	.cat.active {
		background: var(--primary-gradient);
		border-color: rgba(245, 210, 133, 0.2);
		box-shadow: 0 8rpx 20rpx rgba(10, 46, 36, 0.15);
	}

	.cat-icon {
		font-size: 36rpx;
	}

	.cat-name {
		font-size: 22rpx;
		color: var(--text-muted);
		font-weight: 800;
	}

	.cat.active .cat-name {
		color: #ffffff;
	}

	.empty {
		margin: 80rpx 32rpx;
		padding: 80rpx 40rpx;
		background: rgba(255, 255, 255, 0.65);
		backdrop-filter: blur(15px);
		border-radius: 48rpx 16rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: var(--card-shadow);
		text-align: center;
	}

	.empty-mark {
		width: 96rpx;
		height: 96rpx;
		border-radius: 32rpx;
		background: #edf3f0;
		margin: 0 auto 18rpx;
		position: relative;
		border: 1rpx solid rgba(10, 46, 36, 0.04);
	}

	.empty-mark::before {
		content: '';
		position: absolute;
		left: 22rpx;
		right: 22rpx;
		top: 30rpx;
		bottom: 22rpx;
		border: 6rpx solid var(--text-light);
		border-radius: 10rpx;
	}

	.empty-mark::after {
		content: '';
		position: absolute;
		left: 34rpx;
		right: 34rpx;
		top: 24rpx;
		height: 14rpx;
		border-radius: 10rpx 10rpx 0 0;
		background: var(--accent);
		border-radius: 999rpx;
	}

	.empty-title {
		display: block;
		font-size: 30rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.goods-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20rpx;
		padding: 28rpx 32rpx;
	}

	.goods {
		background: rgba(255, 255, 255, 0.78);
		backdrop-filter: blur(20px);
		border-radius: 48rpx 16rpx;
		padding: 24rpx 20rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: var(--card-shadow);
		position: relative;
		transition: var(--transition);
	}

	.goods:active {
		transform: scale(0.96) translateY(2rpx);
		opacity: 0.95;
	}

	.goods-cover {
		height: 200rpx;
		border-radius: 32rpx 12rpx;
		background: linear-gradient(135deg, #eef3f0 0%, #f7f1e1 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		border: 1rpx solid rgba(10, 46, 36, 0.03);
	}

	.goods-cover-emoji {
		font-size: 100rpx;
	}

	.goods-tag {
		position: absolute;
		top: 12rpx;
		right: 12rpx;
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(239, 68, 68, 0.08);
		color: #ef4444;
		border: 1rpx solid rgba(239, 68, 68, 0.15);
		font-size: 20rpx;
		font-weight: 800;
	}

	.goods-name {
		display: block;
		margin-top: 18rpx;
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
		line-height: 1.35;
	}

	.goods-subtitle {
		display: block;
		color: var(--text-muted);
		font-size: 22rpx;
		margin-top: 6rpx;
		line-height: 1.35;
		font-weight: 600;
	}

	.goods-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 14rpx;
	}

	.goods-price {
		color: #c79a39;
		font-size: 32rpx;
		font-weight: 900;
		font-variant-numeric: tabular-nums;
	}

	.goods-add {
		width: 52rpx;
		height: 52rpx;
		border-radius: 20rpx;
		background: var(--accent-gradient);
		color: var(--primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
		font-weight: 800;
		box-shadow: var(--accent-glow);
		transition: var(--transition);
	}

	.goods-add:active {
		transform: scale(0.85);
	}

	.goods-sales {
		display: block;
		margin-top: 8rpx;
		color: var(--text-light);
		font-size: 20rpx;
		font-weight: 600;
	}

	.cart-fab {
		position: fixed;
		right: 32rpx;
		bottom: 220rpx;
		width: 104rpx;
		height: 104rpx;
		border-radius: 36rpx;
		background: var(--accent-gradient);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--accent-glow);
		animation: pulse-gold 2.5s infinite, float-gentle 4s infinite ease-in-out;
		z-index: 98;
		border: 6rpx solid #ffffff;
	}

	.cart-fab-icon {
		width: 44rpx;
		height: 34rpx;
		border: 5rpx solid var(--primary);
		border-top: 0;
		border-radius: 0 0 12rpx 12rpx;
		position: relative;
	}

	.cart-fab-icon::before {
		content: '';
		position: absolute;
		left: 4rpx;
		right: 4rpx;
		top: -14rpx;
		height: 18rpx;
		border: 5rpx solid var(--primary);
		border-bottom: 0;
		border-radius: 18rpx 18rpx 0 0;
	}

	.cart-fab-badge {
		position: absolute;
		top: -8rpx;
		right: -8rpx;
		min-width: 40rpx;
		height: 40rpx;
		padding: 0 8rpx;
		border-radius: 999rpx;
		background: var(--primary);
		color: #ffffff;
		font-size: 22rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 10rpx rgba(10, 46, 36, 0.3);
	}

	.cart-bar {
		position: fixed;
		left: 32rpx;
		right: 32rpx;
		bottom: 40rpx;
		height: 108rpx;
		background: rgba(10, 46, 36, 0.95);
		border: 1rpx solid rgba(255, 255, 255, 0.1);
		border-radius: 99rpx;
		padding: 0 14rpx 0 36rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 20rpx 50rpx rgba(10, 46, 36, 0.22);
		backdrop-filter: blur(15px);
		z-index: 99;
	}

	.cart-bar-info {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.cart-bar-count {
		color: rgba(255, 255, 255, 0.5);
		font-size: 22rpx;
		font-weight: 600;
	}

	.cart-bar-amount {
		color: #ffffff;
		font-size: 34rpx;
		font-weight: 800;
	}

	.cart-bar-btn {
		background: var(--accent-gradient);
		color: var(--primary);
		height: 80rpx;
		padding: 0 44rpx;
		border-radius: 99rpx;
		display: flex;
		align-items: center;
		font-size: 28rpx;
		font-weight: 800;
		box-shadow: var(--accent-glow);
		transition: var(--transition);
	}

	.cart-bar-btn:active {
		transform: scale(0.95);
	}
</style>
