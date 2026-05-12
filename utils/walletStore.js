import { http } from './request.js'

export const BALANCE_LOG_TYPE = {
	RECHARGE: 'recharge',
	GIFT: 'gift',
	CONSUME_FISHING: 'consume_fishing',
	CONSUME_MALL: 'consume_mall',
	REFUND: 'refund',
	ADMIN_ADJUST: 'admin_adjust'
}

export const BALANCE_TYPE_LABEL = {
	recharge: '充值',
	gift: '赠送',
	consume_fishing: '钓场消费',
	consume_mall: '商城消费',
	refund: '退款返还',
	admin_adjust: '后台调整'
}

export function fetchWallet() {
	return http.get('/app/wallet/info')
}

export function fetchRechargePlans() {
	return http.get('/app/wallet/plans').then((rows) => rows || [])
}

export function submitRecharge({ planId, amountCents }) {
	return http.post('/app/wallet/recharge', { planId, amountCents }).then((data) => {
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
					success: () => resolve(data.order),
					fail: (err) => reject(err)
				})
			})
		}
		return data.order
	})
}

export function fetchMyRecharges() {
	return http.get('/app/wallet/recharges').then((rows) => rows || [])
}
