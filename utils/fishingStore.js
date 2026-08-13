import { http, resolveAssetUrl } from './request.js'
import { uploadProfileAvatar } from './request.js'

const USER_KEY = 'fishpond_user'
const LOGIN_KEY = 'fishpond_login'
const VENUE_KEY = 'fishpond_venue'

export const ORDER_STATUS = {
	READY: 0,
	RUNNING: 1,
	PENDING: 2,
	PAID: 3,
	CANCELED: 4
}

export const COUPON_TYPE = {
	DURATION: 'duration',
	AMOUNT: 'amount'
}

export function formatMoney(cents) {
	return (Number(cents || 0) / 100).toFixed(2)
}

/**
 * 安全返回首页：若首页在页面栈底则逐级返回（不新建页面），
 * 否则用 reLaunch 重置到首页。避免堆叠重复首页，也保证滑动返回能回到首页。
 */
export function goHomeSafely() {
	const pages = (typeof getCurrentPages === 'function') ? getCurrentPages() : []
	if (pages && pages.length > 1) {
		uni.navigateBack({ delta: pages.length - 1 })
	} else {
		uni.reLaunch({ url: '/pages/index/index' })
	}
}

/**
 * 若当前页是页面栈底唯一页（冷启动/扫码/分享直达），用 reLaunch 首页并带 after 参数把当前页
 * 重新垫到首页之上，避免安卓返回手势/返回键直接退出小程序。返回 true 表示已触发重定向，调用方应立即 return。
 */
export function seedHomeIfAlone(currentRoute) {
	const pages = (typeof getCurrentPages === 'function') ? getCurrentPages() : []
	if (!pages || pages.length !== 1) return false
	if (!currentRoute || currentRoute === '/pages/index/index') return false
	uni.reLaunch({ url: '/pages/index/index?after=' + encodeURIComponent(currentRoute) })
	return true
}

// ---- 启动加载动画（每次冷启动仅展示一次）----
let __splashSeen = false
export function shouldShowSplash() {
	if (__splashSeen) return false
	__splashSeen = true
	return true
}

export function formatDuration(secondsValue) {
	const total = Number(secondsValue || 0)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = total % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDatetime(value) {
	if (!value) return '--'
	const time = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(time.getTime())) return String(value)
	const p = (n) => String(n).padStart(2, '0')
	return `${time.getFullYear()}-${p(time.getMonth() + 1)}-${p(time.getDate())} ${p(time.getHours())}:${p(time.getMinutes())}:${p(time.getSeconds())}`
}

// ---- 本地登录态 ----

function readStorage(key) {
	try { return uni.getStorageSync(key) } catch (error) { return null }
}

function saveJson(key, value) { uni.setStorageSync(key, value) }

function readLoginSession() {
	const raw = readStorage(LOGIN_KEY)
	if (!raw) return null
	if (typeof raw === 'object') return raw
	try { return JSON.parse(raw) } catch (e) { return null }
}

export function isLoggedIn() {
	const session = readLoginSession()
	const user = getUser()
	if (!session || !session.token || !user) return false
	const sessionUserId = session.userId === undefined || session.userId === null ? '' : String(session.userId)
	const userId = user.userId === undefined || user.userId === null ? '' : String(user.userId)
	return !sessionUserId || !userId || sessionUserId === userId
}

export function getUser() {
	const raw = readStorage(USER_KEY)
	if (!raw) return null
	if (typeof raw === 'object') return raw
	try { return JSON.parse(raw) } catch (e) { return null }
}

export function setUser(user) {
	if (!user) return
	const normalized = { ...user, avatar: resolveAssetUrl(user.avatar || '') }
	saveJson(USER_KEY, normalized)
}

export function logout() {
	uni.removeStorageSync(LOGIN_KEY)
	uni.removeStorageSync(USER_KEY)
}

export function resetLocalData() {
	uni.removeStorageSync(USER_KEY)
	uni.removeStorageSync(LOGIN_KEY)
	uni.removeStorageSync(VENUE_KEY)
}

