<template>
	<view class="app login">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<view class="hero-brand">
					<view class="hero-logo">🎣</view>
					<text class="hero-brand-text">FISHING</text>
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
			<view class="privacy-icon">🔐</view>
			<view class="privacy-text">
				<text class="privacy-title">我们将获取以下信息</text>
				<text class="privacy-desc">微信昵称与头像，用于识别账户身份</text>
			</view>
		</view>

		<view class="spacer"></view>

		<view class="dock">
			<text class="agree">登录即代表同意《用户协议》《隐私政策》</text>
			<button class="dock-primary" @click="doLogin">
				<text class="wx-icon">💬</text>
				微信一键登录
			</button>
			<button class="dock-ghost" @click="skip">稍后再说</button>
		</view>
	</view>
</template>

<script>
	import { loginWithCode, isLoggedIn } from '../../utils/fishingStore.js'

	export default {
		data() { return { redirect: '' } },
		onLoad(option = {}) {
			this.redirect = option.redirect || ''
			if (isLoggedIn()) this.goNext()
		},
		methods: {
			doLogin() {
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
			goNext() {
				const target = this.redirect ? decodeURIComponent(this.redirect) : '/pages/index/index'
				uni.reLaunch({ url: target })
			}
		}
	}
</script>

<style>
	.login {
		padding-bottom: 340rpx;
		min-height: 100vh;
	}

	.hero {
		position: relative;
		margin: 20rpx 28rpx 0;
		padding: 70rpx 40rpx;
		border-radius: 32rpx;
		overflow: hidden;
		box-shadow: 0 16rpx 36rpx rgba(26, 32, 48, 0.1);
	}

	.hero-bg {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
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
		gap: 16rpx;
		margin-bottom: 28rpx;
	}

	.hero-logo {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: #f5c23b;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		box-shadow: 0 12rpx 24rpx rgba(245, 194, 59, 0.35);
	}

	.hero-brand-text {
		color: #f5c23b;
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 8rpx;
	}

	.hero-title {
		color: #ffffff;
		font-size: 56rpx;
		font-weight: 800;
		letter-spacing: 10rpx;
	}

	.hero-sub {
		color: #a8a8a8;
		font-size: 24rpx;
		margin-top: 14rpx;
		letter-spacing: 3rpx;
	}

	.steps {
		margin: 24rpx 28rpx 0;
		padding: 24rpx 28rpx;
		border-radius: 22rpx;
		background: #ffffff;
		box-shadow: 0 6rpx 20rpx rgba(26, 32, 48, 0.04);
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 20rpx;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #eef0f5;
	}

	.step:last-child {
		border-bottom: 0;
	}

	.step-index {
		width: 56rpx;
		height: 56rpx;
		border-radius: 14rpx;
		background: #fff7df;
		color: #b8860b;
		font-size: 22rpx;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		letter-spacing: 1rpx;
	}

	.step-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.step-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.step-desc {
		font-size: 24rpx;
		color: #6b7280;
		line-height: 1.5;
	}

	.privacy {
		margin: 24rpx 28rpx 0;
		padding: 22rpx;
		border-radius: 18rpx;
		background: #f7f8fb;
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.privacy-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
	}

	.privacy-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.privacy-title {
		font-size: 26rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.privacy-desc {
		font-size: 22rpx;
		color: #6b7280;
	}

	.spacer {
		height: 40rpx;
	}

	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 24rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
		background: #ffffff;
		box-shadow: 0 -10rpx 28rpx rgba(26, 32, 48, 0.08);
	}

	.agree {
		display: block;
		text-align: center;
		color: #9aa3b2;
		font-size: 22rpx;
		margin-bottom: 16rpx;
	}

	.dock-primary {
		width: 100%;
		height: 104rpx;
		line-height: 104rpx;
		border-radius: 22rpx;
		background: #f5c23b;
		color: #1a1306;
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 3rpx;
		box-shadow: 0 12rpx 28rpx rgba(245, 194, 59, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
	}

	.dock-primary::after {
		border: 0;
	}

	.wx-icon {
		font-size: 32rpx;
	}

	.dock-ghost {
		width: 100%;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 20rpx;
		background: transparent;
		color: #6b7280;
		border: 0;
		font-size: 26rpx;
		margin-top: 10rpx;
	}

	.dock-ghost::after {
		border: 0;
	}
</style>
