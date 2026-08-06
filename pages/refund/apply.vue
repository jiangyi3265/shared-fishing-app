<template>
	<view class="app refund-apply has-account-tabbar has-brand-header">
		<brand-header title="申请退款" theme="light" layout="compact" :back="true" />
		<view class="card" v-if="order">
			<text class="card-title">订单信息</text>
			<view class="row"><text class="row-k">订单号</text><text class="row-v">{{ orderNoText }}</text></view>
			<view class="row"><text class="row-k">订单类型</text><text class="row-v">{{ orderType === 'mall' ? '补给订单' : '钓场订单' }}</text></view>
			<view class="row"><text class="row-k">实付金额</text><text class="row-v price">¥{{ formatMoney(order.amountPaid) }}</text></view>
			<view v-if="order.balanceCents > 0" class="row"><text class="row-k">余额抵扣</text><text class="row-v price">¥{{ formatMoney(order.balanceCents) }}</text></view>
			<view class="row"><text class="row-k">{{ orderType === 'mall' ? '支付时间' : '支付时间' }}</text><text class="row-v">{{ formatDatetime(order.paidTime) }}</text></view>
		</view>

		<view class="card">
			<text class="card-title">申请退款</text>
			<view class="form-row">
				<text class="form-k">退款金额(元)</text>
				<input class="form-input" type="digit" v-model="amountYuan" :placeholder="'最多 ' + formatMoney(maxCents)" />
			</view>
			<view class="form-row col">
				<text class="form-k">退款原因</text>
				<textarea class="form-textarea" v-model="reason" placeholder="请说明原因，便于审核（200字内）" maxlength="200" />
			</view>
		</view>

		<view class="tips">
			<text>· 提交后由钓场管理员审核，一般 24 小时内处理</text>
			<text>· 通过后退款原路返回微信支付账户，1-3 个工作日到账</text>
			<text>· 同一订单同时只能有一条进行中的退款申请</text>
		</view>

		<view class="footer">
			<button class="btn ghost" @click="goList">退款记录</button>
			<button class="btn primary" :disabled="submitting" @click="submit">{{ submitting ? '提交中...' : '提交申请' }}</button>
		</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	import {
		formatMoney,
		formatDatetime,
		fetchOrderDetail,
		applyRefund,
		isLoggedIn
	} from '../../utils/fishingStore.js'
	import { fetchMallOrderDetail, applyMallRefund } from '../../utils/mallStore.js'

	export default {
		data() {
			return {
				orderId: null,
				mallOrderId: null,
				orderType: 'fishing',
				order: null,
				amountYuan: '',
				reason: '',
				submitting: false
			}
		},
		computed: {
			maxCents() {
				if (!this.order) return 0
				if (this.orderType === 'mall') {
					// 补给订单：可退 = 实付 + 余额抵扣（余额部分原路退回余额）
					return (this.order.amountPaid || 0) + (this.order.balanceCents || 0)
				}
				return (this.order.amountPaid || 0) + (this.order.balanceCents || 0)
			},
			orderNoText() {
				if (!this.order) return ''
				return this.order.orderNo || this.order.mallOrderNo
			}
		},
		onLoad(query) {
			this.orderId = query && query.orderId
			this.mallOrderId = query && query.mallOrderId
			this.orderType = (query && query.orderType === 'mall') || this.mallOrderId ? 'mall' : 'fishing'
			if (!isLoggedIn()) {
				const target = this.orderType === 'mall'
					? '/pages/refund/apply?orderType=mall&mallOrderId=' + encodeURIComponent(this.mallOrderId || '')
					: '/pages/refund/apply?orderId=' + encodeURIComponent(this.orderId || '')
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent(target) })
				return
			}
			if (this.orderType === 'mall') {
				if (!this.mallOrderId) { uni.showToast({ title: '缺少订单ID', icon: 'none' }); return }
				fetchMallOrderDetail(this.mallOrderId).then((o) => {
					this.order = o
					const maxCents = (o && o.amountPaid || 0) + (o && o.balanceCents || 0)
					this.amountYuan = formatMoney(maxCents || (o && o.totalCents))
				}).catch(() => {})
				return
			}
			if (!this.orderId) {
				uni.showToast({ title: '缺少订单ID', icon: 'none' })
				return
			}
			fetchOrderDetail(this.orderId).then((o) => {
				this.order = o
				const maxCents = (o && o.amountPaid || 0) + (o && o.balanceCents || 0)
				this.amountYuan = formatMoney(maxCents)
			}).catch(() => {})
		},
		methods: {
			formatMoney,
			formatDatetime,
			goList() {
				uni.navigateTo({ url: '/pages/refund/list' })
			},
			submit() {
				if (this.submitting) return
				const yuan = Number(this.amountYuan)
				if (!yuan || yuan <= 0) {
					uni.showToast({ title: '请输入退款金额', icon: 'none' })
					return
				}
				const cents = Math.round(yuan * 100)
				if (cents > this.maxCents) {
					uni.showToast({ title: '退款金额超过可退额度', icon: 'none' })
					return
				}
				if (!this.reason || this.reason.length < 2) {
					uni.showToast({ title: '请填写退款原因', icon: 'none' })
					return
				}
				this.submitting = true
				const promise = this.orderType === 'mall'
					? applyMallRefund({ mallOrderId: this.mallOrderId, applyAmountCents: cents, reason: this.reason })
					: applyRefund({ orderId: this.orderId, applyAmountCents: cents, reason: this.reason })
				promise
					.then(() => {
						uni.showToast({ title: '已提交申请', icon: 'success' })
						setTimeout(() => uni.redirectTo({ url: '/pages/refund/list' }), 800)
					})
					.catch((e) => {
						uni.showToast({ title: (e && e.msg) || '提交失败', icon: 'none' })
					})
					.finally(() => { this.submitting = false })
			}
		}
	}
