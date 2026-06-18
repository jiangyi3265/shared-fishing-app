<template>
	<view class="app login">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<view class="hero-brand">
					<view class="hero-logo">
						<text class="hero-logo-line"></text>
					</view>
					<text class="hero-brand-text">SHARED FISHING</text>
				</view>
				<text class="hero-title">共享钓场</text>
				<text class="hero-sub">扫码入场 · 按时计费 · 离场付款</text>
			</view>
		</view>

		<view class="steps">
			<view class="step">
				<view class="step-index">01</view>
				<view class="step-text">
					<text class="step-title">扫入口码开始计时</text>
					<text class="step-desc">进入钓位后扫码，以服务端时间为准</text>
				</view>
			</view>
			<view class="step">
				<view class="step-index">02</view>
				<view class="step-text">
					<text class="step-title">离场扫出口码结算</text>
					<text class="step-desc">费用自动计算，支持微信支付</text>
				</view>
			</view>
			<view class="step">
				<view class="step-index">03</view>
				<view class="step-text">
					<text class="step-title">待支付订单优先</text>
					<text class="step-desc">存在未结清订单时需先完成支付</text>
				</view>
			</view>
		</view>

		<view class="privacy">
			<view class="privacy-icon"></view>
			<view class="privacy-text">
				<text class="privacy-title">登录用于保存订单</text>
				<text class="privacy-desc">仅在你主动登录后获取微信身份标识，不在首页强制授权</text>
			</view>
		</view>

		<view class="spacer"></view>

		<view class="dock">
			<checkbox-group class="agree-row" @change="onAgreeChange">
				<label class="agree-label">
					<checkbox value="agree" :checked="agreed" color="#0f7a54" />
					<text>我已阅读并同意</text>
				</label>
				<text class="agree-link" @click.stop="openUserAgreement">《用户服务协议》</text>
				<text class="agree-link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
			</checkbox-group>
			<button class="dock-primary" :disabled="!agreed" @click="doLogin">
				<text class="wx-icon"></text>
				微信一键登录
			</button>
			<button class="dock-ghost" @click="skip">稍后再说</button>
		</view>
	</view>
</template>

<script>
	import { loginWithCode, isLoggedIn } from '../../utils/fishingStore.js'

	export default {
		data() { return { redirect: '', agreed: false } },
		onLoad(option = {}) {
			this.redirect = option.redirect || ''
			if (isLoggedIn()) this.goNext()
		},
		methods: {
			doLogin() {
				if (!this.agreed) {
					uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' })
					return
				}
				uni.showLoading({ title: '登录中' })
				const finish = () => {
					uni.hideLoading()
					uni.showToast({ title: '登录成功', icon: 'success' })
					this.goNext()
				}
				const fail = (err) => {
					uni.hideLoading()
					const msg = (err && (err.msg || err.message || err.errMsg)) || '登录失败'
					uni.showToast({ title: msg, icon: 'none' })
				}
				// #ifdef MP-WEIXIN
				uni.login({
					provider: 'weixin',
					success: (res) => {
						if (!res.code) return fail({ msg: '微信登录未返回 code' })
						loginWithCode(res.code, {}).then(finish).catch(fail)
					},
					fail: (err) => fail({ msg: (err && err.errMsg) || '微信登录失败，请重试' })
				})
				// #endif
				// #ifndef MP-WEIXIN
				fail({ msg: '请在微信小程序环境登录' })
				// #endif
			},
			skip() {
				uni.reLaunch({ url: '/pages/index/index' })
			},
			onAgreeChange(e) {
				this.agreed = (e.detail.value || []).includes('agree')
			},
			openUserAgreement() {
				uni.navigateTo({ url: '/pages/protocol/user' })
			},
			openPrivacyPolicy() {
				uni.navigateTo({ url: '/pages/protocol/privacy' })
			},
			goNext() {
				const target = this.redirect ? decodeURIComponent(this.redirect) : '/pages/index/index'
				if (target === '/pages/index/index') {
					uni.reLaunch({ url: target })
					return
				}
				// reLaunch 到首页并带 after 参数，由首页在 onReady 里 navigateTo 目标页：
				// 既保证目标页下方垫着首页（左滑退回首页而非退出小程序），又避开 reLaunch 后立即跳转的时序失败。
				uni.reLaunch({ url: '/pages/index/index?after=' + encodeURIComponent(target) })
			}
		}
	}
