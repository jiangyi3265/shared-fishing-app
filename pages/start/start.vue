<template>
	<view class="app start dc-start has-brand-header">
		<brand-header title="准备开始" theme="light" layout="compact" :back="true" />
		<view class="dc-start-content">
			<view class="dc-start-venue">
				<view class="dc-start-venue-head">
					<view class="dc-start-pin hic-nav"></view>
					<view class="dc-start-venue-copy">
						<text class="dc-start-name">{{ venue.name }}</text>
						<text class="dc-start-address">{{ venue.address }}</text>
					</view>
				</view>
				<view class="dc-start-status">可开始</view>
				<text class="dc-start-notice">{{ venue.notice || '下竿后开始计时，实时计费' }}</text>
				<view v-if="spot" class="dc-start-spot">
					<view class="dc-start-spot-no">{{ spotNumber }}</view>
					<view class="dc-start-spot-copy">
						<text class="dc-start-spot-name">{{ spot.spotName }}</text>
						<text class="dc-start-spot-desc">{{ spot.description || '二维码已匹配当前钓位' }}</text>
					</view>
					<text class="dc-start-spot-state">已匹配</text>
				</view>
			</view>

			<view class="dc-start-rule">
				<view class="dc-start-row"><text>计费单位</text><text>{{ rule.stepMinutes }} 分钟</text></view>
				<view class="dc-start-row"><text>单位价格</text><text>¥{{ stepPriceYuan }}</text></view>
				<view class="dc-start-row"><text>起步时长</text><text>{{ rule.minDurationMinutes }} 分钟</text></view>
				<view class="dc-start-row"><text>向上取整</text><text>是</text></view>
			</view>

			<text class="dc-start-summary">{{ rule.summary }}</text>
			<button class="dc-start-primary" :disabled="starting" @click="startNow">{{ primaryButtonText }}</button>
			<button class="dc-start-back" @click="backHome">返回</button>
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
		resolveQrcode,
		isLoggedIn,
		loadDefaultVenue,
		getCachedVenue,
		goHomeSafely
	} from '../../utils/fishingStore.js'
	import { safeDecode, parseScanParams, extractScanProof } from '../../utils/scan.js'

	const FALLBACK_VENUE = { name: '共享钓场', address: '--', notice: '', venueId: null }
	const FALLBACK_RULE = { name: '标准计费', stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0, summary: '起步 30 分钟起计' }

	export default {
		data() {
			return { venue: FALLBACK_VENUE, rule: FALLBACK_RULE, spot: null, scanQrId: null, scanScene: '', directEntry: false, starting: false }
		},
		computed: {
			stepPriceYuan() { return formatMoney(this.rule.pricePerStepCents) },
			spotNumber() {
				const match = String(this.spot && this.spot.spotName || '').match(/\d+/)
				return match ? match[0].padStart(2, '0') : '位'
			},
			primaryButtonText() {
				if (this.starting) return '正在开始…'
				return this.spot ? `确认 ${this.spot.spotName} 并开始计时` : '开始计时'
			}
		},
		onLoad(option = {}) {
			this.applyScanOption(option)
			this.directEntry = String(option.direct || '') === '1'
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/start/start' + this.buildEntryQuery()) })
				return
			}
			if (!this.hasScanProof() && !this.directEntry) {
				uni.showToast({ title: '请从首页点击下竿计时，或扫描钓场二维码', icon: 'none' })
				setTimeout(() => this.backHome(), 500)
				return
			}
			this.loadVenue()
			if (this.hasScanProof()) this.loadScanInfo()
			const user = getUser()
			if (!user) return
			fetchPendingOrder(user.userId).then((p) => { if (p) uni.redirectTo({ url: '/pages/pay/pay' }) })
			fetchRunningOrder(user.userId).then((r) => {
				if (r) uni.redirectTo({
					url: '/pages/session/session' + (this.hasScanProof() ? this.buildEntryQuery({ settle: 1 }) : '')
				})
			})
		},
		methods: {
			loadScanInfo() {
				resolveQrcode(this.currentScan(), { redirectOnUnauthorized: false }).then((data) => {
					this.spot = data && data.spot ? data.spot : null
				}).catch(() => { this.spot = null })
			},
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
					? safeDecode(option.scene)
					: (option.action && option.venueId ? 'action=' + option.action + '&venueId=' + option.venueId : '')
				const proof = extractScanProof(parseScanParams(rawScene))
				const qrId = Number(option.qrId || (proof && proof.qrId) || 0)
				this.scanQrId = Number.isSafeInteger(qrId) && qrId > 0 ? qrId : null
				this.scanScene = this.scanQrId ? '' : ((proof && proof.scene) || rawScene)
			},
			hasScanProof() {
				return Boolean(this.scanQrId || this.scanScene)
			},
			currentScan() {
				if (this.scanQrId) return { qrId: this.scanQrId }
				if (this.scanScene) return { scene: this.scanScene }
				return {}
			},
			buildEntryQuery(extra = {}) {
				const parts = []
				if (this.scanQrId) parts.push('qrId=' + encodeURIComponent(this.scanQrId))
				else if (this.scanScene) parts.push('scene=' + encodeURIComponent(this.scanScene))
				if (this.directEntry) parts.push('direct=1')
				Object.keys(extra).forEach((key) => {
					if (extra[key] !== undefined && extra[key] !== null && extra[key] !== '') {
						parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(extra[key]))
					}
				})
				return parts.length ? '?' + parts.join('&') : ''
			},
			startNow() {
				if (this.starting) return
				const user = getUser()
				if (!user) {
					uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/start/start' + this.buildEntryQuery()) })
					return
				}
				if (!this.hasScanProof() && !this.directEntry) {
					uni.showToast({ title: '请从首页点击下竿计时，或扫描钓场二维码', icon: 'none' })
					return
				}
				if (this.directEntry && (!Number.isSafeInteger(Number(this.venue.venueId)) || Number(this.venue.venueId) <= 0)) {
					uni.showToast({ title: '钓场信息尚未加载完成，请稍后重试', icon: 'none' })
					return
				}
				this.starting = true
				fetchPendingOrder(user.userId).then((pending) => {
					if (pending) {
						uni.showToast({ title: '请先支付未完成账单', icon: 'none' })
						uni.redirectTo({ url: '/pages/pay/pay' })
						return
					}
					const venueId = this.hasScanProof() ? null : Number(this.venue.venueId)
					return startOrder(user.userId, venueId, this.currentScan()).then(() => {
						uni.redirectTo({ url: '/pages/session/session' })
					})
				}).catch(() => {}).finally(() => { this.starting = false })
			},
			backHome() { goHomeSafely() }
		}
	}
