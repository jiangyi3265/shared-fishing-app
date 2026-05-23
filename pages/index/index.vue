<template>
	<view class="app home">
		<view class="home-hero">
			<view class="hero-top">
				<view class="hero-copy">
					<text class="hero-kicker">共享钓场</text>
					<text class="hero-title">{{ venue.name }}</text>
				</view>
				<view class="hero-status">
					<text class="hero-status-dot"></text>
					<text>开放中</text>
				</view>
			</view>
			<view class="hero-metrics">
				<view class="hero-metric">
					<text class="metric-label">起步计费</text>
					<text class="metric-value">{{ rule.minDurationMinutes }}分钟</text>
				</view>
				<view class="hero-metric">
					<text class="metric-label">阶梯价格</text>
					<text class="metric-value">¥{{ stepPriceYuan }}</text>
				</view>
				<view class="hero-metric">
					<text class="metric-label">递增周期</text>
					<text class="metric-value">{{ rule.stepMinutes }}分钟</text>
				</view>
			</view>
		</view>

		<view class="search">
			<text class="search-icon"></text>
			<input class="search-input" placeholder="搜索活动、钓位、商品" placeholder-class="search-ph" v-model="keyword" />
			<view class="search-btn" @click="onSearch">搜索</view>
		</view>

		<swiper class="banner" autoplay circular indicator-dots indicator-active-color="#c79a39" indicator-color="rgba(16,35,31,0.22)">
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
			<text class="notice-icon"></text>
			<text class="notice-text">起步 {{ rule.minDurationMinutes }} 分钟 ¥{{ stepPriceYuan }}，超时按 {{ rule.stepMinutes }} 分钟递增</text>
		</view>

		<view v-if="weather" class="weather-bar">
			<text class="weather-text">{{ weather.text }} {{ weather.temp }}℃</text>
			<text class="weather-detail">气压 {{ weather.pressure }}hPa · {{ weather.windDir }}{{ weather.windScale }}级 · 湿度{{ weather.humidity }}%</text>
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
			<view class="two-item two-item-primary" @click="scanStart">
				<view class="two-text">
					<text class="two-title">扫码入场</text>
					<text class="two-desc">扫钓位入口二维码</text>
				</view>
				<view class="two-ill two-ill-enter">
					<text class="two-ill-word">入</text>
					<text class="two-ill-line"></text>
				</view>
			</view>
			<view class="two-item two-item-secondary" @click="scanEnd">
				<view class="two-text">
					<text class="two-title">扫码出场</text>
					<text class="two-desc">结束计时并结算</text>
				</view>
				<view class="two-ill two-ill-exit">
					<text class="two-ill-word">结</text>
					<text class="two-ill-line"></text>
				</view>
			</view>
		</view>

		<view class="quick-grid">
			<view class="quick-item" @click="goOrders">
				<view class="quick-icon quick-icon-order">单</view>
				<text class="quick-name">我的订单</text>
			</view>
			<view class="quick-item" @click="goStocking">
				<view class="quick-icon quick-icon-stock">鱼</view>
				<text class="quick-name">放鱼动态</text>
			</view>
			<view class="quick-item" @click="goReserve">
				<view class="quick-icon quick-icon-date">位</view>
				<text class="quick-name">钓位预订</text>
			</view>
			<view class="quick-item" @click="goCatch">
				<view class="quick-icon quick-icon-catch">获</view>
				<text class="quick-name">钓获社区</text>
			</view>
			<view class="quick-item" @click="goMember">
				<view class="quick-icon quick-icon-member">会</view>
				<text class="quick-name">会员中心</text>
			</view>
			<view class="quick-item" @click="goPoints">
				<view class="quick-icon quick-icon-points">积</view>
				<text class="quick-name">积分商城</text>
			</view>
			<view class="quick-item" @click="goGroup">
				<view class="quick-icon quick-icon-group">约</view>
				<text class="quick-name">拼场约钓</text>
			</view>
			<view class="quick-item" @click="goVenue">
				<view class="quick-icon quick-icon-venue">店</view>
				<text class="quick-name">附近门店</text>
			</view>
		</view>

		<view class="footer-text">技术支持 · 共享钓场</view>

		<view class="tabbar">
			<view class="tabbar-item active">
				<text class="tabbar-icon tabbar-icon-home"></text>
				<text>首页</text>
			</view>
			<view class="tabbar-mid" @click="scanEnd">
				<view class="tabbar-mid-btn"></view>
				<text>结算离场</text>
			</view>
			<view class="tabbar-item" @click="goMine">
				<text class="tabbar-icon tabbar-icon-user"></text>
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
		fetchRunningOrder,
		fetchPendingOrder,
		finishOrder,
		calcAmount,
		isLoggedIn,
		fetchAds,
		fetchWeather,
		loadDefaultVenue,
		getCachedVenue,
		resolveQrcode
	} from '../../utils/fishingStore.js'

	const FALLBACK_VENUE = { name: '共享钓场', address: '--', notice: '', venueId: null }
	const FALLBACK_RULE = { stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0 }

	export default {
		data() {
			return {
				user: null,
				runningOrder: null,
				pendingOrder: null,
				now: Date.now(),
				timer: null,
				venue: FALLBACK_VENUE,
				rule: FALLBACK_RULE,
				keyword: '',
				ads: [],
				weather: null
			}
		},
		computed: {
			stepPriceYuan() {
				return formatMoney(this.rule.pricePerStepCents)
			},
			runningStartMillis() {
				if (!this.runningOrder || !this.runningOrder.startTime) return 0
				return typeof this.runningOrder.startTime === 'number'
					? this.runningOrder.startTime
					: new Date(this.runningOrder.startTime).getTime()
			},
			liveSeconds() {
				if (!this.runningStartMillis) return 0
				return Math.max(0, Math.floor((this.now - this.runningStartMillis) / 1000))
			},
			estimate() {
				if (!this.runningStartMillis) return { amountCents: 0 }
				return calcAmount(this.now - this.runningStartMillis, this.rule)
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
				this.loadVenue()
				this.refreshData()
				this.startTimer()
				if (option.action === 'start') this.scanStart()
				else if (option.action === 'end') this.scanEnd()
			},
			loadVenue() {
				const cached = getCachedVenue()
				if (cached && cached.venue) this.applyVenue(cached)
				loadDefaultVenue().then((data) => { if (data) this.applyVenue(data) }).catch(() => {})
			},
			applyVenue(data) {
				if (data.venue) this.venue = data.venue
				if (data.rule) this.rule = Object.assign({}, FALLBACK_RULE, data.rule)
			},
			refreshData() {
				this.user = getUser()
				if (!this.user) return
				fetchRunningOrder(this.user.userId).then((r) => { this.runningOrder = r }).catch(() => {})
				fetchPendingOrder(this.user.userId).then((p) => { this.pendingOrder = p }).catch(() => {})
				fetchAds().then((list) => { this.ads = list }).catch(() => {})
				fetchWeather().then((w) => { this.weather = w }).catch(() => {})
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
				uni.navigateTo({ url: '/pages/promotions/promotions?keyword=' + encodeURIComponent(this.keyword) })
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
				this.launchScan('start')
			},
			scanEnd() {
				if (this.pendingOrder) { this.goPay(); return }
				if (this.runningOrder) {
					this.launchScan('end')
					return
				}
				uni.showToast({ title: '未检测到进行中的订单', icon: 'none' })
			},
			launchScan(expectedAction) {
				// #ifdef MP-WEIXIN || APP-PLUS
				uni.scanCode({
					onlyFromCamera: false,
					success: (res) => this.handleScanResult(res.result || '', expectedAction),
					fail: () => this.fallbackScan(expectedAction)
				})
				// #endif
				// #ifndef MP-WEIXIN || APP-PLUS
				this.fallbackScan(expectedAction)
				// #endif
			},
			fallbackScan(expectedAction) {
				if (expectedAction === 'start') { uni.redirectTo({ url: '/pages/start/start' }); return }
				if (expectedAction === 'end') {
					if (!this.user) return
					finishOrder(this.user.userId).then(() => this.goPay())
				}
			},
			handleScanResult(raw, expectedAction) {
				const params = this.parseScan(raw)
				if (!params || (params.action !== expectedAction && expectedAction)) {
					uni.showToast({ title: '二维码与当前操作不匹配', icon: 'none' })
					return
				}
				if (params.qrId) {
					resolveQrcode({ qrId: params.qrId }).then((data) => {
						if (!data) return
						if (data.action === 'start') uni.redirectTo({ url: '/pages/start/start' })
						else if (data.action === 'end' && this.user) finishOrder(this.user.userId).then(() => this.goPay())
					}).catch(() => this.fallbackScan(expectedAction))
				} else {
					this.fallbackScan(expectedAction)
				}
			},
			parseScan(raw) {
				if (!raw) return null
				const idx = raw.indexOf('?')
				const qs = idx >= 0 ? raw.slice(idx + 1) : raw
				const out = {}
				qs.split('&').forEach((pair) => {
					const [k, v] = pair.split('=')
					if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '')
				})
				if (out.qrId) out.qrId = Number(out.qrId)
				if (out.venueId) out.venueId = Number(out.venueId)
				return out
			},
			goPay() { uni.redirectTo({ url: '/pages/pay/pay' }) },
			goSession() { uni.redirectTo({ url: '/pages/session/session' }) },
			goOrders() { uni.redirectTo({ url: '/pages/orders/orders' }) },
			goMine() { uni.redirectTo({ url: '/pages/mine/mine' }) },
			goVenue() { uni.navigateTo({ url: '/pages/venue/venue' }) },
			goStocking() { uni.navigateTo({ url: '/pages/stocking/stocking' }) },
			goReserve() { uni.navigateTo({ url: '/pages/reserve/reserve' }) },
			goCatch() { uni.navigateTo({ url: '/pages/catch/catch' }) },
			goMember() { uni.navigateTo({ url: '/pages/member/member' }) },
			goPoints() { uni.navigateTo({ url: '/pages/points/points' }) },
			goGroup() { uni.navigateTo({ url: '/pages/group/group' }) },
			formatMoney,
			formatDuration
		}
	}
