<template>
	<view class="app session">
		<view class="hero">
			<view class="hero-top">
				<view class="dot-pulse"></view>
				<text class="hero-status">RUNNING · 实时同步</text>
			</view>
			<text class="hero-label">已用时长</text>
			<text class="hero-timer">{{ formatDuration(elapsed) }}</text>
			<view class="hero-bar">
				<view class="hero-bar-inner" :style="{ width: progressWidth }"></view>
			</view>
			<view class="hero-meta">
				<view class="hero-meta-item">
					<text class="hero-meta-label">开始时间</text>
					<text class="hero-meta-value">{{ startTimeText }}</text>
				</view>
				<view class="hero-meta-sep"></view>
				<view class="hero-meta-item">
					<text class="hero-meta-label">订单号</text>
					<text class="hero-meta-value">{{ order.orderNo }}</text>
				</view>
			</view>
		</view>

		<view class="amount-card">
			<view class="amount-badge">预估金额</view>
			<view class="amount-row">
				<text class="money-currency">¥</text>
				<text class="money-number">{{ formatMoney(estimate.amountCents) }}</text>
			</view>
			<text class="amount-tip">按 {{ rule.stepMinutes }} 分钟向上取整 · 起步 {{ rule.minDurationMinutes }} 分钟</text>
			<view class="amount-chips">
				<view class="chip">
					<text class="chip-label">计费时长</text>
					<text class="chip-value">{{ formatDuration(estimate.billableDurationSeconds) }}</text>
				</view>
				<view class="chip">
					<text class="chip-label">费率</text>
					<text class="chip-value">¥{{ stepPriceYuan }} / {{ rule.stepMinutes }} 分</text>
				</view>
			</view>
		</view>

		<view class="steps">
			<view class="step step-done">
				<view class="step-dot">1</view>
				<text class="step-name">扫入口码</text>
				<text class="step-desc">已完成</text>
			</view>
			<view class="step-line step-line-active"></view>
			<view class="step step-active">
				<view class="step-dot">2</view>
				<text class="step-name">计时进行中</text>
				<text class="step-desc">当前步骤</text>
			</view>
			<view class="step-line"></view>
			<view class="step">
				<view class="step-dot">3</view>
				<text class="step-name">出口结算</text>
				<text class="step-desc">待执行</text>
			</view>
		</view>

		<view class="tip">
			<text class="tip-emoji">📍</text>
			<text class="tip-text">离场请前往出口扫码结束并支付</text>
		</view>

		<view class="spacer"></view>

		<view class="dock">
			<button class="dock-ghost" @click="backHome">返回首页</button>
			<button class="dock-primary" @click="finish">扫出口码结算</button>
		</view>
	</view>
</template>

<script>
	import {
		calcAmount,
		formatMoney,
		formatDuration,
		formatDatetime,
		getUser,
		fetchRunningOrder,
		finishOrder,
		getCachedVenue,
		loadDefaultVenue,
		isLoggedIn
	} from '../../utils/fishingStore.js'

	const DEFAULT_RULE = { stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0 }

	export default {
		data() {
			return {
				order: { orderNo: '--', startTime: 0, ruleSnapshot: null },
				now: Date.now(),
				timer: null,
				rule: DEFAULT_RULE
			}
		},
		computed: {
			elapsed() {
				if (!this.startMillis) return 0
				return Math.floor((this.now - this.startMillis) / 1000)
			},
			estimate() {
				if (!this.startMillis) {
					return { amountCents: 0, billableDurationSeconds: 0, elapsedSeconds: 0 }
				}
				return calcAmount(this.now - this.startMillis, this.rule)
			},
			startMillis() {
				if (!this.order || !this.order.startTime) return 0
				return typeof this.order.startTime === 'number' ? this.order.startTime : new Date(this.order.startTime).getTime()
			},
			stepPriceYuan() { return formatMoney(this.rule.pricePerStepCents) },
			startTimeText() { return this.order.startTime ? formatDatetime(this.order.startTime) : '--' },
			progressWidth() {
				const stepSec = this.rule.stepMinutes * 60
				const into = this.elapsed % stepSec
				const ratio = stepSec === 0 ? 0 : into / stepSec
				return (Math.max(0.05, ratio) * 100).toFixed(1) + '%'
			}
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/session/session') })
				return
			}
			this.ensureVenue().then(() => this.refresh())
			this.startTimer()
		},
		onHide() { this.stopTimer() },
		beforeDestroy() { this.stopTimer() },
		methods: {
			ensureVenue() {
				const cached = getCachedVenue()
				if (cached && cached.rule) { this.rule = cached.rule; return Promise.resolve() }
				return loadDefaultVenue().then((data) => { if (data && data.rule) this.rule = data.rule }).catch(() => {})
			},
			refresh() {
				const user = getUser()
				if (!user) { uni.redirectTo({ url: '/pages/index/index' }); return }
				fetchRunningOrder(user.userId).then((running) => {
					if (!running) { uni.redirectTo({ url: '/pages/index/index' }); return }
					this.order = running
					if (running.ruleSnapshot) {
						try { this.rule = Object.assign({}, this.rule, JSON.parse(running.ruleSnapshot)) } catch (e) {}
					}
				})
			},
			finish() {
				uni.showModal({
					title: '结束本次计时',
					content: '将记录结束时间并生成待支付订单',
					success: (res) => {
						if (!res.confirm) return
						const user = getUser()
						finishOrder(user.userId).then((result) => {
							if (!result) {
								uni.showToast({ title: '未检测到进行中订单', icon: 'none' })
								this.backHome()
								return
							}
							uni.redirectTo({ url: '/pages/pay/pay' })
						})
					}
				})
			},
			backHome() { uni.redirectTo({ url: '/pages/index/index' }) },
			startTimer() {
				if (this.timer) return
				this.timer = setInterval(() => { this.now = Date.now() }, 1000)
			},
			stopTimer() { if (this.timer) { clearInterval(this.timer); this.timer = null } },
			formatMoney,
			formatDuration,
			formatDatetime
		}
	}
