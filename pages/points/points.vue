<template>
	<view class="app points-page has-brand-header">
		<brand-header title="我的积分" theme="teal" layout="stacked" :back-on-title="true" />
		<view class="points-header">
			<view class="points-card">
				<text class="points-label">可用积分</text>
				<view class="points-line"><text class="points-value">{{ myPoints }}</text><text class="points-unit">积分</text><view class="detail-btn" @click="activeTab='records'">兑换记录</view></view>
				<text class="month-points">消费每满 1 元赠 5 积分，支付成功自动到账</text>
			</view>
		</view>

		<view class="points-tabs"><text :class="{active:activeTab==='goods'}" @click="activeTab='goods'">积分兑换</text><text :class="{active:activeTab==='records'}" @click="activeTab='records'">兑换记录</text></view>
		<view v-if="loading" class="points-state">正在读取积分信息…</view>
		<view v-else-if="loadError" class="points-state state-error" @click="loadData">{{ loadError }} · 点击重试</view>
		<view v-else-if="activeTab==='goods' && !goods.length" class="points-state">暂无可兑换商品，商品由后台上架后显示</view>
		<view v-if="!loading && !loadError && activeTab==='goods' && goods.length" class="goods-list">
			<view class="goods-card" v-for="g in goods" :key="g.goodsId">
				<image v-if="g.image" :src="g.image" class="goods-img" mode="aspectFill" />
				<view class="goods-img goods-img-placeholder" v-else><view class="hic-gift"></view></view>
				<view class="goods-info">
					<text class="goods-name">{{ g.name }}</text>
					<text class="goods-cost">{{ g.pointsCost }} 积分</text>
				</view>
				<view class="goods-btn" :class="{disabled: myPoints < g.pointsCost}" @click="doExchange(g)">兑换</view>
			</view>
		</view>

		<view v-if="!loading && !loadError && activeTab==='records' && !exchanges.length" class="points-state">暂无兑换记录</view>
		<view v-if="!loading && !loadError && activeTab==='records' && exchanges.length" class="exchange-list">
			<view class="exchange-item" v-for="e in exchanges" :key="e.exchangeId">
				<text class="ex-name">{{ e.goodsName }}</text>
				<text class="ex-cost">-{{ e.pointsCost }}积分</text>
				<text class="ex-status">{{ {0:'待发放',1:'已发放',2:'已取消'}[e.status] }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchMyPoints, fetchPointsGoods, doCheckin, exchangePoints } from '../../utils/fishingStore.js'

export default {
	data() {
		return { myPoints: 0, goods: [], exchanges: [], checkedIn: false, activeTab: 'goods', loading: true, loadError: '' }
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			this.loadError = ''
			Promise.all([fetchMyPoints(), fetchPointsGoods()]).then(([data, rows]) => {
				this.myPoints = data.points || 0
				this.exchanges = data.exchanges || []
				this.goods = Array.isArray(rows) ? rows : []
			}).catch((error) => {
				this.loadError = (error && (error.msg || error.message)) || '积分信息加载失败'
			}).finally(() => { this.loading = false })
		},
		doCheckinAction() {
			if (this.checkedIn) return
			doCheckin().then(r => {
				this.checkedIn = true
				this.myPoints = r.totalPoints
				uni.showToast({ title: '签到成功 +' + r.earned + '积分' })
			}).catch(e => uni.showToast({ title: e.message || '签到失败', icon: 'none' }))
		},
		doExchange(g) {
			if (this.myPoints < g.pointsCost) { uni.showToast({ title: '积分不足', icon: 'none' }); return }
			uni.showModal({ title: '确认兑换', content: `消耗 ${g.pointsCost} 积分兑换「${g.name}」？`, success: res => {
				if (res.confirm) {
					exchangePoints(g.goodsId).then(() => {
						uni.showToast({ title: '兑换成功' })
						this.loadData()
					}).catch(e => uni.showToast({ title: e.message || '兑换失败', icon: 'none' }))
				}
			}})
		}
	}
}
</script>

