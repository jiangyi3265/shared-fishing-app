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
		padding-bottom: 60rpx;
	}

	.hero {
		position: relative;
		margin: 20rpx 28rpx 0;
		padding: 40rpx 32rpx 36rpx;
		border-radius: 28rpx;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 2rpx;
		display: block;
	}

	.hero-sub {
		font-size: 22rpx;
		color: #f5c23b;
		letter-spacing: 4rpx;
		display: block;
		margin-top: 8rpx;
	}

	.info-row {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.info-icon {
		font-size: 36rpx;
	}

	.info-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.info-label {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.info-value {
		font-size: 28rpx;
		color: #1a2030;
		font-weight: 600;
	}

	.nav-btn {
		padding: 12rpx 28rpx;
		background: #f5c23b;
		border-radius: 999rpx;
		font-size: 24rpx;
		font-weight: 700;
		color: #1a1306;
	}

	.notice-text {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #6b7280;
		line-height: 1.6;
	}

	.actions {
		margin: 32rpx 28rpx 0;
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		flex: 1;
		height: 96rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		background: #f5c23b;
		border-radius: 20rpx;
		box-shadow: 0 12rpx 24rpx rgba(245, 194, 59, 0.28);
	}

	.action-btn-ghost {
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
		border: 1rpx solid #e4e7ee;
	}

	.action-btn-icon {
		font-size: 28rpx;
	}

	.action-btn-text {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a1306;
	}

	.action-btn-ghost .action-btn-text {
		color: #3a4355;
	}
</style>
