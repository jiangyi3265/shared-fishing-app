function firstCoordinate(venue, keys) {
	for (const key of keys) {
		const value = venue && venue[key]
		if (value !== undefined && value !== null && String(value).trim() !== '') {
			return Number(String(value).trim())
		}
	}
	return NaN
}

/**
 * 微信 openLocation 需要 GCJ-02 数字坐标。这里兼容常见字段名，但不使用 0,0
 * 或越界值兜底，避免把用户带到错误地点。
 */
export function getVenueCoordinates(venue = {}) {
	const latitude = firstCoordinate(venue, ['latitude', 'lat', 'venueLatitude'])
	const longitude = firstCoordinate(venue, ['longitude', 'lng', 'lon', 'venueLongitude'])
	const latitudeValid = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
	const longitudeValid = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
	const isZeroPoint = Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001
	if (!latitudeValid || !longitudeValid || isZeroPoint) return null
	return { latitude, longitude }
}

function copyAddress(address) {
	if (!address) return
	uni.setClipboardData({
		data: address,
		success: () => uni.showToast({ title: '地址已复制', icon: 'success' })
	})
}

function showCoordinateError(address) {
	const hasAddress = Boolean(address)
	uni.showModal({
		title: '暂时无法导航',
		content: hasAddress
			? '钓场尚未配置有效经纬度，暂时不能打开微信地图。可复制地址后在地图中搜索。'
			: '钓场尚未配置有效经纬度和地址，请联系钓场管理员完善信息。',
		showCancel: hasAddress,
		confirmText: hasAddress ? '复制地址' : '我知道了',
		cancelText: '关闭',
		success: (res) => {
			if (hasAddress && res.confirm) copyAddress(address)
		}
	})
}

function openNativeLocation(options) {
	// 微信小程序优先使用原生接口，打开后可直接选择路线/导航。
	// #ifdef MP-WEIXIN
	if (typeof wx !== 'undefined' && typeof wx.openLocation === 'function') {
		wx.openLocation(options)
		return
	}
	// #endif
	uni.openLocation(options)
}

function openLocationSettings() {
	if (typeof uni.openSetting === 'function') {
		uni.openSetting({
			fail: () => uni.showToast({ title: '请在微信设置中开启定位权限', icon: 'none' })
		})
		return
	}
	uni.showToast({ title: '请在微信设置中开启定位权限', icon: 'none' })
}

export function openVenueLocation(venue = {}) {
	const coordinates = getVenueCoordinates(venue)
	const rawAddress = String(venue.address || '').trim()
	const address = rawAddress === '--' ? '' : rawAddress
	if (!coordinates) {
		showCoordinateError(address)
		return Promise.resolve(false)
	}

	return new Promise((resolve) => {
		const options = {
			latitude: coordinates.latitude,
			longitude: coordinates.longitude,
			name: String(venue.name || '共享钓场'),
			address,
			scale: 18,
			success: () => resolve(true),
			fail: (error = {}) => {
				const message = String(error.errMsg || '')
				if (!message.includes('cancel')) {
					uni.showModal({
						title: '导航打开失败',
						content: '无法调用微信地图，请检查微信定位权限和网络后重试。',
						showCancel: true,
						confirmText: '检查权限',
						cancelText: '关闭',
						success: (res) => { if (res.confirm) openLocationSettings() }
					})
				}
				resolve(false)
			}
		}
		try {
			openNativeLocation(options)
		} catch (error) {
			options.fail({ errMsg: (error && error.message) || 'openLocation:fail' })
		}
	})
}
