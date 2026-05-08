import { http } from './request.js'

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

export function isLoggedIn() { return Boolean(readStorage(LOGIN_KEY)) }

export function getUser() {
	const raw = readStorage(USER_KEY)
	if (!raw) return null
	if (typeof raw === 'object') return raw
	try { return JSON.parse(raw) } catch (e) { return null }
}

export function setUser(user) { saveJson(USER_KEY, user) }

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
		saveJson(LOGIN_KEY, { at: Date.now(), token: data.token, userId: data.userId })
		return data
	})
}

export function loginWithCode(code, profile = {}) {
	return loginRequest({ code, nickname: profile.nickName, avatar: profile.avatarUrl })
}

export function resolveQrcode({ qrId, scene } = {}) {
	const params = {}
	if (qrId) params.qrId = qrId
	if (scene) params.scene = scene
	return http.get('/app/qrcode/resolve', params)
}

export function loadDefaultVenue() {
	return http.get('/app/venue/default').then((data) => {
		if (data && data.venue) setCachedVenue({ venue: data.venue, rule: data.rule })
		return data
	})
}

export function fetchRunningOrder(userId) {
	if (!userId) return Promise.resolve(null)
	return http.get('/app/order/running', { userId }).then((data) => data || null)
}

export function fetchPendingOrder(userId) {
	if (!userId) return Promise.resolve(null)
	return http.get('/app/order/pending', { userId }).then((data) => data || null)
}

export function startOrder(userId, venueId) {
	return http.post('/app/order/start', { userId, venueId })
}

export function finishOrder(userId) {
	return http.post('/app/order/finish', { userId })
}

export function payOrder(userId, orderId, couponId) {
	return http.post('/app/order/pay', { userId, orderId, couponId }).then((data) => {
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
					success: () => resolve(data.order),
					fail: (err) => reject(err)
				})
			})
		}
		return data.order || data
	})
}

export function fetchOrders(userId, limit = 50) {
	return http.get('/app/order/list', { userId, limit }).then((rows) => rows || [])
}

export function fetchOrderDetail(orderId) {
	return http.get('/app/order/' + orderId)
}

export function fetchAds() {
	return http.get('/app/ad/list').then((rows) => (rows || []).map(mapAdForView))
}

export function fetchAdById(adId) {
	return http.get('/app/ad/' + adId).then(mapAdForView)
}

function mapAdForView(ad) {
	if (!ad) return ad
	return {
		...ad,
		id: ad.adId,
		type: ad.adType,
		desc: ad.description,
		activityInfo: ad.adType === 'activity' ? {
			name: ad.activityName,
			date: ad.activityDate,
			location: ad.activityLocation,
			feeCents: ad.activityFeeCents,
			slots: ad.activitySlots,
			rules: ad.activityRules
		} : null
	}
}

export function submitRegistration(adId, userId, info) {
	return http.post('/app/registration/submit', {
		adId, userId, name: info.name, phone: info.phone, remark: info.remark || ''
	})
}

export function payRegistration(regId) {
	return http.post('/app/registration/pay', { regId })
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
