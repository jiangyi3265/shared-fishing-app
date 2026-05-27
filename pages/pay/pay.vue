<template>
	<view class="app pay">
		<view v-if="!order" class="empty-wrap">
			<view class="empty">
				<view class="empty-icon">🧾</view>
				<text class="empty-title">暂无待支付订单</text>
				<text class="empty-desc">您可以返回首页开始新一轮计时</text>
				<button class="empty-btn" @click="goHome">返回首页</button>
			</view>
		</view>

		<block v-else>
			<view class="hero">
				<view class="hero-label">应付金额</view>
				<view class="hero-amount">
					<text class="hero-currency">¥</text>
					<text class="hero-number">{{ formatMoney(wxPayAmount) }}</text>
				</view>
				<view class="hero-chips">
					<view class="hero-chip"><text class="hero-chip-label">计费时长</text><text class="hero-chip-value">{{ formatDuration(order.durationSeconds || 0) }}</text></view>
					<view class="hero-chip"><text class="hero-chip-label">实际时长</text><text class="hero-chip-value">{{ formatDuration(order.elapsedSeconds || 0) }}</text></view>
				</view>
			</view>

			<view class="ticket-board">
				<view class="sheet">
					<view class="sheet-title">
						<text>账单明细</text>
						<text class="sheet-tag">{{ orderTag }}</text>
					</view>
					<view class="sheet-row">
						<text class="sheet-key">订单号</text>
						<text class="sheet-val">{{ order.orderNo }}</text>
					</view>
					<view class="sheet-row">
						<text class="sheet-key">开始时间</text>
						<text class="sheet-val">{{ formatDatetime(order.startTime) }}</text>
					</view>
					<view class="sheet-row">
						<text class="sheet-key">结束时间</text>
						<text class="sheet-val">{{ formatDatetime(order.endTime) }}</text>
					</view>
					<view class="sheet-row">
						<text class="sheet-key">费率</text>
						<text class="sheet-val">{{ ruleText }}</text>
					</view>
				</view>

				<view class="channel">
					<text class="channel-title">支付方式</text>
					<view class="channel-row">
						<view class="channel-logo">💚</view>
						<view class="channel-text">
							<text class="channel-name">微信支付</text>
							<text class="channel-desc">安全快捷完成订单支付</text>
						</view>
						<view class="channel-check">✓</view>
					</view>
				</view>

				<view v-if="unpaidMall.length" class="mall-merge">
					<view class="mall-merge-title">
						<text>合并支付未取补给</text>
						<text class="mall-merge-tip">勾选则一起付，省一笔微信操作</text>
					</view>
					<view v-for="m in unpaidMall" :key="m.mallOrderId" class="mall-row" @click="toggleMall(m)">
						<view class="mall-check" :class="{ on: selectedMallIds.includes(m.mallOrderId) }">{{ selectedMallIds.includes(m.mallOrderId) ? '✓' : '' }}</view>
						<view class="mall-info">
						<view class="mall-cover-row">
							<text v-for="(it, i) in m.items" :key="i" class="mall-cover">{{ it.cover }}</text>
						</view>
							<text class="mall-no">{{ m.mallOrderNo }}</text>
						</view>
						<text class="mall-amount">¥{{ formatMoney(m.totalCents) }}</text>
					</view>
				</view>

				<view v-if="walletBalance > 0" class="balance-card" @click="toggleBalance">
					<view class="balance-left">
						<view class="balance-icon">💰</view>
						<view class="balance-text">
							<text class="balance-title">储值余额抵扣</text>
							<text class="balance-desc">当前余额 ¥{{ formatMoney(walletBalance) }}{{ useBalance && balanceUsed > 0 ? '，本单抵扣 ¥' + formatMoney(balanceUsed) : '' }}</text>
						</view>
					</view>
					<view class="balance-switch" :class="{ on: useBalance }"><view class="balance-dot"></view></view>
				</view>

				<view class="coupon-select">
					<text class="coupon-select-title">优惠券</text>
					<view v-if="availableCoupons.length === 0" class="coupon-none">
						<text class="coupon-none-text">暂无可用优惠券</text>
					</view>
					<view v-else class="coupon-options">
						<view v-for="c in availableCoupons" :key="c.couponId" class="coupon-option" :class="{ selected: selectedCoupon && selectedCoupon.couponId === c.couponId }" @click="toggleCoupon(c)">
							<view class="coupon-opt-left">
								<text class="coupon-opt-value" v-if="c.couponType === 'duration'">{{ c.couponValue }}分钟</text>
								<text class="coupon-opt-value" v-else>-¥{{ formatMoney(c.couponValue) }}</text>
							</view>
							<view class="coupon-opt-right">
								<text class="coupon-opt-name">{{ c.title }}</text>
								<text class="coupon-opt-cond" v-if="c.couponType === 'amount' && c.minAmountCents > 0">满¥{{ formatMoney(c.minAmountCents) }}可用</text>
							</view>
							<view class="coupon-opt-check" v-if="selectedCoupon && selectedCoupon.couponId === c.couponId">✓</view>
						</view>
					</view>
				</view>
			</view>

			<view class="spacer"></view>

			<view class="dock">
				<view class="dock-amount">
					<text class="dock-amount-label">应付</text>
					<text class="dock-amount-value">¥{{ formatMoney(wxPayAmount) }}</text>
					<text v-if="discountText" class="dock-discount">{{ discountText }}</text>
				</view>
				<button class="dock-btn" :disabled="paymentBusy" :class="{ disabled: paymentBusy }" @click="payNow">
					{{ paymentBusy ? '支付中...' : '立即支付' }}
				</button>
			</view>
		</block>
	</view>
