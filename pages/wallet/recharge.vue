<template>
	<view class="app recharge has-brand-header">
		<brand-header title="钱包充值" theme="light" layout="compact" :back="true" />
		<view class="head">
			<text class="head-label">当前余额</text>
			<text class="head-amount">¥{{ formatMoney(balance && balance.balanceCents) }}</text>
		</view>

		<view class="section">
			<text class="section-title">选择充值套餐</text>
			<view class="plans">
				<view v-for="p in plans" :key="p.planId"
					class="plan" :class="{ active: selectedPlanId === p.planId }"
					@click="pickPlan(p)">
					<view v-if="p.badge" class="plan-badge">{{ p.badge }}</view>
					<text class="plan-amount">¥{{ formatMoney(p.amountCents) }}</text>
					<text v-if="p.bonusCents > 0" class="plan-bonus">送 ¥{{ formatMoney(p.bonusCents) }}</text>
					<text class="plan-title">{{ p.title || '' }}</text>
				</view>
			</view>
		</view>

		<view class="section">
			<text class="section-title">或输入自定义金额</text>
			<view class="custom">
				<text class="custom-currency">¥</text>
				<input class="custom-input" type="digit" v-model="customYuan" placeholder="最少 1 元" @input="onCustom" />
			</view>
		</view>

		<view class="agree">
			<text>· 充值到账后不可提现，仅可在本钓场消费</text>
			<text>· 余额永久有效（活动赠送另有说明的除外）</text>
			<text>· 钓场费 / 现场补给均可使用</text>
		</view>

		<view class="footer">
			<view class="footer-info">
				<text class="footer-label">应付</text>
				<text class="footer-amount">¥{{ formatMoney(payAmount) }}</text>
				<text v-if="bonusAmount > 0" class="footer-bonus">实际入账 ¥{{ formatMoney(payAmount + bonusAmount) }}</text>
			</view>
			<button class="pay-btn" :disabled="submitting || payAmount <= 0" @click="submit">
				{{ submitting ? '提交中...' : '微信支付' }}
			</button>
		</view>
	</view>
</template>

<script>
	import { fetchWallet, fetchRechargePlans, submitRecharge } from '../../utils/walletStore.js'
	import { formatMoney, isLoggedIn } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				balance: null,
				plans: [],
				selectedPlanId: null,
				customYuan: '',
				submitting: false
			}
		},
		computed: {
			selectedPlan() { return this.plans.find((p) => p.planId === this.selectedPlanId) },
			payAmount() {
				if (this.selectedPlan) return this.selectedPlan.amountCents
				const cents = Math.round((Number(this.customYuan) || 0) * 100)
				return cents > 0 ? cents : 0
			},
			bonusAmount() {
				if (this.selectedPlan) return this.selectedPlan.bonusCents || 0
				return 0
			}
		},
		onShow() {
			if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/wallet/recharge') }); return }
			fetchWallet().then((data) => { this.balance = data && data.balance })
			fetchRechargePlans().then((rows) => { this.plans = rows })
		},
		methods: {
			formatMoney(c) { return formatMoney(c || 0) },
			pickPlan(p) {
				this.selectedPlanId = p.planId
				this.customYuan = ''
			},
			onCustom() { this.selectedPlanId = null },
			submit() {
				if (this.submitting) return
				if (this.payAmount <= 0) { uni.showToast({ title: '请选择套餐或输入金额', icon: 'none' }); return }
				this.submitting = true
				const body = this.selectedPlanId
					? { planId: this.selectedPlanId }
					: { amountCents: this.payAmount }
				submitRecharge(body).then((order) => {
					if (order && (order.status === 1 || order.totalCreditCents)) {
						uni.showToast({ title: '充值成功', icon: 'success' })
						setTimeout(() => uni.redirectTo({ url: '/pages/wallet/wallet' }), 800)
					} else {
						uni.redirectTo({ url: '/pages/wallet/wallet' })
					}
				}).catch((e) => {
					uni.showToast({ title: (e && e.msg) || '充值失败', icon: 'none' })
				}).finally(() => { this.submitting = false })
			}
		}
	}
</script>