export function getCachedVenue() {
	const v = readStorage(VENUE_KEY)
	return v && typeof v === 'object' ? v : null
}

export function setCachedVenue(venue) { saveJson(VENUE_KEY, venue) }

// ---- API 封装 ----

export function loginRequest({ code, nickname, avatar } = {}) {
	if (!code) return Promise.reject({ msg: '微信登录失败，请重试' })
	const payload = { nickname, avatar }
	payload.code = code
	return http.post('/app/login', payload).then((data) => {
		if (!data || !data.user || !data.token) throw { msg: '登录响应异常' }
		setUser(data.user)
		data.user = getUser()
		const userId = data.userId !== undefined && data.userId !== null ? data.userId : data.user.userId
		saveJson(LOGIN_KEY, { at: Date.now(), token: String(data.token), userId })
		if (!isLoggedIn()) throw { msg: '登录信息保存失败' }
		return data
	})
}

export function loginWithCode(code, profile = {}) {
	return loginRequest({ code, nickname: profile.nickName, avatar: profile.avatarUrl })
}

export function saveChosenAvatar(filePath) {
	if (!filePath) return Promise.resolve(getUser())
	return uploadProfileAvatar(filePath).then((data) => {
		const user = data && data.user ? data.user : getUser()
		if (user) setUser(user)
		return getUser()
	})
}

export function resolveQrcode({ qrId, scene } = {}, requestOptions) {
	const params = {}
	if (qrId) params.qrId = qrId
	if (scene) params.scene = scene
	return http.get('/app/qrcode/resolve', params, requestOptions)
}

export function loadDefaultVenue() {
	return http.get('/app/venue/default').then((data) => {
		if (data && data.venue) setCachedVenue({ venue: data.venue, rule: data.rule })
		return data
	})
}

export function fetchRunningOrder(userId, requestOptions) {
	if (!userId) return Promise.resolve(null)
	return http.get('/app/order/running', { userId }, requestOptions).then((data) => data || null)
}

export function fetchPendingOrder(userId, requestOptions) {
	if (!userId) return Promise.resolve(null)
	return http.get('/app/order/pending', { userId }, requestOptions).then((data) => data || null)
}

function attachScanPayload(payload, scan = {}) {
	if (scan.qrId) payload.qrId = scan.qrId
	if (scan.scene) payload.scene = scan.scene
	return payload
}

export function startOrder(userId, venueId, scan = {}) {
	return http.post('/app/order/start', attachScanPayload({ userId, venueId }, scan))
}

export function finishOrder(userId, scan = {}) {
	return http.post('/app/order/finish', attachScanPayload({ userId }, scan))
}

