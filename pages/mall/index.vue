<template>
	<view class="app mall has-brand-header">
		<brand-header title="钓场补给" theme="teal" layout="compact" :back="true" />
		<view class="hero">
			<image class="mall-hero-photo" src="/static/hero-fishing-v2.jpg" mode="aspectFill" />
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">钓场补给</text>
				<text class="hero-subtitle">精选好物 · 便捷补给</text>
				<text class="hero-trust">✓ 正品保障　 ✓ 即到即用　 ✓ 售后无忧</text>
				<view class="hero-search">
					<text class="hero-search-icon"></text>
					<input class="hero-search-input" v-model="keyword" placeholder="搜索鱼饵 / 钓具 / 饮品补给" confirm-type="search" />
				</view>
			</view>
		</view>

		<view class="mall-catalog" :class="{ 'catalog-empty': !categories.length }">
		<scroll-view v-if="categories.length" class="cats" scroll-y>
			<view v-for="c in categories" :key="c.catId" class="cat" :class="{ active: c.catId === activeCat }" @click="switchCat(c.catId)">
				<text class="cat-icon">{{ c.icon }}</text>
				<text class="cat-name">{{ c.name }}</text>
			</view>
		</scroll-view>

		<view v-if="loading" class="catalog-state">
			<view class="state-spinner"></view>
			<text class="empty-title">补给加载中</text>
			<text class="empty-desc">正在同步后台商品和库存</text>
		</view>

		<view v-else-if="loadError" class="catalog-state">
			<view class="empty-mark error-mark"></view>
			<text class="empty-title">补给暂时加载失败</text>
			<text class="empty-desc">{{ loadError }}</text>
			<view class="retry-btn" @click="retryLoad">重新加载</view>
		</view>

		<view v-else-if="!filteredGoods.length" class="catalog-state">
			<view class="empty-mark"></view>
			<text class="empty-title">暂无补给</text>
			<text class="empty-desc">商品上架后会在这里展示</text>
		</view>

		<view v-else class="goods-grid">
			<view v-for="g in filteredGoods" :key="g.goodsId" class="goods" @click="goDetail(g)">
				<view class="goods-cover">
					<product-thumb :name="g.name" :goods-id="g.goodsId" />
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
		<mall-tabbar active="mall" />
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
				cartAmount: 0,
				loading: true,
				loadError: ''
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
			this.loadCategories()
		},
		methods: {
			formatMoney,
			loadCategories() {
				this.loading = true
				this.loadError = ''
				fetchCategories().then((cats) => {
					this.categories = Array.isArray(cats) ? cats : []
					if (this.categories[0]) return this.switchCat(this.categories[0].catId)
					this.goods = []
					this.loading = false
				}).catch((error) => {
					this.categories = []
					this.goods = []
					this.loading = false
					this.loadError = this.errorMessage(error)
				})
			},
			switchCat(catId) {
				this.activeCat = catId
				this.loading = true
				this.loadError = ''
				return fetchGoodsByCategory(catId).then((g) => {
					this.goods = Array.isArray(g) ? g : []
				}).catch((error) => {
					this.goods = []
					this.loadError = this.errorMessage(error)
				}).finally(() => {
					this.loading = false
				})
			},
			errorMessage(error) {
				return (error && (error.msg || error.message || error.errMsg)) || '网络异常，请检查连接后重试'
			},
			retryLoad() {
				if (this.categories.length && this.activeCat) this.switchCat(this.activeCat)
				else this.loadCategories()
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
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, var(--g-950) 0%, var(--g-900) 50%, var(--g-950) 100%);
	}

	.hero-bg::after {
		display: none;
	}

	.hero-content {
		position: relative;
		z-index: 1;
		color: #ffffff;
	}

	.hero-title {
		display: block;
		font-size: 48rpx;
		font-weight: 600;
		letter-spacing: 1rpx;
	}

	.hero-sub {
		display: block;
		color: var(--accent);
		font-size: 22rpx;
		letter-spacing: 4rpx;
		margin-top: 8rpx;
		font-weight: 600;
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
		background: var(--surface);
		right: -10rpx;
		bottom: -6rpx;
		transform: rotate(45deg);
		border-radius: var(--r-pill);
	}

	.hero-search-input {
		flex: 1;
		color: #ffffff;
		font-size: 26rpx;
	}

	/* 旧版是压在 hero 上的白色悬浮大药丸 + 每项还带副标题，占掉半屏。
	   改成规矩的横向 tab 条，紧跟 hero 下方，不再重叠。 */
	.cats {
		white-space: nowrap;
		margin: 0;
		padding: 12rpx var(--gut);
		background: var(--surface);
		border-bottom: 1rpx solid var(--line);
		position: relative;
		z-index: 10;
	}

	.cat {
		display: inline-flex;
		align-items: center;
		gap: 10rpx;
		padding: 12rpx 26rpx;
		border-radius: var(--r-pill);
		margin-right: 12rpx;
		background: transparent;
		transition: var(--transition);
	}

	.cat.active {
		background: var(--g-50);
	}

	.cat-icon {
		font-size: 28rpx;
	}

	.cat-name {
		font-size: var(--t-sm);
		color: var(--ink-3);
		font-weight: 400;
	}

	.cat.active .cat-name {
		color: var(--jade);
		font-weight: 600;
	}

	.empty {
		margin: 64rpx 32rpx;
		padding: 80rpx 40rpx;
		background: var(--surface);
		border-radius: var(--r);
		border: 1rpx solid rgba(17, 49, 40, 0.05);
		text-align: center;
	}

	.empty-mark {
		width: 96rpx;
		height: 96rpx;
		border-radius: var(--r-lg);
		background: var(--g-50);
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
		border-radius: var(--r-xs);
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
		border-radius: var(--r-pill);
	}

	.empty-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--jade);
	}

	.goods-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20rpx;
		padding: 28rpx 32rpx;
	}

	.goods {
		background: var(--surface);
		border-radius: var(--r);
		padding: 20rpx 18rpx;
		border: 1rpx solid rgba(17, 49, 40, 0.05);
		position: relative;
		transition: var(--transition);
	}

	.goods:active {
		transform: scale(0.96) translateY(2rpx);
		opacity: 0.95;
	}

	.goods-cover {
		height: 200rpx;
		border-radius: var(--r-sm);
		/* 米黄渐变看着像图没加载完 —— 换成中性占位 */
		background: var(--surface-2);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.goods-cover-emoji {
		font-size: 100rpx;
	}

	.goods-tag {
		position: absolute;
		top: 12rpx;
		right: 12rpx;
		padding: 6rpx 16rpx;
		border-radius: var(--r-pill);
		background: var(--danger-bg);
		color: var(--danger);
		font-size: 20rpx;
		font-weight: 500;
	}

	.goods-name {
		display: block;
		margin-top: 18rpx;
		font-size: var(--t-body);
		font-weight: 500;
		color: var(--ink);
		line-height: 1.35;
	}

	.goods-subtitle {
		display: block;
		color: var(--ink-3);
		font-size: var(--t-xs);
		margin-top: 6rpx;
		line-height: 1.35;
	}

	.goods-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 14rpx;
	}

	/* 价格是唯一该用金色的地方 */
	.goods-price {
		color: var(--gold-ink);
		font-size: 32rpx;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	/* 加购按钮回归品牌绿，金色不当装饰 */
	.goods-add {
		width: 52rpx;
		height: 52rpx;
		border-radius: var(--r-sm);
		background: var(--g-600);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 34rpx;
		font-weight: 400;
		transition: var(--transition);
	}

	.goods-add:active {
		transform: scale(0.85);
	}

	.goods-sales {
		display: block;
		margin-top: 8rpx;
		color: var(--ink-4);
		font-size: 20rpx;
	}

	/* 悬浮购物车和底部结算条功能重复、还会互相压住。
	   底部条已经常驻显示件数和金额，去掉这颗会闪会浮的金色 FAB。 */
	.cart-fab {
		display: none;
	}

	.cart-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: auto;
		background: var(--surface);
		border-top: 1rpx solid var(--line);
		padding: 20rpx var(--gut) calc(20rpx + env(safe-area-inset-bottom));
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 99;
	}

	.cart-bar-info {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.cart-bar-count {
		color: var(--ink-3);
		font-size: var(--t-xs);
	}

	.cart-bar-amount {
		color: var(--ink);
		font-size: var(--t-h2);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.cart-bar-btn {
		background: var(--g-600);
		color: #fff;
		height: 84rpx;
		padding: 0 48rpx;
		border-radius: var(--r);
		display: flex;
		align-items: center;
		font-size: var(--t-body);
		font-weight: 500;
		transition: var(--transition);
	}

	.cart-bar-btn:active {
		transform: scale(0.95);
	}
</style>

<style>
.mall{min-height:100vh;padding-bottom:calc(118rpx + env(safe-area-inset-bottom));background:#f7fbfb}.mall .hero{height:330rpx;padding:28rpx 28rpx 0;box-sizing:border-box;overflow:hidden}.mall-hero-photo{position:absolute;inset:0;width:100%;height:100%}.mall .hero-bg{background:linear-gradient(90deg,rgba(0,151,151,.97),rgba(0,156,154,.6) 55%,rgba(0,91,92,.12))}.mall .hero-content{height:100%}.mall .hero-title{font-size:51rpx;font-weight:800}.hero-subtitle{display:block;margin-top:7rpx;color:#dffbfa;font-size:23rpx}.hero-trust{display:block;margin-top:18rpx;color:#e3fbfa;font-size:18rpx}.mall .hero-search{position:absolute;left:0;right:0;bottom:14rpx;height:62rpx}.mall .hero-search-input{font-size:21rpx}.mall-catalog{display:flex;align-items:stretch;min-height:660rpx}.cats{width:150rpx;min-width:150rpx;height:660rpx;padding:0;background:#fff;border-right:1rpx solid #dbe7e6}.cat{width:150rpx;height:100rpx;padding:0;display:flex;align-items:center;justify-content:center;gap:8rpx;border-radius:0;color:#536f71;box-sizing:border-box;position:relative}.cat.active{background:#eff9f8;color:#08a4a1}.cat.active::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6rpx;background:#08aaa6}.cat-icon{display:none}.cat-name{font-size:23rpx}.goods-grid{flex:1;min-width:0;margin:0;padding:10rpx;display:flex;flex-direction:column;gap:10rpx}.goods{height:142rpx;padding:10rpx;display:grid;grid-template-columns:128rpx 1fr 60rpx;grid-template-rows:35rpx 33rpx 38rpx 22rpx;column-gap:12rpx;border:1rpx solid #dce8e7;border-radius:11rpx;background:#fff}.goods-cover{grid-row:1/5;width:128rpx;height:120rpx;border-radius:8rpx;overflow:hidden}.goods-name{grid-column:2/4;font-size:23rpx}.goods-subtitle{grid-column:2/4;font-size:18rpx}.goods-foot{grid-column:2/4;display:flex;align-items:center}.goods-price{font-size:27rpx}.goods-add{margin-left:auto;width:42rpx;height:42rpx;font-size:31rpx}.goods-sales{grid-column:2/4;font-size:16rpx}.goods-cover-emoji{display:none}.cart-fab{display:none}.cart-bar{left:20rpx;right:20rpx;bottom:calc(104rpx + env(safe-area-inset-bottom));height:78rpx;border-radius:99rpx;background:#0aa9a5}.cart-bar-info{flex-direction:row;align-items:center;gap:18rpx}.cart-bar-count{color:#fff}.cart-bar-amount{font-size:27rpx}.cart-bar-btn{border-left:1rpx solid rgba(255,255,255,.45);background:transparent}
.catalog-state{flex:1;min-width:0;min-height:660rpx;padding:72rpx 28rpx;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;background:#f7fbfb}.catalog-empty .catalog-state{width:100%}.catalog-state .empty-mark{margin-top:18rpx}.empty-desc{display:block;max-width:460rpx;margin-top:12rpx;color:#718486;font-size:22rpx;line-height:1.6}.retry-btn{height:70rpx;margin-top:26rpx;padding:0 42rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#0aa9a5;color:#fff;font-size:24rpx;font-weight:700}.state-spinner{width:52rpx;height:52rpx;margin:34rpx 0 24rpx;border:6rpx solid #d6eeec;border-top-color:#08aaa6;border-radius:50%;animation:mall-spin .8s linear infinite}.error-mark::after{display:none}.error-mark::before{left:44rpx;right:auto;top:22rpx;width:7rpx;height:42rpx;border:0;border-radius:99rpx;background:#f0a500;box-shadow:0 51rpx 0 -1rpx #f0a500}@keyframes mall-spin{to{transform:rotate(360deg)}}
</style>
