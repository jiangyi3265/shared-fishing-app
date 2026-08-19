<template>
	<view class="app settings has-account-tabbar has-brand-header">
		<brand-header title="设置" theme="light" layout="compact" :back="true" />
		<view class="section-title">账号</view>
		<view class="card">
			<view class="cell">
				<text class="cell-label">用户ID</text>
				<text class="cell-value">{{ user ? user.userId : '--' }}</text>
			</view>
			<form class="cell" @submit="onNicknameSubmit">
				<text class="cell-label">昵称</text>
				<input class="nickname-editor" type="nickname" name="nickname" v-model="nicknameDraft" maxlength="20" placeholder="点击选择微信昵称" />
				<button class="nickname-save" form-type="submit" :disabled="savingNickname">{{ savingNickname ? '保存中' : '保存' }}</button>
			</form>
		</view>
		<view class="section-title">通用设置</view>
		<view class="card"><view class="cell"><text class="cell-label">消息通知</text><text class="cell-arrow">›</text></view><view class="cell"><text class="cell-label">隐私设置</text><text class="cell-arrow">›</text></view><view class="cell"><text class="cell-label">支付设置</text><text class="cell-arrow">›</text></view></view>
		<view class="card misc-card"><view class="cell" @click="clearCache"><text class="cell-label">清除缓存</text><text class="cell-value">{{ cacheSize }}</text><text class="cell-arrow">›</text></view><view class="cell"><text class="cell-label">当前版本</text><text class="cell-value">v1.0.0</text><text class="cell-arrow">›</text></view></view>

		<view class="logout-btn" @click="doLogout">退出登录</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	import { getUser, logout, isLoggedIn, updateNickname } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				user: null,
				nicknameDraft: '',
				savingNickname: false,
				cacheSize: '计算中...'
			}
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/settings/settings') })
				return
			}
			this.user = getUser()
			this.nicknameDraft = (this.user && (this.user.nickname || this.user.name)) || ''
			this.calcCache()
		},
		methods: {
			// 昵称填写能力：手输的值要 blur 才提交，交给 form submit 取最终值
			onNicknameSubmit(e) {
				const value = e && e.detail && e.detail.value ? e.detail.value.nickname : ''
				if (value) this.nicknameDraft = String(value)
				this.saveNickname()
			},
			saveNickname() {
				if (this.savingNickname) return
				const nickname = String(this.nicknameDraft || '').trim()
				if (!nickname) {
					uni.showToast({ title: '请填写昵称', icon: 'none' })
					return
				}
				this.savingNickname = true
				updateNickname(nickname).then((user) => {
					this.user = user
					this.nicknameDraft = user.nickname || nickname
					uni.showToast({ title: '昵称已更新', icon: 'success' })
				}).catch(() => {}).finally(() => { this.savingNickname = false })
			},
			calcCache() {
				try {
					const info = uni.getStorageInfoSync()
					const kb = info.currentSize || 0
					this.cacheSize = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB'
				} catch (e) {
					this.cacheSize = '未知'
				}
			},
			clearCache() {
				uni.showModal({
					title: '清除缓存',
					content: '将清除本地缓存数据（不影响账号信息），确认？',
					success: (res) => {
						if (!res.confirm) return
						try {
							const user = getUser()
							const loginData = uni.getStorageSync('fishpond_login')
							uni.clearStorageSync()
							if (user) uni.setStorageSync('fishpond_user', user)
							if (loginData) uni.setStorageSync('fishpond_login', loginData)
							this.calcCache()
							uni.showToast({ title: '已清除', icon: 'success' })
						} catch (e) {
							uni.showToast({ title: '清除失败', icon: 'none' })
						}
					}
				})
			},
			doLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确认退出当前账号？',
					success: (res) => {
						if (!res.confirm) return
						logout()
						uni.redirectTo({ url: '/pages/login/login' })
					}
				})
			}
		}
	}
</script>

<style>
	.settings {
		padding-bottom: 60rpx;
	}

	.section-title {
		padding: 34rpx 28rpx 14rpx;
		font-size: 25rpx;
		color: var(--text-light);
		font-weight: 500;
	}

	.card {
		margin: 0 28rpx;
		background: var(--surface);
		border-radius: var(--r);
		overflow: hidden;
	}

	.cell {
		display: flex;
		align-items: center;
		padding: 30rpx 28rpx;
		border-bottom: 1rpx solid var(--border-color);
	}

	.cell:last-child {
		border-bottom: none;
	}

	.cell:active {
		background: var(--surface-soft);
	}

	.cell-label {
		flex: 1;
		font-size: 28rpx;
		color: var(--text-main);
		font-weight: 600;
	}

	.cell-value {
		font-size: 26rpx;
		color: var(--text-muted);
		margin-right: 8rpx;
	}

	.cell-arrow {
		font-size: 30rpx;
		color: var(--text-light);
	}

	.logout-btn {
		margin: 48rpx 28rpx 0;
		height: 96rpx;
		line-height: 96rpx;
		text-align: center;
		background: var(--surface);
		border: 1rpx solid var(--border-color);
		border-radius: var(--r);
		font-size: 30rpx;
		font-weight: 500;
		color: var(--danger);
	}

	.logout-btn:active {
		background: var(--danger-bg);
	}
</style>

<style>
.settings{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.settings .section-title{margin:0 0 8rpx;padding:0 2rpx;font-size:22rpx}.settings .card{margin:0 0 14rpx;padding:0 20rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.settings .cell{height:72rpx;padding:0;border-bottom:1rpx solid #dfe9e8}.settings .cell-label{font-size:22rpx}.settings .cell-value{font-size:20rpx}.settings .cell-arrow{font-size:30rpx}.settings .misc-card{margin-top:18rpx}.settings .logout-btn{height:76rpx;margin-top:16rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid #d7e5e4;border-radius:12rpx;background:#fff;color:#ed4343;font-size:23rpx}
.nickname-editor{width:300rpx;height:54rpx;padding:0 14rpx;border-radius:10rpx;background:#f1f8f7;color:#123e41;font-size:20rpx;text-align:right;box-sizing:border-box}.nickname-save{width:86rpx;height:54rpx;margin:0 0 0 10rpx;padding:0;display:flex;align-items:center;justify-content:center;border:0;border-radius:10rpx;background:#08aaa6;color:#fff;font-size:18rpx;font-weight:800;line-height:1}.nickname-save:after{border:0}.nickname-save[disabled]{opacity:.58}
</style>