export function payOrder(userId, orderId, couponId, mallOrderIds, useBalance) {
	return http.post('/app/order/pay', { userId, orderId, couponId, mallOrderIds: mallOrderIds || [], useBalance: !!useBalance }).then((data) => {
		if (!data) return null
		// data: { order, pay?, needWxPay }
		if (data.needWxPay && data.pay && !data.pay.mock) {
			return new Promise((resolve, reject) => {
				uni.requestPayment({
					provider: 'wxpay',
					timeStamp: String(data.pay.timeStamp || ''),
					nonceStr: data.pay.nonceStr || '',
					package: data.pay.package || ('prepay_id=' + (data.pay.prepayId || '')),
					signType: data.pay.signType || 'RSA',
					paySign: data.pay.paySign || '',
					success: () => resolve(waitOrderPaid(data.order && data.order.orderId, data.order)),
					fail: (err) => reject(normalizePaymentError(err))
				})
			})
		}
		return data.order || data
	})
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitOrderPaid(orderId, fallback) {
	if (!orderId) return fallback || null
	let latest = fallback || null
	for (let i = 0; i < 8; i += 1) {
		await sleep(i === 0 ? 600 : 900)
		try {
			latest = await fetchOrderDetail(orderId)
			if (latest && latest.status === ORDER_STATUS.PAID) return latest
		} catch (e) {}
	}
	return latest || fallback || null
}

export function normalizePaymentError(err = {}) {
	const raw = err.errMsg || err.msg || '微信支付失败'
	if (raw.includes('cancel')) return { ...err, msg: '已取消支付' }
	if (raw.includes('requestPayment:fail')) return { ...err, msg: raw.replace('requestPayment:fail ', '') || '微信支付调起失败' }
	return { ...err, msg: raw }
}

export function fetchOrders(userId, limit = 50) {
	return http.get('/app/order/list', { userId, limit }).then((rows) => rows || [])
}

export function fetchOrderDetail(orderId) {
	return http.get('/app/order/' + orderId)
}

export const REFUND_STATUS = {
	PENDING: 0,
	REFUNDING: 1,
	DONE: 2,
	REJECTED: 3,
	FAILED: 4
}

export function applyRefund({ orderId, applyAmountCents, reason }) {
	return http.post('/app/refund/apply', { orderId, applyAmountCents, reason })
}

export function fetchMyRefunds(userId) {
	return http.get('/app/refund/my', { userId }).then((rows) => rows || [])
}

// ---------------- 店员工作台 ----------------

export function fetchStaffInfo() {
	return http.get('/app/staff/info')
}

export function staffRedeem(code) {
	return http.post('/app/staff/redeem', { code })
}

export function fetchAds() {
	return http.get('/app/ad/list').then((result) => normalizeListResult(result).map(mapAdForView))
}

export function fetchStockingList(venueId) {
	const normalizedVenueId = Number(venueId)
	if (!Number.isInteger(normalizedVenueId) || normalizedVenueId <= 0) {
		return Promise.reject({ msg: '未获取到有效的钓场信息' })
	}
	return http.get('/app/stocking/list', { venueId: normalizedVenueId })
		.then(rows => (rows || []).map(mapStockingForView))
}

function mapStockingForView(record) {
	if (!record || typeof record !== 'object') return record
	const rawImages = [record.images, record.image]
	const images = []
	rawImages.forEach((raw) => {
		const values = Array.isArray(raw) ? raw : String(raw || '').split(',')
		values.forEach((value) => {
			const url = resolveAssetUrl(value)
			if (url && !images.includes(url)) images.push(url)
		})
	})
	return { ...record, image: images[0] || '', images }
}

export function fetchAdById(adId) {
	return http.get('/app/ad/' + adId).then(mapAdForView)
}

function mapAdForView(ad) {
	if (!ad) return ad
	const id = ad.adId !== undefined && ad.adId !== null ? ad.adId : ad.id
	const rawType = ad.adType !== undefined && ad.adType !== null ? ad.adType : ad.type
	const type = String(rawType || 'ad').toLowerCase()
	const rawImage = ad.image || ad.imageUrl || ad.coverUrl || ad.cover || ''
	const image = Array.isArray(rawImage) ? rawImage[0] : String(rawImage).split(',')[0]
	return {
		...ad,
		adId: id,
		id,
		adType: type,
		type,
		title: ad.title || ad.name || '钓场活动',
		description: ad.description || ad.desc || ad.subtitle || '',
		desc: ad.description || ad.desc || ad.subtitle || '',
		image: resolveAssetUrl(image),
		bgColor: ad.bgColor || ad.backgroundColor || '#e9e2d3',
		activityInfo: type === 'activity' ? {
			name: ad.activityName,
			date: ad.activityDate,
			location: ad.activityLocation,
			feeCents: ad.activityFeeCents,
			slots: ad.activitySlots,
			rules: ad.activityRules
		} : null
	}
}

function normalizeListResult(result) {
	if (Array.isArray(result)) return result
	if (result && Array.isArray(result.rows)) return result.rows
	if (result && Array.isArray(result.list)) return result.list
	return []
}

export function submitRegistration(adId, userId, info) {
	return http.post('/app/registration/submit', {
		adId, userId, name: info.name, phone: info.phone, remark: info.remark || ''
	})
}

export function payRegistration(regId) {
	return http.post('/app/registration/pay', { regId }).then((data) => {
		if (!data) return null
		if (data.needWxPay && data.pay && !data.pay.mock) {
			return new Promise((resolve, reject) => {
				uni.requestPayment({
					provider: 'wxpay',
					timeStamp: String(data.pay.timeStamp || ''),
					nonceStr: data.pay.nonceStr || '',
					package: data.pay.package || ('prepay_id=' + (data.pay.prepayId || '')),
					signType: data.pay.signType || 'RSA',
					paySign: data.pay.paySign || '',
					success: () => resolve(waitRegistrationPaid(regId, data.order)),
					fail: (err) => reject(normalizePaymentError(err))
				})
			})
		}
		return data.order || data
	})
}

async function waitRegistrationPaid(regId, fallback) {
	let latest = fallback || null
	for (let i = 0; i < 8; i += 1) {
		await sleep(i === 0 ? 600 : 900)
		try {
			const user = getUser()
			if (!user) return latest
			const rows = await fetchMyRegistrations(user.userId)
			const matched = rows.find((item) => item.regId === regId)
			if (matched) latest = matched
			if (latest && latest.paid === 1) return latest
		} catch (e) {}
	}
	return latest
}

export function fetchMyRegistrations(userId) {
	return http.get('/app/registration/my', { userId }).then((rows) => rows || [])
}

export function grantCoupon(userId, templateId, source) {
	return http.post('/app/coupon/grant', { userId, templateId, source })
}

export function fetchMyCoupons(userId) {
	return http.get('/app/coupon/my', { userId }).then((rows) => rows || [])
}

export function fetchAvailableCoupons(userId) {
	return http.get('/app/coupon/available', { userId }).then((rows) => rows || [])
}

// ---- 本地计费估算（仅展示用，最终以服务端为准） ----

export function calcAmount(elapsedMs, rule) {
	const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
	const step = Math.max(1, Number(rule?.stepMinutes || 30)) * 60
	const minDur = Math.max(0, Number(rule?.minDurationMinutes || 30)) * 60
	const pricePerStep = Number(rule?.pricePerStepCents || 300)
	const cap = Number(rule?.capAmountCents || 0)
	const billable = Math.max(minDur, Math.ceil(totalSeconds / step) * step)
	let amount = (billable / step) * pricePerStep
	if (cap > 0 && amount > cap) amount = cap
	return { amountCents: amount, billableDurationSeconds: billable, elapsedSeconds: totalSeconds }
}

export function applyCouponToOrder(coupon, amountCents) {
	if (!coupon) return { discountCents: 0, discountSeconds: 0 }
	if (coupon.couponType === COUPON_TYPE.AMOUNT) {
		if (amountCents < (coupon.minAmountCents || 0)) return { discountCents: 0, discountSeconds: 0 }
		return { discountCents: Math.min(coupon.couponValue, amountCents), discountSeconds: 0 }
	}
	if (coupon.couponType === COUPON_TYPE.DURATION) {
		return { discountCents: 0, discountSeconds: coupon.couponValue * 60 }
	}
	return { discountCents: 0, discountSeconds: 0 }
}

// ===== 钓位预订 =====
export function fetchSpots(venueId) {
	return http.get('/app/spot/list', { venueId }).then(rows => rows || [])
}
export function submitReservation(data) {
	return http.post('/app/reservation/submit', data)
}
export function fetchMyReservations() {
	return http.get('/app/reservation/mine').then(rows => rows || [])
}
export function cancelReservation(id) {
	return http.put('/app/reservation/cancel/' + id)
}

// ===== 天气 =====
export function fetchWeather(location) {
	const params = location ? { location } : {}
	return http.get('/app/weather', params)
}

// ===== 我的钓获（仅当前登录用户可见） =====
export function fetchMyCatch() {
	return http.get('/app/catch/mine').then(rows => rows || [])
}

// ===== 会员等级 =====
export function fetchMemberLevels() {
	return http.get('/app/member/levels').then(rows => rows || [])
}
export function fetchMyMember() {
	return http.get('/app/member/my')
}

// ===== 积分 =====
export function fetchMyPoints() {
	return http.get('/app/points/my')
}
export function fetchPointsGoods() {
	return http.get('/app/points/goods').then(rows => rows || [])
}
export function doCheckin() {
	return http.post('/app/points/checkin')
}
export function fetchCheckinCalendar(month) {
	const params = month ? { month } : {}
	return http.get('/app/points/checkin/calendar', params)
}
export function exchangePoints(goodsId) {
	return http.post('/app/points/exchange/' + goodsId)
}

export function fetchConsumePointsReward(sourceNo) {
	if (!sourceNo) return Promise.resolve(null)
	return http.get('/app/points/reward/' + encodeURIComponent(sourceNo))
}

export function claimConsumePointsReward(sourceNo) {
	return http.post('/app/points/reward/' + encodeURIComponent(sourceNo) + '/claim')
}

// ===== 极智鱼鉴 · 电子鱼卡 =====
export function fetchFishCardGame() {
	return http.get('/app/fish-card/my')
}

export function submitFishCard(speciesId, videoUrl) {
	return http.post('/app/fish-card/submit', { speciesId, videoUrl })
}

// ===== 称鱼结算 =====
export function submitFishWeigh({ userId, venueId, weightGrams, scan }) {
	const payload = { userId, venueId, weightGrams }
	if (scan) attachScanPayload(payload, scan)
	return http.post('/app/fish-weigh/submit', payload)
}

export function payFishWeigh(fishWeighId, useBalance) {
	return http.post('/app/fish-weigh/pay', { fishWeighId, useBalance: !!useBalance }).then((data) => {
		if (!data) return null
		if (data.needWxPay && data.pay && !data.pay.mock) {
			return new Promise((resolve, reject) => {
				uni.requestPayment({
					provider: 'wxpay',
					timeStamp: String(data.pay.timeStamp || ''),
					nonceStr: data.pay.nonceStr || '',
					package: data.pay.package || ('prepay_id=' + (data.pay.prepayId || '')),
					signType: data.pay.signType || 'RSA',
					paySign: data.pay.paySign || '',
					success: () => resolve(data.order || data),
					fail: (err) => reject(normalizePaymentError(err))
				})
			})
		}
		return data.order || data
	})
}

export function fetchFishPrice(venueId) {
	const params = venueId ? { venueId } : {}
	return http.get('/app/fish-weigh/price', params)
}

// ===== 装备租赁 =====
export function fetchRentalList() {
	return http.get('/app/rental/list').then(rows => rows || [])
}
export function rentEquipment(goodsId) {
	return http.post('/app/rental/rent/' + goodsId)
}
export function fetchMyRentals() {
	return http.get('/app/rental/mine').then(rows => rows || [])
}

// ===== 比赛 =====
export function fetchCompetitionList(venueId) {
	const params = venueId ? { venueId } : {}
	return http.get('/app/competition/list', params).then(rows => rows || [])
}
export function fetchCompetitionDetail(compId) {
	return http.get('/app/competition/' + compId)
}
export function fetchCompetitionRanking(compId) {
	return http.get('/app/competition/ranking/' + compId).then(rows => rows || [])
}
export function enterCompetition(compId, data, options = {}) {
	return http.post('/app/competition/enter/' + compId, data, options)
}

// ===== 排行榜（钓王榜 / 积分榜）=====
// 正式环境只展示真实业务数据；空榜由页面呈现明确的空状态。
export function fetchLeaderboard(type = 'weight', venueId) {
	const kind = type === 'points' ? 'points' : 'weight'
	const params = { type: kind }
	if (venueId) params.venueId = venueId
	return http.get('/app/rank/list', params).then((rows) => rows || [])
}