</script>

<style>
/* v18：严格对齐核心入场设计稿 */
	.dc-start.start {
		min-height: 100vh;
		padding: 28rpx 0 calc(48rpx + env(safe-area-inset-bottom)) !important;
		background: #f7fbfa;
	}

	.dc-start-content {
		padding: 0 28rpx;
	}

	.dc-start-venue,
	.dc-start-rule {
		border: 1rpx solid var(--line);
		border-radius: 22rpx;
		background: var(--surface-strong);
	}

	.dc-start-venue {
		padding: 32rpx 30rpx 28rpx;
		text-align: center;
	}

	.dc-start-venue-head {
		display: flex;
		align-items: flex-start;
		gap: 18rpx;
		text-align: left;
	}

	.dc-start-pin {
		width: 46rpx;
		height: 46rpx;
		margin-top: 3rpx;
		background-size: contain;
		flex-shrink: 0;
	}

	.dc-start-venue-copy {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.dc-start-name {
		overflow: hidden;
		color: var(--ink);
		font-size: 34rpx;
		font-weight: 800;
		line-height: 1.25;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dc-start-address {
		margin-top: 8rpx;
		overflow: hidden;
		color: var(--ink-3);
		font-size: 25rpx;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dc-start-status {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 180rpx;
		height: 64rpx;
		margin-top: 26rpx;
		padding: 0 30rpx;
		border: 2rpx solid var(--g-600);
		border-radius: 18rpx;
		color: var(--g-800);
		font-size: 29rpx;
		font-weight: 800;
	}

	.dc-start-notice {
		display: block;
		margin-top: 16rpx;
		color: var(--ink-3);
		font-size: 23rpx;
	}

	.dc-start-spot {
		display: flex;
		align-items: center;
		gap: 18rpx;
		margin-top: 28rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid var(--line);
		text-align: left;
	}

	.dc-start-spot-no {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64rpx;
		height: 64rpx;
		border-radius: 18rpx;
		background: var(--g-100);
		color: var(--g-800);
		font-size: 27rpx;
		font-weight: 900;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.dc-start-spot-copy {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.dc-start-spot-name {
		color: var(--ink);
		font-size: 28rpx;
		font-weight: 800;
	}

	.dc-start-spot-desc {
		margin-top: 5rpx;
		overflow: hidden;
		color: var(--ink-3);
		font-size: 22rpx;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dc-start-spot-state {
		color: var(--g-700);
		font-size: 23rpx;
		font-weight: 800;
		flex-shrink: 0;
	}

	.dc-start-rule {
		margin-top: 24rpx;
		padding: 0 28rpx;
	}

	.dc-start-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24rpx;
		min-height: 88rpx;
		border-bottom: 1rpx solid var(--line);
		color: var(--ink);
		font-size: 27rpx;
	}

	.dc-start-row:last-child {
		border-bottom: 0;
	}

	.dc-start-row text:first-child {
		font-weight: 700;
	}

	.dc-start-row text:last-child {
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}

	.dc-start-summary {
		display: block;
		margin: 18rpx 6rpx 0;
		color: var(--ink-3);
		font-size: 22rpx;
		text-align: center;
	}

	.dc-start-primary,
	.dc-start-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin: 0;
		line-height: 1.2;
	}

	.dc-start-primary {
		height: 96rpx;
		margin-top: 36rpx;
		border-radius: 20rpx;
		background: var(--g-600);
		box-shadow: 0 9rpx 22rpx rgba(8,142,141,.16);
		color: #f8fffe;
		font-size: 31rpx;
		font-weight: 800;
	}

	.dc-start-primary:active {
		background: var(--g-800);
		transform: scale(.985);
	}

	.dc-start-back {
		height: 76rpx;
		margin-top: 8rpx;
		background: transparent;
		color: var(--g-800);
		font-size: 28rpx;
		font-weight: 700;
	}

	@media (max-width: 360px) {
		.dc-start-content {
			padding: 0 22rpx;
		}

		.dc-start-venue {
			padding-left: 24rpx;
			padding-right: 24rpx;
		}

		.dc-start-name {
			font-size: 31rpx;
		}
	}
</style>
