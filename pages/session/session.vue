<template>
	<view class="app session dc-session has-brand-header">
		<brand-header title="计时中" theme="light" layout="compact" :back="true" />
		<view class="dc-session-content">
			<view class="dc-session-hero">
				<text v-if="order.spotName" class="dc-session-spot">{{ order.spotName }} · 已绑定</text>
				<text class="dc-session-label">已用时长</text>
				<text class="dc-session-timer">{{ formatDuration(elapsed) }}</text>
				<view class="dc-session-divider"></view>
				<view class="dc-session-metrics">
					<view><text>开始时间</text><text>{{ startTimeText }}</text></view>
					<view class="dc-session-metric-line"></view>
					<view><text>预估金额</text><text>¥{{ formatMoney(estimate.amountCents) }}</text></view>
				</view>
			</view>

			<view class="dc-session-rule">
				<text class="dc-session-rule-title">计费规则</text>
				<text class="dc-session-rule-summary">每 {{ rule.stepMinutes }} 分钟 ¥{{ stepPriceYuan }} · 起步 {{ rule.minDurationMinutes }} 分钟 · 向上取整</text>
				<view class="dc-session-row"><text>计费单位</text><text>{{ rule.stepMinutes }} 分钟</text></view>
				<view class="dc-session-row"><text>单位价格</text><text>¥{{ stepPriceYuan }}</text></view>
				<view class="dc-session-row"><text>起步时长</text><text>{{ rule.minDurationMinutes }} 分钟</text></view>
				<view class="dc-session-row"><text>向上取整</text><text>是</text></view>
			</view>

			<view class="dc-session-steps">
				<view class="dc-session-step active"><view>1</view><text>下竿准备</text></view>
				<view class="dc-session-step-line active"></view>
				<view class="dc-session-step active"><view>2</view><text>计时进行中</text></view>
				<view class="dc-session-step-line"></view>
				<view class="dc-session-step"><view>3</view><text>收竿结算</text></view>
			</view>

			<button class="dc-session-primary" :disabled="finishConfirming || finishing" @click="finish">{{ finishing ? '正在结算…' : '收竿结算' }}</button>
			<button class="dc-session-back" @click="backHome">返回首页</button>
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
		isLoggedIn,
		goHomeSafely
	} from '../../utils/fishingStore.js'
	import { safeDecode, parseScanParams, extractScanProof } from '../../utils/scan.js'

	const DEFAULT_RULE = { stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0 }

	export default {
		data() {
			return {
				order: { orderNo: '--', startTime: 0, ruleSnapshot: null },
				now: Date.now(),
				timer: null,
				rule: DEFAULT_RULE,
				scanQrId: null,
				scanScene: '',
				autoSettle: false,
				directEntry: false,
				settlePromptShown: false,
				finishConfirming: false,
				finishing: false
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
		onLoad(option = {}) {
			this.applyScanOption(option)
			this.autoSettle = String(option.settle || '') === '1'
			this.directEntry = String(option.direct || '') === '1'
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/session/session' + this.buildEntryQuery()) })
				return
			}
			this.ensureVenue().then(() => this.refresh()).catch(() => {})
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
				if (!user) { goHomeSafely(); return }
				return fetchRunningOrder(user.userId).then((running) => {
					if (!running) {
						uni.showToast({ title: '当前没有进行中的计时', icon: 'none' })
						setTimeout(() => goHomeSafely(), 500)
						return
					}
					this.order = running
					if (running.ruleSnapshot) {
						try { this.rule = Object.assign({}, this.rule, JSON.parse(running.ruleSnapshot)) } catch (e) {}
					}
					if (this.autoSettle && !this.settlePromptShown) {
						this.settlePromptShown = true
						setTimeout(() => this.confirmFinish(this.currentScan()), 150)
					}
				})
			},
			finish() {
				this.confirmFinish(this.currentScan())
			},
			applyScanOption(option = {}) {
				const rawScene = option.scene
					? safeDecode(option.scene)
					: (option.action && option.venueId ? 'action=' + option.action + '&venueId=' + option.venueId : '')
				const proof = extractScanProof(parseScanParams(rawScene))
				const qrId = Number(option.qrId || (proof && proof.qrId) || 0)
				this.scanQrId = Number.isSafeInteger(qrId) && qrId > 0 ? qrId : null
				this.scanScene = this.scanQrId ? '' : ((proof && proof.scene) || rawScene)
			},
			currentScan() {
				if (this.scanQrId) return { qrId: this.scanQrId }
				if (this.scanScene) return { scene: this.scanScene }
				return {}
			},
			buildEntryQuery() {
				const parts = []
				if (this.scanQrId) parts.push('qrId=' + encodeURIComponent(this.scanQrId))
				else if (this.scanScene) parts.push('scene=' + encodeURIComponent(this.scanScene))
				if (this.autoSettle) parts.push('settle=1')
				if (this.directEntry) parts.push('direct=1')
				return parts.length ? '?' + parts.join('&') : ''
			},
			confirmFinish(scan = {}) {
				if (this.finishConfirming || this.finishing) return
				this.finishConfirming = true
				try {
					uni.showModal({
						title: '确认收竿结算',
						content: '确认后将结束计时，并按当前时长生成待支付订单。',
						success: (res) => {
							if (!res.confirm || this.finishing) return
							const user = getUser()
							if (!user) return
							this.finishing = true
							finishOrder(user.userId, scan).then((result) => {
								if (!result) {
									uni.showToast({ title: '未检测到进行中订单', icon: 'none' })
									this.backHome()
									return
								}
								uni.redirectTo({ url: '/pages/pay/pay' })
							}).catch(() => {}).finally(() => { this.finishing = false })
						},
						complete: () => { this.finishConfirming = false }
					})
				} catch (error) {
					this.finishConfirming = false
				}
			},
			backHome() { goHomeSafely() },
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
/* v18：严格对齐计时中设计稿 */
	.dc-session.session {
		min-height: 100vh;
		padding: 0 0 calc(42rpx + env(safe-area-inset-bottom)) !important;
		background: var(--g-600);
	}

	.dc-session-content {
		padding: 0 24rpx;
	}

	.dc-session-hero {
		padding: 54rpx 20rpx 34rpx;
		color: #f8fffe;
		text-align: center;
	}

	.dc-session-label {
		display: block;
		font-size: 27rpx;
		font-weight: 700;
	}

	.dc-session-spot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48rpx;
		margin-bottom: 18rpx;
		padding: 0 20rpx;
		border: 1rpx solid rgba(248,255,254,.5);
		border-radius: 12rpx;
		font-size: 23rpx;
		font-weight: 800;
	}

	.dc-session-timer {
		display: block;
		margin-top: 10rpx;
		font-size: 82rpx;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		letter-spacing: 2rpx;
		line-height: 1.2;
	}

	.dc-session-divider {
		height: 1rpx;
		margin: 28rpx 10rpx 24rpx;
		background: rgba(248,255,254,.48);
	}

	.dc-session-metrics {
		display: flex;
		align-items: center;
	}

	.dc-session-metrics > view:not(.dc-session-metric-line) {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 8rpx;
	}

	.dc-session-metrics text:first-child {
		font-size: 22rpx;
		font-weight: 650;
		opacity: .88;
	}

	.dc-session-metrics text:last-child {
		font-size: 34rpx;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.dc-session-metric-line {
		width: 1rpx;
		height: 70rpx;
		background: rgba(248,255,254,.42);
	}

	.dc-session-rule,
	.dc-session-steps {
		border: 1rpx solid rgba(248,255,254,.28);
		border-radius: 22rpx;
		background: var(--surface-strong);
		box-shadow: 0 7rpx 22rpx rgba(4,69,70,.11);
	}

	.dc-session-rule {
		padding: 26rpx 28rpx 0;
	}

	.dc-session-rule-title {
		display: block;
		color: var(--ink);
		font-size: 30rpx;
		font-weight: 800;
	}

	.dc-session-rule-summary {
		display: block;
		margin: 8rpx 0 14rpx;
		color: var(--ink-3);
		font-size: 21rpx;
		line-height: 1.5;
	}

	.dc-session-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20rpx;
		min-height: 72rpx;
		border-top: 1rpx solid var(--line);
		color: var(--ink-2);
		font-size: 24rpx;
	}

	.dc-session-row text:last-child {
		font-variant-numeric: tabular-nums;
	}

	.dc-session-steps {
		display: flex;
		align-items: flex-start;
		margin-top: 20rpx;
		padding: 28rpx 24rpx 24rpx;
	}

	.dc-session-step {
		display: flex;
		width: 116rpx;
		align-items: center;
		flex-direction: column;
		gap: 10rpx;
		color: var(--ink-3);
		font-size: 21rpx;
		white-space: nowrap;
	}

	.dc-session-step view {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 50rpx;
		height: 50rpx;
		border-radius: 50%;
		background: var(--surface-3);
		color: var(--ink-3);
		font-size: 24rpx;
		font-weight: 800;
	}

	.dc-session-step.active {
		color: var(--ink);
	}

	.dc-session-step.active view {
		background: var(--g-600);
		color: #f8fffe;
	}

	.dc-session-step-line {
		flex: 1;
		height: 4rpx;
		margin-top: 23rpx;
		background: var(--surface-3);
	}

	.dc-session-step-line.active {
		background: var(--g-600);
	}

	.dc-session-primary,
	.dc-session-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin: 0;
		line-height: 1.2;
	}

	.dc-session-primary {
		height: 92rpx;
		margin-top: 22rpx;
		border: 2rpx solid rgba(248,255,254,.86);
		border-radius: 20rpx;
		background: transparent;
		color: #f8fffe;
		font-size: 30rpx;
		font-weight: 800;
	}

	.dc-session-primary:active {
		background: rgba(248,255,254,.12);
		transform: scale(.985);
	}

	.dc-session-back {
		height: 72rpx;
		margin-top: 6rpx;
		background: transparent;
		color: #f8fffe;
		font-size: 27rpx;
		font-weight: 700;
	}

	@media (max-width: 360px) {
		.dc-session-content {
			padding: 0 18rpx;
		}

		.dc-session-hero {
			padding-top: 42rpx;
		}

		.dc-session-timer {
			font-size: 70rpx;
		}

		.dc-session-steps {
			padding-left: 16rpx;
			padding-right: 16rpx;
		}

		.dc-session-step {
			width: 102rpx;
			font-size: 19rpx;
		}
	}
</style>
