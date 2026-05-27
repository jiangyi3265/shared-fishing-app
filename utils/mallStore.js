import { http } from './request.js'
import { normalizePaymentError } from './fishingStore.js'

// 后端 API 已接通；如需脱机演示改回 false
export const MALL_API_ENABLED = true

const CART_KEY = 'fishpond_cart'

export const MALL_ORDER_STATUS = {
	UNPAID: 0,
	PAID: 1,
	REDEEMED: 2,
	CANCELED: 3
}

// ---------------- 分类 + 商品 ----------------

const MOCK_CATEGORIES = [
	{ catId: 1, name: '热卖', icon: '🔥' },
	{ catId: 2, name: '鱼饵', icon: '🪱' },
	{ catId: 3, name: '渔具', icon: '🎣' },
	{ catId: 4, name: '饮料', icon: '🥤' },
	{ catId: 5, name: '小吃', icon: '🍢' }
]

const MOCK_PRODUCTS = [
	{ goodsId: 101, catId: 2, name: '红虫(冻干)', subtitle: '40g · 经典款', priceCents: 1500, stock: 88, sales: 326, cover: '🪱', desc: '低温冷冻保存红虫，开袋即用，鲫鱼、鲤鱼通杀。' },
	{ goodsId: 102, catId: 2, name: '玉米饵', subtitle: '300g · 散装', priceCents: 800, stock: 120, sales: 412, cover: '🌽', desc: '甜玉米发酵饵，野钓大鱼利器。' },
	{ goodsId: 103, catId: 2, name: '蚯蚓鲜虫', subtitle: '一盒 · 现挖', priceCents: 1000, stock: 50, sales: 198, cover: '🐛', desc: '当日新鲜蚯蚓，活力强、上钩率高。' },
	{ goodsId: 201, catId: 3, name: '碳素鱼竿 5.4米', subtitle: '高碳素 · 28调', priceCents: 28800, stock: 12, sales: 47, cover: '🎣', desc: '5.4 米高碳素台钓竿，重量 145g，腰力十足。' },
	{ goodsId: 202, catId: 3, name: '鱼线 0.8号', subtitle: '500m · 主线', priceCents: 3500, stock: 36, sales: 89, cover: '🧵', desc: '日本进口尼龙线，柔软耐磨，结节强度高。' },
	{ goodsId: 203, catId: 3, name: '伊势尼鱼钩', subtitle: '6号 · 一包10枚', priceCents: 1200, stock: 200, sales: 612, cover: '🪝', desc: '黑色高碳钢，倒刺结实，鲫鱼必备。' },
	{ goodsId: 301, catId: 4, name: '冰镇可乐', subtitle: '330ml', priceCents: 400, stock: 200, sales: 1245, cover: '🥤', desc: '冰柜直取，钓累了来一罐。' },
	{ goodsId: 302, catId: 4, name: '矿泉水', subtitle: '550ml', priceCents: 200, stock: 500, sales: 2134, cover: '💧', desc: '5 元 3 瓶，户外解渴必备。' },
	{ goodsId: 303, catId: 4, name: '红牛功能饮料', subtitle: '250ml', priceCents: 700, stock: 80, sales: 320, cover: '🐂', desc: '夜钓提神。' },
	{ goodsId: 401, catId: 5, name: '现烤鸡翅', subtitle: '一份 · 4个', priceCents: 1800, stock: 30, sales: 156, cover: '🍗', desc: '炭火现烤，外脆里嫩。' },
	{ goodsId: 402, catId: 5, name: '泡面套餐', subtitle: '康师傅红烧牛肉', priceCents: 800, stock: 100, sales: 432, cover: '🍜', desc: '附热水、火腿肠、卤蛋。' },
	{ goodsId: 403, catId: 5, name: '关东煮拼盘', subtitle: '8 串', priceCents: 1500, stock: 40, sales: 211, cover: '🍢', desc: '萝卜、海带结、鱼丸、墨鱼丸。' }
]

