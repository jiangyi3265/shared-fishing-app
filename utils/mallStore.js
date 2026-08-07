import { http } from './request.js'
import { normalizePaymentError } from './fishingStore.js'

const CART_KEY = 'fishpond_cart'

export const MALL_ORDER_STATUS = {
	UNPAID: 0,
	PAID: 1,
	REDEEMED: 2,
	CANCELED: 3
}

// ---------------- 分类 + 商品 ----------------

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
	return http.get('/app/mall/category/list').then((rows) => {
		const list = rows || []
		// 顶部追加"热卖"虚拟分类
		return [{ catId: 0, name: '热卖', icon: '🔥' }, ...list]
	})
}

export function fetchGoodsByCategory(catId) {
	// catId 为 0 → 不传，后端按销量排序返回全部上架
	const params = catId && catId !== 0 ? { catId } : null
	return http.get('/app/mall/goods/list', params).then((rows) => (rows || []).map(normalizeGoods))
}

export function fetchGoodsDetail(goodsId) {
	return http.get('/app/mall/goods/' + goodsId).then(normalizeGoods)
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

/**
 * 结算前必须重新读取服务端商品快照。
 * 本地购物车只保存选择结果，价格、上下架状态和库存始终以后端为准。
 */
export function refreshCartItems() {
	const cached = readCart()
	if (!cached.length) return Promise.resolve([])
	return Promise.all(cached.map((item) => fetchGoodsDetail(item.goodsId).then((goods) => {
		if (!goods || String(goods.status) !== '0') {
			const error = new Error(`「${item.name || '商品'}」已下架，请移除后再结算`)
			error.msg = error.message
			throw error
		}
		const stock = Math.max(0, Number(goods.stock) || 0)
		if (stock < Number(item.qty || 0)) {
			const error = new Error(`「${goods.name}」库存仅剩 ${stock} 件，请调整数量`)
			error.msg = error.message
			throw error
		}
		return {
			goodsId: goods.goodsId,
			name: goods.name,
			subtitle: goods.subtitle || '',
			priceCents: Number(goods.priceCents) || 0,
			cover: goods.cover,
			stock,
			status: goods.status,
			qty: Math.max(1, Number(item.qty) || 1)
		}
	}))).then((items) => {
		writeCart(items)
		return items
	})
}

// ---------------- 商城订单（仅使用正式后端） ----------------

function normalizeMallOrder(o) {
	if (!o) return null
	return {
		mallOrderId: o.mallOrderId || o.mall_order_id,
		mallOrderNo: o.mallOrderNo || o.mall_order_no,
		userId: o.userId,
		totalCents: o.totalCents == null ? o.total_cents : o.totalCents,
		amountPaid: o.amountPaid,
		balanceCents: o.balanceCents == null ? o.balance_cents : o.balanceCents,
		pointsUsed: o.pointsUsed == null ? o.points_used : o.pointsUsed,
		pointsDeductCents: o.pointsDeductCents == null ? o.points_deduct_cents : o.pointsDeductCents,
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

function requestMallPayment(data) {
	if (!data) return Promise.resolve(null)
	const order = normalizeMallOrder(data.order)
	if (!data.needWxPay || !data.pay || data.pay.mock) return Promise.resolve(order)
	return new Promise((resolve, reject) => {
		uni.requestPayment({
			provider: 'wxpay',
			timeStamp: String(data.pay.timeStamp || ''),
			nonceStr: data.pay.nonceStr || '',
			package: data.pay.package || ('prepay_id=' + (data.pay.prepayId || '')),
			signType: data.pay.signType || 'RSA',
			paySign: data.pay.paySign || '',
			success: () => waitMallOrderPaid(order && order.mallOrderId).then(resolve).catch(() => resolve(order)),
			fail: (err) => {
				const error = normalizePaymentError(err)
				error.order = order
				reject(error)
			}
		})
	})
}

export function submitMallOrder({ items, remark, useBalance, pointsToUse }) {
	return http.post('/app/mall/order/submit', {
		items: items.map((i) => ({ goodsId: i.goodsId, qty: i.qty })),
		remark,
		useBalance: !!useBalance,
		pointsToUse: pointsToUse || 0
	}).then(requestMallPayment)
}

/** 复用原订单继续支付，避免重复下单和重复扣库存。 */
export function payMallOrder(mallOrderId) {
	return http.post('/app/mall/order/' + mallOrderId + '/pay', {}).then(requestMallPayment)
}

export function fetchMyMallOrders() {
	return http.get('/app/mall/order/my').then((rows) => (rows || []).map(normalizeMallOrder))
}

/** 待支付商城订单（用于钓场结算合并支付） */
export function fetchUnpaidMallOrders() {
	return fetchMyMallOrders().then((list) => list.filter((o) => o.status === MALL_ORDER_STATUS.UNPAID))
}

export function fetchMallOrderDetail(mallOrderId) {
	return http.get('/app/mall/order/' + mallOrderId).then(normalizeMallOrder)
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
