const USER_KEY = 'fishpond_user'
const ORDERS_KEY = 'fishpond_orders'
const LOGIN_KEY = 'fishpond_login'
const ADS_KEY = 'fishpond_ads'
const REGISTRATIONS_KEY = 'fishpond_registrations'
const COUPONS_KEY = 'fishpond_coupons'

export const ORDER_STATUS = {
	READY: 0,
	RUNNING: 1,
	PENDING: 2,
	PAID: 3,
	CANCELED: 4
}

export const VENUE_INFO = {
	name: '共享钓场 · 旗舰店',
	address: '滨湖路 · 湖畔东岸',
	notice: '请于指定钓位垂钓，离场请走出口通道'
}

export const DEFAULT_RULE = {
	name: '标准计费',
	desc: '每 30 分钟 ¥3.00',
	stepMinutes: 30,
	minDurationMinutes: 30,
	pricePerStepCents: 300,
	capPerOrderCents: 0,
	summary: '起步 30 分钟起计，不足 30 分钟按 30 分钟计算'
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
	if (!value) {
		return '--'
	}
	const time = new Date(value)
	const p = (n) => String(n).padStart(2, '0')
	return `${time.getFullYear()}-${p(time.getMonth() + 1)}-${p(time.getDate())} ${p(time.getHours())}:${p(time.getMinutes())}:${p(time.getSeconds())}`
}

export function calcAmount(elapsedMs) {
	const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
	const minSeconds = DEFAULT_RULE.minDurationMinutes * 60
	const stepSeconds = DEFAULT_RULE.stepMinutes * 60
	const billableDurationSeconds = Math.max(minSeconds, Math.ceil(totalSeconds / stepSeconds) * stepSeconds)
	let amountCents = (billableDurationSeconds / stepSeconds) * DEFAULT_RULE.pricePerStepCents
	if (DEFAULT_RULE.capPerOrderCents > 0 && amountCents > DEFAULT_RULE.capPerOrderCents) {
		amountCents = DEFAULT_RULE.capPerOrderCents
	}
	return {
		amountCents,
		billableDurationSeconds,
		elapsedSeconds: totalSeconds
	}
}

function readStorage(key) {
	try {
		return uni.getStorageSync(key)
	} catch (error) {
		return null
	}
}

function parseArray(raw) {
	if (Array.isArray(raw)) {
		return raw
	}
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw)
			return Array.isArray(parsed) ? parsed : []
		} catch (error) {
			return []
		}
	}
	return []
}

function saveJson(key, value) {
	uni.setStorageSync(key, value)
}

function readUserObject(raw) {
	if (!raw) {
		return null
	}
	if (typeof raw === 'object' && !Array.isArray(raw)) {
		return raw
	}
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw)
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
		} catch (error) {
			return null
		}
	}
	return null
}

function makeUser(id) {
	const now = Date.now()
	return {
		id,
		name: `钓友_${String(now).slice(-4)}`,
		avatar: ''
	}
}

export function isLoggedIn() {
	return Boolean(readStorage(LOGIN_KEY))
}

export function loginMock() {
	const now = Date.now()
	const user = makeUser(`u_${now}`)
	saveJson(USER_KEY, user)
	saveJson(LOGIN_KEY, { at: now, openid: `mock_${now}` })
	return user
}

export function logout() {
	uni.removeStorageSync(LOGIN_KEY)
}

export function getUser() {
	let user = readUserObject(readStorage(USER_KEY))
	if (!user || !user.id) {
		user = makeUser(`u_${Date.now()}`)
		saveJson(USER_KEY, user)
	}
	return user
}

export function setUser(user) {
	saveJson(USER_KEY, user)
}

export function resetLocalData() {
	uni.removeStorageSync(USER_KEY)
	uni.removeStorageSync(ORDERS_KEY)
	uni.removeStorageSync(LOGIN_KEY)
}

function loadOrders() {
	return parseArray(readStorage(ORDERS_KEY)) || []
}

function saveOrders(value) {
	saveJson(ORDERS_KEY, value)
}