// 热卖：按销量取前 6
function buildHot() {
	return MOCK_PRODUCTS.slice().sort((a, b) => b.sales - a.sales).slice(0, 6)
}

function normalizeGoods(g) {
	if (!g) return null
	// 后端字段映射：goods_id/goodsId 都允许；前端始终用 goodsId/catId
	return {
		goodsId: g.goodsId || g.goods_id,
		catId: g.catId || g.cat_id,
		name: g.name,
		subtitle: g.subtitle,
		cover: g.cover,
		desc: g.description || g.desc,
		priceCents: g.priceCents == null ? g.price_cents : g.priceCents,
		stock: g.stock,
		sales: g.sales,
		status: g.status
	}
}

export function fetchCategories() {
	if (MALL_API_ENABLED) return http.get('/app/mall/category/list').then((rows) => {
		const list = rows || []
		// 顶部追加"热卖"虚拟分类
		return [{ catId: 0, name: '热卖', icon: '🔥' }, ...list]
	})
	return Promise.resolve([{ catId: 1, name: '热卖', icon: '🔥' }, ...MOCK_CATEGORIES.slice(1)])
}

export function fetchGoodsByCategory(catId) {
	if (MALL_API_ENABLED) {
		// catId 为 0 → 不传，后端按销量排序返回全部上架
		const params = catId && catId !== 0 ? { catId } : null
		return http.get('/app/mall/goods/list' + (params ? '' : ''), params).then((rows) => (rows || []).map(normalizeGoods))
	}
	if (catId === 1 || catId === 0) return Promise.resolve(buildHot())
	return Promise.resolve(MOCK_PRODUCTS.filter((p) => p.catId === catId))
}

export function fetchGoodsDetail(goodsId) {
	if (MALL_API_ENABLED) return http.get('/app/mall/goods/' + goodsId).then(normalizeGoods)
	const p = MOCK_PRODUCTS.find((g) => g.goodsId === Number(goodsId))
	return Promise.resolve(p || null)
}

// ---------------- 购物车（本地） ----------------

export function readCart() {
	try {
		const raw = uni.getStorageSync(CART_KEY)
		if (!raw) return []
		if (Array.isArray(raw)) return raw
		return JSON.parse(raw) || []
	} catch (e) { return [] }
}

function writeCart(items) { uni.setStorageSync(CART_KEY, items) }

export function addToCart(goods, qty = 1) {
	const items = readCart()
	const existed = items.find((i) => i.goodsId === goods.goodsId)
	if (existed) existed.qty += qty
	else items.push({ goodsId: goods.goodsId, name: goods.name, subtitle: goods.subtitle, priceCents: goods.priceCents, cover: goods.cover, qty })
	writeCart(items)
	return items
}

export function updateCartQty(goodsId, qty) {
	const items = readCart()
	const target = items.find((i) => i.goodsId === goodsId)
	if (!target) return items
	target.qty = Math.max(0, qty)
	const left = items.filter((i) => i.qty > 0)
	writeCart(left)
	return left
}

export function removeFromCart(goodsId) {
	const items = readCart().filter((i) => i.goodsId !== goodsId)
	writeCart(items)
	return items
}

export function clearCart() { writeCart([]) }

export function cartCount() {
	return readCart().reduce((acc, i) => acc + (i.qty || 0), 0)
}

export function cartTotalCents(items) {
	const list = items || readCart()
	return list.reduce((acc, i) => acc + (i.priceCents || 0) * (i.qty || 0), 0)
}

// ---------------- 商城订单（mock 缓存到本地） ----------------

const MALL_ORDER_KEY = 'fishpond_mall_orders'

function readMallOrders() {
	try {
		const raw = uni.getStorageSync(MALL_ORDER_KEY)
		if (!raw) return []
		if (Array.isArray(raw)) return raw
		return JSON.parse(raw) || []
	} catch (e) { return [] }
}

function writeMallOrders(orders) { uni.setStorageSync(MALL_ORDER_KEY, orders) }

