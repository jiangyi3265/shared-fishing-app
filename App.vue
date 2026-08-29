<script>
	export default {
		onLaunch: function() {
			// #ifdef MP-WEIXIN
			if (typeof wx !== 'undefined' && typeof wx.getUpdateManager === 'function') {
				const updateManager = wx.getUpdateManager()
				updateManager.onUpdateReady(() => {
					wx.showModal({
						title: '发现新版本',
						content: '新版本已准备好，请立即重启以使用最新功能。',
						showCancel: false,
						success: () => updateManager.applyUpdate()
					})
				})
				updateManager.onUpdateFailed(() => {
					wx.showModal({
						title: '更新未完成',
						content: '请关闭小程序后重新打开，或从微信最近使用中删除后重新进入。',
						showCancel: false
					})
				})
			}
			// #endif
		},
		onShow: function() {
		},
		onHide: function() {
		}
	}
</script>

<style>
	@import './static/common.css';
</style>