export function getOrders(userId) {
	return loadOrders().filter((item) => item.userId === userId)
}

export function getRunningOrder(userId) {
	return getOrders(userId).find((item) => item.status === ORDER_STATUS.RUNNING) || null
}

export function getPendingOrder(userId) {
	return getOrders(userId).find((item) => item.status === ORDER_STATUS.PENDING) || null
}

export function getLatestOrders(userId, limit = 20) {
	return getOrders(userId)
		.sort((a, b) => b.createdAt - a.createdAt)
		.slice(0, limit)
}

export function createOrder(userId) {
	const running = getRunningOrder(userId)
	if (running) {
		return running
	}
	const now = Date.now()
	const order = {
		id: `o_${now}_${userId}`,
		userId,
		orderNo: `FD${Math.floor(now / 1000)}`,
		status: ORDER_STATUS.RUNNING,
		startTime: now,
		endTime: 0,
		durationSeconds: 0,
		amountCents: 0,
		billableDurationSeconds: 0,
		createdAt: now,
		venueName: VENUE_INFO.name,
		ruleSnapshot: {
			name: DEFAULT_RULE.name,
			desc: DEFAULT_RULE.desc,
			stepMinutes: DEFAULT_RULE.stepMinutes,
			pricePerStepCents: DEFAULT_RULE.pricePerStepCents,
			minDurationMinutes: DEFAULT_RULE.minDurationMinutes
		}
	}
	const all = loadOrders()
	all.push(order)
	saveOrders(all)
	return order
}

export function finishOrderByUser(userId) {
	const all = loadOrders()
	const running = all.find((item) => item.userId === userId && item.status === ORDER_STATUS.RUNNING)
	if (!running) {
		return null
	}
	const calc = calcAmount(Date.now() - running.startTime)
	running.status = ORDER_STATUS.PENDING
	running.endTime = Date.now()
	running.durationSeconds = calc.billableDurationSeconds
	running.amountCents = calc.amountCents
	running.elapsedSeconds = calc.elapsedSeconds
	running.settlementTime = Date.now()
	const index = all.findIndex((item) => item.id === running.id)
	all[index] = running
	saveOrders(all)
	return running
}

export function payPendingOrder(userId, orderId) {
	const all = loadOrders()
	const pending = all.find(
		(item) => item.userId === userId && item.id === orderId && item.status === ORDER_STATUS.PENDING
	)
	if (!pending) {
		return null
	}
	pending.status = ORDER_STATUS.PAID
	pending.paidTime = Date.now()
	pending.paidAmountCents = pending.amountCents
	const index = all.findIndex((item) => item.id === pending.id)
	all[index] = pending
	saveOrders(all)
	return pending
}

export function removeOrder(orderId) {
	const all = loadOrders().filter((item) => item.id !== orderId)
	saveOrders(all)
}

// --- 广告系统 ---

const DEFAULT_ADS = [
	{
		id: 'ad_1',
		type: 'activity',
		title: '周末路亚挑战赛',
		image: '',
		bgColor: '#fff3d1',
		desc: '报名费 ¥50，冠军奖金 ¥500！本周六开赛',
		activityInfo: {
			name: '周末路亚挑战赛',
			date: '2026-05-10',
			location: '共享钓场 · 旗舰店 A区',
			feeCents: 5000,
			slots: 30,
			rules: '1. 比赛时长3小时\n2. 钓获最重者获胜\n3. 禁止使用活饵'
		}
	},
	{
		id: 'ad_2',
		type: 'ad',
		title: '新品鱼竿到店',
		image: '',
		bgColor: '#dfe8f5',
		desc: '日本进口碳素竿，到店体验享8折',
		content: '全新到店：shimano 碳素鱼竿系列\n\n轻量化设计，手感极佳\n到店体验价8折优惠\n\n活动时间：即日起至5月底\n地址：共享钓场 · 旗舰店',
		coupon: { type: 'duration', title: '免费钓30分钟', value: 30, minAmountCents: 0 }
	},
	{
		id: 'ad_3',
		type: 'ad',
		title: '会员充值优惠',
		image: '',
		bgColor: '#eaf5ee',
		desc: '充 200 送 50，限时活动',
		content: '会员充值活动\n\n充200送50，充500送150\n充值金额可用于钓场计时消费\n\n活动截止：2026年5月31日',
		coupon: { type: 'amount', title: '满10减5元', value: 500, minAmountCents: 1000 }
	}
]

