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
		padding-bottom: 220rpx;
		background: transparent;
	}

	/* ---------------- 计时仪表盘 ---------------- */
	.hero {
		margin: 24rpx 32rpx 0;
		padding: 52rpx 36rpx 56rpx;
		border-radius: 48rpx 16rpx 48rpx 16rpx;
		background: linear-gradient(135deg, #071f18 0%, #0c352a 50%, #031410 100%);
		color: #ffffff;
		box-shadow: 0 24rpx 56rpx rgba(10, 46, 36, 0.2);
		position: relative;
		overflow: hidden;
		border: 1rpx solid rgba(245, 210, 133, 0.16);
	}

	.hero::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 320rpx;
		height: 320rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%);
		filter: blur(30px);
		z-index: 0;
		pointer-events: none;
	}

	.hero-top {
		display: flex;
		align-items: center;
		gap: 16rpx;
		position: relative;
		z-index: 1;
	}

	.dot-pulse {
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 12rpx rgba(16, 185, 129, 0.8);
		position: relative;
	}

	.dot-pulse::after {
		content: '';
		position: absolute;
		top: -12rpx;
		left: -12rpx;
		right: -12rpx;
		bottom: -12rpx;
		border-radius: 50%;
		border: 2rpx solid rgba(16, 185, 129, 0.4);
		animation: radar-pulse 1.8s infinite cubic-bezier(0.25, 0, 0, 1);
	}

	.hero-status {
		color: #10b981;
		font-size: 22rpx;
		letter-spacing: 4rpx;
		font-weight: 800;
	}

	.hero-label {
		display: block;
		margin-top: 32rpx;
		color: rgba(255, 255, 255, 0.5);
		font-size: 22rpx;
		letter-spacing: 4rpx;
		font-weight: 700;
	}

	.hero-timer {
		display: block;
		margin-top: 14rpx;
		color: #ffffff;
		font-size: 120rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		text-shadow: 0 0 20rpx rgba(16, 185, 129, 0.6), 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
		position: relative;
		z-index: 1;
	}

	/* 仪表盘进度条 */
	.hero-bar {
		margin-top: 40rpx;
		height: 12rpx;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 99rpx;
		overflow: hidden;
	}

	.hero-bar-inner {
		height: 100%;
		background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
		border-radius: 99rpx;
		transition: width 0.5s ease-in-out;
		position: relative;
	}

	.hero-bar-inner::after {
		content: '';
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%);
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	.hero-meta {
		margin-top: 36rpx;
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.hero-meta-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.hero-meta-label {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.4);
	}

	.hero-meta-value {
		font-size: 26rpx;
		color: #ffffff;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.hero-meta-sep {
		width: 1rpx;
		height: 64rpx;
		background: rgba(255, 255, 255, 0.1);
	}

	/* ---------------- 预估账单卡 ---------------- */
	.amount-card {
		margin: 24rpx 32rpx 0;
		padding: 40rpx 32rpx;
		border-radius: 16rpx 48rpx 16rpx 48rpx;
		background: rgba(255, 255, 255, 0.78);
		backdrop-filter: blur(20px);
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: var(--card-shadow);
		text-align: center;
	}

	.amount-badge {
		display: inline-flex;
		padding: 8rpx 24rpx;
		border-radius: 99rpx;
		background: var(--warning-bg);
		color: var(--warning);
		border: 1rpx solid var(--warning-border);
		font-size: 22rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
	}

	.amount-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
		margin-top: 24rpx;
	}

	.amount-row .money-currency {
		font-size: 38rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.amount-row .money-number {
		font-size: 96rpx;
		font-weight: 900;
		color: var(--primary);
	}

	.amount-tip {
		display: block;
		margin-top: 14rpx;
		color: var(--text-muted);
		font-size: 24rpx;
		font-weight: 600;
	}

	/* 计费详情芯片 */
	.amount-chips {
		margin-top: 36rpx;
		display: flex;
		gap: 20rpx;
	}

	.chip {
		flex: 1;
		padding: 20rpx;
		border-radius: 24rpx;
		background: rgba(255, 255, 255, 0.4);
		border: 1rpx solid rgba(255, 255, 255, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
	}

	.chip-label {
		font-size: 22rpx;
		color: var(--text-light);
		font-weight: 600;
	}

	.chip-value {
		font-size: 26rpx;
		font-weight: 800;
		color: var(--primary);
		font-variant-numeric: tabular-nums;
	}

	/* ---------------- 步骤流向图 ---------------- */
	.steps {
		margin: 36rpx 32rpx 0;
		padding: 24rpx 16rpx;
		background: transparent;
		border: none;
		box-shadow: none;
		display: flex;
		align-items: center;
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
		background: rgba(255, 255, 255, 0.4);
		color: var(--text-light);
		font-size: 26rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1rpx solid rgba(255, 255, 255, 0.3);
		transition: var(--transition);
	}

	.step-done .step-dot {
		background: var(--success);
		color: #ffffff;
		border-color: var(--success);
		box-shadow: 0 4rpx 12rpx rgba(16, 185, 129, 0.2);
	}

	.step-active .step-dot {
		background: var(--accent-gradient);
		color: var(--primary);
		border-color: transparent;
		box-shadow: var(--accent-glow);
		position: relative;
	}

	.step-active .step-dot::after {
		content: '';
		position: absolute;
		top: -8rpx;
		left: -8rpx;
		right: -8rpx;
		bottom: -8rpx;
		border-radius: 50%;
		border: 2rpx solid rgba(199, 154, 57, 0.5);
		animation: radar-pulse 2s infinite cubic-bezier(0.25, 0, 0, 1);
	}

	.step-name {
		font-size: 24rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.step-desc {
		font-size: 20rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.step-line {
		flex: 1;
		height: 4rpx;
		background: rgba(255, 255, 255, 0.4);
		border-radius: 99rpx;
	}

	.step-line-active {
		background: var(--success);
	}

	/* ---------------- 温馨提示 ---------------- */
	.tip {
		margin: 24rpx 32rpx 0;
		padding: 24rpx 32rpx;
		border-radius: 36rpx 12rpx;
		background: rgba(255, 251, 239, 0.85);
		backdrop-filter: blur(10px);
		border: 1rpx solid rgba(224, 169, 60, 0.2);
		display: flex;
		align-items: center;
		gap: 16rpx;
		box-shadow: 0 8rpx 24rpx rgba(224, 169, 60, 0.02);
	}

	.tip-emoji {
		font-size: 32rpx;
	}

	.tip-text {
		flex: 1;
		font-size: 26rpx;
		color: #8a6914;
		line-height: 1.5;
		font-weight: 600;
	}

	.spacer {
		height: 40rpx;
	}

	/* ---------------- 底部悬浮操作板 ---------------- */
	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
		background: rgba(255, 255, 255, 0.95);
		display: flex;
		gap: 20rpx;
		box-shadow: 0 -12rpx 40rpx rgba(10, 46, 36, 0.06);
		backdrop-filter: blur(15px);
		border-top: 1rpx solid rgba(10, 46, 36, 0.04);
		z-index: 99;
	}

	.dock-ghost {
		flex: 0 0 220rpx;
		height: 100rpx;
		line-height: 100rpx;
		border-radius: 99rpx;
		background: #ffffff;
		color: var(--primary);
		border: 1rpx solid rgba(10, 46, 36, 0.15);
		font-size: 30rpx;
		font-weight: 800;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
		transition: var(--transition);
	}

	.dock-ghost:active {
		background: #f7faf8;
		transform: scale(0.97);
	}

	.dock-ghost::after {
		border: 0;
	}

	.dock-primary {
		flex: 1;
		height: 100rpx;
		line-height: 100rpx;
		border-radius: 99rpx;
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

	.dock-primary::before {
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

	.dock-primary:active {
		transform: scale(0.97);
		opacity: 0.95;
	}

	.dock-primary::after {
		border: 0;
	}
</style>
