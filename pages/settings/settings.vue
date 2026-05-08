<template>
	<view class="app settings">
		<view class="section-title">通用设置</view>

		<view class="card">
			<view class="cell" @click="clearCache">
				<text class="cell-label">清除缓存</text>
				<text class="cell-value">{{ cacheSize }}</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell">
				<text class="cell-label">当前版本</text>
				<text class="cell-value">v1.0.0</text>
			</view>
		</view>

		<view class="section-title">账号</view>

		<view class="card">
			<view class="cell">
				<text class="cell-label">用户ID</text>
				<text class="cell-value">{{ user ? user.userId : '--' }}</text>
			</view>
			<view class="cell">
				<text class="cell-label">昵称</text>
				<text class="cell-value">{{ user ? (user.nickname || user.name || '--') : '--' }}</text>
			</view>
		</view>

		<view class="logout-btn" @click="doLogout">退出登录</view>
	</view>
</template>

<script>
	import { getUser, logout, isLoggedIn } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				user: null,
				cacheSize: '计算中...'
			}
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login' })
				return
			}
			this.user = getUser()
			this.calcCache()
		},
		methods: {
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
		padding: 32rpx 28rpx 16rpx;
		font-size: 26rpx;
		color: #9aa3b2;
		font-weight: 600;
	}

	.card {
		margin: 0 28rpx;
		background: #ffffff;
		border-radius: 22rpx;
		overflow: hidden;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.cell {
		display: flex;
		align-items: center;
		padding: 30rpx 28rpx;
		border-bottom: 1rpx solid #f4f5f7;
	}

	.cell:last-child {
		border-bottom: none;
	}

	.cell-label {
		flex: 1;
		font-size: 28rpx;
		color: #1a2030;
	}

	.cell-value {
		font-size: 26rpx;
		color: #9aa3b2;
		margin-right: 8rpx;
	}

	.cell-arrow {
		font-size: 28rpx;
		color: #c8cdd5;
	}

	.logout-btn {
		margin: 48rpx 28rpx 0;
		height: 96rpx;
		line-height: 96rpx;
		text-align: center;
		background: #ffffff;
		border-radius: 22rpx;
		font-size: 30rpx;
		font-weight: 700;
		color: #e86a4b;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}
</style>
