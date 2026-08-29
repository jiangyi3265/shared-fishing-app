<template>
	<exact-home
		:status-bar-height="statusBarHeight"
		:user="user"
		:account="account"
		:pending-order="pendingOrder"
		:running-order="runningOrder"
		:live-seconds="liveSeconds"
		:venue="venue"
		:weather="weather"
		:stocking="homeStocking"
		:competition="homeCompetition"
		@start="startFishing"
		@wallet="goWallet"
		@points="goPoints"
		@coupons="goCoupons"
		@pay="goPay"
		@session="goSession"
		@venue="goVenue"
		@reserve="goReserve"
		@stocking="goStocking"
		@catch="goCatch"
		@rank="goLeaderboard"
		@competition="goCompetition"
		@fish-card="goFishCard"
		@mall="goMall"
		@weigh="goWeighFish"
		@services="goServices"
		@checkout="settleFishing"
		@mine="goMine"
	/>
</template>

<script>
	import {
		formatMoney,
		formatDuration,
		getUser,
		fetchRunningOrder,
		fetchPendingOrder,
		calcAmount,
		fetchWeather,
		fetchStockingList,
		fetchCompetitionList,
		loadDefaultVenue,
		getCachedVenue,
		resolveQrcode,
		shouldShowSplash,
		fetchMyPoints,
		fetchMyCoupons
	} from '../../utils/fishingStore.js'
	import { fetchWallet } from '../../utils/walletStore.js'
	import { openVenueLocation } from '../../utils/location.js'
	import { safeDecode, parseScanParams, extractScanProof } from '../../utils/scan.js'

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
				weather: null,
				homeStocking: null,
				homeCompetition: null,
				showSplash: false,
				splashFading: false,
				splashProgress: 0,
				statusBarHeight: 20,
				flowLoading: false,
				account: { balanceCents: 0, points: 0, coupons: 0 }
			}
		},
		computed: {
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
			profileIncomplete() {
				if (!this.user) return false
				const nickname = this.user.nickname || this.user.name || ''
				return !this.user.avatar || !nickname || /^钓友_\d+$/.test(nickname)
			}
		},
		onLoad(option = {}) {
			this.afterTarget = this.normalizeAfterTarget(option.after)
			try {
				const info = uni.getSystemInfoSync()
				if (info && info.statusBarHeight) this.statusBarHeight = info.statusBarHeight
			} catch (e) {}
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
			this.clearSplashTimers()
		},
		beforeDestroy() {
			this.stopTimer()
			this.clearSplashTimers()
		},
		methods: {
			normalizeAfterTarget(value) {
				let target = String(value || '')
				// 微信会保留 reLaunch 查询参数中的百分号编码；登录回跳必须先还原，
				// 否则会被当成首页下的相对路径（pages/index/%2Fpages%2F...）。
				for (let i = 0; i < 2 && /%[0-9a-f]{2}/i.test(target); i += 1) {
					try { target = decodeURIComponent(target) } catch (e) { return '' }
				}
				if (!target.startsWith('/pages/') || target.startsWith('/pages/login/login')) return ''
				return target
			},
			maybeShowSplash(option = {}) {
				// 仅在“干净”冷启动（无扫码 / 深链 / 跳转参数）时展示一次，避免打断扫码入场等流程
				const hasEntryParam = option.after || option.qrId || option.scene || option.action || option.venueId
				if (hasEntryParam || !shouldShowSplash()) return
				this.showSplash = true
				this.splashFading = false
				this.splashProgress = 0
				this.splashTimer = setInterval(() => {
					this.splashProgress = Math.min(100, this.splashProgress + 2)
					if (this.splashProgress >= 100) this.clearSplashProgress()
				}, 56)
				this.splashHideTimer = setTimeout(() => this.dismissSplash(), 3000)
			},
			clearSplashProgress() {
				if (this.splashTimer) { clearInterval(this.splashTimer); this.splashTimer = null }
			},
			clearSplashTimers() {
				this.clearSplashProgress()
				if (this.splashHideTimer) { clearTimeout(this.splashHideTimer); this.splashHideTimer = null }
				if (this.splashRemoveTimer) { clearTimeout(this.splashRemoveTimer); this.splashRemoveTimer = null }
			},
			dismissSplash() {
				if (!this.showSplash || this.splashFading) return
				this.clearSplashProgress()
				if (this.splashHideTimer) { clearTimeout(this.splashHideTimer); this.splashHideTimer = null }
				this.splashProgress = 100
				this.splashFading = true
				this.splashRemoveTimer = setTimeout(() => {
					this.showSplash = false
					this.splashFading = false
				}, 480)
			},
			bootstrap(option) {
				this.user = getUser()
				this.loadVenue()
				this.refreshData()
				this.startTimer()
				if (option.qrId || option.scene || (option.action && option.venueId)) this.handleScanResult(this.optionToRawScan(option))
				else if (option.action === 'start') this.startFishing()
				else if (option.action === 'end') this.settleFishing()
			},
			loadVenue() {
				const cached = getCachedVenue()
				if (cached && cached.venue) this.applyVenue(cached)
				loadDefaultVenue().then((data) => { if (data) this.applyVenue(data) }).catch(() => {})
			},
			applyVenue(data) {
				if (data.venue) this.venue = data.venue
				if (data.rule) this.rule = Object.assign({}, FALLBACK_RULE, data.rule)
				this.loadHomeContent()
			},
			loadHomeContent() {
				const venueId = Number(this.venue && this.venue.venueId)
				if (Number.isInteger(venueId) && venueId > 0) {
					fetchStockingList(venueId).then((rows) => {
						this.homeStocking = rows && rows.length ? rows[0] : null
					}).catch(() => { this.homeStocking = null })
				}
				fetchCompetitionList(Number.isInteger(venueId) && venueId > 0 ? venueId : null).then((rows) => {
					this.homeCompetition = rows && rows.length ? rows[0] : null
				}).catch(() => { this.homeCompetition = null })
			},
			refreshData() {
				this.user = getUser()
				fetchWeather().then((w) => { this.weather = w }).catch(() => {})
				this.loadHomeContent()
				this.now = Date.now()
				if (!this.user) {
					this.runningOrder = null
					this.pendingOrder = null
					this.account = { balanceCents: 0, points: 0, coupons: 0 }
					return
				}
				fetchRunningOrder(this.user.userId).then((r) => { this.runningOrder = r }).catch(() => {})
				fetchPendingOrder(this.user.userId).then((p) => { this.pendingOrder = p }).catch(() => {})
				this.loadAccount()
			},
			loadAccount() {
				const uid = this.user && this.user.userId
				fetchWallet().then((data) => {
					const b = data && data.balance
					if (b) this.account.balanceCents = b.balanceCents || 0
				}).catch(() => {})
				fetchMyPoints().then((p) => {
					this.account.points = (p && (p.pointsBalance != null ? p.pointsBalance : p.points)) || 0
				}).catch(() => {})
				if (uid) fetchMyCoupons(uid).then((rows) => {
					this.account.coupons = (rows || []).filter((c) => !c.status || c.status === 0 || c.status === 'unused').length
				}).catch(() => {})
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
			getShareConfig() {
				const name = this.venue && this.venue.name ? this.venue.name : '共享钓场'
				return {
					title: `${name}，下竿计时、收竿结算更省心`,
					path: '/pages/index/index'
				}
			},
			goWeighFish() {
				if (!this.user) { this.goLogin('/pages/weighFish/weighFish'); return }
				uni.navigateTo({ url: '/pages/weighFish/weighFish' })
			},
			async startFishing() {
				this.user = getUser()
				if (!this.user) { this.goLogin('/pages/index/index?action=start'); return }
				if (this.flowLoading) return
				this.flowLoading = true
				try {
					const pending = await fetchPendingOrder(this.user.userId)
					if (pending) {
						this.pendingOrder = pending
						uni.showToast({ title: '请先支付未完成账单', icon: 'none' })
						this.goPay()
						return
					}
					const running = await fetchRunningOrder(this.user.userId)
					if (running) {
						this.runningOrder = running
						this.goSession()
						return
					}
					const raw = await this.scanFishingSpot()
					if (raw) await this.handleScanResult(raw)
				} catch (e) {
					if (!this.isScanCancel(e)) {
						uni.showToast({ title: '扫码失败，请对准钓位二维码重试', icon: 'none' })
					}
				} finally {
					this.flowLoading = false
				}
			},
			scanFishingSpot() {
				return new Promise((resolve, reject) => {
					uni.scanCode({
						onlyFromCamera: true,
						scanType: ['qrCode'],
						success: (result) => {
							const raw = result && (result.path || result.result)
							if (!raw) {
								reject({ errMsg: 'scanCode:fail empty result' })
								return
							}
							resolve(raw)
						},
						fail: reject
					})
				})
			},
			isScanCancel(error) {
				return String(error && error.errMsg || '').toLowerCase().includes('cancel')
			},
			async settleFishing() {
				this.user = getUser()
				if (!this.user) { this.goLogin('/pages/session/session?settle=1&direct=1'); return }
				if (this.flowLoading) return
				this.flowLoading = true
				try {
					const pending = await fetchPendingOrder(this.user.userId)
					if (pending) {
						this.pendingOrder = pending
						this.goPay()
						return
					}
					const running = await fetchRunningOrder(this.user.userId)
					if (!running) {
						uni.showToast({ title: '当前没有进行中的计时', icon: 'none' })
						return
					}
					this.runningOrder = running
					uni.navigateTo({ url: '/pages/session/session?settle=1&direct=1' })
				} catch (e) {
					// 请求层已给出可读错误提示。
				} finally {
					this.flowLoading = false
				}
			},
			handleScanResult(raw) {
				const params = parseScanParams(raw)
				const scan = extractScanProof(params)
				if (!scan) {
					uni.showToast({ title: '无法识别该钓场二维码', icon: 'none' })
					return Promise.resolve()
				}
				return resolveQrcode(scan, { redirectOnUnauthorized: false }).then((data) => {
					if (!data) return
					if (data.action !== 'end' && (!data.spot || !data.spotId)) {
						uni.showToast({ title: '该二维码未绑定钓位，请联系现场管理员', icon: 'none' })
						return
					}
					let verifiedScan = scan
					if (data.qrId !== undefined && data.qrId !== null && data.qrId !== '') {
						const qrId = Number(data.qrId)
						if (!Number.isSafeInteger(qrId) || qrId <= 0) {
							uni.showToast({ title: '二维码数据异常，请联系钓场管理员', icon: 'none' })
							return
						}
						verifiedScan = { qrId }
					}
					if (!this.user) {
						const target = data.action === 'end' ? '/pages/session/session' : '/pages/start/start'
						const extra = data.action === 'end' ? { settle: 1 } : {}
						uni.navigateTo({ url: target + this.buildScanQuery(verifiedScan, extra) })
						return
					}
					this.routeVerifiedScan(verifiedScan, data.action)
				}).catch((error) => {
					if (this.isUnauthorizedError(error)) {
						this.goLogin('/pages/start/start' + this.buildScanQuery(scan))
						return
					}
					uni.showToast({ title: '二维码无效或已停用', icon: 'none' })
				})
			},
			async routeVerifiedScan(verifiedScan, resolvedAction) {
				try {
					const requestOptions = { redirectOnUnauthorized: false }
					const pending = await fetchPendingOrder(this.user.userId, requestOptions)
					if (pending) {
						this.pendingOrder = pending
						this.goPay()
						return
					}
					const running = await fetchRunningOrder(this.user.userId, requestOptions)
					if (running) {
						this.runningOrder = running
						uni.navigateTo({ url: '/pages/session/session' + this.buildScanQuery(verifiedScan, { settle: 1 }) })
						return
					}
					if (resolvedAction === 'end') {
						uni.showToast({ title: '当前没有进行中的计时', icon: 'none' })
						return
					}
					uni.navigateTo({ url: '/pages/start/start' + this.buildScanQuery(verifiedScan) })
				} catch (error) {
					if (this.isUnauthorizedError(error)) {
						const target = resolvedAction === 'end'
							? '/pages/session/session' + this.buildScanQuery(verifiedScan, { settle: 1 })
							: '/pages/start/start' + this.buildScanQuery(verifiedScan)
						this.goLogin(target)
					}
				}
			},
			isUnauthorizedError(error) {
				return Number(error && (error.statusCode || error.code)) === 401
			},
			optionToRawScan(option = {}) {
				if (option.qrId) return 'qrId=' + option.qrId
				if (option.action && option.venueId) return 'action=' + option.action + '&venueId=' + option.venueId
				return option.scene ? safeDecode(option.scene) : ''
			},
			buildScanQuery(scan = {}, extra = {}) {
				const parts = []
				const qrId = Number(scan.qrId)
				if (Number.isSafeInteger(qrId) && qrId > 0) parts.push('qrId=' + encodeURIComponent(qrId))
				else if (scan.scene) parts.push('scene=' + encodeURIComponent(scan.scene))
				Object.keys(extra).forEach((key) => {
					if (extra[key] !== undefined && extra[key] !== null && extra[key] !== '') {
						parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(extra[key]))
					}
				})
				return parts.length ? '?' + parts.join('&') : ''
			},
			goPay() { uni.navigateTo({ url: '/pages/pay/pay' }) },
			goSession() { uni.navigateTo({ url: '/pages/session/session' }) },
			goOrders() { uni.navigateTo({ url: '/pages/orders/orders' }) },
			goMine() { uni.navigateTo({ url: '/pages/mine/mine' }) },
			goLogin(redirect) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent(redirect || '/pages/index/index') }) },
			goVenue() { uni.navigateTo({ url: '/pages/venue/venue' }) },
			goStocking() { uni.navigateTo({ url: '/pages/stocking/stocking' }) },
			goReserve() { uni.navigateTo({ url: '/pages/reserve/reserve' }) },
			goCatch() {
				if (!this.user) { this.goLogin('/pages/catch/catch'); return }
				uni.navigateTo({ url: '/pages/catch/catch' })
			},
			goFishCard() {
				if (!this.user) { this.goLogin('/pages/fishCard/fishCard'); return }
				uni.navigateTo({ url: '/pages/fishCard/fishCard' })
			},
			goMember() {
				if (!this.user) { this.goLogin('/pages/member/member'); return }
				uni.navigateTo({ url: '/pages/member/member' })
			},
			goPoints() { uni.navigateTo({ url: '/pages/points/points' }) },
			goRental() { uni.navigateTo({ url: '/pages/rental/rental' }) },
			goContact() { uni.navigateTo({ url: '/pages/contact/contact' }) },
			goCoupons() {
				if (!this.user) { this.goLogin('/pages/coupons/coupons'); return }
				uni.navigateTo({ url: '/pages/coupons/coupons' })
			},
			goMall() { uni.navigateTo({ url: '/pages/mall/index' }) },
			goServices() { uni.navigateTo({ url: '/pages/services/services' }) },
			goLeaderboard() { uni.navigateTo({ url: '/pages/rank/rank' }) },
			goCompetition() {
				if (!this.user) { this.goLogin('/pages/competition/competition'); return }
				uni.navigateTo({ url: '/pages/competition/competition' })
			},
			goRank() { uni.navigateTo({ url: '/pages/goal/goal' }) },
			goWallet() {
				if (!this.user) { this.goLogin('/pages/wallet/wallet'); return }
				uni.navigateTo({ url: '/pages/wallet/wallet' })
			},
			goRecharge() {
				if (!this.user) { this.goLogin('/pages/wallet/recharge'); return }
				uni.navigateTo({ url: '/pages/wallet/recharge' })
			},
			goRateInfo() { uni.navigateTo({ url: '/pages/rateInfo/rateInfo' }) },
			openNavigation() { openVenueLocation(this.venue) },
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
	page { background: #f5fbfa; }
</style>