function normalizeMallOrder(o) {
	if (!o) return null
	return {
		mallOrderId: o.mallOrderId || o.mall_order_id,
		mallOrderNo: o.mallOrderNo || o.mall_order_no,
		userId: o.userId,
		totalCents: o.totalCents == null ? o.total_cents : o.totalCents,
		amountPaid: o.amountPaid,
		balanceCents: o.balanceCents == null ? o.balance_cents : o.balanceCents,
		status: o.status,
		remark: o.remark2 || o.remark || '',
		redeemCode: o.redeemCode || o.redeem_code,
		paidTime: o.paidTime,
		createTime: o.createTime,
		items: (o.items || []).map((i) => ({
			goodsId: i.goodsId || i.goods_id,
			name: i.name,
			subtitle: i.subtitle,
			cover: i.cover,
			priceCents: i.priceCents == null ? i.price_cents : i.priceCents,
			qty: i.qty
		}))
	}
}

export function submitMallOrder({ items, remark, useBalance }) {
	if (MALL_API_ENABLED) {
		return http.post('/app/mall/order/submit', {
			items: items.map((i) => ({ goodsId: i.goodsId, qty: i.qty })),
			remark,
			useBalance: !!useBalance
		}).then((data) => {
			if (!data) return null
			const order = normalizeMallOrder(data.order)
			if (data.needWxPay && data.pay && !data.pay.mock) {
				return new Promise((resolve, reject) => {
					uni.requestPayment({
						provider: 'wxpay',
						timeStamp: String(data.pay.timeStamp || ''),
						nonceStr: data.pay.nonceStr || '',
						package: data.pay.package || ('prepay_id=' + (data.pay.prepayId || '')),
						signType: data.pay.signType || 'RSA',
						paySign: data.pay.paySign || '',
						success: () => waitMallOrderPaid(order && order.mallOrderId).then(resolve).catch(() => resolve(order)),
						fail: (err) => reject(normalizePaymentError(err))
					})
				})
			}
			return order
		})
	}
	// mock 本地：伪造一单，直接置为可领取
	const totalCents = cartTotalCents(items)
	const now = Date.now()
	const order = {
		mallOrderId: now,
		mallOrderNo: 'M' + now,
		items: items.map((i) => ({ ...i })),
		totalCents,
		status: MALL_ORDER_STATUS.PAID,
		remark: remark || '',
		redeemCode: String(now).slice(-8),
		createTime: new Date(now).toISOString(),
		paidTime: new Date(now).toISOString()
	}
	const all = readMallOrders()
	all.unshift(order)
	writeMallOrders(all)
	return Promise.resolve(order)
}

export function fetchMyMallOrders() {
	if (MALL_API_ENABLED) return http.get('/app/mall/order/my').then((rows) => (rows || []).map(normalizeMallOrder))
	return Promise.resolve(readMallOrders())
}

/** 待支付商城订单（用于钓场结算合并支付） */
export function fetchUnpaidMallOrders() {
	return fetchMyMallOrders().then((list) => list.filter((o) => o.status === MALL_ORDER_STATUS.UNPAID))
}

export function fetchMallOrderDetail(mallOrderId) {
	if (MALL_API_ENABLED) return http.get('/app/mall/order/' + mallOrderId).then(normalizeMallOrder)
	const found = readMallOrders().find((o) => String(o.mallOrderId) === String(mallOrderId))
	return Promise.resolve(found || null)
}

function waitMallOrderPaid(mallOrderId, left = 6) {
	if (!mallOrderId) return Promise.resolve(null)
	return fetchMallOrderDetail(mallOrderId).then((order) => {
		if (!order || order.status !== MALL_ORDER_STATUS.UNPAID || left <= 0) return order
		return new Promise((resolve) => setTimeout(resolve, 800))
			.then(() => waitMallOrderPaid(mallOrderId, left - 1))
	})
}

export function applyMallRefund({ mallOrderId, applyAmountCents, reason }) {
	return http.post('/app/mall/refund/apply', { mallOrderId, applyAmountCents, reason })
}
