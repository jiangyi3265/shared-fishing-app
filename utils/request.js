import { API_BASE_URL_STORAGE_KEY, API_BASE_URLS } from './config.js'

const LOGIN_KEY = 'fishpond_login'
let authRedirecting = false

function resolveBaseUrl() {
	try {
		const cfg = uni.getStorageSync(API_BASE_URL_STORAGE_KEY)
		if (cfg) return cfg
	} catch (e) {}
	const envVersion = getMiniProgramEnv()
	return API_BASE_URLS[envVersion] || API_BASE_URLS.develop
}

export function setBaseUrl(url) {
	uni.setStorageSync(API_BASE_URL_STORAGE_KEY, url)
}

/** 将后台上传接口返回的相对资源路径补全为小程序可加载的 HTTPS 地址。 */
export function resolveAssetUrl(path) {
	if (path === undefined || path === null) return ''
	const value = String(path).trim()
	if (!value) return ''
	if (/^(https?:|data:|wxfile:|blob:)/i.test(value) || value.startsWith('/static/')) return value
	if (value.startsWith('//')) return 'https:' + value
	const baseUrl = String(resolveBaseUrl() || '').replace(/\/$/, '')
	if (!baseUrl) return value
	return baseUrl + '/' + value.replace(/^\/+/, '')
}

export function request(options) {
	const baseUrl = resolveBaseUrl()
	if (!options.url.startsWith('http') && !isValidBaseUrl(baseUrl)) {
		const err = { msg: '小程序正式接口域名未配置' }
		uni.showToast({ title: err.msg, icon: 'none' })
		return Promise.reject(err)
	}
	const url = options.url.startsWith('http') ? options.url : baseUrl + options.url
	const token = getToken()
	const header = { 'Content-Type': 'application/json', ...(options.header || {}) }
	if (token && !header.Authorization) header.Authorization = 'Bearer ' + token
	return new Promise((resolve, reject) => {
		uni.request({
			url,
			method: options.method || 'GET',
			data: options.data || {},
			header,
			timeout: 15000,
			success: (res) => {
				const body = res.data
				if (res.statusCode === 401 || (body && typeof body === 'object' && Number(body.code) === 401)) {
					handleUnauthorized(token, options)
					const detail = body && typeof body === 'object' ? body : {}
					reject(Object.assign({}, detail, { code: 401, statusCode: 401, msg: detail.msg || '登录状态已过期' }))
					return
				}
				if (res.statusCode < 200 || res.statusCode >= 300) {
					const err = { msg: (body && body.msg) || `接口异常(${res.statusCode})`, statusCode: res.statusCode, data: body }
					uni.showToast({ title: err.msg, icon: 'none' })
					reject(err)
					return
				}
				if (body && typeof body === 'object' && 'code' in body) {
					if (body.code === 200) {
						resolve(body.data !== undefined ? body.data : body.rows)
					} else {
						uni.showToast({ title: body.msg || '请求失败', icon: 'none' })
						reject(body)
					}
				} else {
					resolve(body)
				}
			},
			fail: (err) => {
				const normalized = Object.assign({}, err, { msg: '网络异常，请检查接口地址或后端服务' })
				uni.showToast({ title: normalized.msg, icon: 'none' })
				reject(normalized)
			}
		})
	})
}

export const http = {
	get: (url, params, options = {}) => request({ ...options, url: url + (params ? buildQuery(params) : ''), method: 'GET' }),
	post: (url, data, options = {}) => request({ ...options, url, method: 'POST', data }),
	put: (url, data, options = {}) => request({ ...options, url, method: 'PUT', data }),
	del: (url, options = {}) => request({ ...options, url, method: 'DELETE' })
}

function buildQuery(params) {
	const parts = []
	Object.keys(params).forEach((k) => {
		if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
			parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
		}
	})
	return parts.length ? '?' + parts.join('&') : ''
}

function getToken() {
	try {
		const login = uni.getStorageSync(LOGIN_KEY)
		if (!login) return ''
		if (typeof login === 'object') return login.token || ''
		const parsed = JSON.parse(login)
		return parsed.token || ''
	} catch (e) {
		return ''
	}
}

function currentPageUrl() {
	try {
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
		const page = pages && pages.length ? pages[pages.length - 1] : null
		if (!page || !page.route) return '/pages/index/index'
		const route = '/' + String(page.route).replace(/^\/+/, '')
		const options = page.options || (page.$page && page.$page.options) || {}
		const query = buildQuery(options)
		return route + query
	} catch (e) {
		return '/pages/index/index'
	}
}

function handleUnauthorized(failedToken, options = {}) {
	const activeToken = getToken()
	// 旧请求的 401 不得清除刚刚登录后写入的新 token，也不能把用户重新踢回登录页。
	const belongsToActiveSession = failedToken ? activeToken === failedToken : !activeToken
	if (!belongsToActiveSession) return
	if (failedToken && activeToken === failedToken) {
		uni.removeStorageSync('fishpond_login')
		uni.removeStorageSync('fishpond_user')
	}
	if (options.redirectOnUnauthorized === false || authRedirecting) return
	const redirect = currentPageUrl()
	if (redirect.startsWith('/pages/login/login')) return
	authRedirecting = true
	uni.redirectTo({
		url: '/pages/login/login?redirect=' + encodeURIComponent(redirect),
		complete: () => setTimeout(() => { authRedirecting = false }, 600)
	})
}

function getMiniProgramEnv() {
	try {
		const info = uni.getAccountInfoSync && uni.getAccountInfoSync()
		return info?.miniProgram?.envVersion || 'develop'
	} catch (e) {
		return 'develop'
	}
}

function isValidBaseUrl(baseUrl) {
	if (!baseUrl) return false
	if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
		return getMiniProgramEnv() === 'develop'
	}
	if (getMiniProgramEnv() === 'release') return baseUrl.startsWith('https://')
	return /^https?:\/\//.test(baseUrl)
}

function uploadTo(filePath, path) {
	return new Promise((resolve, reject) => {
		const baseUrl = resolveBaseUrl()
		const token = getToken()
		uni.uploadFile({
			url: baseUrl + path,
			filePath,
			name: 'file',
			header: token ? { Authorization: 'Bearer ' + token } : {},
			success: (res) => {
				try {
					const data = JSON.parse(res.data)
					if (res.statusCode === 401 || Number(data.code) === 401) {
						handleUnauthorized(token)
						reject({ code: 401, statusCode: 401, msg: data.msg || '登录状态已过期' })
						return
					}
					if (data.code === 200) {
						resolve(data.data || data)
					} else {
						reject({ msg: data.msg || '上传失败' })
					}
				} catch (e) {
					reject({ msg: '上传响应解析失败' })
				}
			},
			fail: (err) => reject({ msg: '上传失败' })
		})
	})
}

export function uploadFile(filePath) {
	return uploadTo(filePath, '/app/media/upload').then(data => resolveAssetUrl(data.fileName))
}

export function uploadProfileAvatar(filePath) {
	return uploadTo(filePath, '/app/profile/avatar')
}
