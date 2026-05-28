<template>
	<view class="app start">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<view class="hero-badge">SCAN · ENTRANCE</view>
				<text class="hero-title">准备开始</text>
				<text class="hero-sub">扫码已核验，确认后即可计时</text>
			</view>
			<view class="hero-ill">🎣</view>
		</view>

		<view class="venue">
			<view class="venue-top">
				<text class="venue-name">{{ venue.name }}</text>
				<view class="venue-chip venue-chip-ok">可开始</view>
			</view>
			<view class="venue-addr">
				<text class="venue-addr-icon">📍</text>
				<text class="venue-addr-text">{{ venue.address }}</text>
			</view>
			<text class="venue-notice">{{ venue.notice }}</text>
		</view>

		<view class="amount">
			<view class="amount-label">当前应付</view>
			<view class="amount-row">
				<text class="money-currency">¥</text>
				<text class="money-number">0.00</text>
			</view>
			<text class="amount-tip">开始计时后按服务端时间累计</text>
		</view>

		<view class="rule">
			<view class="rule-title">
				<text>计费规则</text>
				<text class="rule-tag">{{ rule.name }}</text>
			</view>
			<view class="rule-grid">
				<view class="rule-cell">
					<text class="rule-cell-label">计费单位</text>
					<text class="rule-cell-value">{{ rule.stepMinutes }} 分钟</text>
				</view>
				<view class="rule-cell">
					<text class="rule-cell-label">单位价格</text>
					<text class="rule-cell-value rule-cell-highlight">¥{{ stepPriceYuan }}</text>
				</view>
				<view class="rule-cell">
					<text class="rule-cell-label">起步时长</text>
					<text class="rule-cell-value">{{ rule.minDurationMinutes }} 分钟</text>
				</view>
				<view class="rule-cell">
					<text class="rule-cell-label">进位方式</text>
					<text class="rule-cell-value">向上取整</text>
				</view>
			</view>
			<text class="rule-tip">{{ rule.summary }}</text>
		</view>

		<view class="spacer"></view>

		<view class="dock">
			<button class="dock-ghost" @click="backHome">返回</button>
			<button class="dock-primary" @click="startNow">开始计时</button>
		</view>
	</view>
</template>

<script>
	import {
		formatMoney,
		startOrder,
		getUser,
		fetchRunningOrder,
		fetchPendingOrder,
		isLoggedIn,
		loadDefaultVenue,
		getCachedVenue
	} from '../../utils/fishingStore.js'

	const FALLBACK_VENUE = { name: '共享钓场', address: '--', notice: '', venueId: null }
	const FALLBACK_RULE = { name: '标准计费', stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0, summary: '起步 30 分钟起计' }

	export default {
		data() {
			return { venue: FALLBACK_VENUE, rule: FALLBACK_RULE, scanQrId: null, scanScene: '' }
		},
		computed: {
			stepPriceYuan() { return formatMoney(this.rule.pricePerStepCents) }
		},
		onLoad(option = {}) {
			this.applyScanOption(option)
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/start/start' + this.buildScanQuery()) })
				return
			}
			if (!this.hasScanProof()) {
				uni.showToast({ title: '请先扫描入口码', icon: 'none' })
				setTimeout(() => this.backHome(), 500)
				return
			}
			this.loadVenue()
			const user = getUser()
			if (!user) return
			fetchPendingOrder(user.userId).then((p) => { if (p) uni.redirectTo({ url: '/pages/pay/pay' }) })
			fetchRunningOrder(user.userId).then((r) => { if (r) uni.redirectTo({ url: '/pages/session/session' }) })
		},
		methods: {
			loadVenue() {
				const cached = getCachedVenue()
				if (cached && cached.venue) { this.applyVenue(cached) }
				loadDefaultVenue().then((data) => { if (data) this.applyVenue(data) }).catch(() => {})
			},
			applyVenue(data) {
				if (data.venue) this.venue = data.venue
				if (data.rule) this.rule = Object.assign({}, FALLBACK_RULE, data.rule, { name: data.rule.ruleName || FALLBACK_RULE.name })
			},
			applyScanOption(option = {}) {
				const rawScene = option.scene
					? decodeURIComponent(option.scene)
					: (option.action && option.venueId ? 'action=' + option.action + '&venueId=' + option.venueId : '')
				const sceneParams = this.parseScan(rawScene)
				const qrId = Number(option.qrId || sceneParams.qrId || 0)
				this.scanQrId = Number.isFinite(qrId) && qrId > 0 ? qrId : null
				this.scanScene = this.scanQrId ? '' : rawScene
			},
			parseScan(raw) {
				if (!raw || raw.indexOf('=') < 0) return {}
				const out = {}
				raw.split('&').forEach((pair) => {
					const [k, v] = pair.split('=')
					if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '')
				})
				return out
			},
			hasScanProof() {
				return Boolean(this.scanQrId || this.scanScene)
			},
			currentScan() {
				return this.scanQrId ? { qrId: this.scanQrId } : { scene: this.scanScene }
			},
			buildScanQuery() {
				if (this.scanQrId) return '?qrId=' + encodeURIComponent(this.scanQrId)
				if (this.scanScene) return '?scene=' + encodeURIComponent(this.scanScene)
				return ''
			},
			startNow() {
				const user = getUser()
				if (!user) {
					uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/start/start' + this.buildScanQuery()) })
					return
				}
				if (!this.hasScanProof()) {
					uni.showToast({ title: '请先扫描入口码', icon: 'none' })
					return
				}
				fetchPendingOrder(user.userId).then((pending) => {
					if (pending) {
						uni.showToast({ title: '请先支付未完成账单', icon: 'none' })
						uni.redirectTo({ url: '/pages/pay/pay' })
						return
					}
					startOrder(user.userId, this.venue.venueId, this.currentScan()).then(() => {
						uni.redirectTo({ url: '/pages/session/session' })
					})
				})
			},
			backHome() { uni.redirectTo({ url: '/pages/index/index' }) }
		}
	}
