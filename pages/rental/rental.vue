<template>
	<view class="app rental-page has-account-tabbar has-brand-header">
		<brand-header title="装备租赁" theme="light" layout="compact" :back="true" />
		<view class="balance-tip">
			<text class="balance-tip-label">储值余额</text>
			<text class="balance-tip-amount">¥{{ formatMoney(walletBalance) }}</text>
			<text class="balance-tip-link" @click="goRecharge">立即充值</text>
		</view>
		<view class="rental-tabs"><text :class="{active:activeTab==='goods'}" @click="activeTab='goods'">可租装备</text><text :class="{active:activeTab==='orders'}" @click="activeTab='orders'">我的租赁（{{ myOrders.length }}）</text></view>
		<view v-if="loading" class="tab-state">正在读取租赁信息…</view>
		<view v-else-if="loadError" class="tab-state state-error" @click="loadData">{{ loadError }} · 点击重试</view>
		<view v-else-if="activeTab==='goods' && !goods.length" class="tab-state">暂无可租装备，请联系钓场工作人员</view>
		<view v-if="!loading && !loadError && activeTab==='goods'" class="rental-list">
			<view class="rental-card" v-for="g in goods" :key="g.goodsId">
				<view class="rental-img"><equipment-thumb :name="g.name" /></view>
				<view class="rental-info">
					<text class="rental-name">{{ g.name }}</text>
					<text class="rental-cat">{{ g.category }}</text>
					<view class="rental-prices">
						<text class="rental-rent">租金 ¥{{ (g.rentCents/100).toFixed(2) }}/{{ g.rentUnit==='per_hour'?'小时':'次' }}</text>
						<text v-if="g.depositCents" class="rental-deposit">押金 ¥{{ (g.depositCents/100).toFixed(2) }}</text>
					</view>
					<text class="rental-charge">需余额 ¥{{ formatMoney(totalCharge(g)) }}</text>
				</view>
				<view class="rental-btn" :class="{ warn: balanceReady && !canAfford(g) }" @click="doRent(g)">
					{{ balanceReady && !canAfford(g) ? '去充值' : '租借' }}
				</view>
			</view>
		</view>
		<view v-if="!loading && !loadError && activeTab==='orders' && !myOrders.length" class="tab-state">暂无租赁记录</view>
		<view v-if="!loading && !loadError && activeTab==='orders'" class="my-list orders-tab-list">
			<view class="my-item" v-for="o in myOrders" :key="o.orderId">
				<text class="my-name">{{ o.goodsName }}</text>
				<text class="my-status">{{ {0:'租借中',1:'已归还',2:'已取消',3:'押金扣除'}[o.status] }}</text>
			</view>
		</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
import { fetchRentalList, rentEquipment, fetchMyRentals, formatMoney } from '../../utils/fishingStore.js'
import { fetchWallet } from '../../utils/walletStore.js'
export default {
	data() { return { goods: [], myOrders: [], walletBalance: 0, balanceReady: false, activeTab: 'goods', loading: true, loadError: '' } },
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			this.loadError = ''
			Promise.all([
				fetchRentalList(),
				fetchMyRentals(),
				fetchWallet()
			]).then(([goods, orders, data]) => {
				this.goods = Array.isArray(goods) ? goods : []
				this.myOrders = Array.isArray(orders) ? orders : []
				const balance = data && data.balance
				this.walletBalance = balance && balance.balanceCents ? balance.balanceCents : 0
				this.balanceReady = true
			}).catch((error) => {
				this.walletBalance = 0
				this.balanceReady = true
				this.loadError = (error && (error.msg || error.message)) || '租赁信息加载失败'
			}).finally(() => { this.loading = false })
		},
		formatMoney(cents) {
			return formatMoney(cents || 0)
		},
		totalCharge(g) {
			return (g && g.rentCents ? g.rentCents : 0) + (g && g.depositCents ? g.depositCents : 0)
		},
		canAfford(g) {
			return this.walletBalance >= this.totalCharge(g)
		},
		goRecharge() {
			uni.navigateTo({ url: '/pages/wallet/recharge' })
		},
		errorMessage(error) {
			return (error && (error.msg || error.message || error.errMsg)) || '租借失败，请稍后再试'
		},
		isBalanceError(message) {
			return String(message || '').includes('余额不足') || String(message || '').includes('储值余额不足')
		},
		showInsufficientBalance(g, serverMessage) {
			const total = this.totalCharge(g)
			const missing = Math.max(0, total - this.walletBalance)
			const depositText = g.depositCents ? `，其中押金 ¥${this.formatMoney(g.depositCents)}` : ''
			const content = serverMessage && serverMessage !== '余额不足'
				? serverMessage
				: `租借「${g.name}」需要余额 ¥${this.formatMoney(total)}${depositText}。当前余额 ¥${this.formatMoney(this.walletBalance)}，还差 ¥${this.formatMoney(missing)}。请先充值后再租借。`
			uni.showModal({
				title: '余额不足',
				content,
				cancelText: '取消',
				confirmText: '去充值',
				success: res => {
					if (res.confirm) this.goRecharge()
				}
			})
		},
		doRent(g) {
			if (this.balanceReady && !this.canAfford(g)) {
				this.showInsufficientBalance(g)
				return
			}
			const total = this.totalCharge(g)
			const depositText = g.depositCents ? `，押金 ¥${this.formatMoney(g.depositCents)}` : ''
			uni.showModal({ title: '确认租借', content: `租借「${g.name}」？将从余额扣除 ¥${this.formatMoney(total)}（租金 ¥${this.formatMoney(g.rentCents)}${depositText}）。`, success: res => {
				if (res.confirm) rentEquipment(g.goodsId).then(() => {
					uni.showToast({title:'租借成功'})
					this.loadData()
				}).catch(e => {
					const msg = this.errorMessage(e)
					if (this.isBalanceError(msg)) {
						this.showInsufficientBalance(g, msg)
						return
					}
					uni.showToast({title: msg, icon:'none'})
				})
			}})
		}
	}
}
</script>

