<template>
	<view class="app detail has-brand-header">
		<brand-header title="补给详情" theme="light" layout="compact" :back="true" />
		<view v-if="goods">
		<view class="cover">
			<product-thumb :name="goods.name" :goods-id="goods.goodsId" />
		</view>
		<view class="head">
			<text class="name">{{ goods.name }}</text>
			<text class="subtitle">{{ goods.subtitle }}</text>
			<view class="meta">
				<text class="price">¥{{ formatMoney(goods.priceCents) }}</text>
				<text class="sales">已领用 {{ goods.sales }} · 库存 {{ goods.stock }}</text>
			</view>
			<button class="share-line" open-type="share">转发给好友</button>
		</view>

		<view class="card">
			<view v-if="goods.subtitle" class="spec-row"><text>规格</text><text>{{ goods.subtitle }}</text></view>
			<view class="spec-row"><text>库存</text><text>{{ goods.stock > 0 ? goods.stock + ' 件' : '暂时售罄' }}</text></view>
			<view v-if="goods.desc" class="spec-row desc-row"><text>商品说明</text><text>{{ goods.desc }}</text></view>
		</view>

		<view class="footer">
			<view class="qty">
				<view class="qty-btn" @click="dec">-</view>
				<text class="qty-num">{{ qty }}</text>
				<view class="qty-btn" @click="inc">+</view>
			</view>
			<button class="btn ghost" :disabled="goods.stock <= 0" @click="addCart">加入补给车</button>
			<button class="btn primary" :disabled="goods.stock <= 0" @click="buyNow">{{ goods.stock > 0 ? '立即下单' : '暂时售罄' }}</button>
		</view>
		</view>
		<view v-else class="empty detail-empty">
			<text class="empty-title">{{ loading ? '正在加载补给信息' : '补给信息加载失败' }}</text>
			<text class="empty-desc">{{ loadError || '如果商品已下架，可返回补给商城重新选择' }}</text>
			<view v-if="!loading" class="empty-retry" @click="loadGoods">重新加载</view>
		</view>
	</view>
</template>

<script>
	import { fetchGoodsDetail, addToCart } from '../../utils/mallStore.js'
	import { formatMoney } from '../../utils/fishingStore.js'

	export default {
		data() { return { goods: null, qty: 1, goodsId: null, loading: true, loadError: '' } },
		onLoad(query) {
			this.goodsId = query.goodsId
			this.loadGoods()
		},
		methods: {
			formatMoney,
			loadGoods() {
				this.loading = true
				this.loadError = ''
				fetchGoodsDetail(this.goodsId).then((g) => {
					if (!g || String(g.status) !== '0') throw new Error('该商品已下架')
					this.goods = g
				}).catch((error) => {
					this.goods = null
					this.loadError = (error && (error.msg || error.message)) || '请检查网络后重试'
				}).finally(() => { this.loading = false })
			},
			inc() { if (this.qty < (this.goods.stock || 99)) this.qty++ },
			dec() { if (this.qty > 1) this.qty-- },
			addCart() {
				addToCart(this.goods, this.qty)
				uni.showToast({ title: '已加入补给车', icon: 'success' })
			},
			buyNow() {
				addToCart(this.goods, this.qty)
				uni.navigateTo({ url: '/pages/mall/checkout' })
			},
			getShareConfig() {
				if (!this.goods) return { title: '共享钓场补给', path: '/pages/mall/index' }
				return {
					title: `${this.goods.name}，钓场补给可直接下单`,
					path: '/pages/mall/detail?goodsId=' + (this.goods.goodsId || this.goodsId)
				}
			}
		}
	}
</script>

<style>
	.detail { padding-bottom: 200rpx; }
	.cover { height: 600rpx; background: linear-gradient(135deg,var(--surface-2) 0%, var(--bg) 100%); display: flex; align-items: center; justify-content: center; }
	.cover-emoji { font-size: 240rpx; }
	.head { background: var(--surface); padding: 32rpx 28rpx; }
	.name { display: block; font-size: 40rpx; font-weight: 600; color: var(--ink); }
	.subtitle { display: block; color: var(--ink-3); font-size: 26rpx; margin-top: 10rpx; }
	.meta { display: flex; justify-content: space-between; align-items: baseline; margin-top: 20rpx; }
	.price { color: var(--gold); font-size: 52rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
	.sales { color: var(--ink-3); font-size: 22rpx; }
	.share-line { margin: 24rpx 0 0; height: 68rpx; line-height: 68rpx; border-radius: var(--r-pill); background: var(--g-900); color: #fff; font-size: 26rpx; font-weight: 600; border: 0; }
	.share-line::after { border: 0; }

	.card { margin: 20rpx 28rpx; padding: 28rpx; background: var(--surface); border-radius: var(--r); }
	.card-title { display: block; font-size: 28rpx; font-weight: 600; color: var(--ink); margin-bottom: 14rpx; }
	.desc { color: var(--ink); font-size: 26rpx; line-height: 44rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: var(--surface); display: flex; align-items: center; gap: 16rpx; }
	.qty { display: flex; align-items: center; background: var(--surface-2); border-radius: var(--r-pill); padding: 4rpx 8rpx; }
	.qty-btn { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; color: var(--ink); }
	.qty-num { padding: 0 16rpx; font-size: 28rpx; font-weight: 600; min-width: 40rpx; text-align: center; }
	.btn { flex: 1; height: 80rpx; border-radius: var(--r-pill); font-size: 28rpx; font-weight: 600; }
	.btn.ghost { background: transparent; color: var(--jade); border: 1rpx solid var(--g-200); }
	.btn.primary { background: var(--g-600); color: #fff; }
</style>

<style>
.detail .btn[disabled]{opacity:.45}.detail .desc-row{align-items:flex-start;padding:18rpx 0;line-height:1.6}.detail .empty-retry{margin:28rpx auto 0;width:220rpx;height:72rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#0aa9a5;color:#fff;font-size:24rpx;font-weight:700}
</style>

<style>
.detail{min-height:100vh;padding-bottom:calc(118rpx + env(safe-area-inset-bottom));background:#f7fbfb}.detail .cover{height:520rpx;border-radius:0;background:#f1f3f2;overflow:hidden}.cover-emoji{display:none}.detail .head{margin:0;padding:22rpx 24rpx;background:#fff}.detail .name{font-size:31rpx}.detail .subtitle{margin-top:7rpx;font-size:22rpx}.detail .meta{margin-top:12rpx}.detail .price{font-size:37rpx;color:#f08d00}.share-line{display:none}.detail .card{margin:14rpx 0 0;padding:0 24rpx;border-radius:0;border:0;background:#fff}.spec-row{min-height:66rpx;display:flex;align-items:center;justify-content:space-between;gap:22rpx;border-bottom:1rpx solid #dce7e6;color:#607476;font-size:22rpx}.spec-row text:first-child{width:125rpx;flex-shrink:0}.spec-row text:last-child{text-align:right;color:#3d5c5e}.detail .footer{height:calc(100rpx + env(safe-area-inset-bottom));padding:10rpx 18rpx env(safe-area-inset-bottom);gap:10rpx;background:#fff}.detail .qty{width:125rpx}.detail .btn{height:72rpx;border-radius:99rpx;font-size:23rpx}.detail .btn.ghost{border:2rpx solid #0aa6a3;color:#0a9b99}.detail .btn.primary{background:#0aa9a5}
</style>
