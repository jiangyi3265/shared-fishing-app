<template>
	<view class="app weigh-fish">
		<view class="wf-hero">
			<text class="wf-hero-kicker">FISH WEIGH</text>
			<text class="wf-hero-title">称鱼结算</text>
			<text class="wf-hero-sub">将鱼放在电子秤上（已去皮），输入显示重量后确认付款</text>
		</view>

		<view v-if="step === 'input'" class="wf-body">
			<view class="wf-card">
				<view class="wf-steps-bar">
					<view class="wf-step active">
						<view class="wf-step-dot">1</view>
						<text class="wf-step-label">录入重量</text>
					</view>
					<view class="wf-step-line"></view>
					<view class="wf-step">
						<view class="wf-step-dot">2</view>
						<text class="wf-step-label">核对金额</text>
					</view>
					<view class="wf-step-line"></view>
					<view class="wf-step">
						<view class="wf-step-dot">3</view>
						<text class="wf-step-label">确认付款</text>
					</view>
				</view>

				<view class="wf-input-section">
					<text class="wf-input-label">请输入电子秤显示的重量</text>
					<view class="wf-input-row">
						<input
							class="wf-weight-input"
							type="digit"
							v-model="weightInput"
							placeholder="0.0"
							placeholder-class="wf-input-ph"
							@input="onWeightInput"
						/>
						<text class="wf-unit">斤</text>
					</view>
					<text class="wf-input-hint">请确保电子秤已去皮，鱼获完整放置</text>
				</view>

				<view class="wf-price-info">
					<view class="wf-price-row">
						<text class="wf-price-label">鱼获单价</text>
						<text class="wf-price-value">¥{{ fishPriceDisplay }}/斤</text>
					</view>
					<view v-if="isMember" class="wf-member-tag">
						<text>会员价</text>
					</view>
				</view>
			</view>

			<view class="wf-dock">
				<button class="wf-dock-btn" :disabled="!canSubmit" @click="goConfirm">
					下一步 · 核对金额
				</button>
			</view>
		</view>

		<view v-else-if="step === 'confirm'" class="wf-body">
			<view class="wf-card">
				<view class="wf-steps-bar">
					<view class="wf-step done">
						<view class="wf-step-dot">✓</view>
						<text class="wf-step-label">录入重量</text>
					</view>
					<view class="wf-step-line done"></view>
					<view class="wf-step active">
						<view class="wf-step-dot">2</view>
						<text class="wf-step-label">核对金额</text>
					</view>
					<view class="wf-step-line"></view>
					<view class="wf-step">
						<view class="wf-step-dot">3</view>
						<text class="wf-step-label">确认付款</text>
					</view>
				</view>

				<view class="wf-summary">
					<view class="wf-summary-amount">
						<text class="wf-summary-currency">¥</text>
						<text class="wf-summary-number">{{ totalAmountDisplay }}</text>
					</view>
					<view class="wf-summary-details">
						<view class="wf-detail-row">
							<text class="wf-detail-key">鱼获重量</text>
							<text class="wf-detail-val">{{ weightInput }} 斤</text>
						</view>
						<view class="wf-detail-row">
							<text class="wf-detail-key">单价</text>
							<text class="wf-detail-val">¥{{ fishPriceDisplay }}/斤{{ isMember ? '（会员价）' : '' }}</text>
						</view>
						<view class="wf-detail-row">
							<text class="wf-detail-key">应付金额</text>
							<text class="wf-detail-val wf-detail-highlight">¥{{ totalAmountDisplay }}</text>
						</view>
					</view>
				</view>

				<view class="wf-actions">
					<button class="wf-btn-back" @click="goBack">返回修改</button>
					<button class="wf-btn-pay" :disabled="paying" @click="confirmPay">
						{{ paying ? '提交中...' : '确认付款' }}
					</button>
				</view>
			</view>
		</view>

		<view v-else-if="step === 'done'" class="wf-body">
			<view class="wf-card wf-done-card">
				<view class="wf-done-icon">✓</view>
				<text class="wf-done-title">称鱼结算已提交</text>
				<text class="wf-done-desc">鱼获 {{ weightInput }} 斤，金额 ¥{{ totalAmountDisplay }}</text>
				<button class="wf-done-btn" @click="goHome">返回首页</button>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getUser,
		isLoggedIn,
		submitFishWeigh,
		payFishWeigh,
		fetchFishPrice,
		getCachedVenue,
		normalizePaymentError,
		goHomeSafely
	} from '../../utils/fishingStore.js'

	const DEFAULT_PRICE = { normalPricePerJin: 1180, memberPricePerJin: 980 }

	export default {
		data() {
			return {
				step: 'input',
				weightInput: '',
				fishPrice: DEFAULT_PRICE,
				isMember: false,
				paying: false,
				scan: null,
				venueId: null
			}
		},
		computed: {
			weightGrams() {
				const jin = parseFloat(this.weightInput)
				if (isNaN(jin) || jin <= 0) return 0
				return Math.round(jin * 500)
			},
			currentPriceCentsPerJin() {
				return this.isMember
					? (this.fishPrice.memberPricePerJin || DEFAULT_PRICE.memberPricePerJin)
					: (this.fishPrice.normalPricePerJin || DEFAULT_PRICE.normalPricePerJin)
			},
			fishPriceDisplay() {
				return (this.currentPriceCentsPerJin / 100).toFixed(1)
			},
			totalAmountCents() {
				const jin = parseFloat(this.weightInput)
				if (isNaN(jin) || jin <= 0) return 0
				return Math.round(jin * this.currentPriceCentsPerJin)
			},
			totalAmountDisplay() {
				return (this.totalAmountCents / 100).toFixed(2)
			},
			canSubmit() {
				const jin = parseFloat(this.weightInput)
				return !isNaN(jin) && jin > 0
			}
		},
		onLoad(option) {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/weighFish/weighFish') })
				return
			}
			if (option && option.scan) {
				this.scan = decodeURIComponent(option.scan)
			}
			this.loadPriceAndMember()
		},
		methods: {
			loadPriceAndMember() {
				const cached = getCachedVenue()
				if (cached && cached.venue) this.venueId = cached.venue.venueId

				const user = getUser()
				if (user && user.memberLevel && user.memberLevel > 0) {
					this.isMember = true
				}

				fetchFishPrice(this.venueId).then((data) => {
					if (data) {
						this.fishPrice = Object.assign({}, DEFAULT_PRICE, data)
						if (data.isMember !== undefined) this.isMember = !!data.isMember
					}
				}).catch(() => {})
			},
			onWeightInput(e) {
				let val = e.detail.value || ''
				val = val.replace(/[^0-9.]/g, '')
				const parts = val.split('.')
				if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
				if (parts[1] && parts[1].length > 1) val = parts[0] + '.' + parts[1].slice(0, 1)
				this.weightInput = val
			},
			goConfirm() {
				if (!this.canSubmit) return
				this.step = 'confirm'
			},
			goBack() {
				this.step = 'input'
			},
			confirmPay() {
				if (this.paying || !this.canSubmit) return
				this.paying = true
				uni.showLoading({ title: '提交中' })
				const user = getUser()
				submitFishWeigh({
					userId: user.userId,
					venueId: this.venueId,
					weightGrams: this.weightGrams,
					scan: this.scan ? { scene: this.scan } : null
				}).then((data) => {
					if (!data || !data.fishWeighId) {
						uni.hideLoading()
						this.paying = false
						this.step = 'done'
						return
					}
					return payFishWeigh(data.fishWeighId, false)
				}).then((paid) => {
					uni.hideLoading()
					this.paying = false
					this.step = 'done'
				}).catch((e) => {
					uni.hideLoading()
					this.paying = false
					const msg = (e && e.msg) || '提交失败，请稍后再试'
					uni.showModal({ title: '提示', content: msg, showCancel: false })
				})
			},
			goHome() {
				goHomeSafely()
			}
		}
	}
