<template>
	<view class="app refund-list has-account-tabbar has-brand-header">
		<brand-header title="退款记录" theme="light" layout="compact" :back="true" />
		<view v-if="!list.length" class="empty">
			<text class="empty-emoji">💸</text>
			<text class="empty-title">暂无退款记录</text>
			<text class="empty-desc">已完成订单可申请退款</text>
		</view>
		<view v-for="r in list" :key="r.refundId" class="item">
			<view class="head">
				<text class="rno">{{ r.refundNo }}</text>
				<view class="pill" :class="pillClass(r.status)">{{ statusLabel[r.status] || '未知' }}</view>
			</view>
			<view class="row"><text class="k">订单类型</text><text class="v">
				<text class="type-tag" :class="r.orderType === 'mall' ? 'type-mall' : 'type-fishing'">
					{{ r.orderType === 'mall' ? '补给' : '钓场' }}
				</text>
			</text></view>
			<view class="row"><text class="k">订单号</text><text class="v">{{ r.orderNo }}</text></view>
			<view class="row"><text class="k">申请金额</text><text class="v price">¥{{ formatMoney(r.applyAmountCents) }}</text></view>
			<view class="row" v-if="r.status === 2"><text class="k">实退金额</text><text class="v price">¥{{ formatMoney(r.refundAmountCents) }}</text></view>
			<view class="row"><text class="k">原因</text><text class="v dim">{{ r.reason || '--' }}</text></view>
			<view class="row" v-if="r.auditRemark"><text class="k">审批意见</text><text class="v dim">{{ r.auditRemark }}</text></view>
			<view class="row"><text class="k">提交时间</text><text class="v dim">{{ formatDatetime(r.createTime) }}</text></view>
		</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	import {
		REFUND_STATUS,
		formatMoney,
		formatDatetime,
		fetchMyRefunds,
		getUser,
		isLoggedIn
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				list: [],
				statusLabel: {
					[REFUND_STATUS.PENDING]: '待审核',
					[REFUND_STATUS.REFUNDING]: '退款中',
					[REFUND_STATUS.DONE]: '已完成',
					[REFUND_STATUS.REJECTED]: '已驳回',
					[REFUND_STATUS.FAILED]: '退款失败'
				}
			}
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/refund/list') })
				return
			}
			const user = getUser()
			if (!user) return
			fetchMyRefunds(user.userId).then((rows) => { this.list = rows }).catch(() => {})
		},
		methods: {
			formatMoney,
			formatDatetime,
			pillClass(s) {
				if (s === REFUND_STATUS.PENDING) return 'pill-pending'
				if (s === REFUND_STATUS.REFUNDING) return 'pill-running'
				if (s === REFUND_STATUS.DONE) return 'pill-paid'
				if (s === REFUND_STATUS.REJECTED) return 'pill-cancel'
				if (s === REFUND_STATUS.FAILED) return 'pill-cancel'
				return 'pill-idle'
			}
		}
	}
</script>

<style>
	.refund-list { padding: 20rpx 28rpx 60rpx; }
	.empty { margin: 80rpx 0; padding: 80rpx 40rpx; background: var(--surface); border-radius: var(--r); text-align: center; }
	.empty-emoji { display: block; font-size: 72rpx; margin-bottom: 16rpx; }
	.empty-title { display: block; font-size: 30rpx; font-weight: 500; color: var(--ink); }
	.empty-desc { display: block; color: var(--ink-2); font-size: 26rpx; margin-top: 10rpx; }
	.item { background: var(--surface); border-radius: var(--r); padding: 24rpx; margin-bottom: 20rpx; }
	.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; }
	.rno { font-size: 24rpx; color: var(--ink-2); letter-spacing: 1rpx; }
	.row { display: flex; justify-content: space-between; padding: 8rpx 0; }
	.k { color: var(--ink-3); font-size: 26rpx; }
	.v { color: var(--ink); font-size: 26rpx; font-weight: 600; font-variant-numeric: tabular-nums; max-width: 60%; text-align: right; }
	.v.dim { color: var(--ink-2); font-weight: 400; }
	.v.price { color: var(--gold); }
	.pill { padding: 6rpx 18rpx; border-radius: var(--r-pill); font-size: 22rpx; font-weight: 500; }
	.pill-pending { background: var(--gold-bg); color: var(--gold); }
	.pill-running { background: var(--g-50); color: var(--jade); }
	.pill-paid    { background: var(--g-50); color: var(--ink); }
	.pill-cancel  { background: var(--danger-bg); color: var(--danger); }
	.pill-idle    { background: var(--bg); color: var(--ink-2); }
	.type-tag { padding: 4rpx 14rpx; border-radius: var(--r-pill); font-size: 22rpx; font-weight: 500; }
	.type-fishing { background: var(--g-50); color: var(--jade); }
	.type-mall    { background: var(--g-50); color: var(--ink); }
</style>

<style>
.refund-list{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.refund-list::before{content:'全部　　　　审核中　　　　已完成';height:66rpx;display:flex;align-items:center;justify-content:center;border-bottom:1rpx solid #dce7e6;color:#566f71;font-size:22rpx;white-space:pre}.refund-list .item{margin:14rpx 0 0;padding:18rpx;border:1rpx solid #d7e5e4;border-radius:12rpx;background:#fff}.refund-list .head{padding-bottom:11rpx}.refund-list .rno{font-size:21rpx}.refund-list .row{min-height:40rpx}.refund-list .k,.refund-list .v{font-size:19rpx}.refund-list .price{font-size:25rpx}.empty-emoji{display:none}
</style>
