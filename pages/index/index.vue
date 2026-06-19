<template>
	<view class="app home">
		<view class="home-hero">
			<view class="hero-top">
				<view class="hero-copy">
					<text class="hero-kicker">共享钓场</text>
					<text class="hero-title">{{ venue.name }}</text>
				</view>
				<view class="hero-actions">
					<view class="hero-status">
						<text class="hero-status-dot"></text>
						<text>开放中</text>
					</view>
					<button class="hero-share-btn" open-type="share">转发给好友</button>
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
			<input class="search-input" placeholder="搜索钓场服务、活动、钓位" placeholder-class="search-ph" v-model="keyword" />
			<view class="search-btn" @click="onSearch">搜索</view>
		</view>

		<swiper class="banner" autoplay circular indicator-dots indicator-active-color="#c79a39" indicator-color="rgba(16,35,31,0.22)">
			<swiper-item v-for="ad in bannerAds" :key="ad.id" @click="onAdClick(ad)">
				<view class="banner-slide" :style="{ background: ad.bgColor || '#e9e2d3' }">
					<text class="banner-title">{{ ad.title }}</text>
					<text class="banner-desc">{{ ad.desc }}</text>
					<text v-if="ad.type === 'activity'" class="banner-tag">点击报名</text>
					<text v-else-if="ad.type === 'fallback'" class="banner-tag banner-tag-ad">查看钓场</text>
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

		<view class="weigh-entry" @click="scanWeighFish">
			<view class="weigh-entry-left">
				<view class="weigh-entry-icon">
					<text class="weigh-icon-text">秤</text>
				</view>
				<view class="weigh-entry-copy">
					<text class="weigh-entry-title">称鱼结算</text>
					<text class="weigh-entry-desc">将鱼放上电子秤 · 扫码录入重量 · 确认付款</text>
				</view>
			</view>
			<text class="weigh-entry-arrow">›</text>
		</view>

		<view class="service-section">
			<view class="service-head">
				<view>
					<text class="service-kicker">SUPPLY</text>
					<text class="service-title">补给与权益</text>
				</view>
			</view>
			<view class="service-grid">
				<view class="service-card is-primary" @click="goMall">
					<view class="service-icon icon-shop tone-gold"></view>
					<view class="service-copy">
						<text class="service-name">钓场补给</text>
						<text class="service-desc">饮品零食 · 可用积分抵现</text>
					</view>
					<text class="service-arrow">›</text>
				</view>
				<view class="service-card" @click="goPoints">
					<view class="service-icon icon-order tone-teal"></view>
					<view class="service-copy">
						<text class="service-name">积分兑换</text>
						<text class="service-desc">积分换好礼 · 每日签到得分</text>
					</view>
					<text class="service-arrow">›</text>
				</view>
				<view class="service-card" @click="goRental">
					<view class="service-icon icon-member tone-green"></view>
					<view class="service-copy">
						<text class="service-name">钓具租赁</text>
						<text class="service-desc">钓竿 · 鱼护 · 配套装备</text>
					</view>
					<text class="service-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="service-section">
			<view class="service-head">
				<view>
					<text class="service-kicker">VENUE</text>
					<text class="service-title">钓场详情</text>
				</view>
				<text class="service-count" @click="goVenue">公告详情 ›</text>
			</view>
			<view style="display:flex; gap:12rpx;">
				<view style="flex:1; display:flex; flex-direction:column; align-items:center; gap:10rpx; padding:8rpx 0;" @click="openNavigation">
					<view style="width:76rpx; height:76rpx; border-radius:24rpx; display:flex; align-items:center; justify-content:center; font-size:26rpx; font-weight:800; color:#fff; background:#2f6fb3;">导航</view>
					<text style="font-size:22rpx; color:#7a857f; font-weight:600;">地址导航</text>
				</view>
				<view style="flex:1; display:flex; flex-direction:column; align-items:center; gap:10rpx; padding:8rpx 0;" @click="callVenue">
					<view style="width:76rpx; height:76rpx; border-radius:24rpx; display:flex; align-items:center; justify-content:center; font-size:26rpx; font-weight:800; color:#fff; background:#1d9e75;">电话</view>
					<text style="font-size:22rpx; color:#7a857f; font-weight:600;">联系电话</text>
				</view>
				<view style="flex:1; display:flex; flex-direction:column; align-items:center; gap:10rpx; padding:8rpx 0;" @click="goContact">
					<view style="width:76rpx; height:76rpx; border-radius:24rpx; display:flex; align-items:center; justify-content:center; font-size:26rpx; font-weight:800; color:#fff; background:#6a5acd;">客服</view>
					<text style="font-size:22rpx; color:#7a857f; font-weight:600;">在线客服</text>
				</view>
				<view style="flex:1; display:flex; flex-direction:column; align-items:center; gap:10rpx; padding:8rpx 0;" @click="goReserve">
					<view style="width:76rpx; height:76rpx; border-radius:24rpx; display:flex; align-items:center; justify-content:center; font-size:26rpx; font-weight:800; color:#fff; background:#c79a39;">订位</view>
					<text style="font-size:22rpx; color:#7a857f; font-weight:600;">钓位预订</text>
				</view>
			</view>
		</view>

		<view class="weigh-entry" @click="goRateInfo">
			<view class="weigh-entry-left">
				<view class="weigh-entry-icon">
					<text class="weigh-icon-text">规</text>
				</view>
				<view class="weigh-entry-copy">
					<text class="weigh-entry-title">计费规则说明</text>
					<text class="weigh-entry-desc">起步价 · 阶梯计费 · 封顶规则，一看就懂</text>
				</view>
			</view>
			<text class="weigh-entry-arrow">›</text>
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
		fetchAds,
		fetchWeather,
		loadDefaultVenue,
		getCachedVenue,
		resolveQrcode
	} from '../../utils/fishingStore.js'

	const FALLBACK_VENUE = { name: '共享钓场', address: '--', notice: '', venueId: null }
	const FALLBACK_RULE = { stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0 }
	const FALLBACK_ADS = [{
		id: 'fallback-open',
		type: 'fallback',
		title: '今日开放营业',
		desc: '扫码入场 · 计时计费 · 离场结算',
		bgColor: 'linear-gradient(135deg, #e9f2ee 0%, #f8f1df 100%)'
	}]

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
			},
			bannerAds() {
				return this.ads.length ? this.ads : FALLBACK_ADS
			}
		},
		onLoad(option = {}) {
			this.afterTarget = option.after || ''
			this.bootstrap(option)
		},
		onReady() {
			// 配合 reLaunch('/pages/index/index?after=目标页')：在首页确保就绪后再 push 目标页，
			// 让目标页下方垫着首页（安卓左滑退回首页而非退出小程序），并避开 reLaunch 后立即跳转的时序失败。
			if (this.afterTarget && this.afterTarget !== '/pages/index/index') {
				const url = this.afterTarget
				this.afterTarget = ''
				uni.navigateTo({ url })
			}
		},
		onShow() {
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
				if (option.qrId || option.scene || (option.action && option.venueId)) this.handleScanResult(this.optionToRawScan(option), null)
				else if (option.action === 'start') this.scanStart()
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
				fetchAds().then((list) => { this.ads = list }).catch(() => {})
				fetchWeather().then((w) => { this.weather = w }).catch(() => {})
				this.now = Date.now()
				if (!this.user) {
					this.runningOrder = null
					this.pendingOrder = null
					return
				}
				fetchRunningOrder(this.user.userId).then((r) => { this.runningOrder = r }).catch(() => {})
				fetchPendingOrder(this.user.userId).then((p) => { this.pendingOrder = p }).catch(() => {})
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
				if (ad.type === 'fallback') {
					this.goVenue()
					return
				}
				if (ad.type === 'activity') {
					uni.navigateTo({ url: '/pages/activityRegister/activityRegister?id=' + ad.id })
				} else {
					uni.navigateTo({ url: '/pages/adDetail/adDetail?id=' + ad.id })
				}
			},
			getShareConfig() {
				const name = this.venue && this.venue.name ? this.venue.name : '共享钓场'
				return {
					title: `${name}，扫码入场、计时计费更省心`,
					path: '/pages/index/index'
				}
			},
			scanWeighFish() {
				if (!this.user) { this.goLogin('/pages/index/index'); return }
				uni.scanCode({
					onlyFromCamera: true,
					success: (res) => {
						uni.navigateTo({ url: '/pages/weighFish/weighFish?scan=' + encodeURIComponent(res.result || '') })
					},
					fail: () => {
						uni.navigateTo({ url: '/pages/weighFish/weighFish' })
					}
				})
			},
			scanStart() {
				if (!this.user) { this.goLogin('/pages/index/index?action=start'); return }
				if (this.pendingOrder) {
					uni.showToast({ title: '请先支付未完成账单', icon: 'none' })
					this.goPay()
					return
				}
				if (this.runningOrder) { this.goSession(); return }
				this.launchScan('start')
			},
			scanEnd() {
				if (!this.user) { this.goLogin('/pages/index/index?action=end'); return }
				fetchPendingOrder(this.user.userId).then((pending) => {
					if (pending) { this.goPay(); return null }
					return fetchRunningOrder(this.user.userId)
				}).then((running) => {
					if (running === null) return
					if (running) {
						this.runningOrder = running
						this.launchScan('end')
						return
					}
					uni.showToast({ title: '未检测到进行中的订单', icon: 'none' })
				})
			},
			launchScan(expectedAction) {
				// #ifdef MP-WEIXIN || APP-PLUS
				uni.scanCode({
					onlyFromCamera: true,
					success: (res) => this.handleScanResult(res.result || '', expectedAction),
					fail: () => this.fallbackScan(expectedAction)
				})
				// #endif
				// #ifndef MP-WEIXIN || APP-PLUS
				this.fallbackScan(expectedAction)
				// #endif
			},
			fallbackScan(expectedAction) {
				uni.showToast({
					title: expectedAction === 'start' ? '请扫描入口码' : '请扫描出口码',
					icon: 'none'
				})
			},
			handleScanResult(raw, expectedAction) {
				const params = this.parseScan(raw)
				const scan = this.extractScanProof(params)
				if (!scan) {
					uni.showToast({ title: '请扫描钓场入口或出口二维码', icon: 'none' })
					return
				}
				resolveQrcode(scan).then((data) => {
					if (!data) return
					if (expectedAction && data.action !== expectedAction) {
						uni.showToast({ title: '二维码与当前操作不匹配', icon: 'none' })
						return
					}
					if (data.action === 'start') {
						uni.navigateTo({ url: '/pages/start/start' + this.buildScanQuery(scan) })
						return
					}
					if (data.action === 'end') this.finishWithScan(scan)
				}).catch(() => {
					uni.showToast({ title: '二维码无效或已停用', icon: 'none' })
				})
			},
			finishWithScan(scan) {
				if (!this.user) {
					this.goLogin('/pages/index/index' + this.buildScanQuery(scan))
					return
				}
				fetchPendingOrder(this.user.userId).then((pending) => {
					if (pending) {
						this.goPay()
						return null
					}
					return fetchRunningOrder(this.user.userId)
				}).then((running) => {
					if (running === null) return
					if (!running) {
						uni.showToast({ title: '未检测到进行中的订单', icon: 'none' })
						return
					}
					finishOrder(this.user.userId, scan).then(() => this.goPay())
				})
			},
			optionToRawScan(option = {}) {
				if (option.qrId) return 'qrId=' + option.qrId
				if (option.action && option.venueId) return 'action=' + option.action + '&venueId=' + option.venueId
				return option.scene ? decodeURIComponent(option.scene) : ''
			},
			parseScan(raw) {
				if (!raw) return null
				const idx = raw.indexOf('?')
				const qs = idx >= 0 ? raw.slice(idx + 1) : raw
				if (qs.indexOf('=') < 0) return { scene: qs }
				const out = {}
				qs.split('&').forEach((pair) => {
					const [k, v] = pair.split('=')
					if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '')
				})
				if (out.qrId) out.qrId = Number(out.qrId)
				if (out.venueId) out.venueId = Number(out.venueId)
				return out
			},
			extractScanProof(params) {
				if (!params) return null
				if (params.qrId) return { qrId: params.qrId }
				if (params.scene) {
					const nested = this.parseScan(params.scene)
					if (nested && nested.qrId) return { qrId: nested.qrId }
					return { scene: params.scene }
				}
				if (params.action && params.venueId) return { scene: 'action=' + params.action + '&venueId=' + params.venueId }
				return null
			},
			buildScanQuery(scan) {
				if (scan.qrId) return '?qrId=' + encodeURIComponent(scan.qrId)
				if (scan.scene) return '?scene=' + encodeURIComponent(scan.scene)
				return ''
			},
			goPay() { uni.navigateTo({ url: '/pages/pay/pay' }) },
			goSession() { uni.navigateTo({ url: '/pages/session/session' }) },
			goOrders() { uni.navigateTo({ url: '/pages/orders/orders' }) },
			goMine() { uni.navigateTo({ url: '/pages/mine/mine' }) },
			goLogin(redirect) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent(redirect || '/pages/index/index') }) },
			goVenue() { uni.navigateTo({ url: '/pages/venue/venue' }) },
			goStocking() { uni.navigateTo({ url: '/pages/stocking/stocking' }) },
			goReserve() { uni.navigateTo({ url: '/pages/reserve/reserve' }) },
			goCatch() { uni.navigateTo({ url: '/pages/catch/catch' }) },
			goMember() { uni.navigateTo({ url: '/pages/member/member' }) },
			goPoints() { uni.navigateTo({ url: '/pages/points/points' }) },
			goGroup() { uni.navigateTo({ url: '/pages/group/group' }) },
			goRental() { uni.navigateTo({ url: '/pages/rental/rental' }) },
			goContact() { uni.navigateTo({ url: '/pages/contact/contact' }) },
			goMall() { uni.navigateTo({ url: '/pages/mall/index' }) },
			goRateInfo() { uni.navigateTo({ url: '/pages/rateInfo/rateInfo' }) },
			openNavigation() {
				const v = this.venue || {}
				if (v.latitude && v.longitude) {
					uni.openLocation({
						latitude: Number(v.latitude),
						longitude: Number(v.longitude),
						name: v.name || '共享钓场',
						address: v.address || ''
					})
				} else {
					this.goVenue()
				}
			},
			callVenue() {
				const phone = this.venue && (this.venue.phone || this.venue.tel || this.venue.contactPhone)
				if (phone) uni.makePhoneCall({ phoneNumber: String(phone) })
				else this.goVenue()
			},
			formatMoney,
			formatDuration
		}
	}