</script>

<style>
	.refund-apply { padding: 20rpx 28rpx 200rpx; }
	.card { background: var(--surface); border-radius: var(--r); padding: 28rpx; margin-bottom: 20rpx; }
	.card-title { display: block; font-size: 30rpx; font-weight: 600; color: var(--ink); margin-bottom: 16rpx; }
	.row { display: flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx dashed var(--bg); }
	.row:last-child { border-bottom: 0; }
	.row-k { color: var(--ink-3); font-size: 26rpx; }
	.row-v { color: var(--ink); font-size: 28rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
	.row-v.price { color: var(--gold); }
	.form-row { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx dashed var(--bg); }
	.form-row.col { flex-direction: column; align-items: stretch; }
	.form-row:last-child { border-bottom: 0; }
	.form-k { width: 180rpx; color: var(--ink-2); font-size: 26rpx; }
	.form-row.col .form-k { width: auto; margin-bottom: 12rpx; }
	.form-input { flex: 1; height: 64rpx; font-size: 32rpx; font-weight: 500; color: var(--ink); }
	.form-textarea { width: 100%; min-height: 200rpx; background: var(--surface-2); border-radius: var(--r-sm); padding: 20rpx; font-size: 26rpx; color: var(--ink); box-sizing: border-box; }
	.tips { margin: 8rpx 8rpx 0; }
	.tips text { display: block; color: var(--ink-3); font-size: 24rpx; line-height: 40rpx; }
	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 24rpx 28rpx env(safe-area-inset-bottom); background: var(--surface); display: flex; gap: 16rpx; }
	.btn { flex: 1; height: 88rpx; border-radius: var(--r-pill); font-size: 30rpx; font-weight: 600; }
	.btn.ghost { background: var(--surface-2); color: var(--ink-2); }
	.btn.primary { background: var(--g-600); color: #fff; }
	.btn[disabled] { opacity: .6; }
</style>

<style>
.refund-apply{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.refund-apply .card{margin:0 0 14rpx;padding:20rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.refund-apply .card-title{font-size:25rpx}.refund-apply .row{min-height:52rpx}.refund-apply .row-k,.refund-apply .row-v{font-size:20rpx}.refund-apply .form-row{padding:13rpx 0}.refund-apply .form-k{font-size:22rpx}.refund-apply .form-input,.refund-apply .form-textarea{border:1rpx solid #d5e4e2;border-radius:8rpx;background:#fbfdfd}.refund-apply .tips{margin:0 0 14rpx;padding:16rpx 20rpx;border:1rpx solid #efc779;border-radius:10rpx;background:#fff8ed;color:#7d6a4c;font-size:19rpx}.refund-apply .footer{position:static;padding:0;display:block}.refund-apply .footer .ghost{display:none}.refund-apply .footer .primary{width:100%;height:74rpx;border-radius:9rpx;background:#0aa9a5}
</style>
