<template>
	<view class="app refund-apply">
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
				uni.redirectTo({ url: '/pages/login/login' })
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
	.card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.card-title { display: block; font-size: 30rpx; font-weight: 800; color: #1a2030; margin-bottom: 16rpx; }
	.row { display: flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx dashed #eef0f5; }
	.row:last-child { border-bottom: 0; }
	.row-k { color: #9aa3b2; font-size: 26rpx; }
	.row-v { color: #1a2030; font-size: 28rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
	.row-v.price { color: #b8860b; }
	.form-row { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx dashed #eef0f5; }
	.form-row.col { flex-direction: column; align-items: stretch; }
	.form-row:last-child { border-bottom: 0; }
	.form-k { width: 180rpx; color: #6b7280; font-size: 26rpx; }
	.form-row.col .form-k { width: auto; margin-bottom: 12rpx; }
	.form-input { flex: 1; height: 64rpx; font-size: 32rpx; font-weight: 700; color: #1a2030; }
	.form-textarea { width: 100%; min-height: 200rpx; background: #f6f7fa; border-radius: 16rpx; padding: 20rpx; font-size: 26rpx; color: #1a2030; box-sizing: border-box; }
	.tips { margin: 8rpx 8rpx 0; }
	.tips text { display: block; color: #9aa3b2; font-size: 24rpx; line-height: 40rpx; }
	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 24rpx 28rpx env(safe-area-inset-bottom); background: #fff; display: flex; gap: 16rpx; box-shadow: 0 -6rpx 20rpx rgba(26,32,48,.06); }
	.btn { flex: 1; height: 88rpx; border-radius: 999rpx; font-size: 30rpx; font-weight: 800; }
	.btn.ghost { background: #f4f5f7; color: #6b7280; }
	.btn.primary { background: #f5c23b; color: #1a1306; }
	.btn[disabled] { opacity: .6; }
</style>
