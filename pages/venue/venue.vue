<template>
	<view class="app venue-detail">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">{{ venue.name || '共享钓场' }}</text>
				<text class="hero-sub">SHARED · FISHING VENUE</text>
			</view>
		</view>

		<view class="card">
			<view class="info-row">
				<text class="info-icon">📍</text>
				<view class="info-body">
					<text class="info-label">钓场地址</text>
					<text class="info-value">{{ venue.address || '暂无地址信息' }}</text>
				</view>
				<view class="nav-btn" @click="openMap">导航</view>
			</view>
		</view>

		<view class="card">
			<text class="card-title">计费信息</text>
			<view class="kv-row">
				<text class="kv-key">起步时长</text>
				<text class="kv-val">{{ rule.minDurationMinutes }} 分钟</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">计费单价</text>
				<text class="kv-val">¥{{ formatMoney(rule.pricePerStepCents) }} / {{ rule.stepMinutes }}分钟</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">封顶金额</text>
				<text class="kv-val">{{ rule.capAmountCents > 0 ? '¥' + formatMoney(rule.capAmountCents) : '无封顶' }}</text>
			</view>
		</view>

		<view v-if="venue.notice" class="card">
			<text class="card-title">钓场公告</text>
			<text class="notice-text">{{ venue.notice }}</text>
		</view>

		<view class="actions">
			<view class="action-btn" @click="goHome">
				<text class="action-btn-icon">🎣</text>
				<text class="action-btn-text">开始垂钓</text>
			</view>
			<view class="action-btn action-btn-ghost" @click="callVenue">
				<text class="action-btn-icon">📞</text>
				<text class="action-btn-text">联系钓场</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { formatMoney, loadDefaultVenue, getCachedVenue } from '../../utils/fishingStore.js'

	const FALLBACK_RULE = { stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0 }

	export default {
		data() {
			return {
				venue: { name: '共享钓场', address: '' },
				rule: FALLBACK_RULE
			}
		},
		onShow() {
			const cached = getCachedVenue()
			if (cached) {
				if (cached.venue) this.venue = cached.venue
				if (cached.rule) this.rule = Object.assign({}, FALLBACK_RULE, cached.rule)
			}
			loadDefaultVenue().then((data) => {
				if (data && data.venue) this.venue = data.venue
				if (data && data.rule) this.rule = Object.assign({}, FALLBACK_RULE, data.rule)
			}).catch(() => {})
		},
		methods: {
			formatMoney,
			openMap() {
				if (!this.venue.address) return
				// #ifdef MP-WEIXIN
				uni.openLocation({
					latitude: this.venue.latitude || 0,
					longitude: this.venue.longitude || 0,
					name: this.venue.name || '共享钓场',
					address: this.venue.address
				})
				// #endif
				// #ifndef MP-WEIXIN
				uni.setClipboardData({
					data: this.venue.address,
					success: () => uni.showToast({ title: '地址已复制', icon: 'success' })
				})
				// #endif
			},
			callVenue() {
				const phone = this.venue.phone || '400-000-0000'
				if (!this.venue.phone) {
					uni.showToast({ title: '暂无联系方式', icon: 'none' })
					return
				}
				uni.makePhoneCall({ phoneNumber: phone })
			},
			goHome() {
				uni.redirectTo({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style>
	.venue-detail {
		padding-bottom: 80rpx;
	}

	/* ---------------- 英雄详情 Banner ---------------- */
	.hero {
		position: relative;
		margin: 24rpx 32rpx 0;
		padding: 48rpx 36rpx 48rpx;
		border-radius: 32rpx;
		overflow: hidden;
		box-shadow: 0 16rpx 40rpx rgba(10, 46, 36, 0.15);
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, #0d382c 0%, #06221a 70%, #031410 100%);
	}
	
	.hero-bg::after {
		content: '';
		position: absolute;
		right: -60rpx;
		top: -80rpx;
		width: 260rpx;
		height: 260rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(199, 154, 57, 0.12) 0%, rgba(199, 154, 57, 0) 70%);
		filter: blur(15px);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.hero-title {
		font-size: 48rpx;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 1rpx;
		display: block;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	}

	.hero-sub {
		font-size: 22rpx;
		color: var(--accent);
		letter-spacing: 6rpx;
		display: block;
		font-weight: 800;
		text-transform: uppercase;
	}

	/* ---------------- 地址栏 ---------------- */
	.info-row {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.info-icon {
		font-size: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.info-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		min-width: 0;
	}

	.info-label {
		font-size: 22rpx;
		color: var(--text-light);
		font-weight: 600;
	}

	.info-value {
		font-size: 28rpx;
		color: var(--text-main);
		font-weight: 700;
		line-height: 1.4;
	}

	.nav-btn {
		padding: 16rpx 36rpx;
		background: var(--accent-gradient);
		border-radius: 99rpx;
		font-size: 24rpx;
		font-weight: 800;
		color: var(--primary);
		box-shadow: var(--accent-glow);
		transition: var(--transition);
	}

	.nav-btn:active {
		transform: scale(0.95);
	}

	/* 公告 */
	.notice-text {
		display: block;
		margin-top: 14rpx;
		font-size: 26rpx;
		color: var(--text-muted);
		line-height: 1.6;
		font-weight: 600;
	}

	/* ---------------- 底部操作 ---------------- */
	.actions {
		margin: 40rpx 32rpx 0;
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		flex: 1;
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		background: var(--accent-gradient);
		border-radius: 22rpx;
		box-shadow: var(--accent-glow);
		transition: var(--transition);
		border: 0;
	}

	.action-btn:active {
		transform: scale(0.97);
		opacity: 0.95;
	}

	.action-btn-ghost {
		background: #ffffff;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
		border: 1rpx solid rgba(10, 46, 36, 0.15);
	}

	.action-btn-icon {
		font-size: 32rpx;
	}

	.action-btn-text {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.action-btn-ghost .action-btn-text {
		color: var(--text-main);
	}

</style>