<style>
	.recharge { padding: 0 0 220rpx; }
	.head { padding: 44rpx 28rpx; background: linear-gradient(135deg,var(--g-900) 0%,var(--g-950) 60%,var(--g-800) 100%); color: #fff; border-bottom-left-radius: 32rpx; border-bottom-right-radius: 32rpx; }
	.head-label { display: block; font-size: 24rpx; color: #fff; letter-spacing: 4rpx; }
	.head-amount { display: block; font-size: 60rpx; font-weight: 600; margin-top: 14rpx; font-variant-numeric: tabular-nums; }

	.section { margin: 24rpx 28rpx; padding: 24rpx 24rpx 28rpx; background: var(--surface); border-radius: var(--r); }
	.section-title { display: block; font-size: 28rpx; font-weight: 600; color: var(--ink); margin-bottom: 20rpx; }

	.plans { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
	.plan { position: relative; padding: 28rpx 16rpx; border-radius: var(--r); background: var(--surface-2); border: 2rpx solid transparent; display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
	.plan.active { background: var(--g-600); border-color: #fff; }
	.plan-badge { position: absolute; top: -16rpx; right: -16rpx; padding: 6rpx 16rpx; border-radius: 999rpx 999rpx 999rpx 0; background: var(--g-900); color: #fff; font-size: 20rpx; font-weight: 500; }
	.plan-amount { font-size: 44rpx; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
	.plan-bonus { color: var(--gold); font-size: 22rpx; font-weight: 500; }
	.plan-title { color: var(--ink-2); font-size: 22rpx; }

	.custom { display: flex; align-items: center; padding: 20rpx 24rpx; border-radius: var(--r-sm); background: var(--surface-2); gap: 8rpx; }
	.custom-currency { font-size: 36rpx; font-weight: 600; color: var(--ink); }
	.custom-input { flex: 1; height: 64rpx; font-size: 36rpx; font-weight: 600; color: var(--ink); }

	.agree { margin: 18rpx 36rpx; }
	.agree text { display: block; color: var(--ink-3); font-size: 22rpx; line-height: 38rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: var(--surface); display: flex; align-items: center; gap: 20rpx; }
	.footer-info { flex: 1; display: flex; flex-direction: column; }
	.footer-label { color: var(--ink-3); font-size: 22rpx; }
	.footer-amount { color: var(--gold); font-size: 40rpx; font-weight: 600; font-variant-numeric: tabular-nums; }
	.footer-bonus { color: var(--jade); font-size: 22rpx; font-weight: 500; }
	.pay-btn { background: linear-gradient(135deg,var(--g-700) 0%,var(--g-800) 100%); color: #fff; padding: 0 60rpx; height: 88rpx; line-height: 88rpx; border-radius: var(--r-pill); font-size: 30rpx; font-weight: 600; }
	.pay-btn[disabled] { opacity: .5; }
</style>

<style>
.recharge{min-height:100vh;padding:14rpx 20rpx calc(126rpx + env(safe-area-inset-bottom));background:#f7fbfb}.recharge .head{margin:0;padding:24rpx;border:1rpx solid #d7e5e4;border-radius:14rpx;background:#fff}.recharge .head-label{font-size:21rpx}.recharge .head-amount{margin-top:9rpx;color:#079f9d;font-size:52rpx}.recharge .section{margin:14rpx 0 0;padding:22rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.recharge .section-title{font-size:24rpx}.recharge .plans{grid-template-columns:repeat(2,1fr);gap:14rpx;margin-top:16rpx}.recharge .plan{height:146rpx;padding:20rpx 10rpx;border:1rpx solid #d8e5e4;border-radius:10rpx;background:#fff}.recharge .plan.active{border:3rpx solid #08aaa6;background:#fff}.recharge .plan-amount{color:#079f9d;font-size:35rpx}.recharge .plan-bonus{font-size:19rpx}.recharge .plan-title{font-size:18rpx}.recharge .custom{height:64rpx;margin-top:14rpx;border:1rpx solid #d5e4e2;border-radius:8rpx}.recharge .agree{margin:16rpx 0 0;padding:20rpx;color:#6f8183;font-size:19rpx}.recharge .footer{height:calc(106rpx + env(safe-area-inset-bottom));padding:10rpx 20rpx env(safe-area-inset-bottom);background:#fff}.recharge .footer-amount{color:#079f9d}.recharge .pay-btn{height:72rpx;border-radius:9rpx;background:#0aa9a5}
</style>
