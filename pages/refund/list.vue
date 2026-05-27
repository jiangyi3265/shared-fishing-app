<template>
	<view class="app refund-list">
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
				uni.redirectTo({ url: '/pages/login/login' })
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
	.empty { margin: 80rpx 0; padding: 80rpx 40rpx; background: #fff; border-radius: 24rpx; text-align: center; }
	.empty-emoji { display: block; font-size: 72rpx; margin-bottom: 16rpx; }
	.empty-title { display: block; font-size: 30rpx; font-weight: 700; color: #1a2030; }
	.empty-desc { display: block; color: #6b7280; font-size: 26rpx; margin-top: 10rpx; }
	.item { background: #fff; border-radius: 22rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; }
	.rno { font-size: 24rpx; color: #6b7280; letter-spacing: 1rpx; }
	.row { display: flex; justify-content: space-between; padding: 8rpx 0; }
	.k { color: #9aa3b2; font-size: 26rpx; }
	.v { color: #1a2030; font-size: 26rpx; font-weight: 600; font-variant-numeric: tabular-nums; max-width: 60%; text-align: right; }
	.v.dim { color: #6b7280; font-weight: 400; }
	.v.price { color: #b8860b; }
	.pill { padding: 6rpx 18rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 700; }
	.pill-pending { background: #fff7e0; color: #b8860b; }
	.pill-running { background: #e0f0ff; color: #1976d2; }
	.pill-paid    { background: #e3f7e3; color: #2e7d32; }
	.pill-cancel  { background: #ffe6e6; color: #c62828; }
	.pill-idle    { background: #eef0f5; color: #6b7280; }
	.type-tag { padding: 4rpx 14rpx; border-radius: 999rpx; font-size: 22rpx; font-weight: 700; }
	.type-fishing { background: #e0f0ff; color: #1976d2; }
	.type-mall    { background: #e3f7e3; color: #2e7d32; }
</style>
