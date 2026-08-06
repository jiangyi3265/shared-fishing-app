export function safeDecode(value) {
	const text = value === undefined || value === null ? '' : String(value)
	try {
		return decodeURIComponent(text)
	} catch (error) {
		return text
	}
}

/**
 * 兼容小程序 scene、扫码 path、普通 query string 和畸形百分号编码。
 * 参数值按第一个等号切分，避免 scene 自身包含等号时被截断。
 */
export function parseScanParams(raw) {
	if (raw === undefined || raw === null || raw === '') return null
	const text = String(raw).trim()
	if (!text) return null
	const queryIndex = text.indexOf('?')
	const query = queryIndex >= 0 ? text.slice(queryIndex + 1) : text
	if (!query.includes('=')) return { scene: safeDecode(query) }

	const result = {}
	query.split('&').forEach((pair) => {
		if (!pair) return
		const equalsIndex = pair.indexOf('=')
		const rawKey = equalsIndex >= 0 ? pair.slice(0, equalsIndex) : pair
		const rawValue = equalsIndex >= 0 ? pair.slice(equalsIndex + 1) : ''
		const key = safeDecode(rawKey)
		if (key) result[key] = safeDecode(rawValue)
	})

	if (result.qrId !== undefined) {
		const qrId = Number(result.qrId)
		if (Number.isSafeInteger(qrId) && qrId > 0) result.qrId = qrId
		else delete result.qrId
	}
	if (result.venueId !== undefined) {
		const venueId = Number(result.venueId)
		if (Number.isSafeInteger(venueId) && venueId > 0) result.venueId = venueId
		else delete result.venueId
	}
	return result
}

export function extractScanProof(params) {
	if (!params) return null
	const qrId = Number(params.qrId)
	if (Number.isSafeInteger(qrId) && qrId > 0) return { qrId }
	if (params.scene) {
		const nested = parseScanParams(params.scene)
		if (nested && nested.qrId) return { qrId: nested.qrId }
		return { scene: String(params.scene) }
	}
	const venueId = Number(params.venueId)
	if (params.action && Number.isSafeInteger(venueId) && venueId > 0) {
		return { scene: 'action=' + params.action + '&venueId=' + venueId }
	}
	return null
}