</script>

<style>
	.weigh-fish {
		padding-bottom: 220rpx;
	}

	/* Hero */
	.wf-hero {
		padding: 52rpx 28rpx 36rpx;
		background: var(--primary-gradient);
		border-radius: 0 0 30rpx 30rpx;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.wf-hero-kicker {
		font-size: 22rpx;
		font-weight: 700;
		color: rgba(248, 251, 247, 0.68);
		letter-spacing: 1rpx;
	}

	.wf-hero-title {
		font-size: 48rpx;
		font-weight: 850;
		color: #f8fbf7;
		line-height: 1.12;
	}

	.wf-hero-sub {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: rgba(248, 251, 247, 0.6);
		line-height: 1.5;
		font-weight: 600;
	}

	/* Body */
	.wf-body {
		padding: 24rpx 28rpx 0;
	}

	.wf-card {
		background: var(--surface);
		border: 1rpx solid var(--border-color);
		border-radius: 22rpx;
		box-shadow: var(--card-shadow);
		padding: 30rpx 28rpx;
	}

	/* Step bar */
	.wf-steps-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		margin-bottom: 36rpx;
		padding: 0 12rpx;
	}

	.wf-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		flex-shrink: 0;
	}

	.wf-step-dot {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background: var(--surface-strong);
		border: 2rpx solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		font-weight: 800;
		color: var(--text-light);
		transition: var(--transition);
	}

	.wf-step.active .wf-step-dot {
		background: var(--primary);
		border-color: var(--primary);
		color: #f8fbf7;
	}

	.wf-step.done .wf-step-dot {
		background: var(--success);
		border-color: var(--success);
		color: #ffffff;
	}

	.wf-step-label {
		font-size: 21rpx;
		color: var(--text-light);
		font-weight: 600;
	}

	.wf-step.active .wf-step-label {
		color: var(--primary);
		font-weight: 800;
	}

	.wf-step.done .wf-step-label {
		color: var(--success);
	}

	.wf-step-line {
		flex: 1;
		height: 2rpx;
		background: var(--border-color);
		margin: 0 12rpx;
		margin-bottom: 30rpx;
	}

	.wf-step-line.done {
		background: var(--success);
	}

	/* Input section */
	.wf-input-section {
		padding: 24rpx 0;
	}

	.wf-input-label {
		display: block;
		font-size: 28rpx;
		font-weight: 800;
		color: var(--text-main);
		margin-bottom: 20rpx;
	}

	.wf-input-row {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 20rpx 24rpx;
		background: var(--surface-strong);
		border: 2rpx solid var(--border-color);
		border-radius: 18rpx;
		transition: var(--transition);
	}

	.wf-input-row:focus-within {
		border-color: var(--primary);
	}

	.wf-weight-input {
		flex: 1;
		font-size: 56rpx;
		font-weight: 900;
		color: var(--text-main);
		text-align: center;
		font-variant-numeric: tabular-nums;
		background: transparent;
		min-height: 80rpx;
	}

	.wf-input-ph {
		color: var(--text-light);
		font-weight: 400;
	}

	.wf-unit {
		font-size: 32rpx;
		font-weight: 800;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.wf-input-hint {
		display: block;
		margin-top: 14rpx;
		font-size: 22rpx;
		color: var(--text-light);
		font-weight: 600;
	}

	/* Price info */
	.wf-price-info {
		margin-top: 20rpx;
		padding: 20rpx 24rpx;
		background: var(--accent-soft);
		border: 1rpx solid rgba(184, 111, 49, 0.14);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.wf-price-row {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.wf-price-label {
		font-size: 24rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.wf-price-value {
		font-size: 28rpx;
		font-weight: 850;
		color: var(--accent);
	}

	.wf-member-tag {
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background: var(--primary);
		color: #f8fbf7;
		font-size: 20rpx;
		font-weight: 700;
	}

	/* Dock */
	.wf-dock {
		margin-top: 32rpx;
	}

	.wf-dock-btn {
		width: 100%;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 16rpx;
		background: var(--primary);
		color: #f8fbf7;
		font-size: 30rpx;
		font-weight: 800;
		border: 0;
		box-shadow: 0 10rpx 24rpx rgba(24, 95, 72, 0.18);
		transition: var(--transition);
	}

	.wf-dock-btn::after {
		border: 0;
	}

	.wf-dock-btn:active {
		transform: translateY(1rpx);
		opacity: 0.88;
	}

	.wf-dock-btn[disabled] {
		background: #b9c9c3;
		box-shadow: none;
	}

	/* Summary (confirm step) */
	.wf-summary {
		text-align: center;
		padding: 24rpx 0;
	}

	.wf-summary-amount {
		display: flex;
		align-items: baseline;
		justify-content: center;
		margin-bottom: 28rpx;
	}

	.wf-summary-currency {
		font-size: 38rpx;
		font-weight: 800;
		color: var(--text-main);
		margin-right: 4rpx;
	}

	.wf-summary-number {
		font-size: 88rpx;
		font-weight: 900;
		color: var(--text-main);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.wf-summary-details {
		background: var(--surface-strong);
		border: 1rpx solid var(--border-color);
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
	}

	.wf-detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 1rpx dashed var(--border-color);
	}

	.wf-detail-row:last-child {
		border-bottom: 0;
		padding-bottom: 8rpx;
	}

	.wf-detail-key {
		font-size: 26rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.wf-detail-val {
		font-size: 26rpx;
		color: var(--text-main);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.wf-detail-highlight {
		font-size: 30rpx;
		font-weight: 850;
		color: var(--accent);
	}

	/* Actions */
	.wf-actions {
		margin-top: 28rpx;
		display: flex;
		gap: 16rpx;
	}

	.wf-btn-back {
		flex: 1;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 16rpx;
		background: var(--surface-strong);
		color: var(--text-main);
		border: 1rpx solid var(--border-color);
		font-size: 28rpx;
		font-weight: 800;
		box-shadow: none;
	}

	.wf-btn-back::after {
		border: 0;
	}

	.wf-btn-pay {
		flex: 2;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 16rpx;
		background: var(--accent-gradient);
		color: #ffffff;
		font-size: 30rpx;
		font-weight: 800;
		border: 0;
		box-shadow: 0 10rpx 24rpx rgba(184, 111, 49, 0.22);
		transition: var(--transition);
	}

	.wf-btn-pay::after {
		border: 0;
	}

	.wf-btn-pay:active {
		transform: translateY(1rpx);
		opacity: 0.88;
	}

	.wf-btn-pay[disabled] {
		opacity: 0.65;
	}

	/* Done */
	.wf-done-card {
		text-align: center;
		padding: 60rpx 28rpx;
	}

	.wf-done-icon {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: var(--success);
		color: #ffffff;
		font-size: 48rpx;
		font-weight: 900;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 24rpx;
	}

	.wf-done-title {
		display: block;
		font-size: 34rpx;
		font-weight: 850;
		color: var(--text-main);
	}

	.wf-done-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.wf-done-btn {
		margin-top: 40rpx;
		width: 60%;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 16rpx;
		background: var(--primary);
		color: #f8fbf7;
		font-size: 28rpx;
		font-weight: 800;
		border: 0;
		box-shadow: 0 10rpx 24rpx rgba(24, 95, 72, 0.18);
	}

	.wf-done-btn::after {
		border: 0;
	}
</style>
