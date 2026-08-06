<template>
	<view class="app venue-detail has-brand-header">
		<brand-header title="钓场详情" theme="light" layout="compact" :back="true" />
		<view class="hero">
			<image class="v-hero-photo" src="/static/hero-fishing-v2.jpg" mode="aspectFill"></image>
			<view class="v-hero-scrim"></view>
			<view class="venue-overview">
				<image class="venue-mark" src="/static/logo-mark.svg" mode="aspectFill" />
				<view class="venue-overview-main">
					<view class="venue-title-row">
						<text class="hero-title">{{ venue.name || '共享钓场' }}</text>
						<text class="open-tag">开放中</text>
					</view>
					<view class="venue-meta"><text class="star">★</text><text>评分 4.8</text><text class="meta-sep"></text><text>营业时间 06:00-18:00</text></view>
				</view>
			</view>
		</view>

		<view class="venue-info-card">
			<view class="info-row">
				<view class="line-icon hic-nav"></view>
				<view class="info-body">
					<text class="info-label">钓场地址</text>
					<text class="info-value">{{ venue.address || '暂无地址信息' }}</text>
				</view>
				<view class="mini-nav" @click="openMap"><text class="mini-nav-arrow">➤</text><text>导航</text></view>
			</view>
			<view class="fee-head"><view class="line-icon fee-icon"></view><text>计费信息</text></view>
			<view class="fee-row">
				<text class="kv-key">起步时长</text>
				<text class="kv-val">{{ rule.minDurationMinutes }} 分钟</text>
			</view>
			<view class="fee-row">
				<text class="kv-key">计费单价</text>
				<text class="kv-val">¥{{ formatMoney(rule.pricePerStepCents) }} / {{ rule.stepMinutes }}分钟</text>
			</view>
			<view class="fee-row">
				<text class="kv-key">封顶金额</text>
				<text class="kv-val">{{ rule.capAmountCents > 0 ? '¥' + formatMoney(rule.capAmountCents) : '无封顶' }}</text>
			</view>
		</view>

		<view class="notice-card">
			<view class="notice-head"><view class="notice-icon"></view><text>钓场公告</text></view>
			<text class="notice-text">{{ venue.notice || '请爱护环境，带走垃圾，禁止夜钓。' }}</text>
		</view>

		<view class="actions">
			<view class="action-btn action-btn-primary" @click="goHome">
				<text class="action-btn-text">开始垂钓</text>
			</view>
			<view class="action-row">
				<view class="action-btn action-btn-ghost" @click="callVenue"><view class="phone-icon"></view><text class="action-btn-text">联系钓场</text></view>
				<view class="action-btn action-btn-ghost" @click="openMap"><view class="nav-arrow-icon"></view><text class="action-btn-text">导航</text></view>
			</view>
		</view>
	</view>
</template>