<style scoped>
.rental-page { padding: 0 24rpx 40rpx; }
.page-head { padding: 40rpx 4rpx 16rpx; }
.page-head-title { font-size: 38rpx; font-weight: 600; color: var(--text-main); letter-spacing: 0.5rpx; }
.balance-tip { margin: 0 0 20rpx; padding: 18rpx 22rpx; display: flex; align-items: center; gap: 14rpx; background: var(--gold-bg); border: 1rpx solid rgba(199,146,43,0.22); border-radius: var(--r-sm); }
.balance-tip-label { font-size: 24rpx; color: var(--text-muted); }
.balance-tip-amount { flex: 1; font-size: 30rpx; color: var(--gold-ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.balance-tip-link { padding: 8rpx 20rpx; border-radius: var(--r-pill); background: var(--g-900); color: var(--gold-line); font-size: 24rpx; font-weight: 600; }
.rental-list { display: flex; flex-direction: column; gap: 16rpx; }
.rental-card { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: var(--r); padding: 22rpx; display: flex; align-items: center; gap: 20rpx; }
.rental-img { width: 100rpx; height: 100rpx; border-radius: var(--r-sm); flex-shrink: 0; }
.rental-placeholder { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,var(--g-50),var(--g-100)); }
.rental-info { flex: 1; min-width: 0; }
.rental-name { font-size: 29rpx; font-weight: 600; display: block; color: var(--text-main); }
.rental-cat { font-size: 22rpx; color: var(--text-light); }
.rental-prices { margin-top: 10rpx; }
.rental-rent { font-size: 26rpx; color: var(--gold); font-weight: 500; }
.rental-deposit { font-size: 22rpx; color: var(--text-muted); margin-left: 12rpx; }
.rental-charge { display: block; margin-top: 6rpx; font-size: 22rpx; color: var(--text-muted); }
.rental-btn { background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; padding: 14rpx 30rpx; border-radius: 99rpx; font-size: 25rpx; font-weight: 500; flex-shrink: 0; }
.rental-btn.warn { background: var(--g-600); color: #fff; }
.rental-btn:active { transform: scale(0.96); }
.section-title { font-size: 30rpx; font-weight: 600; margin: 28rpx 0 14rpx; color: var(--text-main); }
.my-list { display: flex; flex-direction: column; gap: 12rpx; }
.my-item { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: var(--r-sm); padding: 22rpx 24rpx; display: flex; justify-content: space-between; align-items: center; }
.my-name { font-size: 27rpx; color: var(--text-main); font-weight: 600; }
.my-status { font-size: 23rpx; color: var(--text-muted); background: var(--surface-soft); padding: 4rpx 14rpx; border-radius: 99rpx; }
</style>

<style scoped>
.rental-page{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.page-head{display:none}.balance-tip{height:114rpx;padding:20rpx 24rpx;box-sizing:border-box;display:grid;grid-template-columns:1fr auto;grid-template-rows:30rpx 42rpx;border:1rpx solid #d7e5e4;border-radius:14rpx;background:#fff}.balance-tip-label{font-size:21rpx}.balance-tip-amount{grid-row:2;font-size:35rpx;color:#079f9d}.balance-tip-link{grid-column:2;grid-row:1/3;align-self:center;padding:9rpx 16rpx;border-radius:8rpx;background:#0aa9a5;color:#fff;font-size:19rpx}.rental-tabs{height:70rpx;margin-top:14rpx;display:flex;align-items:center;justify-content:space-around;border:1rpx solid #d8e5e4;border-radius:13rpx 13rpx 0 0;background:#fff;color:#617577;font-size:22rpx}.rental-tabs text{height:70rpx;display:flex;align-items:center;position:relative}.rental-tabs .active{color:#08a5a2;font-weight:800}.rental-tabs .active::after{content:'';position:absolute;left:0;right:0;bottom:0;height:5rpx;background:#08a5a2}.rental-list{gap:0;border:1rpx solid #d8e5e4;border-top:0;border-radius:0 0 13rpx 13rpx;background:#fff}.rental-card{min-height:124rpx;margin:0;padding:13rpx 16rpx;border:0;border-bottom:1rpx solid #e0e9e8;border-radius:0}.rental-card:last-child{border-bottom:0}.rental-img{width:110rpx;height:96rpx;border-radius:8rpx;overflow:hidden}.rental-info{gap:4rpx}.rental-name{font-size:23rpx}.rental-cat{display:none}.rental-prices{gap:10rpx}.rental-rent{font-size:22rpx;color:#079f9d}.rental-deposit{font-size:17rpx}.rental-charge{font-size:17rpx}.rental-btn{padding:8rpx 12rpx;border-radius:7rpx;background:#0aa9a5;font-size:18rpx}.section-title{font-size:24rpx}.my-item{border-radius:10rpx}
.rental-page{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.page-head{display:none}.balance-tip{height:114rpx;padding:20rpx 24rpx;box-sizing:border-box;display:grid;grid-template-columns:1fr auto;grid-template-rows:30rpx 42rpx;border:1rpx solid #d7e5e4;border-radius:14rpx;background:#fff}.balance-tip-label{font-size:21rpx}.balance-tip-amount{grid-row:2;font-size:35rpx;color:#079f9d}.balance-tip-link{grid-column:2;grid-row:1/3;align-self:center;padding:9rpx 16rpx;border-radius:8rpx;background:#0aa9a5;color:#fff;font-size:19rpx}.rental-tabs{height:70rpx;margin-top:14rpx;display:flex;align-items:center;justify-content:space-around;border:1rpx solid #d8e5e4;border-radius:13rpx 13rpx 0 0;background:#fff;color:#617577;font-size:22rpx}.rental-tabs text{height:70rpx;display:flex;align-items:center;position:relative}.rental-tabs .active{color:#08a5a2;font-weight:800}.rental-tabs .active::after{content:'';position:absolute;left:0;right:0;bottom:0;height:5rpx;background:#08a5a2}.tab-state{min-height:180rpx;padding:46rpx 28rpx;box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;border:1rpx solid #d8e5e4;border-top:0;border-radius:0 0 13rpx 13rpx;background:#fff;color:#6b7f81;font-size:22rpx}.state-error{color:#95600b;background:#fffaf0}.rental-list{gap:0;border:1rpx solid #d8e5e4;border-top:0;border-radius:0 0 13rpx 13rpx;background:#fff}.rental-card{min-height:124rpx;margin:0;padding:13rpx 16rpx;border:0;border-bottom:1rpx solid #e0e9e8;border-radius:0}.rental-card:last-child{border-bottom:0}.rental-img{width:110rpx;height:96rpx;border-radius:8rpx;overflow:hidden}.rental-info{gap:4rpx}.rental-name{font-size:23rpx}.rental-cat{display:none}.rental-prices{gap:10rpx}.rental-rent{font-size:22rpx;color:#079f9d}.rental-deposit{font-size:17rpx}.rental-charge{font-size:17rpx}.rental-btn{padding:8rpx 12rpx;border-radius:7rpx;background:#0aa9a5;font-size:18rpx}.section-title{font-size:24rpx}.orders-tab-list{padding:14rpx;border:1rpx solid #d8e5e4;border-top:0;border-radius:0 0 13rpx 13rpx;background:#fff}.my-item{border-radius:10rpx}
</style>