</script>

<style>
	.home {
		background: #f3f6f1;
	}

	.home-hero {
		margin: 0;
		padding: 42rpx 32rpx 54rpx;
		background: linear-gradient(145deg, #0d211d 0%, #163b34 58%, #275b55 100%);
		color: #f8f4e8;
		position: relative;
		overflow: hidden;
	}

	.home-hero::after {
		content: '';
		position: absolute;
		left: 32rpx;
		right: 32rpx;
		bottom: 24rpx;
		height: 1rpx;
		background: rgba(248, 244, 232, 0.18);
	}

	.hero-top {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 28rpx;
	}

	.hero-copy {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.hero-kicker {
		font-size: 22rpx;
		font-weight: 700;
		color: rgba(240, 210, 138, 0.88);
		letter-spacing: 6rpx;
	}

	.hero-title {
		font-size: 52rpx;
		font-weight: 800;
		line-height: 1.12;
		color: #ffffff;
		letter-spacing: 0;
	}

	.hero-status {
		height: 48rpx;
		padding: 0 18rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.12);
		border: 1rpx solid rgba(255, 255, 255, 0.18);
		display: flex;
		align-items: center;
		gap: 10rpx;
		color: #f8f4e8;
		font-size: 22rpx;
		font-weight: 700;
	}

	.hero-status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: #f0d28a;
		box-shadow: 0 0 0 6rpx rgba(240, 210, 138, 0.18);
	}

	.hero-metrics {
		position: relative;
		z-index: 1;
		margin-top: 38rpx;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 14rpx;
	}

	.hero-metric {
		padding: 18rpx 14rpx;
		border-radius: 16rpx;
		background: rgba(255, 255, 255, 0.1);
		border: 1rpx solid rgba(255, 255, 255, 0.16);
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.metric-label {
		color: rgba(248, 244, 232, 0.62);
		font-size: 20rpx;
	}

	.metric-value {
		color: #ffffff;
		font-size: 27rpx;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.home .search {
		margin-top: -28rpx;
		position: relative;
		z-index: 2;
	}

	.search-ph {
		color: #8b978f;
	}

	.banner {
		margin: 0 32rpx;
		height: 292rpx;
		border-radius: 16rpx;
		overflow: hidden;
		border: 1rpx solid rgba(16, 35, 31, 0.08);
		box-shadow: 0 14rpx 34rpx rgba(16, 35, 31, 0.08);
	}

	.banner-slide {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 12rpx;
		box-sizing: border-box;
		padding: 44rpx;
	}

	.banner-title {
		font-size: 40rpx;
		font-weight: 800;
		line-height: 1.18;
		color: #10231f;
		letter-spacing: 0;
	}

	.banner-desc {
		font-size: 24rpx;
		color: #4d5f57;
		letter-spacing: 0;
	}

	.banner-tag {
		margin-top: 12rpx;
		padding: 8rpx 20rpx;
		border-radius: 999rpx;
		background: #c79a39;
		color: #10231f;
		font-size: 22rpx;
		font-weight: 800;
	}

	.banner-tag-ad {
		background: #10231f;
		color: #f8f4e8;
	}

	.notice {
		margin: 24rpx 32rpx 0;
		background: #ffffff;
		color: #10231f;
		border-radius: 16rpx;
		min-height: 78rpx;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
		gap: 16rpx;
		font-size: 24rpx;
		border: 1rpx solid rgba(16, 35, 31, 0.07);
		box-shadow: 0 10rpx 30rpx rgba(16, 35, 31, 0.05);
	}

	.notice-icon {
		width: 8rpx;
		height: 42rpx;
		border-radius: 999rpx;
		background: #c79a39;
		flex: 0 0 auto;
	}

	.notice-text {
		flex: 1;
		color: #3c5048;
		line-height: 1.5;
	}

	.weather-bar {
		margin: 16rpx 32rpx 0;
		background: #e7f0ed;
		border-radius: 16rpx;
		padding: 18rpx 24rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1rpx solid rgba(44, 107, 115, 0.12);
	}

	.weather-text {
		font-size: 27rpx;
		color: #10231f;
		font-weight: 800;
	}

	.weather-detail {
		font-size: 22rpx;
		color: #566861;
		text-align: right;
		max-width: 450rpx;
		line-height: 1.4;
	}

	.alert {
		margin: 24rpx 32rpx 0;
		background: #fff8e8;
		border-radius: 16rpx;
		padding: 26rpx;
		border: 1rpx solid rgba(199, 154, 57, 0.32);
		box-shadow: 0 12rpx 30rpx rgba(144, 105, 28, 0.08);
	}

	.alert-ok {
		background: #eaf3ef;
		border-color: rgba(44, 107, 115, 0.2);
	}

	.alert-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.alert-tag {
		display: inline-block;
		padding: 5rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(199, 154, 57, 0.18);
		color: #90691c;
		font-size: 22rpx;
		font-weight: 800;
		letter-spacing: 0;
	}

	.alert-tag-ok {
		background: rgba(44, 107, 115, 0.14);
		color: #1f636a;
	}

	.alert-amount {
		font-size: 42rpx;
		font-weight: 800;
		color: #10231f;
		font-variant-numeric: tabular-nums;
	}

	.alert-title {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #3c5048;
		line-height: 1.45;
	}

	.alert-actions {
		margin-top: 18rpx;
		display: flex;
		justify-content: flex-end;
	}

	.alert-btn {
		background: #10231f;
		color: #f8f4e8;
		padding: 14rpx 30rpx;
		border-radius: 14rpx;
		font-size: 26rpx;
		font-weight: 800;
	}

	.two-grid {
		margin: 24rpx 32rpx 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18rpx;
	}

	.two-item {
		border-radius: 16rpx;
		padding: 28rpx 24rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 20rpx;
		min-height: 250rpx;
		box-shadow: 0 14rpx 34rpx rgba(16, 35, 31, 0.08);
		box-sizing: border-box;
	}

	.two-item-primary {
		background: #10231f;
		color: #ffffff;
	}

	.two-item-secondary {
		background: #ffffff;
		border: 1rpx solid rgba(16, 35, 31, 0.08);
	}

	.two-text {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.two-title {
		font-size: 34rpx;
		font-weight: 800;
		color: #10231f;
	}

	.two-item-primary .two-title {
		color: #ffffff;
	}

	.two-desc {
		font-size: 22rpx;
		color: #65736c;
		line-height: 1.4;
	}

	.two-item-primary .two-desc {
		color: rgba(248, 244, 232, 0.68);
	}

	.two-ill {
		align-self: flex-end;
		width: 118rpx;
		height: 118rpx;
		border-radius: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.two-ill-enter {
		background: linear-gradient(145deg, #c79a39 0%, #efd086 100%);
		color: #10231f;
	}

	.two-ill-exit {
		background: #e7f0ed;
		color: #1f636a;
	}

	.two-ill-word {
		font-size: 48rpx;
		font-weight: 900;
		line-height: 1;
	}

	.two-ill-line {
		position: absolute;
		right: 18rpx;
		bottom: 20rpx;
		width: 42rpx;
		height: 6rpx;
		border-radius: 999rpx;
		background: currentColor;
		opacity: 0.32;
	}

	.quick-grid {
		margin: 24rpx 32rpx 0;
		background: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx 16rpx 26rpx;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 22rpx 0;
		border: 1rpx solid rgba(16, 35, 31, 0.07);
		box-shadow: 0 12rpx 32rpx rgba(16, 35, 31, 0.05);
	}

	.quick-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		padding: 4rpx 0;
	}

	.quick-icon {
		width: 74rpx;
		height: 74rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: 900;
		color: #10231f;
		background: #eef3ed;
		border: 1rpx solid rgba(16, 35, 31, 0.06);
		box-sizing: border-box;
	}

	.quick-icon-order,
	.quick-icon-member,
	.quick-icon-venue {
		background: #f8f0dc;
		color: #90691c;
	}

	.quick-icon-stock,
	.quick-icon-catch,
	.quick-icon-group {
		background: #e7f0ed;
		color: #1f636a;
	}

	.quick-icon-date,
	.quick-icon-points {
		background: #edf1ea;
		color: #243d36;
	}

	.quick-name {
		font-size: 22rpx;
		color: #334942;
		font-weight: 700;
		line-height: 1.2;
	}

	.footer-text {
		text-align: center;
		color: #8b978f;
		font-size: 22rpx;
		margin: 40rpx 0 24rpx;
	}
</style>
