<template>
	<view class="app rental-page">
		<view class="page-head"><text class="page-head-title">装备租赁</text></view>
		<view class="balance-tip">
			<text class="balance-tip-label">当前余额</text>
			<text class="balance-tip-amount">¥{{ formatMoney(walletBalance) }}</text>
			<text class="balance-tip-link" @click="goRecharge">充值</text>
		</view>
		<view class="rental-list">
			<view class="rental-card" v-for="g in goods" :key="g.goodsId">
				<image v-if="g.image" :src="g.image" class="rental-img" mode="aspectFill" />
				<view class="rental-img rental-placeholder" v-else></view>
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
		<view class="section-title" v-if="myOrders.length">我的租赁</view>
		<view class="my-list">
			<view class="my-item" v-for="o in myOrders" :key="o.orderId">
				<text class="my-name">{{ o.goodsName }}</text>
				<text class="my-status">{{ {0:'租借中',1:'已归还',2:'已取消',3:'押金扣除'}[o.status] }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchRentalList, rentEquipment, fetchMyRentals, formatMoney } from '../../utils/fishingStore.js'
import { fetchWallet } from '../../utils/walletStore.js'
export default {
	data() { return { goods: [], myOrders: [], walletBalance: 0, balanceReady: false } },
	onShow() { this.loadData() },
	methods: {
		loadData() {
			fetchRentalList().then(rows => { this.goods = rows })
			fetchMyRentals().then(rows => { this.myOrders = rows }).catch(() => {})
			fetchWallet().then(data => {
				const balance = data && data.balance
				this.walletBalance = balance && balance.balanceCents ? balance.balanceCents : 0
				this.balanceReady = true
			}).catch(() => {
				this.walletBalance = 0
				this.balanceReady = true
			})
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
.page-head-title { font-size: 38rpx; font-weight: 800; color: var(--text-main); letter-spacing: 0.5rpx; }
.balance-tip { margin: 0 0 20rpx; padding: 18rpx 22rpx; display: flex; align-items: center; gap: 14rpx; background: #fff8e5; border: 1rpx solid rgba(199,146,43,0.22); border-radius: 18rpx; }
.balance-tip-label { font-size: 24rpx; color: var(--text-muted); }
.balance-tip-amount { flex: 1; font-size: 30rpx; color: #9c710f; font-weight: 800; font-variant-numeric: tabular-nums; }
.balance-tip-link { padding: 8rpx 20rpx; border-radius: 999rpx; background: #13241f; color: #f5d285; font-size: 24rpx; font-weight: 800; }
.rental-list { display: flex; flex-direction: column; gap: 16rpx; }
.rental-card { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: 20rpx; padding: 22rpx; display: flex; align-items: center; gap: 20rpx; box-shadow: 0 6rpx 18rpx rgba(17,49,40,0.05); }
.rental-img { width: 100rpx; height: 100rpx; border-radius: 16rpx; flex-shrink: 0; }
.rental-placeholder { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#eef7f4,#e2f0ea); }
.rental-info { flex: 1; min-width: 0; }
.rental-name { font-size: 29rpx; font-weight: 800; display: block; color: var(--text-main); }
.rental-cat { font-size: 22rpx; color: var(--text-light); }
.rental-prices { margin-top: 10rpx; }
.rental-rent { font-size: 26rpx; color: #c7922b; font-weight: 700; }
.rental-deposit { font-size: 22rpx; color: var(--text-muted); margin-left: 12rpx; }
.rental-charge { display: block; margin-top: 6rpx; font-size: 22rpx; color: var(--text-muted); }
.rental-btn { background: linear-gradient(135deg,#1b745e,#104a3d); color: #fff; padding: 14rpx 30rpx; border-radius: 99rpx; font-size: 25rpx; font-weight: 700; box-shadow: 0 6rpx 14rpx rgba(16,74,61,0.2); flex-shrink: 0; }
.rental-btn.warn { background: linear-gradient(135deg,#f5d285,#c7922b); color: #352407; box-shadow: 0 6rpx 14rpx rgba(199,146,43,0.2); }
.rental-btn:active { transform: scale(0.96); }
.section-title { font-size: 30rpx; font-weight: 800; margin: 28rpx 0 14rpx; color: var(--text-main); }
.my-list { display: flex; flex-direction: column; gap: 12rpx; }
.my-item { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: 18rpx; padding: 22rpx 24rpx; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 6rpx 18rpx rgba(17,49,40,0.05); }
.my-name { font-size: 27rpx; color: var(--text-main); font-weight: 600; }
.my-status { font-size: 23rpx; color: var(--text-muted); background: var(--surface-soft); padding: 4rpx 14rpx; border-radius: 99rpx; }
</style>