</template>

<script>
	import {
		formatMoney,
		formatDuration,
		formatDatetime,
		getUser,
		fetchPendingOrder,
		payOrder,
		isLoggedIn,
		fetchAvailableCoupons,
		applyCouponToOrder,
		COUPON_TYPE
	} from '../../utils/fishingStore.js'
	import { fetchUnpaidMallOrders } from '../../utils/mallStore.js'
	import { fetchWallet } from '../../utils/walletStore.js'

	const FALLBACK_RULE = { stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300 }

	export default {
		data() {
			return {
				order: null,
				availableCoupons: [],
				selectedCoupon: null,
				unpaidMall: [],
				selectedMallIds: [],
				walletBalance: 0,
				useBalance: false,
				paymentBusy: false
			}
		},
		computed: {
			orderRule() {
				if (this.order && this.order.ruleSnapshot) {
					try { return Object.assign({}, FALLBACK_RULE, JSON.parse(this.order.ruleSnapshot)) } catch (e) {}
				}
				return FALLBACK_RULE
			},
			ruleText() {
				return `每 ${this.orderRule.stepMinutes} 分钟 ¥${formatMoney(this.orderRule.pricePerStepCents)}`
			},
			orderTag() { return this.order ? '待支付' : '' },
			fishAmount() {
				if (!this.order) return 0
				if (!this.selectedCoupon) return this.order.amountCents
				const result = applyCouponToOrder(this.selectedCoupon, this.order.amountCents)
				if (result.discountCents > 0) {
					return Math.max(0, this.order.amountCents - result.discountCents)
				}
				if (result.discountSeconds > 0) {
					const rule = this.orderRule
					const discountCents = Math.floor(result.discountSeconds / (rule.stepMinutes * 60)) * rule.pricePerStepCents
					return Math.max(0, this.order.amountCents - discountCents)
				}
				return this.order.amountCents
			},
			mallAmount() {
				return this.unpaidMall
					.filter((m) => this.selectedMallIds.includes(m.mallOrderId))
					.reduce((acc, m) => acc + (m.totalCents || 0), 0)
			},
			finalAmount() {
				return this.fishAmount + this.mallAmount
			},
			balanceUsed() {
				if (!this.useBalance) return 0
				return Math.min(this.walletBalance || 0, this.finalAmount)
			},
			wxPayAmount() {
				return Math.max(0, this.finalAmount - this.balanceUsed)
			},
			discountText() {
				if (!this.order) return ''
				const parts = []
				if (this.selectedCoupon) {
					const saved = this.order.amountCents - this.fishAmount
					if (saved > 0) parts.push(`优惠券 -¥${formatMoney(saved)}`)
				}
				if (this.balanceUsed > 0) parts.push(`余额抵扣 -¥${formatMoney(this.balanceUsed)}`)
				return parts.join(' · ')
			}
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/pay/pay') })
				return
			}
			this.refresh()
		},
		methods: {
			refresh() {
				const user = getUser()
				if (!user) return
				fetchPendingOrder(user.userId).then((order) => {
					this.order = order
					this.selectedCoupon = null
					if (!order) { this.availableCoupons = []; this.unpaidMall = []; this.selectedMallIds = []; return }
					fetchAvailableCoupons(user.userId).then((coupons) => {
						this.availableCoupons = coupons.filter((c) => {
							if (c.couponType === COUPON_TYPE.AMOUNT && (c.minAmountCents || 0) > order.amountCents) return false
							return true
						})
					})
					fetchUnpaidMallOrders().then((rows) => {
						this.unpaidMall = rows
						// 默认全选，鼓励合并支付
						this.selectedMallIds = rows.map((m) => m.mallOrderId)
					}).catch(() => { this.unpaidMall = [] })
					fetchWallet().then((data) => {
						this.walletBalance = (data && data.balance && data.balance.balanceCents) || 0
					}).catch(() => { this.walletBalance = 0 })
				})
			},
			toggleBalance() { this.useBalance = !this.useBalance },
			toggleMall(m) {
				const idx = this.selectedMallIds.indexOf(m.mallOrderId)
				if (idx >= 0) this.selectedMallIds.splice(idx, 1)
				else this.selectedMallIds.push(m.mallOrderId)
			},
			toggleCoupon(coupon) {
				if (this.selectedCoupon && this.selectedCoupon.couponId === coupon.couponId) {
					this.selectedCoupon = null
				} else {
					this.selectedCoupon = coupon
				}
			},
			payNow() {
				if (!this.order || this.paymentBusy) return
				this.paymentBusy = true
				uni.showLoading({ title: '调起支付' })
				const user = getUser()
				const couponId = this.selectedCoupon ? this.selectedCoupon.couponId : null
				payOrder(user.userId, this.order.orderId, couponId, this.selectedMallIds, this.useBalance)
					.then((paid) => {
						uni.hideLoading()
						this.paymentBusy = false
						if (!paid) { uni.redirectTo({ url: '/pages/payResult/payResult?success=0' }); return }
						uni.redirectTo({ url: `/pages/payResult/payResult?success=1&orderId=${paid.orderId}` })
					})
					.catch((e) => {
						uni.hideLoading()
						this.paymentBusy = false
						const msg = (e && e.msg) || '支付失败，请稍后再试'
						uni.showModal({
							title: '支付未调起',
							content: msg,
							showCancel: false
						})
					})
			},
			goHome() { uni.redirectTo({ url: '/pages/index/index' }) },
			formatMoney,
			formatDuration,
			formatDatetime
		}
	}
