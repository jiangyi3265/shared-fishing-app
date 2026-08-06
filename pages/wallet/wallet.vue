<template>
	<view class="app wallet has-account-tabbar has-brand-header">
		<brand-header title="储值余额" theme="light" layout="compact" :back="true" />
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
		<account-tabbar active="mine" />
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
			if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/wallet/wallet') }); return }
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

	.card { position: relative; margin: 28rpx; padding: 40rpx 32rpx 32rpx; border-radius: var(--r-lg); overflow: hidden; }
	.card-bg { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(135deg, var(--g-900) 0%, var(--g-950) 58%, var(--g-800) 100%); }
	.card-bg::after { content: ''; position: absolute; top: 0; right: 0; width: 100%; height: 100%; background: linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 34%, rgba(245,210,133,0.16) 100%); }
	.card-content { position: relative; z-index: 1; color: #fff; }
	.card-label { color: var(--gold-line); font-size: 24rpx; letter-spacing: 4rpx; }
	.card-amount { display: flex; align-items: baseline; margin-top: 16rpx; }
	.card-currency { color: #fff; font-size: 44rpx; font-weight: 500; }
	.card-number { color: #fff; font-size: 88rpx; font-weight: 300; font-variant-numeric: tabular-nums; margin-left: 6rpx; letter-spacing: 1rpx; }

	.card-stats { display: flex; align-items: center; margin-top: 28rpx; padding: 20rpx; border-radius: var(--r-sm); background: rgba(255,255,255,.08); }
	.card-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
	.card-stat-num { color: #fff; font-size: 28rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
	.card-stat-label { color: var(--ink-4); font-size: 22rpx; }
	.card-stat-sep { width: 1rpx; height: 50rpx; background: rgba(255,255,255,.18); }

	.recharge-btn { margin-top: 32rpx; height: 92rpx; line-height: 92rpx; border-radius: var(--r-pill); background: var(--g-600); color: #fff; font-size: 32rpx; font-weight: 600; }

	.section { margin: 24rpx 28rpx; padding: 28rpx; background: var(--surface); border-radius: var(--r); }
	.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
	.section-title { font-size: 30rpx; font-weight: 600; color: var(--ink); }
	.section-link { color: var(--gold); font-size: 24rpx; font-weight: 500; }
	.empty { text-align: center; color: var(--ink-3); font-size: 26rpx; padding: 60rpx 0; }

	.log { display: flex; justify-content: space-between; padding: 22rpx 0; border-bottom: 1rpx dashed var(--bg); }
	.log:last-child { border-bottom: 0; }
	.log-info { display: flex; flex-direction: column; gap: 4rpx; flex: 1; }
	.log-type { color: var(--ink); font-size: 28rpx; font-weight: 500; }
	.log-time { color: var(--ink-3); font-size: 22rpx; }
	.log-remark { color: var(--ink-2); font-size: 22rpx; }
	.log-amounts { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
	.log-delta { font-size: 30rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
	.log-delta.plus { color: var(--jade); }
	.log-delta.minus { color: var(--danger); }
	.log-balance { color: var(--ink-3); font-size: 22rpx; }
</style>

<style>
.wallet{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.wallet>.card{margin:0;padding:26rpx;border:1rpx solid #d7e5e4;border-radius:14rpx;background:#fff;color:#143f42}.wallet .card-bg{display:none}.wallet .card-content{position:relative}.wallet .card-label{color:#607577;font-size:22rpx}.wallet .card-amount{margin-top:12rpx;color:#079f9d}.wallet .card-currency{font-size:36rpx}.wallet .card-number{font-size:64rpx}.wallet .card-stats{margin-top:24rpx;padding-top:20rpx;border-top:1rpx solid #dce7e6}.wallet .card-stat-num{color:#2d5759;font-size:27rpx}.wallet .card-stat-label{color:#7a8b8c;font-size:19rpx}.wallet .recharge-btn{height:70rpx;margin-top:22rpx;border-radius:9rpx;background:#0aa9a5;font-size:26rpx}.wallet .section{margin:16rpx 0 0;padding:0 22rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.wallet .section-head{height:68rpx}.wallet .section-title{font-size:24rpx}.wallet .section-link{font-size:19rpx}.wallet .log{min-height:100rpx;padding:16rpx 0}.wallet .log-type{font-size:23rpx}.wallet .log-time,.wallet .log-remark,.wallet .log-balance{font-size:18rpx}.wallet .log-delta{font-size:25rpx}
</style>
