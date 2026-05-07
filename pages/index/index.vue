<template>
	<view class="app home">
		<view class="page-head">
			<text class="page-head-title">{{ venue.name }}</text>
		</view>

		<view class="search">
			<text class="search-icon">🔍</text>
			<input class="search-input" placeholder="请输入关键词" placeholder-class="search-ph" v-model="keyword" />
			<view class="search-btn" @click="onSearch">搜索</view>
		</view>

		<swiper class="banner" autoplay circular indicator-dots indicator-active-color="#f5c23b" indicator-color="rgba(26,32,48,0.25)">
			<swiper-item v-for="ad in ads" :key="ad.id" @click="onAdClick(ad)">
				<view class="banner-slide" :style="{ background: ad.bgColor || '#e9e2d3' }">
					<text class="banner-title">{{ ad.title }}</text>
					<text class="banner-desc">{{ ad.desc }}</text>
					<text v-if="ad.type === 'activity'" class="banner-tag">点击报名</text>
					<text v-else class="banner-tag banner-tag-ad">查看详情</text>
				</view>
			</swiper-item>
		</swiper>

		<view class="notice">
			<text class="notice-icon">📣</text>
			<text class="notice-text">起步 {{ rule.minDurationMinutes }} 分钟 ¥{{ stepPriceYuan }}，超时按 {{ rule.stepMinutes }} 分钟递增</text>
		</view>

		<view v-if="pendingOrder" class="alert">
			<view class="alert-top">
				<text class="alert-tag">待支付</text>
				<text class="alert-amount">¥{{ formatMoney(pendingOrder.amountCents) }}</text>
			</view>
			<text class="alert-title">您有一笔未结清账单，请先完成支付</text>
			<view class="alert-actions">
				<view class="alert-btn" @click="goPay">立即支付</view>
			</view>
		</view>

		<view v-else-if="runningOrder" class="alert alert-ok">
			<view class="alert-top">
				<text class="alert-tag alert-tag-ok">计时中</text>
				<text class="alert-amount">{{ formatDuration(liveSeconds) }}</text>
			</view>
			<text class="alert-title">预估金额 ¥{{ formatMoney(estimate.amountCents) }}，请在出口扫码结束</text>
			<view class="alert-actions">
				<view class="alert-btn" @click="goSession">查看详情</view>
			</view>
		</view>

		<view class="two-grid">
			<view class="two-item" @click="scanStart">
				<view class="two-text">
					<text class="two-title">扫码入场</text>
					<text class="two-desc">扫钓位入口二维码</text>
				</view>
				<view class="two-ill two-ill-enter">🎣</view>
			</view>
			<view class="two-item" @click="scanEnd">
				<view class="two-text">
					<text class="two-title">扫码出场</text>
					<text class="two-desc">结束计时并结算</text>
				</view>
				<view class="two-ill two-ill-exit">🏷️</view>
			</view>
		</view>

		<view class="quick-grid">
			<view class="quick-item" @click="goOrders">
				<view class="quick-icon">📄</view>
				<text class="quick-name">我的订单</text>
			</view>
			<view class="quick-item" @click="goPay">
				<view class="quick-icon">💰</view>
				<text class="quick-name">待支付</text>
			</view>
			<view class="quick-item" @click="goVenue">
				<view class="quick-icon quick-icon-car">📍</view>
				<text class="quick-name">附近门店</text>
			</view>
		</view>

		<view class="footer-text">技术支持 · 共享钓场</view>

		<view class="tabbar">
			<view class="tabbar-item active">
				<text class="tabbar-icon">🏠</text>
				<text>首页</text>
			</view>
			<view class="tabbar-mid" @click="scanEnd">
				<view class="tabbar-mid-btn">¥</view>
				<text>结算离场</text>
			</view>
			<view class="tabbar-item" @click="goMine">
				<text class="tabbar-icon">👤</text>
				<text>我的</text>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		formatMoney,
		formatDuration,
		getUser,
		getRunningOrder,
		getPendingOrder,
		finishOrderByUser,
		calcAmount,
		isLoggedIn,
		getAds,
		VENUE_INFO,
		DEFAULT_RULE
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				user: null,
				runningOrder: null,
				pendingOrder: null,
				now: Date.now(),
				timer: null,
				venue: VENUE_INFO,
				rule: DEFAULT_RULE,
				keyword: '',
				ads: []
			}
		},
		computed: {
			stepPriceYuan() {
				return formatMoney(this.rule.pricePerStepCents)
			},
			liveSeconds() {
				if (!this.runningOrder) return 0
				return Math.max(0, Math.floor((this.now - this.runningOrder.startTime) / 1000))
			},
			estimate() {
				if (!this.runningOrder) return { amountCents: 0 }
				return calcAmount(this.now - this.runningOrder.startTime)
			}
		},
		onLoad(option = {}) {
			if (!isLoggedIn()) {
				const path = '/pages/index/index' + (option.action ? `?action=${option.action}` : '')
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent(path) })
				return
			}
			this.bootstrap(option)
		},
		onShow() {
			if (!isLoggedIn()) return
			this.refreshData()
			this.startTimer()
		},
		onHide() {
			this.stopTimer()
		},
		beforeDestroy() {
			this.stopTimer()
		},
		methods: {
			bootstrap(option) {
				this.user = getUser()
				this.ads = getAds()
				this.refreshData()
				this.startTimer()
				if (option.action === 'start') this.scanStart()
				else if (option.action === 'end') this.scanEnd()
			},
			refreshData() {
				this.user = getUser()
				this.runningOrder = getRunningOrder(this.user.id)
				this.pendingOrder = getPendingOrder(this.user.id)
				this.ads = getAds()
				this.now = Date.now()
			},
			startTimer() {
				if (this.timer) return
				this.timer = setInterval(() => { this.now = Date.now() }, 1000)
			},
			stopTimer() {
				if (this.timer) { clearInterval(this.timer); this.timer = null }
			},
			onSearch() {
				if (!this.keyword) return
				uni.showToast({ title: '暂未开放', icon: 'none' })
			},
			onAdClick(ad) {
				if (ad.type === 'activity') {
					uni.navigateTo({ url: '/pages/activityRegister/activityRegister?id=' + ad.id })
				} else {
					uni.navigateTo({ url: '/pages/adDetail/adDetail?id=' + ad.id })
				}
			},
			scanStart() {
				if (this.pendingOrder) {
					uni.showToast({ title: '请先支付未完成账单', icon: 'none' })
					this.goPay()
					return
				}
				if (this.runningOrder) { this.goSession(); return }
				uni.redirectTo({ url: '/pages/start/start' })
			},
			scanEnd() {
				if (this.pendingOrder) { this.goPay(); return }
				if (this.runningOrder) {
					finishOrderByUser(this.user.id)
					this.goPay()
					return
				}
				uni.showToast({ title: '未检测到进行中的订单', icon: 'none' })
			},
			goPay() { uni.redirectTo({ url: '/pages/pay/pay' }) },
			goSession() { uni.redirectTo({ url: '/pages/session/session' }) },
			goOrders() { uni.redirectTo({ url: '/pages/orders/orders' }) },
			goMine() { uni.redirectTo({ url: '/pages/mine/mine' }) },
			goVenue() { uni.showToast({ title: this.venue.address, icon: 'none' }) },
			formatMoney,
			formatDuration
		}
	}