</script>

<style>
	.login {
		padding-bottom: 340rpx;
		min-height: 100vh;
		background: var(--bg);
	}

	/* ---------------- 头部英雄区 ---------------- */
	.hero {
		position: relative;
		margin: 0;
		padding: 96rpx 44rpx 84rpx;
		border-bottom-left-radius: 40rpx;
		border-bottom-right-radius: 40rpx;
		overflow: hidden;
		box-shadow: 0 16rpx 48rpx rgba(10, 46, 36, 0.16);
	}

	.hero-bg {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background: linear-gradient(135deg, #0d382c 0%, #06221a 70%, #031410 100%);
	}

	.hero-bg::after {
		content: '';
		position: absolute;
		right: -60rpx;
		top: -80rpx;
		width: 260rpx;
		height: 260rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(199, 154, 57, 0.12) 0%, rgba(199, 154, 57, 0) 70%);
		filter: blur(15px);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-brand {
		display: flex;
		align-items: center;
		gap: 20rpx;
		margin-bottom: 32rpx;
	}

	.hero-logo {
		width: 100rpx;
		height: 100rpx;
		border-radius: 30rpx;
		background: var(--accent-gradient);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--accent-glow);
		position: relative;
		transition: var(--transition);
	}

	.hero-logo::after {
		content: '';
		display: block;
		width: 44rpx;
		height: 44rpx;
		background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGZpbGw9J25vbmUnIHZpZXdCb3g9JzAgMCAyNCAyNCcgc3Ryb2tlPScjMGEyZTI0JyBzdHJva2Utd2lkdGg9JzMnPjxwYXRoIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcgZD0nTTE0Ljc1MiAxMS4xNjhsLTMuMTk3LTIuMTMyQTEgMSAwIDAwMTAgOS44N3Y0LjI2M2ExIDEgMCAwMDEuNTU1LjgzMmwzLjE5Ny0yLjEzMmExIDEgMCAwMDAtMS42NjR6Jy8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJyBkPSdNMjEgMTJhOSA5IDAgMTEtMTggMCA5IDkgMCAwMTE4IDB6Jy8+PC9zdmc+");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}

	.hero-brand-text {
		color: #f5d285;
		font-size: 24rpx;
		font-weight: 800;
		letter-spacing: 6rpx;
	}

	.hero-title {
		color: #ffffff;
		font-size: 60rpx;
		font-weight: 900;
		letter-spacing: 1rpx;
		text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
	}

	.hero-sub {
		color: rgba(255, 255, 255, 0.7);
		font-size: 24rpx;
		margin-top: 18rpx;
		font-weight: 600;
	}

	/* ---------------- 步骤引导 ---------------- */
	.steps {
		margin: -36rpx 32rpx 0;
		padding: 32rpx 28rpx;
		border-radius: 28rpx;
		background: #ffffff;
		border: 1rpx solid var(--border-color);
		box-shadow: var(--card-shadow);
		position: relative;
		z-index: 10;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 24rpx;
		padding: 24rpx 0;
		border-bottom: 1rpx solid rgba(10, 46, 36, 0.04);
	}

	.step:last-child {
		border-bottom: 0;
	}

	.step-index {
		width: 60rpx;
		height: 60rpx;
		border-radius: 18rpx;
		background: #fff8eb;
		color: var(--accent);
		font-size: 24rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1rpx solid rgba(199, 154, 57, 0.12);
	}

	.step-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.step-title {
		font-size: 28rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.step-desc {
		font-size: 24rpx;
		color: var(--text-muted);
		line-height: 1.5;
	}

	/* ---------------- 隐私获取说明 ---------------- */
	.privacy {
		margin: 28rpx 32rpx 0;
		padding: 24rpx 28rpx;
		border-radius: 20rpx;
		background: #ffffff;
		border: 1rpx solid var(--border-color);
		display: flex;
		align-items: center;
		gap: 20rpx;
		box-shadow: var(--card-shadow);
	}

	.privacy-icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: #eef7f5;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		border: 1rpx solid rgba(46, 186, 133, 0.1);
	}

	.privacy-icon::after {
		content: '';
		display: block;
		width: 36rpx;
		height: 36rpx;
		background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGZpbGw9J25vbmUnIHZpZXdCb3g9JzAgMCAyNCAyNCcgc3Ryb2tlPScjMmViYjg1JyBzdHJva2Utd2lkdGg9JzIuMic+PHBhdGggc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBzdHJva2UtbGluZWpvaW49J3JvdW5kJyBkPSdNMTIgMTV2Mm0tNiA0aDEyYTIgMiAwIDAwMi0ydi02YTIgMiAwIDAwLTItMkg2YTIgMiAwIDAwLTIgMnY2YTIgMiAwIDAwMiAyem0xMC0xMFY3YTQgNCAwIDAwLTggMHY0aDh6Jy8+PC9zdmc+");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}

	.privacy-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.privacy-title {
		font-size: 26rpx;
		font-weight: 800;
		color: var(--primary);
	}

	.privacy-desc {
		font-size: 22rpx;
		color: var(--text-muted);
	}

	.spacer {
		height: 40rpx;
	}

	/* ---------------- 底部登录板 ---------------- */
	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 32rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 -12rpx 40rpx rgba(10, 46, 36, 0.08);
		backdrop-filter: blur(15px);
		border-top: 1rpx solid rgba(10, 46, 36, 0.04);
		z-index: 99;
	}

	.agree-row {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8rpx;
		color: var(--text-light);
		font-size: 22rpx;
		margin-bottom: 24rpx;
		font-weight: 600;
	}

	.agree-label {
		display: flex;
		align-items: center;
		gap: 6rpx;
	}

	.agree-link {
		color: #0f7a54;
	}

	.dock-primary {
		width: 100%;
		height: 104rpx;
		line-height: 104rpx;
		border-radius: 20rpx;
		background: #07c160; /* 经典微信绿 */
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 1rpx;
		box-shadow: 0 12rpx 32rpx rgba(7, 193, 96, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16rpx;
		color: #ffffff;
		border: 0;
		transition: var(--transition);
	}

	.dock-primary:active {
		transform: scale(0.97);
		opacity: 0.95;
	}

	.dock-primary[disabled] {
		background: #b8c7c1;
		color: rgba(255, 255, 255, 0.82);
	}

	.dock-primary::after {
		border: 0;
	}

	.wx-icon {
		width: 40rpx;
		height: 40rpx;
		background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgZmlsbD0nI2ZmZmZmZic+PHBhdGggZD0nTTguNSAxMy41YTEuMjUgMS4yNSAwIDEgMS0yLjUgMCAxLjI1IDEuMjUgMCAwIDEgMi41IDB6bTkuNSAwYTEuMjUgMS4yNSAwIDEgMS0yLjUgMCAxLjI1IDEuMjUgMCAwIDEgMi41IDB6bS04LjgtNWMwLTMuMyAzLjYtNiA4LTZzOCAyLjcgOCA2LTMuNiA2LTggNmMtLjkgMC0xLjctLjEtMi41LS40TDEwIDE5di0zLjdDNi42IDE0LjUgNC42IDExLjcgNC42IDguNXptMy44IDYuOWMuNC4yLjguMyAxLjIuMyAzLjYgMCA2LjYtMi4yIDYuNi00LjlzLTMtNC45LTYuNi00LjktNi42IDIuMi02LjYgNC45YzAgMS41IDEgMi44IDIuNSAzLjdWMTdsMi45LTEuNnonLz48L3N2Zz4=");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		display: inline-block;
	}

	.dock-ghost {
		width: 100%;
		height: 84rpx;
		line-height: 84rpx;
		border-radius: 20rpx;
		background: transparent;
		color: var(--text-muted);
		border: 0;
		font-size: 26rpx;
		margin-top: 14rpx;
		font-weight: 700;
		transition: var(--transition);
	}

	.dock-ghost:active {
		background: rgba(10, 46, 36, 0.04);
	}

	.dock-ghost::after {
		border: 0;
	}
</style>