<style scoped>
.points-page { padding: 0 24rpx 40rpx; }
.points-header { margin: 24rpx 0; }
.points-card { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--g-900) 0%, var(--g-950) 100%); border-radius: var(--r); padding: 40rpx 32rpx; color: #fff; display: flex; align-items: center; border: 1rpx solid rgba(245,210,133,0.16); }
.points-card::after { content: ''; position: absolute; top: -60rpx; right: -60rpx; width: 220rpx; height: 220rpx; border-radius: 50%; background: radial-gradient(circle, rgba(199,154,57,0.28), rgba(199,154,57,0) 70%); }
.points-label { position: relative; z-index: 1; font-size: 26rpx; color: var(--gold-line); letter-spacing: 2rpx; }
.points-value { position: relative; z-index: 1; font-size: 88rpx; font-weight: 300; flex: 1; margin-left: 16rpx; color: #fff; font-variant-numeric: tabular-nums; }
.checkin-btn { position: relative; z-index: 1; background: var(--g-600); color: #fff; padding: 14rpx 30rpx; border-radius: 99rpx; font-size: 26rpx; font-weight: 600; }
.section-title { font-size: 30rpx; font-weight: 600; margin: 28rpx 0 16rpx; color: var(--text-main); }

/* 兑换商品：清爽分隔列表 */
.goods-list { background: var(--surface); border: 1rpx solid rgba(17,49,40,0.05); border-radius: var(--r); overflow: hidden; }
.goods-card { padding: 22rpx 24rpx; display: flex; align-items: center; gap: 20rpx; border-bottom: 1rpx solid rgba(17,49,40,0.05); }
.goods-card:last-child { border-bottom: 0; }
.goods-img { width: 76rpx; height: 76rpx; border-radius: var(--r-sm); }
.goods-img-placeholder { display: flex; align-items: center; justify-content: center; background: var(--surface-soft); font-size: 36rpx; }
.goods-info { flex: 1; min-width: 0; }
.goods-name { font-size: 28rpx; font-weight: 500; display: block; color: var(--text-main); }
.goods-cost { font-size: 24rpx; color: var(--gold); font-weight: 500; }
.goods-btn { background: linear-gradient(135deg, var(--g-700), var(--g-800)); color: #fff; padding: 12rpx 28rpx; border-radius: 99rpx; font-size: 24rpx; font-weight: 500; }
.goods-btn.disabled { background: var(--ink-3); box-shadow: none; }

/* 兑换记录：清爽分隔列表 */
.exchange-list { background: var(--surface); border: 1rpx solid rgba(17,49,40,0.05); border-radius: var(--r); overflow: hidden; }
.exchange-item { padding: 20rpx 24rpx; display: flex; align-items: center; border-bottom: 1rpx solid rgba(17,49,40,0.05); }
.exchange-item:last-child { border-bottom: 0; }
.ex-name { flex: 1; font-size: 26rpx; color: var(--text-main); }
.ex-cost { font-size: 24rpx; color: var(--danger); font-weight: 500; margin-right: 16rpx; }
.ex-status { font-size: 22rpx; color: var(--text-light); }
</style>

<style scoped>
.points-page{min-height:100vh;padding:0 20rpx 40rpx;background:#f7fbfb}.points-header{margin:14rpx 0 16rpx}.points-card{height:190rpx;padding:26rpx 28rpx;box-sizing:border-box;display:block;border:1rpx solid #d6e5e3;border-radius:14rpx;background:#fff;color:#123f43}.points-card::after{display:none}.points-label{display:block;color:#697d7f;font-size:23rpx;letter-spacing:0}.points-line{display:flex;align-items:baseline;margin-top:8rpx}.points-value{margin:0;flex:0;color:#08a4a1;font-size:62rpx;font-weight:700;line-height:1}.points-unit{margin-left:15rpx;font-size:24rpx;color:#244e51}.detail-btn{margin-left:auto;padding:8rpx 16rpx;border:1rpx solid #0ba6a3;border-radius:99rpx;color:#0a9e9c;font-size:20rpx}.month-points{display:block;margin-top:12rpx;color:#6d8183;font-size:21rpx}.points-tabs{height:72rpx;display:flex;align-items:center;justify-content:space-around;border:1rpx solid #d8e6e5;border-radius:13rpx 13rpx 0 0;background:#fff;color:#65797b;font-size:23rpx}.points-tabs text{height:72rpx;display:flex;align-items:center;position:relative}.points-tabs .active{color:#08a5a2;font-weight:800}.points-tabs .active::after{content:'';position:absolute;left:-12rpx;right:-12rpx;bottom:0;height:5rpx;border-radius:99rpx;background:#08a5a2}.section-title{display:none}.goods-list{border-radius:0 0 13rpx 13rpx;border-top:0}.goods-card{min-height:118rpx;padding:14rpx 18rpx}.goods-img{width:92rpx;height:82rpx;border-radius:8rpx}.goods-name{font-size:23rpx}.goods-cost{font-size:24rpx;color:#e29300}.goods-btn{padding:10rpx 22rpx;border-radius:8rpx;background:#0aa9a5;font-size:21rpx}.exchange-list{margin-top:14rpx}.checkin-btn{display:none}
</style>

<style scoped>
.points-page{padding-bottom:calc(40rpx + env(safe-area-inset-bottom))}
.points-state{min-height:190rpx;padding:48rpx 30rpx;box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;border:1rpx solid #d8e6e5;border-top:0;border-radius:0 0 13rpx 13rpx;background:#fff;color:#6c8082;font-size:22rpx}.points-state.state-error{color:#95600b;background:#fffaf0}.exchange-list{margin-top:0;border-top:0;border-radius:0 0 13rpx 13rpx}
@media (max-width:360px){.points-card{height:auto;min-height:190rpx;padding-left:22rpx;padding-right:22rpx}.points-value{font-size:54rpx}.detail-btn{padding-left:12rpx;padding-right:12rpx}.goods-card{gap:12rpx}.goods-btn{padding-left:16rpx;padding-right:16rpx}}
.points-line .points-value{flex:0 0 auto;white-space:nowrap}
</style>
