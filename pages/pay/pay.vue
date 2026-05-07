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
					<text class="hero-number">{{ formatMoney(order.amountCents) }}</text>
				</view>
				<view class="hero-chips">
					<view class="hero-chip"><text class="hero-chip-label">计费时长</text><text class="hero-chip-value">{{ formatDuration(order.durationSeconds || 0) }}</text></view>
					<view class="hero-chip"><text class="hero-chip-label">实际时长</text><text class="hero-chip-value">{{ formatDuration(order.elapsedSeconds || 0) }}</text></view>
				</view>
			</view>

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
						<text class="channel-desc">开发阶段使用模拟支付通道</text>
					</view>
					<view class="channel-check">✓</view>
				</view>
			</view>

			<view class="coupon-select">
				<text class="coupon-select-title">优惠券</text>
				<view v-if="availableCoupons.length === 0" class="coupon-none">
					<text class="coupon-none-text">暂无可用优惠券</text>
				</view>
				<view v-else class="coupon-options">
					<view v-for="c in availableCoupons" :key="c.id" class="coupon-option" :class="{ selected: selectedCoupon && selectedCoupon.id === c.id }" @click="toggleCoupon(c)">
						<view class="coupon-opt-left">
							<text class="coupon-opt-value" v-if="c.type === 'duration'">{{ c.value }}分钟</text>
							<text class="coupon-opt-value" v-else>-¥{{ formatMoney(c.value) }}</text>
						</view>
						<view class="coupon-opt-right">
							<text class="coupon-opt-name">{{ c.title }}</text>
							<text class="coupon-opt-cond" v-if="c.type === 'amount' && c.minAmountCents > 0">满¥{{ formatMoney(c.minAmountCents) }}可用</text>
						</view>
						<view class="coupon-opt-check" v-if="selectedCoupon && selectedCoupon.id === c.id">✓</view>
					</view>
				</view>
			</view>

			<view class="spacer"></view>

			<view class="dock">
				<view class="dock-amount">
					<text class="dock-amount-label">应付</text>
					<text class="dock-amount-value">¥{{ formatMoney(finalAmount) }}</text>
					<text v-if="discountText" class="dock-discount">{{ discountText }}</text>
				</view>
				<button class="dock-btn" @click="payNow">立即支付</button>
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
		getPendingOrder,
		payPendingOrder,
		isLoggedIn,
		getAvailableCoupons,
		applyCouponToOrder,
		useCoupon,
		COUPON_TYPE,
		DEFAULT_RULE
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				order: null,
				availableCoupons: [],
				selectedCoupon: null
			}
		},
		computed: {
			ruleText() {
				const rule = (this.order && this.order.ruleSnapshot) || DEFAULT_RULE
				return `每 ${rule.stepMinutes} 分钟 ¥${formatMoney(rule.pricePerStepCents)}`
			},
			orderTag() {
				if (!this.order) return ''
				return '待支付'
			},
			finalAmount() {
				if (!this.order) return 0
				if (!this.selectedCoupon) return this.order.amountCents
				const result = applyCouponToOrder(this.selectedCoupon, this.order.amountCents, this.order.durationSeconds || 0)
				if (result.discountCents > 0) {
					return Math.max(0, this.order.amountCents - result.discountCents)
				}
				if (result.discountSeconds > 0) {
					const rule = (this.order && this.order.ruleSnapshot) || DEFAULT_RULE
					const discountCents = Math.floor(result.discountSeconds / (rule.stepMinutes * 60)) * rule.pricePerStepCents
					return Math.max(0, this.order.amountCents - discountCents)
				}
				return this.order.amountCents
			},
			discountText() {
				if (!this.selectedCoupon || !this.order) return ''
				const saved = this.order.amountCents - this.finalAmount
				if (saved > 0) return `已优惠 ¥${formatMoney(saved)}`
				return ''
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
				this.order = getPendingOrder(user.id)
				if (this.order) {
					const coupons = getAvailableCoupons(user.id)
					this.availableCoupons = coupons.filter((c) => {
						if (c.type === COUPON_TYPE.AMOUNT && c.minAmountCents > this.order.amountCents) return false
						return true
					})
				}
				this.selectedCoupon = null
			},
			toggleCoupon(coupon) {
				if (this.selectedCoupon && this.selectedCoupon.id === coupon.id) {
					this.selectedCoupon = null
				} else {
					this.selectedCoupon = coupon
				}
			},
			payNow() {
				if (!this.order) return
				uni.showLoading({ title: '调起支付' })
				setTimeout(() => {
					const user = getUser()
					if (this.selectedCoupon) {
						useCoupon(this.selectedCoupon.id)
					}
					const paid = payPendingOrder(user.id, this.order.id)
					uni.hideLoading()
					if (!paid) {
						uni.redirectTo({ url: '/pages/payResult/payResult?success=0' })
						return
					}
					uni.redirectTo({ url: `/pages/payResult/payResult?success=1&orderId=${paid.id}` })
				}, 600)
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
	}

	.empty-wrap {
		padding: 80rpx 28rpx;
	}

	.empty {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 80rpx 40rpx;
		text-align: center;
		box-shadow: 0 10rpx 28rpx rgba(26, 32, 48, 0.05);
	}

	.empty-icon {
		font-size: 88rpx;
		margin-bottom: 20rpx;
	}

	.empty-title {
		display: block;
		font-size: 32rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.empty-desc {
		display: block;
		color: #6b7280;
		font-size: 26rpx;
		margin-top: 12rpx;
	}

	.empty-btn {
		margin-top: 32rpx;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 20rpx;
		background: #f5c23b;
		color: #1a1306;
		font-size: 30rpx;
		font-weight: 700;
	}

	.empty-btn::after {
		border: 0;
	}

	.hero {
		margin: 20rpx 28rpx 0;
		padding: 44rpx 36rpx 36rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, #fff7df 0%, #ffeab0 100%);
		box-shadow: 0 12rpx 30rpx rgba(245, 194, 59, 0.25);
	}

	.hero-label {
		color: #b8860b;
		font-size: 22rpx;
		letter-spacing: 6rpx;
		font-weight: 700;
	}

	.hero-amount {
		margin-top: 16rpx;
		color: #1a1306;
		display: flex;
		align-items: baseline;
	}

	.hero-currency {
		font-size: 36rpx;
		font-weight: 700;
		margin-right: 6rpx;
	}

	.hero-number {
		font-size: 112rpx;
		font-weight: 800;
		letter-spacing: 1rpx;
		font-variant-numeric: tabular-nums;
	}

	.hero-chips {
		margin-top: 18rpx;
		display: flex;
		gap: 16rpx;
	}

	.hero-chip {
		flex: 1;
		padding: 16rpx 18rpx;
		border-radius: 16rpx;
		background: rgba(255, 255, 255, 0.7);
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.hero-chip-label {
		font-size: 22rpx;
		color: #8a6914;
	}

	.hero-chip-value {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a1306;
		font-variant-numeric: tabular-nums;
	}

	.sheet {
		margin: 24rpx 28rpx 0;
		padding: 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.sheet-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 12rpx;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.sheet-tag {
		padding: 4rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(245, 194, 59, 0.18);
		color: #b8860b;
		font-size: 22rpx;
		font-weight: 700;
	}

	.sheet-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-top: 1rpx dashed #eef0f5;
		font-size: 26rpx;
	}

	.sheet-key {
		color: #6b7280;
	}

	.sheet-val {
		color: #1a2030;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.channel {
		margin: 24rpx 28rpx 0;
		padding: 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.channel-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
		display: block;
	}

	.channel-row {
		margin-top: 18rpx;
		padding: 22rpx;
		border-radius: 18rpx;
		background: #f7f8fb;
		display: flex;
		align-items: center;
		gap: 18rpx;
	}

	.channel-logo {
		width: 68rpx;
		height: 68rpx;
		border-radius: 18rpx;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
	}

	.channel-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.channel-name {
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.channel-desc {
		font-size: 22rpx;
		color: #6b7280;
	}

	.channel-check {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: #4fb38a;
		color: #ffffff;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spacer {
		height: 40rpx;
	}

	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
		background: rgba(244, 245, 247, 0.96);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		gap: 20rpx;
		box-shadow: 0 -8rpx 20rpx rgba(26, 32, 48, 0.06);
	}

	.dock-amount {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.dock-amount-label {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.dock-amount-value {
		font-size: 38rpx;
		font-weight: 800;
		color: #1a2030;
		font-variant-numeric: tabular-nums;
	}

	.dock-discount {
		font-size: 22rpx;
		color: #e85d04;
		font-weight: 600;
	}

	.dock-btn {
		flex: 1;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 20rpx;
		background: #f5c23b;
		color: #1a1306;
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
		box-shadow: 0 12rpx 24rpx rgba(245, 194, 59, 0.3);
	}

	.dock-btn::after {
		border: 0;
	}

	.coupon-select {
		margin: 24rpx 28rpx 0;
		padding: 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.coupon-select-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
		display: block;
		margin-bottom: 16rpx;
	}

	.coupon-none-text {
		font-size: 26rpx;
		color: #9aa3b2;
	}

	.coupon-options {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.coupon-option {
		display: flex;
		align-items: center;
		padding: 20rpx;
		border-radius: 16rpx;
		background: #f7f8fb;
		border: 2rpx solid transparent;
	}

	.coupon-option.selected {
		border-color: #f5c23b;
		background: #fffdf5;
	}

	.coupon-opt-left {
		width: 140rpx;
		text-align: center;
	}

	.coupon-opt-value {
		font-size: 30rpx;
		font-weight: 800;
		color: #e85d04;
	}

	.coupon-opt-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		padding-left: 16rpx;
	}

	.coupon-opt-name {
		font-size: 26rpx;
		font-weight: 600;
		color: #1a2030;
	}

	.coupon-opt-cond {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.coupon-opt-check {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: #f5c23b;
		color: #1a1306;
		font-size: 24rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
