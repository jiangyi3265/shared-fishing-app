<template>
	<view class="app wallet">
		<view class="card">
			<view class="card-bg"></view>
			<view class="card-content">
				<text class="card-label">储值余额</text>
				<view class="card-amount">
					<text class="card-currency">¥</text>
					<text class="card-number">{{ formatMoney(balance && balance.balanceCents) }}</text>
				</view>
				<view class="card-stats">
					<view class="card-stat">
						<text class="card-stat-num">¥{{ formatMoney(balance && balance.totalRechargeCents) }}</text>
						<text class="card-stat-label">累计充值</text>
					</view>
					<view class="card-stat-sep"></view>
					<view class="card-stat">
						<text class="card-stat-num">¥{{ formatMoney(balance && balance.totalConsumedCents) }}</text>
						<text class="card-stat-label">累计消费</text>
					</view>
				</view>
				<button class="recharge-btn" @click="goRecharge">立即充值</button>
			</view>
		</view>

		<view class="section">
			<view class="section-head">
				<text class="section-title">最近交易</text>
				<text class="section-link" @click="refresh">刷新 ↻</text>
			</view>
			<view v-if="!logs.length" class="empty">
				<text>暂无交易记录</text>
			</view>
			<view v-for="l in logs" :key="l.logId" class="log">
				<view class="log-info">
					<text class="log-type">{{ typeLabel[l.type] || l.type }}</text>
					<text class="log-time">{{ formatDatetime(l.createTime) }}</text>
					<text v-if="l.remark" class="log-remark">{{ l.remark }}</text>
				</view>
				<view class="log-amounts">
					<text :class="['log-delta', l.deltaCents >= 0 ? 'plus' : 'minus']">
						{{ l.deltaCents >= 0 ? '+' : '' }}¥{{ formatMoney(Math.abs(l.deltaCents)) }}
					</text>
					<text class="log-balance">余额 ¥{{ formatMoney(l.balanceAfterCents) }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { fetchWallet, BALANCE_TYPE_LABEL } from '../../utils/walletStore.js'
	import { formatMoney, formatDatetime, isLoggedIn } from '../../utils/fishingStore.js'

	export default {
		data() {
			return { balance: null, logs: [], typeLabel: BALANCE_TYPE_LABEL }
		},
		onShow() {
			if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login' }); return }
			this.refresh()
		},
		methods: {
			formatMoney(c) { return formatMoney(c || 0) },
			formatDatetime,
			refresh() {
				fetchWallet().then((data) => {
					this.balance = data && data.balance
					this.logs = (data && data.logs) || []
				}).catch(() => {})
			},
			goRecharge() { uni.navigateTo({ url: '/pages/wallet/recharge' }) }
		}
	}
</script>

<style>
	.wallet { padding-bottom: 60rpx; }

	.card { position: relative; margin: 28rpx; padding: 40rpx 32rpx 32rpx; border-radius: 28rpx; overflow: hidden; box-shadow: 0 14rpx 32rpx rgba(26,32,48,.12); }
	.card-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 60%, #b8860b 100%); }
	.card-content { position: relative; z-index: 1; color: #fff; }
	.card-label { color: #f5c23b; font-size: 24rpx; letter-spacing: 4rpx; }
	.card-amount { display: flex; align-items: baseline; margin-top: 16rpx; }
	.card-currency { color: #fff; font-size: 44rpx; font-weight: 700; }
	.card-number { color: #fff; font-size: 96rpx; font-weight: 800; font-variant-numeric: tabular-nums; margin-left: 6rpx; letter-spacing: 1rpx; }

	.card-stats { display: flex; align-items: center; margin-top: 28rpx; padding: 20rpx; border-radius: 18rpx; background: rgba(255,255,255,.08); }
	.card-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
	.card-stat-num { color: #fff; font-size: 28rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
	.card-stat-label { color: #d8d8d8; font-size: 22rpx; }
	.card-stat-sep { width: 1rpx; height: 50rpx; background: rgba(255,255,255,.18); }

	.recharge-btn { margin-top: 32rpx; height: 92rpx; line-height: 92rpx; border-radius: 999rpx; background: #f5c23b; color: #1a1306; font-size: 32rpx; font-weight: 800; box-shadow: 0 10rpx 24rpx rgba(245,194,59,.4); }

	.section { margin: 24rpx 28rpx; padding: 28rpx; background: #fff; border-radius: 22rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
	.section-title { font-size: 30rpx; font-weight: 800; color: #1a2030; }
	.section-link { color: #b8860b; font-size: 24rpx; font-weight: 700; }
	.empty { text-align: center; color: #9aa3b2; font-size: 26rpx; padding: 60rpx 0; }

	.log { display: flex; justify-content: space-between; padding: 22rpx 0; border-bottom: 1rpx dashed #eef0f5; }
	.log:last-child { border-bottom: 0; }
	.log-info { display: flex; flex-direction: column; gap: 4rpx; flex: 1; }
	.log-type { color: #1a2030; font-size: 28rpx; font-weight: 700; }
	.log-time { color: #9aa3b2; font-size: 22rpx; }
	.log-remark { color: #6b7280; font-size: 22rpx; }
	.log-amounts { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
	.log-delta { font-size: 30rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
	.log-delta.plus { color: #16a34a; }
	.log-delta.minus { color: #dc2626; }
	.log-balance { color: #9aa3b2; font-size: 22rpx; }
</style>