</script>

<style>
	.start {
		padding-bottom: 200rpx;
	}

	.hero {
		position: relative;
		margin: 20rpx 28rpx 0;
		padding: 40rpx 32rpx;
		border-radius: 28rpx;
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 24rpx;
		box-shadow: 0 12rpx 30rpx rgba(26, 32, 48, 0.08);
	}

	.hero-bg {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		flex: 1;
		color: #ffffff;
	}

	.hero-badge {
		display: inline-block;
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(245, 194, 59, 0.2);
		color: #f5c23b;
		font-size: 20rpx;
		font-weight: 700;
		letter-spacing: 3rpx;
	}

	.hero-title {
		display: block;
		margin-top: 14rpx;
		font-size: 48rpx;
		font-weight: 800;
		color: #ffffff;
	}

	.hero-sub {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #d8d8d8;
	}

	.hero-ill {
		position: relative;
		z-index: 1;
		width: 140rpx;
		height: 140rpx;
		border-radius: 50%;
		background: #f5c23b;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 64rpx;
		box-shadow: 0 14rpx 30rpx rgba(245, 194, 59, 0.4);
	}

	.venue {
		margin: 24rpx 28rpx 0;
		padding: 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.venue-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.venue-name {
		font-size: 32rpx;
		font-weight: 800;
		color: #1a2030;
	}

	.venue-chip {
		padding: 6rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
		font-weight: 700;
	}

	.venue-chip-ok {
		background: rgba(79, 179, 138, 0.14);
		color: #2fa273;
	}

	.venue-addr {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.venue-addr-icon {
		font-size: 28rpx;
	}

	.venue-addr-text {
		font-size: 26rpx;
		color: #4a5567;
	}

	.venue-notice {
		display: block;
		margin-top: 14rpx;
		padding: 16rpx 18rpx;
		border-radius: 14rpx;
		background: #f7f8fb;
		color: #6b7280;
		font-size: 24rpx;
		line-height: 1.6;
	}

	.amount {
		margin: 24rpx 28rpx 0;
		padding: 40rpx 32rpx;
		border-radius: 24rpx;
		background: linear-gradient(135deg, #fff7df 0%, #ffeab0 100%);
		text-align: center;
		box-shadow: 0 10rpx 28rpx rgba(245, 194, 59, 0.22);
	}

	.amount-label {
		color: #b8860b;
		font-size: 22rpx;
		letter-spacing: 6rpx;
		font-weight: 700;
	}

	.amount-row {
		display: flex;
		align-items: baseline;
		justify-content: center;
		margin-top: 14rpx;
		color: #1a1306;
	}

	.amount-row .money-currency {
		color: #1a1306;
		font-size: 34rpx;
	}

	.amount-row .money-number {
		color: #1a1306;
		font-size: 104rpx;
	}

	.amount-tip {
		display: block;
		margin-top: 10rpx;
		color: #8a6914;
		font-size: 24rpx;
	}

	.rule {
		margin: 24rpx 28rpx 0;
		padding: 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.rule-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.rule-tag {
		padding: 4rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(245, 194, 59, 0.18);
		color: #b8860b;
		font-size: 22rpx;
		font-weight: 700;
	}

	.rule-grid {
		margin-top: 18rpx;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14rpx;
	}

	.rule-cell {
		padding: 20rpx;
		border-radius: 16rpx;
		background: #f7f8fb;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.rule-cell-label {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.rule-cell-value {
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2030;
		font-variant-numeric: tabular-nums;
	}

	.rule-cell-highlight {
		color: #b8860b;
	}

	.rule-tip {
		display: block;
		margin-top: 16rpx;
		padding: 16rpx;
		border-radius: 14rpx;
		background: #fff7df;
		color: #8a6914;
		font-size: 24rpx;
		line-height: 1.6;
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