</script>

<style>
	.search-ph {
		color: #9aa3b2;
	}

	.banner {
		margin: 0 28rpx;
		height: 320rpx;
		border-radius: 24rpx;
		overflow: hidden;
	}

	.banner-slide {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
	}

	.banner-title {
		font-size: 40rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
		color: #1a2030;
	}

	.banner-desc {
		font-size: 24rpx;
		color: #6b7280;
		letter-spacing: 2rpx;
	}

	.banner-tag {
		margin-top: 12rpx;
		padding: 6rpx 24rpx;
		border-radius: 999rpx;
		background: #f5c23b;
		color: #1a1306;
		font-size: 22rpx;
		font-weight: 700;
	}

	.banner-tag-ad {
		background: #1a2030;
		color: #ffffff;
	}

	.notice {
		margin: 24rpx 28rpx 0;
		background: #2a2a2a;
		color: #ffffff;
		border-radius: 16rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
		gap: 14rpx;
		font-size: 24rpx;
	}

	.notice-text {
		flex: 1;
		color: #f2f2f2;
	}

	.alert {
		margin: 24rpx 28rpx 0;
		background: #fff7df;
		border-radius: 20rpx;
		padding: 24rpx;
		border: 1rpx solid #f0d47a;
	}

	.alert-ok {
		background: #eaf5ee;
		border-color: #b5ddc3;
	}

	.alert-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.alert-tag {
		display: inline-block;
		padding: 4rpx 16rpx;
		border-radius: 999rpx;
		background: #f5c23b;
		color: #1a1306;
		font-size: 22rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
	}

	.alert-tag-ok {
		background: #4fb38a;
		color: #ffffff;
	}

	.alert-amount {
		font-size: 40rpx;
		font-weight: 800;
		color: #1a2030;
		font-variant-numeric: tabular-nums;
	}

	.alert-title {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #4a5567;
	}

	.alert-actions {
		margin-top: 16rpx;
		display: flex;
		justify-content: flex-end;
	}

	.alert-btn {
		background: #1a2030;
		color: #ffffff;
		padding: 14rpx 32rpx;
		border-radius: 999rpx;
		font-size: 26rpx;
		font-weight: 700;
	}

	.two-grid {
		margin: 24rpx 28rpx 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20rpx;
	}

	.two-item {
		background: #ffffff;
		border-radius: 22rpx;
		padding: 28rpx 24rpx;
		display: flex;
		flex-direction: column;
		gap: 14rpx;
		min-height: 240rpx;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.05);
	}

	.two-text {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.two-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.two-desc {
		font-size: 22rpx;
		color: #6b7280;
	}

	.two-ill {
		align-self: flex-end;
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: #fff3d1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 56rpx;
	}

	.two-ill-exit {
		background: #ffe6a8;
	}

	.quick-grid {
		margin: 24rpx 28rpx 0;
		background: #ffffff;
		border-radius: 22rpx;
		padding: 30rpx 20rpx;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.05);
	}

	.quick-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14rpx;
		padding: 10rpx 0;
	}

	.quick-icon {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: #fff3d1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 42rpx;
	}

	.quick-icon-car {
		background: #ffe6a8;
	}

	.quick-name {
		font-size: 24rpx;
		color: #3a4355;
		font-weight: 600;
	}

	.footer-text {
		text-align: center;
		color: #9aa3b2;
		font-size: 22rpx;
		margin: 40rpx 0 24rpx;
	}
</style>
