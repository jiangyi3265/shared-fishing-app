<template>
	<view class="app recharge">
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
			if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login' }); return }
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
	.head { padding: 40rpx 28rpx; background: linear-gradient(135deg,#1a1a1a,#2e2e2e); color: #fff; }
	.head-label { display: block; font-size: 24rpx; color: #f5c23b; letter-spacing: 4rpx; }
	.head-amount { display: block; font-size: 60rpx; font-weight: 800; margin-top: 14rpx; font-variant-numeric: tabular-nums; }

	.section { margin: 24rpx 28rpx; padding: 24rpx 24rpx 28rpx; background: #fff; border-radius: 22rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.section-title { display: block; font-size: 28rpx; font-weight: 800; color: #1a2030; margin-bottom: 20rpx; }

	.plans { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
	.plan { position: relative; padding: 28rpx 16rpx; border-radius: 22rpx; background: #fafbfd; border: 2rpx solid transparent; display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
	.plan.active { background: linear-gradient(135deg,#fff7e0,#ffeed1); border-color: #f5c23b; box-shadow: 0 6rpx 18rpx rgba(245,194,59,.25); }
	.plan-badge { position: absolute; top: -16rpx; right: -16rpx; padding: 6rpx 16rpx; border-radius: 999rpx 999rpx 999rpx 0; background: #1a2030; color: #f5c23b; font-size: 20rpx; font-weight: 700; }
	.plan-amount { font-size: 44rpx; font-weight: 800; color: #1a2030; font-variant-numeric: tabular-nums; }
	.plan-bonus { color: #b8860b; font-size: 22rpx; font-weight: 700; }
	.plan-title { color: #6b7280; font-size: 22rpx; }

	.custom { display: flex; align-items: center; padding: 20rpx 24rpx; border-radius: 18rpx; background: #fafbfd; gap: 8rpx; }
	.custom-currency { font-size: 36rpx; font-weight: 800; color: #1a2030; }
	.custom-input { flex: 1; height: 64rpx; font-size: 36rpx; font-weight: 800; color: #1a2030; }

	.agree { margin: 18rpx 36rpx; }
	.agree text { display: block; color: #9aa3b2; font-size: 22rpx; line-height: 38rpx; }

	.footer { position: fixed; left: 0; right: 0; bottom: 0; padding: 20rpx 28rpx env(safe-area-inset-bottom); background: #fff; display: flex; align-items: center; gap: 20rpx; box-shadow: 0 -6rpx 20rpx rgba(26,32,48,.06); }
	.footer-info { flex: 1; display: flex; flex-direction: column; }
	.footer-label { color: #9aa3b2; font-size: 22rpx; }
	.footer-amount { color: #b8860b; font-size: 40rpx; font-weight: 800; font-variant-numeric: tabular-nums; }
	.footer-bonus { color: #16a34a; font-size: 22rpx; font-weight: 700; }
	.pay-btn { background: #1a2030; color: #f5c23b; padding: 0 60rpx; height: 88rpx; line-height: 88rpx; border-radius: 999rpx; font-size: 30rpx; font-weight: 800; }
	.pay-btn[disabled] { opacity: .5; }
</style>