</script>

<style>
	.session {
		padding-bottom: 200rpx;
	}

	.hero {
		margin: 20rpx 28rpx 0;
		padding: 40rpx 36rpx 36rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		color: #ffffff;
		box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.2);
	}

	.hero-top {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.dot-pulse {
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #f5c23b;
		box-shadow: 0 0 0 8rpx rgba(245, 194, 59, 0.25);
	}

	.hero-status {
		color: #f5c23b;
		font-size: 22rpx;
		letter-spacing: 4rpx;
		font-weight: 700;
	}

	.hero-label {
		display: block;
		margin-top: 28rpx;
		color: #a8a8a8;
		font-size: 22rpx;
		letter-spacing: 4rpx;
	}

	.hero-timer {
		display: block;
		margin-top: 14rpx;
		color: #ffffff;
		font-size: 140rpx;
		font-weight: 700;
		letter-spacing: 2rpx;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.hero-bar {
		margin-top: 30rpx;
		height: 10rpx;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 999rpx;
		overflow: hidden;
	}

	.hero-bar-inner {
		height: 100%;
		background: #f5c23b;
		border-radius: 999rpx;
		transition: width 0.5s ease;
	}

	.hero-meta {
		margin-top: 28rpx;
		display: flex;
		align-items: center;
		gap: 18rpx;
	}

	.hero-meta-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.hero-meta-label {
		font-size: 22rpx;
		color: #8c8c8c;
	}

	.hero-meta-value {
		font-size: 26rpx;
		color: #ffffff;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.hero-meta-sep {
		width: 1rpx;
		height: 60rpx;
		background: rgba(255, 255, 255, 0.12);
	}

	.amount-card {
		margin: 24rpx 28rpx 0;
		padding: 40rpx 32rpx;
		border-radius: 24rpx;
		background: #ffffff;
		box-shadow: 0 10rpx 28rpx rgba(26, 32, 48, 0.05);
		text-align: center;
	}

	.amount-badge {
		display: inline-block;
		padding: 6rpx 20rpx;
		border-radius: 999rpx;
		background: #fff3d1;
		color: #b8860b;
		font-size: 22rpx;
		font-weight: 700;
		letter-spacing: 2rpx;
	}

	.amount-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
		margin-top: 18rpx;
		color: #1a2030;
	}

	.amount-row .money-currency {
		color: #1a2030;
		font-size: 34rpx;
	}

	.amount-row .money-number {
		color: #1a2030;
		font-size: 96rpx;
	}

	.amount-tip {
		display: block;
		margin-top: 10rpx;
		color: #6b7280;
		font-size: 24rpx;
	}

	.amount-chips {
		margin-top: 24rpx;
		display: flex;
		gap: 18rpx;
	}

	.chip {
		flex: 1;
		padding: 18rpx;
		border-radius: 18rpx;
		background: #f7f8fb;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6rpx;
	}

	.chip-label {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.chip-value {
		font-size: 26rpx;
		font-weight: 700;
		color: #1a2030;
		font-variant-numeric: tabular-nums;
	}

	.steps {
		margin: 24rpx 28rpx 0;
		padding: 30rpx 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		display: flex;
		align-items: center;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.step {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		min-width: 140rpx;
	}

	.step-dot {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: #eef0f5;
		color: #9aa3b2;
		font-size: 26rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-done .step-dot {
		background: #4fb38a;
		color: #ffffff;
	}

	.step-active .step-dot {
		background: #f5c23b;
		color: #1a1306;
		box-shadow: 0 0 0 8rpx rgba(245, 194, 59, 0.2);
	}

	.step-name {
		font-size: 24rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.step-desc {
		font-size: 20rpx;
		color: #9aa3b2;
	}

	.step-line {
		flex: 1;
		height: 2rpx;
		background: #eef0f5;
	}

	.step-line-active {
		background: #4fb38a;
	}

	.tip {
		margin: 24rpx 28rpx 0;
		padding: 22rpx 24rpx;
		border-radius: 18rpx;
		background: #fff7df;
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.tip-emoji {
		font-size: 30rpx;
	}

	.tip-text {
		flex: 1;
		font-size: 26rpx;
		color: #8a6914;
		line-height: 1.5;
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
		display: flex;
		gap: 16rpx;
		box-shadow: 0 -8rpx 20rpx rgba(26, 32, 48, 0.06);
	}

	.dock-ghost {
		flex: 0 0 220rpx;
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 20rpx;
		background: #ffffff;
		color: #3a4355;
		border: 1rpx solid #e4e7ee;
		font-size: 30rpx;
		font-weight: 700;
	}

	.dock-ghost::after {
		border: 0;
	}

	.dock-primary {
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

	.dock-primary::after {
		border: 0;
	}
</style>