<script>
	import { formatMoney, loadDefaultVenue, getCachedVenue, goHomeSafely } from '../../utils/fishingStore.js'
	import { openVenueLocation } from '../../utils/location.js'

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
				openVenueLocation(this.venue)
			},
			callVenue() {
				const phone = this.venue.phone || '400-000-0000'
				if (!this.venue.phone) {
					uni.showToast({ title: '暂无联系方式', icon: 'none' })
					return
				}
				uni.makePhoneCall({ phoneNumber: phone })
			},
			getShareConfig() {
				const name = this.venue && this.venue.name ? this.venue.name : '共享钓场'
				return {
					title: `${name}钓场详情，地址、公告和计费规则都在这里`,
					path: '/pages/venue/venue'
				}
			},
			goHome() {
				uni.navigateTo({ url: '/pages/start/start', fail: () => goHomeSafely() })
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
		margin: 0;
		min-height: 260rpx;
		padding: 48rpx 36rpx 48rpx;
		border-radius: 0;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
	}

	.v-hero-photo {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.v-hero-scrim {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		background: linear-gradient(180deg, rgba(4, 20, 15, 0.3) 0%, rgba(4, 20, 15, 0.12) 45%, rgba(5, 25, 19, 0.74) 100%);
		pointer-events: none;
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, var(--g-900) 0%, var(--g-950) 70%, var(--g-950) 100%);
	}
	
	.hero-bg::after {
		display: none;
	}

	.hero-content {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.info-ico {
		width: 72rpx;
		height: 72rpx;
		border-radius: var(--r);
		background-color: #fff;
		background-size: 38rpx 38rpx;
		flex-shrink: 0;
	}

	.hero-title {
		font-size: 48rpx;
		font-weight: 600;
		color: #ffffff;
		letter-spacing: 1rpx;
		display: block;
	}

	.hero-sub {
		font-size: 22rpx;
		color: var(--accent);
		letter-spacing: 6rpx;
		display: block;
		font-weight: 600;
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
		font-weight: 500;
		line-height: 1.4;
	}

	.nav-btn {
		padding: 16rpx 36rpx;
		background: var(--g-600);
		border-radius: 99rpx;
		font-size: 24rpx;
		font-weight: 600;
		color: #fff;

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
		flex-wrap: wrap;
	}

	.action-btn {
		flex: 1;
		min-width: 200rpx;
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		background: var(--g-600);
		border-radius: var(--r);

		transition: var(--transition);
		border: 0;
		margin: 0;
		padding: 0;
		line-height: 1;
	}

	.action-btn::after {
		border: 0;
	}

	.action-btn:active {
		transform: scale(0.97);
		opacity: 0.95;
	}

	.action-btn-ghost {
		background: var(--surface);
		border: 1rpx solid rgba(10, 46, 36, 0.15);
	}

	.action-btn-share {
		background: var(--primary-gradient);
		color: #ffffff;
	}

	.action-btn-icon {
		font-size: 32rpx;
	}

	/* 主按钮底色是品牌绿，文字必须是白的（旧值 var(--primary) 会绿字压绿底看不见） */
	.action-btn-text {
		font-size: var(--t-body);
		font-weight: 500;
		color: #fff;
	}

	.action-btn-ghost .action-btn-text {
		color: var(--text-main);
	}

	.action-btn-share .action-btn-text {
		color: #ffffff;
	}

</style>

<style>
.venue-detail{min-height:100vh;padding:0 0 calc(38rpx + env(safe-area-inset-bottom));background:#f5fbfa}.venue-detail .hero{height:360rpx;min-height:0;padding:0;overflow:visible;display:block}.venue-detail .v-hero-scrim{background:linear-gradient(180deg,rgba(0,40,45,.02),rgba(0,40,45,.18))}.venue-overview{position:absolute;z-index:3;left:20rpx;right:20rpx;bottom:-62rpx;min-height:126rpx;padding:20rpx;display:flex;align-items:center;gap:18rpx;border-radius:18rpx;background:rgba(255,255,255,.96);box-shadow:0 12rpx 30rpx rgba(5,65,67,.14)}.venue-mark{width:82rpx;height:82rpx;border-radius:15rpx;flex-shrink:0}.venue-overview-main{flex:1;min-width:0}.venue-title-row{display:flex;align-items:center;gap:12rpx}.venue-detail .hero-title{font-size:36rpx;color:#073f45;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.open-tag{padding:5rpx 12rpx;border:1rpx solid #64c178;border-radius:7rpx;color:#32a650;font-size:20rpx}.venue-meta{display:flex;align-items:center;gap:9rpx;margin-top:12rpx;color:#526a6d;font-size:21rpx;white-space:nowrap}.star{color:#efa500}.meta-sep{width:1rpx;height:22rpx;background:#c7d5d5}.venue-info-card{margin:82rpx 20rpx 0;padding:0 22rpx;background:#fff;border:1rpx solid #d7e8e6;border-radius:16rpx}.venue-info-card .info-row{min-height:116rpx;border-bottom:1rpx solid #dde9e8}.line-icon{width:38rpx;height:38rpx;flex-shrink:0;background-size:32rpx 32rpx;background-position:center;background-repeat:no-repeat}.venue-info-card .info-label,.fee-head{font-size:28rpx;font-weight:800;color:#0a454a}.venue-info-card .info-value{font-size:23rpx;font-weight:400;color:#526c6e}.mini-nav{display:flex;flex-direction:column;align-items:center;gap:2rpx;color:#3d6265;font-size:19rpx}.mini-nav-arrow{font-size:30rpx;color:#119a9a;transform:rotate(-35deg)}.fee-head{display:flex;align-items:center;gap:14rpx;padding:22rpx 0 12rpx}.fee-icon{position:relative;border:3rpx solid #159b9b;border-radius:6rpx}.fee-icon::before,.fee-icon::after{content:'';position:absolute;left:6rpx;right:6rpx;border-top:3rpx solid #159b9b}.fee-icon::before{top:9rpx}.fee-icon::after{top:20rpx}.fee-row{display:flex;align-items:center;justify-content:space-between;min-height:70rpx;border-bottom:1rpx solid #e2eceb}.fee-row:last-child{border-bottom:0}.kv-key,.kv-val{font-size:24rpx;color:#405d60}.notice-card{margin:14rpx 20rpx 0;padding:20rpx 22rpx;background:#fff;border:1rpx solid #d7e8e6;border-radius:16rpx}.notice-head{display:flex;align-items:center;gap:14rpx;font-size:28rpx;font-weight:800;color:#0a454a}.notice-icon{width:34rpx;height:28rpx;border-radius:6rpx 16rpx 16rpx 6rpx;background:#149c9c;position:relative}.notice-icon::after{content:'';position:absolute;left:8rpx;bottom:-8rpx;width:5rpx;height:11rpx;background:#149c9c;transform:rotate(-20deg)}.venue-detail .notice-text{font-size:24rpx;font-weight:400;color:#597173;margin:14rpx 0 0 50rpx}.venue-detail .actions{margin:16rpx 20rpx 0;display:block}.venue-detail .action-btn{min-width:0;height:86rpx;border-radius:14rpx}.action-btn-primary{width:100%;background:#0bb0ac}.action-row{display:flex;gap:16rpx;margin-top:14rpx}.action-row .action-btn{height:78rpx;background:#fff;border:1rpx solid #67c0be}.venue-detail .action-btn-text{font-size:28rpx;font-weight:700}.action-row .action-btn-text{color:#118e90}.phone-icon{width:24rpx;height:36rpx;border:4rpx solid #119596;border-width:0 0 4rpx 4rpx;border-radius:0 0 0 18rpx;transform:rotate(-45deg)}.nav-arrow-icon{width:0;height:0;border-left:22rpx solid transparent;border-right:7rpx solid transparent;border-bottom:34rpx solid #119596;transform:rotate(35deg)}
@media (max-height:700px){.venue-detail .hero{height:300rpx}.venue-info-card{margin-top:76rpx}.fee-row{min-height:58rpx}.venue-info-card .info-row{min-height:98rpx}.venue-detail .action-btn{height:76rpx}.action-row .action-btn{height:68rpx}}
</style>