</script>

<style>
	.home {
		background: transparent;
	}

	/* ---------------- 头部英雄区 ---------------- */
	.home-hero {
		margin: 0;
		padding: 60rpx 36rpx 100rpx;
		background: linear-gradient(135deg, #071f18 0%, #0c352a 50%, #031410 100%);
		color: #ffffff;
		position: relative;
		overflow: hidden;
		border-bottom-left-radius: 64rpx;
		border-bottom-right-radius: 64rpx;
		box-shadow: 0 28rpx 64rpx rgba(10, 46, 36, 0.22);
	}

	.home-hero::before {
		content: '';
		position: absolute;
		top: -120rpx;
		right: -120rpx;
		width: 320rpx;
		height: 320rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(199, 154, 57, 0.15) 0%, rgba(199, 154, 57, 0) 70%);
		filter: blur(25px);
		z-index: 1;
	}

	.home-hero::after {
		content: '';
		position: absolute;
		bottom: -100rpx;
		left: -50rpx;
		right: -50rpx;
		height: 180rpx;
		background: radial-gradient(ellipse at bottom, rgba(46, 186, 133, 0.15) 0%, rgba(46, 186, 133, 0) 80%);
		z-index: 1;
		pointer-events: none;
	}

	.hero-top {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 28rpx;
	}

	.hero-copy {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		min-width: 0;
	}

	.hero-kicker {
		font-size: 22rpx;
		font-weight: 800;
		color: #e0a93c;
		letter-spacing: 6rpx;
		text-transform: uppercase;
	}

	.hero-title {
		font-size: 52rpx;
		font-weight: 800;
		line-height: 1.2;
		color: #ffffff;
		text-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.25);
	}

	.hero-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12rpx;
		flex-shrink: 0;
	}

	.hero-status {
		height: 52rpx;
		padding: 0 24rpx;
		border-radius: 999rpx;
		background: rgba(16, 185, 129, 0.16);
		border: 1rpx solid rgba(16, 185, 129, 0.3);
		display: flex;
		align-items: center;
		gap: 12rpx;
		color: #10b981;
		font-size: 22rpx;
		font-weight: 800;
		backdrop-filter: blur(5px);
	}

	.hero-share-btn {
		height: 52rpx;
		line-height: 52rpx;
		margin: 0;
		padding: 0 22rpx;
		border-radius: 999rpx;
		background: rgba(245, 210, 133, 0.16);
		border: 1rpx solid rgba(245, 210, 133, 0.34);
		color: #f5d285;
		font-size: 22rpx;
		font-weight: 800;
		backdrop-filter: blur(5px);
	}

	.hero-share-btn::after {
		border: 0;
	}

	.hero-status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 12rpx rgba(16, 185, 129, 0.8);
		animation: pulse-green 2s infinite;
	}

	@keyframes pulse-green {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
		}
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 8rpx rgba(16, 185, 129, 0);
		}
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
		}
	}

	/* 英雄区数据卡 */
	.hero-metrics {
		position: relative;
		z-index: 2;
		margin-top: 48rpx;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20rpx;
	}

	.hero-metric {
		padding: 24rpx 16rpx;
		border-radius: 32rpx 12rpx;
		background: rgba(255, 255, 255, 0.04);
		border: 1rpx solid rgba(245, 210, 133, 0.18);
		box-shadow: inset 0 0 16rpx rgba(245, 210, 133, 0.08), 0 8rpx 20rpx rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		align-items: center;
		backdrop-filter: blur(10px);
		transition: var(--transition);
	}

	.hero-metric:active {
		background: rgba(255, 255, 255, 0.12);
		transform: scale(0.97);
	}

	.metric-label {
		color: rgba(255, 255, 255, 0.5);
		font-size: 20rpx;
		font-weight: 600;
	}

	.metric-value {
		color: #ffffff;
		font-size: 28rpx;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	/* ---------------- 悬浮搜索框 ---------------- */
	.home .search {
		margin: -45rpx 44rpx 32rpx;
		position: relative;
		z-index: 10;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(24px);
		border: 1rpx solid rgba(255, 255, 255, 0.6);
		box-shadow: 0 20rpx 48rpx rgba(10, 46, 36, 0.08);
		border-radius: 99rpx;
		height: 96rpx;
	}

	.search-ph {
		color: var(--text-light);
	}

	/* ---------------- 广告 Swiper ---------------- */
	.banner {
		margin: 8rpx 32rpx 24rpx;
		height: 260rpx;
		border-radius: 40rpx 16rpx;
		overflow: hidden;
		border: 1rpx solid rgba(255, 255, 255, 0.5);
		box-shadow: var(--card-shadow);
	}

	.banner-slide {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 10rpx;
		box-sizing: border-box;
		padding: 40rpx 44rpx;
		position: relative;
	}

	.banner-title {
		font-size: 38rpx;
		font-weight: 800;
		line-height: 1.25;
		color: var(--primary);
	}

	.banner-desc {
		font-size: 24rpx;
		color: var(--text-muted);
		font-weight: 600;
	}

	.banner-tag {
		margin-top: 14rpx;
		padding: 10rpx 28rpx;
		border-radius: 99rpx;
		background: var(--accent-gradient);
		color: var(--primary);
		font-size: 22rpx;
		font-weight: 800;
		box-shadow: var(--accent-glow);
	}

	.banner-tag-ad {
		background: var(--primary-gradient);
		color: #ffffff;
		box-shadow: 0 8rpx 20rpx rgba(10, 46, 36, 0.2);
	}

	/* ---------------- 公告栏 ---------------- */
	.notice {
		margin: 0 32rpx 24rpx;
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(10px);
		color: var(--text-main);
		border-radius: 30rpx;
		min-height: 80rpx;
		display: flex;
		align-items: center;
		padding: 20rpx 28rpx;
		gap: 20rpx;
		font-size: 24rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.3);
	}

	.notice-icon {
		width: 8rpx;
		height: 36rpx;
		border-radius: 99rpx;
		background: var(--accent-gradient);
		flex: 0 0 auto;
		box-shadow: var(--accent-glow);
	}

	.notice-text {
		flex: 1;
		color: var(--text-muted);
		line-height: 1.5;
		font-weight: 600;
	}

	/* ---------------- 天气栏 ---------------- */
	.weather-bar {
		margin: 0 32rpx 24rpx;
		background: rgba(46, 186, 133, 0.06);
		border-radius: 30rpx;
		padding: 22rpx 28rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1rpx solid rgba(46, 186, 133, 0.1);
	}

	.weather-text {
		font-size: 28rpx;
		color: var(--primary);
		font-weight: 800;
	}

	.weather-detail {
		font-size: 22rpx;
		color: var(--text-muted);
		text-align: right;
		max-width: 450rpx;
		line-height: 1.4;
		font-weight: 600;
	}

	/* ---------------- 警报/计时卡片 ---------------- */
	.alert {
		margin: 0 32rpx 24rpx;
		background: rgba(255, 251, 239, 0.85);
		backdrop-filter: blur(20px);
		border-radius: 40rpx 16rpx;
		padding: 32rpx;
		border: 1rpx solid rgba(224, 169, 60, 0.2);
		box-shadow: 0 16rpx 40rpx rgba(199, 154, 57, 0.05);
	}

	.alert-ok {
		background: rgba(240, 251, 247, 0.85);
		border: 1rpx solid rgba(16, 185, 129, 0.18);
		box-shadow: 0 16rpx 40rpx rgba(16, 185, 129, 0.04);
	}

	.alert-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.alert-tag {
		display: inline-flex;
		padding: 6rpx 20rpx;
		border-radius: 99rpx;
		background: rgba(224, 169, 60, 0.15);
		color: #b8860b;
		font-size: 22rpx;
		font-weight: 800;
	}

	.alert-tag-ok {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}

	.alert-amount {
		font-size: 46rpx;
		font-weight: 800;
		color: var(--primary);
		font-variant-numeric: tabular-nums;
	}

	.alert-title {
		display: block;
		margin-top: 14rpx;
		font-size: 26rpx;
		color: var(--text-muted);
		line-height: 1.5;
		font-weight: 600;
	}

	.alert-actions {
		margin-top: 24rpx;
		display: flex;
		justify-content: flex-end;
	}

	.alert-btn {
		background: var(--primary-gradient);
		color: #ffffff;
		padding: 18rpx 40rpx;
		border-radius: 99rpx;
		font-size: 26rpx;
		font-weight: 800;
		box-shadow: 0 10rpx 24rpx rgba(10, 46, 36, 0.18);
		transition: var(--transition);
	}

	.alert-btn:active {
		transform: scale(0.96);
		box-shadow: 0 4rpx 10rpx rgba(10, 46, 36, 0.1);
	}

	/* ---------------- 双入场/出场胶囊控制器 ---------------- */
	.two-grid {
		margin: 8rpx 32rpx 24rpx;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24rpx;
	}

	.two-item {
		padding: 36rpx 28rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 24rpx;
		min-height: 270rpx;
		transition: var(--transition);
		position: relative;
		overflow: hidden;
	}

	.two-item:active {
		transform: scale(0.96) translateY(2rpx);
		opacity: 0.95;
	}

	.two-item-primary {
		background: linear-gradient(135deg, #0b2d23 0%, #041a14 100%);
		color: #ffffff;
		border-radius: 48rpx 16rpx 48rpx 16rpx;
		border: 1rpx solid rgba(245, 210, 133, 0.28);
		box-shadow: 0 24rpx 56rpx rgba(10, 46, 36, 0.18), inset 0 2rpx 8rpx rgba(255, 255, 255, 0.1);
	}

	.two-item-secondary {
		background: rgba(255, 255, 255, 0.78);
		backdrop-filter: blur(20px);
		border-radius: 16rpx 48rpx 16rpx 48rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.6);
		box-shadow: var(--card-shadow);
	}

	.two-text {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		position: relative;
		z-index: 2;
	}

	.two-title {
		font-size: 34rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.two-item-primary .two-title {
		color: #ffffff;
		text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
	}

	.two-desc {
		font-size: 22rpx;
		color: var(--text-muted);
		line-height: 1.4;
		font-weight: 600;
	}

	.two-item-primary .two-desc {
		color: rgba(255, 255, 255, 0.6);
	}

	.two-ill {
		align-self: flex-end;
		width: 108rpx;
		height: 108rpx;
		border-radius: 32rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		transition: var(--transition);
		z-index: 2;
	}

	.two-ill-enter {
		background: var(--accent-gradient);
		color: var(--primary);
		box-shadow: var(--accent-glow);
	}

	.two-ill-exit {
		background: rgba(10, 46, 36, 0.05);
		color: var(--primary);
		border: 1rpx solid rgba(10, 46, 36, 0.05);
	}

	.two-ill-word {
		font-size: 46rpx;
		font-weight: 900;
		line-height: 1;
	}

	.two-ill-line {
		position: absolute;
		right: 14rpx;
		bottom: 14rpx;
		width: 32rpx;
		height: 6rpx;
		border-radius: 99rpx;
		background: currentColor;
		opacity: 0.25;
	}

	/* ---------------- 服务网格 ---------------- */
	.service-section {
		margin: 28rpx 32rpx 0;
		padding: 0 4rpx 28rpx;
		background: transparent;
		border: none;
		box-shadow: none;
	}

	.service-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		padding: 0 8rpx 28rpx;
	}

	.service-kicker {
		display: block;
		font-size: 18rpx;
		font-weight: 800;
		letter-spacing: 4rpx;
		color: var(--accent);
		line-height: 1;
		text-transform: uppercase;
	}

	.service-title {
		display: block;
		margin-top: 10rpx;
		font-size: 32rpx;
		font-weight: 900;
		color: var(--primary);
		line-height: 1.2;
	}

	.service-count {
		font-size: 22rpx;
		color: var(--text-light);
		font-weight: 700;
	}

	.service-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}

	.service-card {
		min-height: 144rpx;
		padding: 24rpx 20rpx;
		border-radius: 32rpx;
		background: rgba(255, 255, 255, 0.52); /* Fully borderless floating capsule */
		border: 1rpx solid rgba(255, 255, 255, 0.45);
		box-shadow: 0 8rpx 32rpx rgba(10, 46, 36, 0.015);
		display: flex;
		align-items: center;
		gap: 20rpx;
		position: relative;
		overflow: hidden;
		transition: var(--transition);
	}

	.service-card:active {
		transform: scale(0.96) translateY(2rpx);
		background: rgba(255, 255, 255, 0.75);
	}

	.service-card.is-primary {
		background: linear-gradient(135deg, #0c352a 0%, #051d16 100%);
		box-shadow: 0 16rpx 36rpx rgba(10, 46, 36, 0.12);
		border: 1rpx solid rgba(245, 210, 133, 0.16);
	}

	.service-card.is-primary .service-name {
		color: #ffffff;
	}

	.service-card.is-primary .service-desc,
	.service-card.is-primary .service-arrow {
		color: rgba(255, 255, 255, 0.5);
	}

	/* 图标放置容器 */
	.service-icon {
		width: 68rpx;
		height: 68rpx;
		border-radius: 20rpx;
		flex: 0 0 auto;
		background-size: 42rpx 42rpx;
		background-repeat: no-repeat;
		background-position: center;
		transition: var(--transition);
	}

	.tone-gold {
		background: #fff8eb;
		box-shadow: inset 0 0 10rpx rgba(224, 169, 60, 0.05);
	}

	.tone-teal {
		background: #eef7f5;
		box-shadow: inset 0 0 10rpx rgba(46, 186, 133, 0.05);
	}

	.tone-green {
		background: #f0f5f1;
		box-shadow: inset 0 0 10rpx rgba(16, 185, 129, 0.05);
	}

	.is-primary .service-icon {
		background: rgba(255, 255, 255, 0.08);
		border: 1rpx solid rgba(255, 255, 255, 0.06);
	}

	.service-copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		padding-right: 12rpx;
	}

	.service-name {
		font-size: 27rpx;
		font-weight: 800;
		color: var(--primary);
		line-height: 1.25;
	}

	.service-desc {
		font-size: 21rpx;
		color: var(--text-muted);
		line-height: 1.35;
		font-weight: 600;
	}

	.service-arrow {
		position: absolute;
		right: 18rpx;
		top: 18rpx;
		font-size: 28rpx;
		color: var(--text-light);
		font-weight: 700;
	}

	/* ---------------- 称鱼结算入口 ---------------- */
	.weigh-entry {
		margin: 0 28rpx 24rpx;
		padding: 28rpx 24rpx;
		background: var(--surface);
		border: 1rpx solid var(--border-color);
		border-radius: 22rpx;
		box-shadow: var(--card-shadow);
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: var(--transition);
	}

	.weigh-entry:active {
		transform: translateY(1rpx);
		opacity: 0.88;
	}

	.weigh-entry-left {
		display: flex;
		align-items: center;
		gap: 20rpx;
		flex: 1;
		min-width: 0;
	}

	.weigh-entry-icon {
		width: 88rpx;
		height: 88rpx;
		border-radius: 22rpx;
		background: var(--accent-gradient);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.weigh-icon-text {
		font-size: 42rpx;
		font-weight: 900;
		color: #ffffff;
		line-height: 1;
	}

	.weigh-entry-copy {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		min-width: 0;
	}

	.weigh-entry-title {
		font-size: 31rpx;
		font-weight: 850;
		color: var(--text-main);
	}

	.weigh-entry-desc {
		font-size: 23rpx;
		color: var(--text-muted);
		line-height: 1.4;
		font-weight: 600;
	}

	.weigh-entry-arrow {
		font-size: 36rpx;
		color: var(--text-light);
		font-weight: 700;
		flex-shrink: 0;
		margin-left: 12rpx;
	}

	.footer-text {
		text-align: center;
		color: var(--text-light);
		font-size: 22rpx;
		margin: 48rpx 0 24rpx;
	}
</style>
