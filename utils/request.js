import { API_BASE_URL_STORAGE_KEY, API_BASE_URLS } from './config.js'

const LOGIN_KEY = 'fishpond_login'
let authRedirecting = false

function resolveBaseUrl() {
	const envVersion = getMiniProgramEnv()
	// 真机开发版、体验版和正式版都固定使用当前环境配置，防止历史调试缓存
	// 把查询与视频上传悄悄发往旧地址。切换接口必须修改 config.js 后重编译。
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
		if (options.showError !== false) uni.showToast({ title: err.msg, icon: 'none' })
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
					if (options.showError !== false) uni.showToast({ title: err.msg, icon: 'none' })
					reject(err)
					return
				}
				if (body && typeof body === 'object' && 'code' in body) {
					if (body.code === 200) {
						resolve(body.data !== undefined ? body.data : body.rows)
					} else {
						if (options.showError !== false) uni.showToast({ title: body.msg || '请求失败', icon: 'none' })
						reject(body)
					}
				} else {
					resolve(body)
				}
			},
			fail: (err) => {
				const normalized = Object.assign({}, err, { msg: '网络异常，请检查接口地址或后端服务' })
				if (options.showError !== false) uni.showToast({ title: normalized.msg, icon: 'none' })
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

export function getMiniProgramRuntimeInfo() {
	const envVersion = getMiniProgramEnv()
	let platformVersion = ''
	try {
		const info = uni.getAccountInfoSync && uni.getAccountInfoSync()
		platformVersion = info?.miniProgram?.version || ''
	} catch (e) {}
	return {
		envVersion,
		platformVersion,
		apiBaseUrl: resolveBaseUrl()
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

function normalizeUploadFailure(err) {
	const detail = String((err && (err.errMsg || err.message || err.msg)) || '').trim()
	let msg = detail || '视频上传失败，请检查网络后重试'
	if (/url not in domain list|domain list|合法域名|not in domain/i.test(detail)) {
		msg = '视频未发到服务器：微信上传域名未生效，请联系管理员检查 uploadFile 合法域名'
	} else if (/timeout|timed out|超时/i.test(detail)) {
		msg = '视频上传超时，请切换稳定网络或选择更短的视频后重试'
	} else if (/file.*not.*exist|no such file|文件不存在/i.test(detail)) {
		msg = '已选视频的临时文件已失效，请重新选择视频'
	} else if (/exceed|too large|maximum|超过.*大小/i.test(detail)) {
		msg = '视频文件过大，请压缩到 48MB 以内后重试'
	} else if (/network|connection|socket|fail/i.test(detail)) {
		msg = '视频没有上传成功，请检查网络后重试'
	}
	return { msg, detail, stage: 'uploadFile.fail' }
}

function uploadTo(filePath, path, formData = {}, onProgress, uploadContext = {}) {
	return new Promise((resolve, reject) => {
		const baseUrl = resolveBaseUrl()
		const token = getToken()
		if (!filePath) {
			reject({ msg: '请先选择要上传的视频', stage: 'before-upload' })
			return
		}
		if (!isValidBaseUrl(baseUrl)) {
			reject({ msg: '小程序正式上传域名未配置', stage: 'before-upload' })
			return
		}
		const trackingHeaders = {
			'X-Upload-Attempt-Id': String(uploadContext.attemptId || ''),
			'X-MiniProgram-Version': String(uploadContext.clientVersion || ''),
			'X-MiniProgram-Env': String(uploadContext.envVersion || '')
		}
		const uploadTask = uni.uploadFile({
			url: baseUrl + path,
			filePath,
			name: 'file',
			formData,
			header: {
				...(token ? { Authorization: 'Bearer ' + token } : {}),
				...trackingHeaders
			},
			timeout: 120000,
			success: (res) => {
				const statusCode = Number(res.statusCode || 0)
				try {
					const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
					if (statusCode === 401 || Number(data.code) === 401) {
						handleUnauthorized(token)
						reject({ code: 401, statusCode: 401, msg: data.msg || '登录状态已过期', stage: 'server-response' })
						return
					}
					if (statusCode >= 200 && statusCode < 300 && Number(data.code) === 200) {
						resolve(data.data || data)
					} else {
						reject({ statusCode, code: data.code, msg: data.msg || '上传失败', stage: 'server-response' })
					}
				} catch (e) {
					const tooLarge = statusCode === 413
					reject({
						statusCode,
						msg: tooLarge ? '视频超过 48MB，请压缩后重试' : `服务器返回异常（${statusCode || '无状态码'}），视频未提交`,
						detail: String(res.data || '').slice(0, 240),
						stage: 'server-response'
					})
				}
			},
			fail: (err) => reject(normalizeUploadFailure(err))
		})
		if (uploadTask && typeof uploadTask.onProgressUpdate === 'function' && typeof onProgress === 'function') {
			uploadTask.onProgressUpdate((event) => {
				const progress = Math.max(0, Math.min(100, Number(event && event.progress) || 0))
				onProgress(progress)
			})
		}
	})
}

export function uploadFile(filePath) {
	return uploadTo(filePath, '/app/media/upload').then(data => resolveAssetUrl(data.fileName))
}

/** 上传鱼鉴视频并在同一个请求中创建审核记录，防止只上传文件却未生成审核单。 */
export function submitFishCardVideo(filePath, speciesId, onProgress, uploadContext = {}) {
	return uploadTo(filePath, '/app/fish-card/submit-video', {
		speciesId: String(speciesId),
		attemptId: String(uploadContext.attemptId || ''),
		clientVersion: String(uploadContext.clientVersion || ''),
		envVersion: String(uploadContext.envVersion || '')
	}, onProgress, uploadContext)
}

/** uploadFile 在真机本地失败时，改用普通 request 把原因回报到服务器日志。 */
export function reportFishCardUploadDiagnostic(payload) {
	return http.post('/app/fish-card/upload-diagnostic', payload, { showError: false })
}

export function uploadProfileAvatar(filePath) {
	return uploadTo(filePath, '/app/profile/avatar')
}
