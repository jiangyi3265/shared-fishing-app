import { getUser } from './fishingStore.js'

const DEFAULT_SHARE = {
	title: '共享钓场',
	path: '/pages/index/index',
	imageUrl: '/static/logo.png'
}

function normalizePath(path) {
	if (!path) return DEFAULT_SHARE.path
	return path.charAt(0) === '/' ? path : '/' + path
}

function encodeQuery(params = {}) {
	return Object.keys(params)
		.filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
		.join('&')
}

function getCurrentPath() {
	try {
		const pages = getCurrentPages()
		const current = pages[pages.length - 1]
		if (!current || !current.route) return DEFAULT_SHARE.path
		const options = current.options || {}
		const query = encodeQuery(options)
		return `/${current.route}${query ? '?' + query : ''}`
	} catch (e) {
		return DEFAULT_SHARE.path
	}
}

function withShareQuery(path, extra = {}) {
	const user = getUser()
	const query = Object.assign({}, extra)
	if (user && user.userId) query.fromUserId = user.userId
	const [base, rawQuery = ''] = normalizePath(path).split('?')
	const current = {}
	rawQuery.split('&').forEach((item) => {
		if (!item) return
		const [key, value = ''] = item.split('=')
		if (key) current[decodeURIComponent(key)] = decodeURIComponent(value)
	})
	const nextQuery = encodeQuery(Object.assign({}, current, query))
	return `${base}${nextQuery ? '?' + nextQuery : ''}`
}

function getPageShareConfig(vm, source) {
	if (vm && typeof vm.getShareConfig === 'function') return vm.getShareConfig(source) || {}
	if (vm && typeof vm.$getShareConfig === 'function') return vm.$getShareConfig(source) || {}
	return {}
}

export function buildShareOptions(config = {}) {
	const path = config.path || (config.useCurrentPath ? getCurrentPath() : DEFAULT_SHARE.path)
	return {
		title: config.title || DEFAULT_SHARE.title,
		path: withShareQuery(path, config.query),
		imageUrl: config.imageUrl || DEFAULT_SHARE.imageUrl
	}
}

export function enableShareMenu() {
	// #ifdef MP-WEIXIN
	if (uni.showShareMenu) {
		uni.showShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline']
		})
	}
	// #endif
}

export function shareToFriend(config = {}) {
	const share = buildShareOptions(config)
	// #ifdef MP-WEIXIN
	enableShareMenu()
	uni.showToast({ title: '请点击右上角转发给好友', icon: 'none' })
	// #endif
	// #ifndef MP-WEIXIN
	uni.setClipboardData({
		data: share.path,
		success: () => uni.showToast({ title: '分享路径已复制', icon: 'success' })
	})
	// #endif
	return share
}

const shareMixin = {
	onShow() {
		enableShareMenu()
	},
	onShareAppMessage(source) {
		return buildShareOptions(getPageShareConfig(this, source))
	},
	onShareTimeline(source) {
		const share = buildShareOptions(getPageShareConfig(this, source))
		const [, query = ''] = share.path.split('?')
		return {
			title: share.title,
			query,
			imageUrl: share.imageUrl
		}
	},
	methods: {
		$shareToFriend(config) {
			return shareToFriend(config || getPageShareConfig(this, { from: 'button' }))
		}
	}
}

export default shareMixin