</script>

<style>
	.pay {
		padding-bottom: 220rpx;
		background: transparent;
	}

	/* ---------------- 空闲状态 ---------------- */
	.empty-wrap {
		padding: 80rpx 32rpx;
	}

	.empty {
		background: rgba(255, 255, 255, 0.78);
		backdrop-filter: blur(20px);
		border-radius: 48rpx 16rpx;
		padding: 80rpx 40rpx;
		text-align: center;
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: var(--card-shadow);
	}

	.empty-icon {
		font-size: 96rpx;
		margin-bottom: 24rpx;
		display: block;
	}

	.empty-title {
		display: block;
		font-size: 32rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.empty-desc {
		display: block;
		color: var(--text-muted);
		font-size: 26rpx;
		margin-top: 14rpx;
		font-weight: 600;
	}

	.empty-btn {
		margin-top: 40rpx;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 99rpx;
		background: var(--accent-gradient);
		color: var(--primary);
		font-size: 30rpx;
		font-weight: 800;
		box-shadow: var(--accent-glow);
	}

	/* ---------------- 金沙账单 Hero ---------------- */
	.hero {
		margin: 24rpx 32rpx 0;
		padding: 48rpx 36rpx 44rpx;
		border-radius: 48rpx 16rpx;
		background: linear-gradient(135deg, #fffcf2 0%, #fff3cf 50%, #ffeaa8 100%);
		border: 1rpx solid rgba(224, 169, 60, 0.25);
		box-shadow: 0 16rpx 40rpx rgba(199, 154, 57, 0.15);
	}

	.hero-label {
		color: #b8860b;
		font-size: 22rpx;
		letter-spacing: 6rpx;
		font-weight: 800;
		text-transform: uppercase;
	}

	.hero-amount {
		margin-top: 18rpx;
		color: var(--primary);
		display: flex;
		align-items: baseline;
	}

	.hero-currency {
		font-size: 40rpx;
		font-weight: 800;
		margin-right: 6rpx;
	}

	.hero-number {
		font-size: 112rpx;
		font-weight: 900;
		letter-spacing: -1rpx;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.hero-chips {
		margin-top: 28rpx;
		display: flex;
		gap: 20rpx;
	}

	.hero-chip {
		flex: 1;
		padding: 18rpx 20rpx;
		border-radius: 20rpx;
		background: rgba(255, 255, 255, 0.65);
		border: 1rpx solid rgba(255, 255, 255, 0.4);
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.hero-chip-label {
		font-size: 22rpx;
		color: #8a6914;
		font-weight: 600;
	}

	.hero-chip-value {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
		font-variant-numeric: tabular-nums;
	}

	/* ---------------- 连续型黄金票据面板 ---------------- */
	.ticket-board {
		margin: 28rpx 32rpx 0;
		background: rgba(255, 255, 255, 0.82);
		backdrop-filter: blur(20px);
		border-radius: 48rpx 16rpx 48rpx 16rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: var(--card-shadow);
		padding: 12rpx 0 24rpx;
		position: relative;
		overflow: hidden;
	}

	/* ---------------- 账单详情区 ---------------- */
	.sheet {
		margin: 0;
		padding: 36rpx 36rpx;
		background: transparent;
		border: none;
		box-shadow: none;
		position: relative;
		overflow: visible;
	}

	.sheet::before,
	.sheet::after {
		content: '';
		position: absolute;
		bottom: -12rpx;
		width: 24rpx;
		height: 24rpx;
		border-radius: 50%;
		background: #edf3f0;
		z-index: 2;
	}

	.sheet::before {
		left: -12rpx;
		box-shadow: inset -4rpx 0 6rpx rgba(10, 46, 36, 0.03);
	}

	.sheet::after {
		right: -12rpx;
		box-shadow: inset 4rpx 0 6rpx rgba(10, 46, 36, 0.03);
	}

	.sheet-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 24rpx;
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.sheet-tag {
		padding: 6rpx 18rpx;
		border-radius: 99rpx;
		background: var(--warning-bg);
		color: var(--warning);
		border: 1rpx solid var(--warning-border);
		font-size: 22rpx;
		font-weight: 800;
	}

	.sheet-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 0;
		border-top: 1rpx dashed rgba(10, 46, 36, 0.05);
		font-size: 26rpx;
	}

	.sheet-key {
		color: var(--text-muted);
		font-weight: 600;
	}

	.sheet-val {
		color: var(--text-main);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	/* ---------------- 支付渠道 ---------------- */
	.channel {
		margin: 0;
		padding: 36rpx 36rpx;
		background: transparent;
		border-top: 2rpx dashed rgba(10, 46, 36, 0.06);
	}

	.channel-title {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
		display: block;
		margin-bottom: 18rpx;
	}

	.channel-row {
		padding: 24rpx;
		border-radius: 24rpx;
		background: rgba(255, 255, 255, 0.4);
		border: 1rpx solid rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.channel-logo {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		background: #ffffff;
		border: 1rpx solid rgba(10, 46, 36, 0.04);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
	}

	.channel-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.channel-name {
		font-size: 30rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.channel-desc {
		font-size: 22rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.channel-check {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: var(--success);
		color: #ffffff;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		box-shadow: 0 4rpx 10rpx rgba(16, 185, 129, 0.3);
	}

	/* ---------------- 合并支付补给 ---------------- */
	.mall-merge {
		margin: 0;
		padding: 36rpx 36rpx;
		background: transparent;
		border-top: 2rpx dashed rgba(10, 46, 36, 0.06);
		box-shadow: none;
	}

	.mall-merge-title {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		margin-bottom: 20rpx;
	}

	.mall-merge-title text:first-child {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.mall-merge-tip {
		font-size: 22rpx;
		color: #b8860b;
		font-weight: 600;
	}

	.mall-row {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 24rpx 0;
		border-top: 1rpx dashed rgba(224, 169, 60, 0.2);
	}

	.mall-row:first-of-type {
		border-top: 0;
	}

	.mall-check {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		border: 2rpx solid #c79a39;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--primary);
		font-size: 28rpx;
		font-weight: 800;
		background: #ffffff;
		transition: var(--transition);
	}

	.mall-check.on {
		background: var(--accent-gradient);
		border-color: transparent;
		color: var(--primary);
		box-shadow: var(--accent-glow);
	}

	.mall-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.mall-cover-row {
		display: flex;
		gap: 12rpx;
	}

	.mall-cover {
		font-size: 40rpx;
	}

	.mall-no {
		color: var(--text-muted);
		font-size: 22rpx;
		letter-spacing: 0.5rpx;
		font-weight: 600;
	}

	.mall-amount {
		color: #b8860b;
		font-size: 32rpx;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	/* ---------------- 储值余额抵扣 ---------------- */
	.balance-card {
		margin: 0;
		padding: 36rpx 36rpx;
		background: transparent;
		border: none;
		border-top: 2rpx dashed rgba(10, 46, 36, 0.06);
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: none;
		transition: var(--transition);
	}

	.balance-card:active {
		background: rgba(255, 255, 255, 0.3);
	}

	.balance-left {
		display: flex;
		align-items: center;
		gap: 20rpx;
		flex: 1;
	}

	.balance-icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		background: #fff8eb;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 38rpx;
		border: 1rpx solid rgba(224, 169, 60, 0.1);
	}

	.balance-text {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.balance-title {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.balance-desc {
		font-size: 22rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.balance-switch {
		width: 90rpx;
		height: 52rpx;
		border-radius: 99rpx;
		background: #e4e7ed;
		position: relative;
		transition: var(--transition);
	}

	.balance-switch.on {
		background: var(--accent-gradient);
		box-shadow: var(--accent-glow);
	}

	.balance-dot {
		position: absolute;
		top: 6rpx;
		left: 6rpx;
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.12);
		transition: var(--transition);
	}

	.balance-switch.on .balance-dot {
		left: 44rpx;
	}

	/* ---------------- 优惠券 ---------------- */
	.coupon-select {
		margin: 0;
		padding: 36rpx 36rpx 12rpx;
		background: transparent;
		border: none;
		border-top: 2rpx dashed rgba(10, 46, 36, 0.06);
		box-shadow: none;
	}

	.coupon-select-title {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
		display: block;
		margin-bottom: 18rpx;
	}

	.coupon-none {
		padding: 10rpx 0;
	}

	.coupon-none-text {
		font-size: 26rpx;
		color: var(--text-light);
		font-weight: 600;
	}

	.coupon-options {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}

	.coupon-option {
		display: flex;
		align-items: center;
		padding: 24rpx;
		border-radius: 24rpx;
		background: rgba(255, 255, 255, 0.4);
		border: 1rpx solid rgba(255, 255, 255, 0.3);
		box-shadow: none;
		transition: var(--transition);
		position: relative;
		overflow: visible;
	}

	.coupon-option::before,
	.coupon-option::after {
		content: '';
		position: absolute;
		left: 172rpx;
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: #edf3f0;
		z-index: 2;
	}

	.coupon-option::before {
		top: -10rpx;
		box-shadow: inset 0 -4rpx 6rpx rgba(10, 46, 36, 0.02);
	}

	.coupon-option::after {
		bottom: -10rpx;
		box-shadow: inset 0 4rpx 6rpx rgba(10, 46, 36, 0.02);
	}

	.coupon-option.selected {
		background: rgba(255, 253, 245, 0.85);
		border-color: rgba(224, 169, 60, 0.3);
		box-shadow: 0 4rpx 14rpx rgba(199, 154, 57, 0.06);
	}

	.coupon-opt-left {
		width: 140rpx;
		text-align: center;
	}

	.coupon-opt-value {
		font-size: 32rpx;
		font-weight: 900;
		color: #e85d04;
	}

	.coupon-opt-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		padding-left: 20rpx;
		border-left: 2rpx dashed rgba(10, 46, 36, 0.06);
	}

	.coupon-opt-name {
		font-size: 26rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.coupon-opt-cond {
		font-size: 22rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.coupon-opt-check {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: var(--accent-gradient);
		color: var(--primary);
		font-size: 24rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--accent-glow);
	}

	/* ---------------- 底部结算栏 ---------------- */
	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
		background: rgba(255, 255, 255, 0.95);
		display: flex;
		align-items: center;
		gap: 24rpx;
		box-shadow: 0 -12rpx 40rpx rgba(10, 46, 36, 0.08);
		backdrop-filter: blur(15px);
		border-top: 1rpx solid rgba(10, 46, 36, 0.04);
		z-index: 99;
	}

	.dock-amount {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		flex: 1;
	}

	.dock-amount-label {
		font-size: 22rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.dock-amount-value {
		font-size: 42rpx;
		font-weight: 900;
		color: var(--primary);
		font-variant-numeric: tabular-nums;
	}

	.dock-discount {
		font-size: 22rpx;
		color: #e85d04;
		font-weight: 800;
		letter-spacing: 0.5rpx;
	}

	.dock-btn {
		flex: 0 0 320rpx;
		height: 100rpx;
		line-height: 100rpx;
		border-radius: 20rpx;
		background: var(--accent-gradient);
		color: var(--primary);
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
		box-shadow: var(--accent-glow);
		transition: var(--transition);
		border: 0;
		position: relative;
		overflow: hidden;
	}

	.dock-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -150%;
		width: 40%;
		height: 100%;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0) 100%);
		transform: skewX(-25deg);
		animation: shimmer-sweep 3.5s infinite ease-in-out;
		pointer-events: none;
	}

	.dock-btn:active {
		transform: scale(0.97);
		opacity: 0.95;
	}

	.dock-btn.disabled {
		opacity: 0.65;
		transform: none;
	}

	.dock-btn::after {
		border: 0;
	}

	/* 支付页避开全局 hero-chip 浅色覆盖，保持深色头图内的可读性 */
	.pay .hero-chips {
		background: transparent !important;
		border: 0 !important;
		box-shadow: none !important;
	}

	.pay .hero-chip {
		min-height: 96rpx;
		padding: 20rpx 22rpx !important;
		border-radius: 22rpx !important;
		background: rgba(248, 251, 247, 0.13) !important;
		border: 1rpx solid rgba(248, 251, 247, 0.2) !important;
		box-shadow: none !important;
		justify-content: center;
	}

	.pay .hero-chip-label {
		display: block;
		color: rgba(248, 251, 247, 0.7) !important;
		font-size: 22rpx !important;
		font-weight: 700 !important;
		letter-spacing: 0 !important;
	}

	.pay .hero-chip-value {
		display: block;
		margin-top: 6rpx;
		color: #f8fbf7 !important;
		font-size: 28rpx !important;
		font-weight: 900 !important;
		line-height: 1.2;
	}
</style>
