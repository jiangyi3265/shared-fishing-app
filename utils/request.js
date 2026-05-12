import { API_BASE_URL_STORAGE_KEY, API_BASE_URLS } from './config.js'

const LOGIN_KEY = 'fishpond_login'

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
				if (res.statusCode < 200 || res.statusCode >= 300) {
					const err = { msg: (body && body.msg) || `接口异常(${res.statusCode})`, statusCode: res.statusCode, data: body }
					uni.showToast({ title: err.msg, icon: 'none' })
					reject(err)
					return
				}
				if (body && typeof body === 'object' && 'code' in body) {
					if (body.code === 200) {
						resolve(body.data !== undefined ? body.data : body.rows)
					} else if (body.code === 401) {
						uni.removeStorageSync('fishpond_login')
						uni.removeStorageSync('fishpond_user')
						uni.navigateTo({ url: '/pages/login/login' })
						reject(body)
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
	get: (url, params) => request({ url: url + (params ? buildQuery(params) : ''), method: 'GET' }),
	post: (url, data) => request({ url, method: 'POST', data }),
	put: (url, data) => request({ url, method: 'PUT', data }),
	del: (url) => request({ url, method: 'DELETE' })
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

export function uploadFile(filePath) {
	return new Promise((resolve, reject) => {
		const baseUrl = resolveBaseUrl()
		const token = getToken()
		uni.uploadFile({
			url: baseUrl + '/common/upload',
			filePath,
			name: 'file',
			header: token ? { Authorization: 'Bearer ' + token } : {},
			success: (res) => {
				try {
					const data = JSON.parse(res.data)
					if (data.code === 200) {
						resolve(data.fileName)
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
