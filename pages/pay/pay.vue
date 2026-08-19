<template>
	<view class="app pay has-brand-header">
		<brand-header title="订单结算" theme="teal" layout="stacked" :back-on-title="true" :scene="true" />
		<view v-if="!order" class="empty-wrap">
			<view class="empty">
				<view class="empty-icon hic-rate"></view>
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

			<view class="resume-bar">
				<view class="resume-copy">
					<text class="resume-title">还想继续钓？</text>
					<text class="resume-desc">撤销本次收竿，按原下竿时间继续计时</text>
				</view>
				<button class="resume-btn" :disabled="paymentBusy || resumeBusy" @click="resumeFishing">
					{{ resumeBusy ? '恢复中...' : '继续垂钓' }}
				</button>
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
					<view v-if="order.spotName" class="sheet-row">
						<text class="sheet-key">计时钓位</text>
						<text class="sheet-val">{{ order.spotName }}</text>
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
						<view class="channel-logo hic-wxpay"></view>
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
						<view class="balance-icon hic-coin"></view>
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
				<button class="dock-btn" :disabled="paymentBusy || resumeBusy" :class="{ disabled: paymentBusy || resumeBusy }" @click="payNow">
					{{ resumeBusy ? '恢复计时中...' : (paymentBusy ? '支付中...' : '立即支付') }}
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
		resumeOrder,
		payOrder,
		isLoggedIn,
		fetchAvailableCoupons,
		applyCouponToOrder,
		COUPON_TYPE,
		goHomeSafely
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
				paymentBusy: false,
				resumeBusy: false
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
				if (!this.order || this.paymentBusy || this.resumeBusy) return
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
			resumeFishing() {
				if (!this.order || this.paymentBusy || this.resumeBusy) return
				uni.showModal({
					title: '继续垂钓',
					content: '将撤销本次收竿结算，并从原下竿时间继续计时。下次收竿时会重新计算全部时长和费用。',
					confirmText: '继续计时',
					cancelText: '暂不处理',
					success: (res) => {
						if (!res.confirm || this.resumeBusy) return
						const user = getUser()
						if (!user) return
						this.resumeBusy = true
						uni.showLoading({ title: '正在恢复计时' })
						resumeOrder(user.userId, this.order.orderId).then((running) => {
							uni.hideLoading()
							this.resumeBusy = false
							if (!running) throw { msg: '恢复计时失败，请重试' }
							const stack = typeof getCurrentPages === 'function' ? getCurrentPages() : []
							const previous = stack && stack.length > 1 ? stack[stack.length - 2] : null
							if (previous && previous.route === 'pages/session/session') {
								uni.navigateBack({ delta: 1 })
							} else {
								uni.redirectTo({ url: '/pages/session/session' })
							}
						}).catch((error) => {
							uni.hideLoading()
							this.resumeBusy = false
							uni.showToast({ title: (error && error.msg) || '恢复计时失败', icon: 'none' })
							this.refresh()
						})
					}
				})
			},
			goHome() { goHomeSafely() },
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
		background: var(--surface);
		border-radius: 48rpx 16rpx;
		padding: 80rpx 40rpx;
		text-align: center;
		border: 1rpx solid rgba(255, 255, 255, 0.45);
	}

	.empty-icon {
		font-size: 96rpx;
		margin-bottom: 24rpx;
		display: block;
	}

	.empty-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: var(--jade);
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
		background: var(--g-600);
		color: #fff;
		font-size: 30rpx;
		font-weight: 600;

	}

	/* ---------------- 金沙账单 Hero ---------------- */
	.hero {
		margin: 0;
		padding: 48rpx 36rpx 44rpx;
		border-radius: 0;
		background: var(--surface);
		border: 1rpx solid var(--line);
	}

	.hero-label {
		color: var(--gold);
		font-size: 22rpx;
		letter-spacing: 6rpx;
		font-weight: 600;
	}

	.hero-amount {
		margin-top: 18rpx;
		color: var(--jade);
		display: flex;
		align-items: baseline;
	}

	.hero-currency {
		font-size: 40rpx;
		font-weight: 600;
		margin-right: 6rpx;
	}

	.hero-number {
		font-size: 88rpx;
		font-weight: 300;
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
		border-radius: var(--r);
		background: var(--surface);
		border: 1rpx solid rgba(255, 255, 255, 0.4);
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.hero-chip-label {
		font-size: 22rpx;
		color: var(--gold-ink);
		font-weight: 600;
	}

	.hero-chip-value {
		font-size: 28rpx;
		font-weight: 600;
		color: var(--jade);
		font-variant-numeric: tabular-nums;
	}

	/* ---------------- 连续型黄金票据面板 ---------------- */
	.ticket-board {
		margin: 28rpx 32rpx 0;
		background: var(--surface);
		border-radius: 48rpx 16rpx 48rpx 16rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.45);
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
		background: var(--g-50);
		z-index: 2;
	}

	.sheet::before {
		left: -12rpx;
	}

	.sheet::after {
		right: -12rpx;
	}

	.sheet-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 24rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: var(--jade);
	}

	.sheet-tag {
		padding: 6rpx 18rpx;
		border-radius: 99rpx;
		background: var(--warning-bg);
		color: var(--warning);
		border: 1rpx solid var(--warning-border);
		font-size: 22rpx;
		font-weight: 600;
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
		font-weight: 500;
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
		font-weight: 600;
		color: var(--jade);
		display: block;
		margin-bottom: 18rpx;
	}

	.channel-row {
		padding: 24rpx;
		border-radius: var(--r);
		background: var(--surface);
		border: 1rpx solid rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.channel-logo {
		width: 72rpx;
		height: 72rpx;
		border-radius: var(--r);
		background: var(--surface);
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
		font-weight: 600;
		color: var(--jade);
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
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
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
		font-weight: 600;
		color: var(--jade);
	}

	.mall-merge-tip {
		font-size: 22rpx;
		color: var(--gold);
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
		border: 2rpx solid var(--gold);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--jade);
		font-size: 28rpx;
		font-weight: 600;
		background: var(--surface);
		transition: var(--transition);
	}

	.mall-check.on {
		background: var(--accent-gradient);
		border-color: transparent;
		color: var(--jade);
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
		color: var(--gold);
		font-size: 32rpx;
		font-weight: 600;
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
		background: var(--surface);
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
		border-radius: var(--r);
		background: var(--gold-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 38rpx;
		border: 1rpx solid var(--line);
	}

	.balance-text {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.balance-title {
		font-size: 28rpx;
		font-weight: 600;
		color: var(--jade);
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
		background: var(--bg);
		position: relative;
		transition: var(--transition);
	}

	.balance-switch.on {
		background: var(--g-600);

	}

	.balance-dot {
		position: absolute;
		top: 6rpx;
		left: 6rpx;
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: var(--surface);
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
		font-weight: 600;
		color: var(--jade);
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
		border-radius: var(--r);
		background: var(--surface);
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
		background: var(--g-50);
		z-index: 2;
	}

	.coupon-option::before {
		top: -10rpx;
	}

	.coupon-option::after {
		bottom: -10rpx;
	}

	.coupon-option.selected {
		background: var(--surface);
		border-color: rgba(224, 169, 60, 0.3);
	}

	.coupon-opt-left {
		width: 140rpx;
		text-align: center;
	}

	.coupon-opt-value {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--gold);
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
		font-weight: 600;
		color: var(--jade);
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
		color: var(--jade);
		font-size: 24rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ---------------- 底部结算栏 ---------------- */
	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
		background: var(--surface);
		display: flex;
		align-items: center;
		gap: 24rpx;
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
		font-weight: 600;
		color: var(--jade);
		font-variant-numeric: tabular-nums;
	}

	.dock-discount {
		font-size: 22rpx;
		color: var(--gold);
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}

	.dock-btn {
		flex: 0 0 320rpx;
		height: 100rpx;
		line-height: 100rpx;
		border-radius: var(--r);
		background: var(--g-600);
		color: #fff;
		font-size: 32rpx;
		font-weight: 600;
		letter-spacing: 2rpx;

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
		background: transparent;
		border: 0;
		box-shadow: none;
	}

	.pay .hero-chip {
		min-height: 96rpx;
		padding: 20rpx 22rpx;
		border-radius: 22rpx;
		background: rgba(248, 251, 247, 0.13);
		border: 1rpx solid rgba(248, 251, 247, 0.2);
		box-shadow: none;
		justify-content: center;
	}

	.pay .hero-chip-label {
		display: block;
		color: rgba(248, 251, 247, 0.7);
		font-size: 22rpx;
		font-weight: 500;
		letter-spacing: 0;
	}

	.pay .hero-chip-value {
		display: block;
		margin-top: 6rpx;
		color: #fff;
		font-size: 28rpx;
		font-weight: 600;
		line-height: 1.2;
	}

	.resume-bar {
		margin: 0 20rpx 14rpx;
		padding: 22rpx 24rpx;
		border: 1rpx solid #c7dfdc;
		border-radius: 14rpx;
		background: #eef8f6;
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.resume-copy {
		min-width: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.resume-title {
		font-size: 27rpx;
		font-weight: 700;
		color: #0b3134;
	}

	.resume-desc {
		font-size: 21rpx;
		line-height: 1.45;
		color: #617b7d;
	}

	.resume-btn {
		flex: 0 0 180rpx;
		margin: 0;
		height: 72rpx;
		line-height: 72rpx;
		padding: 0 20rpx;
		border: 1rpx solid #078f91;
		border-radius: 12rpx;
		background: #f8fcfb;
		color: #078f91;
		font-size: 25rpx;
		font-weight: 700;
	}

	.resume-btn::after {
		border: 0;
	}
	.channel-logo { background-size: 44rpx 44rpx; }
	.balance-icon { background-size: 42rpx 42rpx; }

	/* 设计稿 02：金额与计费时长在同一张白色摘要卡中 */
	.pay {
		background: #f7fbfa;
	}

	.pay .hero {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(180rpx, 0.8fr);
		grid-template-rows: auto auto;
		align-items: center;
		margin: 0 20rpx 14rpx;
		padding: 22rpx 24rpx;
		border: 0;
		border-radius: 14rpx;
		background: #ffffff;
	}

	.pay .hero-label {
		grid-column: 1;
		grid-row: 1;
		color: #799092;
		font-size: 20rpx;
		letter-spacing: 1rpx;
	}

	.pay .hero-amount {
		grid-column: 1;
		grid-row: 2;
		margin-top: 8rpx;
		color: #078f91;
	}

	.pay .hero-currency {
		font-size: 28rpx;
	}

	.pay .hero-number {
		font-size: 58rpx;
		font-weight: 500;
	}

	.pay .hero-chips {
		grid-column: 2;
		grid-row: 1 / span 2;
		display: block;
		margin: 0;
		padding-left: 24rpx;
		border-left: 1rpx solid #dce9e8;
	}

	.pay .hero-chip {
		min-height: 0;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
	}

	.pay .hero-chip:nth-child(2) {
		display: none;
	}

	.pay .hero-chip-label {
		color: #799092;
		font-size: 20rpx;
	}

	.pay .hero-chip-value {
		margin-top: 8rpx;
		color: #0b3134;
		font-size: 28rpx;
	}

	.pay .ticket-board {
		margin: 0 20rpx;
		padding: 0 0 16rpx;
		border: 0;
		border-radius: 14rpx;
	}

	.pay .sheet {
		padding: 26rpx 24rpx 22rpx;
	}
</style>
