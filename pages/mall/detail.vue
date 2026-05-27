<template>
	<view class="app detail" v-if="goods">
		<view class="cover">
			<text class="cover-emoji">{{ goods.cover }}</text>
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
			<text class="card-title">补给详情</text>
			<text class="desc">{{ goods.desc }}</text>
		</view>

		<view class="footer">
			<view class="qty">
				<view class="qty-btn" @click="dec">-</view>
				<text class="qty-num">{{ qty }}</text>
				<view class="qty-btn" @click="inc">+</view>
			</view>
			<button class="btn ghost" @click="addCart">加入补给车</button>
			<button class="btn primary" @click="buyNow">立即下单</button>
		</view>
	</view>
</template>

<script>
	import { fetchGoodsDetail, addToCart } from '../../utils/mallStore.js'
	import { formatMoney } from '../../utils/fishingStore.js'

	export default {
		data() { return { goods: null, qty: 1, goodsId: null } },
		onLoad(query) {
			this.goodsId = query.goodsId
			fetchGoodsDetail(query.goodsId).then((g) => {
				if (!g) { uni.showToast({ title: '补给不存在', icon: 'none' }); return }
				this.goods = g
			})
		},
		methods: {
			formatMoney,
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
	.cover { height: 600rpx; background: linear-gradient(135deg,#fafbfd 0%, #eef0f5 100%); display: flex; align-items: center; justify-content: center; }
	.cover-emoji { font-size: 240rpx; }
	.head { background: #fff; padding: 32rpx 28rpx; }
	.name { display: block; font-size: 40rpx; font-weight: 800; color: #1a2030; }
	.subtitle { display: block; color: #9aa3b2; font-size: 26rpx; margin-top: 10rpx; }
	.meta { display: flex; justify-content: space-between; align-items: baseline; margin-top: 20rpx; }
	.price { color: #b8860b; font-size: 52rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
	.sales { color: #9aa3b2; font-size: 22rpx; }
	.share-line { margin: 24rpx 0 0; height: 68rpx; line-height: 68rpx; border-radius: 999rpx; background: #1a2030; color: #fff; font-size: 26rpx; font-weight: 800; border: 0; }
	.share-line::after { border: 0; }

	.card { margin: 20rpx 28rpx; padding: 28rpx; background: #fff; border-radius: 22rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.card-title { display: block; font-size: 28rpx; font-weight: 800; color: #1a2030; margin-bottom: 14rpx; }
	.desc { color: #3a4355; font-size: 26rpx; line-height: 44rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: #fff; display: flex; align-items: center; gap: 16rpx; box-shadow: 0 -6rpx 20rpx rgba(26,32,48,.06); }
	.qty { display: flex; align-items: center; background: #f4f5f7; border-radius: 999rpx; padding: 4rpx 8rpx; }
	.qty-btn { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; color: #1a2030; }
	.qty-num { padding: 0 16rpx; font-size: 28rpx; font-weight: 800; min-width: 40rpx; text-align: center; }
	.btn { flex: 1; height: 80rpx; border-radius: 999rpx; font-size: 28rpx; font-weight: 800; }
	.btn.ghost { background: #fff7e0; color: #b8860b; border: 1rpx solid #f0d47a; }
	.btn.primary { background: #f5c23b; color: #1a1306; }
</style>