export function getAds() {
	const stored = readStorage(ADS_KEY)
	if (stored && Array.isArray(stored) && stored.length > 0) {
		return stored
	}
	saveJson(ADS_KEY, DEFAULT_ADS)
	return DEFAULT_ADS
}

export function getAdById(id) {
	return getAds().find((item) => item.id === id) || null
}

// --- 活动报名 ---

function loadRegistrations() {
	return parseArray(readStorage(REGISTRATIONS_KEY)) || []
}

function saveRegistrations(value) {
	saveJson(REGISTRATIONS_KEY, value)
}

export function submitRegistration(adId, userId, info) {
	const all = loadRegistrations()
	const existing = all.find((r) => r.adId === adId && r.userId === userId)
	if (existing) return existing

	const reg = {
		id: `reg_${Date.now()}`,
		adId,
		userId,
		name: info.name,
		phone: info.phone,
		remark: info.remark || '',
		feeCents: info.feeCents || 0,
		paid: false,
		createdAt: Date.now()
	}
	all.push(reg)
	saveRegistrations(all)
	return reg
}

export function payRegistration(regId) {
	const all = loadRegistrations()
	const reg = all.find((r) => r.id === regId)
	if (!reg) return null
	reg.paid = true
	reg.paidAt = Date.now()
	const index = all.findIndex((r) => r.id === reg.id)
	all[index] = reg
	saveRegistrations(all)
	return reg
}

export function getMyRegistrations(userId) {
	return loadRegistrations().filter((r) => r.userId === userId)
}

// --- 优惠券系统 ---

export const COUPON_TYPE = {
	DURATION: 'duration',
	AMOUNT: 'amount'
}

function loadCoupons() {
	return parseArray(readStorage(COUPONS_KEY)) || []
}

function saveCoupons(value) {
	saveJson(COUPONS_KEY, value)
}

export function grantCoupon(userId, couponDef) {
	const all = loadCoupons()
	const coupon = {
		id: `cpn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
		userId,
		type: couponDef.type,
		title: couponDef.title,
		value: couponDef.value,
		minAmountCents: couponDef.minAmountCents || 0,
		expireAt: couponDef.expireAt || (Date.now() + 30 * 24 * 3600 * 1000),
		used: false,
		usedAt: 0,
		source: couponDef.source || '',
		createdAt: Date.now()
	}
	all.push(coupon)
	saveCoupons(all)
	return coupon
}

export function getMyCoupons(userId) {
	return loadCoupons().filter((c) => c.userId === userId)
}

export function getAvailableCoupons(userId) {
	const now = Date.now()
	return getMyCoupons(userId).filter((c) => !c.used && c.expireAt > now)
}

export function useCoupon(couponId) {
	const all = loadCoupons()
	const coupon = all.find((c) => c.id === couponId)
	if (!coupon || coupon.used) return null
	coupon.used = true
	coupon.usedAt = Date.now()
	const index = all.findIndex((c) => c.id === coupon.id)
	all[index] = coupon
	saveCoupons(all)
	return coupon
}

export function applyCouponToOrder(coupon, amountCents, durationSeconds) {
	if (coupon.type === COUPON_TYPE.AMOUNT) {
		if (amountCents < coupon.minAmountCents) return { discountCents: 0, discountSeconds: 0 }
		return { discountCents: Math.min(coupon.value, amountCents), discountSeconds: 0 }
	}
	if (coupon.type === COUPON_TYPE.DURATION) {
		return { discountCents: 0, discountSeconds: coupon.value * 60 }
	}
	return { discountCents: 0, discountSeconds: 0 }
}

export function getAdCoupon(adId) {
	const ad = getAdById(adId)
	if (!ad || !ad.coupon) return null
	return ad.coupon
}
