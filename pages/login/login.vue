<template>
	<view class="app login">
		<view class="login-visual">
			<image class="login-photo" src="/static/hero-fishing-v2.jpg" mode="aspectFill"></image>
			<view class="login-scrim"></view>
			<view class="login-back" :style="{ top: (statusBarHeight + 8) + 'px' }" role="button" aria-label="返回上一页" hover-class="login-back-pressed" @click="goBack">
				<view class="login-back-icon"></view>
			</view>
			<view class="brand-row" :style="{ top: (statusBarHeight + 18) + 'px' }">
				<image class="brand-logo" src="/static/logo-mark.svg" mode="aspectFit"></image>
				<text class="brand-name">共享钓场</text>
			</view>
			<view class="hero-copy">
				<text class="hero-title">下竿有时，收竿有数</text>
				<text class="hero-sub">扫码计时 · 收竿结算 · 会员积分</text>
			</view>
		</view>

		<view class="login-panel">
			<view class="login-content">
				<view class="panel-head">
					<view class="login-emblem"><view class="emblem-check"></view></view>
					<view class="panel-copy">
						<text class="panel-kicker">欢迎来到共享钓场</text>
						<text class="panel-title">微信一键登录</text>
					</view>
				</view>
				<text class="panel-sub">点击昵称框可快速选择微信昵称，登录后将用于订单、积分和排行榜展示。</text>

				<form class="login-form" @submit="onLoginSubmit">
					<view class="nickname-card">
						<view class="nickname-head">
							<text class="nickname-label">微信昵称</text>
							<text class="nickname-optional">可选</text>
						</view>
						<input class="nickname-input" type="nickname" name="nickname" :value="nickname" maxlength="20" confirm-type="done" placeholder="点击选择微信昵称" @input="onNicknameInput" @blur="onNicknameInput" />
						<text class="nickname-tip">微信不会静默提供昵称；不填写也可登录，将显示钓友编号。</text>
					</view>

					<view class="account-assurance">
						<view><text class="assurance-value">免注册</text><text class="assurance-label">微信身份直连</text></view>
						<view class="assurance-divider"></view>
						<view><text class="assurance-value">自动同步</text><text class="assurance-label">订单与积分</text></view>
						<view class="assurance-divider"></view>
						<view><text class="assurance-value">安全识别</text><text class="assurance-label">不强制取头像</text></view>
					</view>

					<view class="login-actions">
						<button class="login-primary" form-type="submit" :disabled="loggingIn">
							<text class="wx-icon"></text>
							<text>{{ loggingIn ? '正在登录…' : '微信一键登录' }}</text>
						</button>
						<checkbox-group class="login-agreement" @change="onAgreeChange">
							<label class="agreement-toggle"><checkbox class="agreement-checkbox" value="agree" :checked="agreed" color="#079f9d" /><text>我已阅读并同意</text></label>
							<view class="agreement-links">
								<text class="agreement-link" @click.stop="openUserAgreement">《用户服务协议》</text>
								<text class="agreement-link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
							</view>
						</checkbox-group>
						<button class="login-secondary" @click="skip">暂不登录，先逛逛</button>
					</view>
				</form>
			</view>
		</view>
	</view>
</template>

<script>
	import { loginWithCode, isLoggedIn } from '../../utils/fishingStore.js'

	export default {
		data() {
			return { statusBarHeight: 20, redirect: '', nickname: '', agreed: false, loggingIn: false, leaving: false }
		},
		onLoad(option = {}) {
			this.initChrome()
			this.redirect = option.redirect || ''
			if (isLoggedIn()) this.goNext()
		},
		methods: {
			goBack() {
				const pages = getCurrentPages()
				if (pages.length > 1) uni.navigateBack()
				else uni.reLaunch({ url: '/pages/index/index' })
			},
			initChrome() {
				const system = uni.getSystemInfoSync()
				this.statusBarHeight = Number(system.statusBarHeight || 20)
			},
			// 微信「昵称填写能力」：手动输入的昵称要等 blur 才提交，直接点按钮会漏掉，
			// 所以按官方建议由 form submit 兜底取值。
			onLoginSubmit(e) {
				const value = e && e.detail && e.detail.value ? e.detail.value.nickname : ''
				if (value) this.nickname = String(value)
				this.doLogin()
			},
			doLogin() {
				if (this.loggingIn) return
				if (!this.agreed) {
					uni.showToast({ title: '请先阅读并勾选用户协议', icon: 'none' })
					return
				}
				this.loggingIn = true
				uni.showLoading({ title: '登录中' })
				const fail = (err) => {
					this.loggingIn = false
					uni.hideLoading()
					uni.showToast({ title: (err && (err.msg || err.message || err.errMsg)) || '登录失败，请重试', icon: 'none' })
				}
				const finish = () => {
					this.loggingIn = false
					uni.hideLoading()
					if (!isLoggedIn()) return fail({ msg: '登录信息保存失败，请重试' })
					uni.showToast({ title: '登录成功', icon: 'success' })
					setTimeout(() => this.goNext(), 180)
				}
				// #ifdef MP-WEIXIN
				uni.login({
					provider: 'weixin',
					success: (res) => {
						if (!res.code) return fail({ msg: '微信登录未返回 code' })
						loginWithCode(res.code, { nickName: this.nickname.trim() }).then(finish).catch(fail)
					},
					fail: (err) => fail({ msg: (err && err.errMsg) || '微信登录失败，请重试' })
				})
				// #endif
				// #ifndef MP-WEIXIN
				fail({ msg: '请在微信小程序环境登录' })
				// #endif
			},
			skip() { uni.reLaunch({ url: '/pages/index/index' }) },
			onNicknameInput(e) { this.nickname = (e.detail && e.detail.value) || '' },
			onAgreeChange(e) { this.agreed = (e.detail.value || []).includes('agree') },
			openUserAgreement() { uni.navigateTo({ url: '/pages/protocol/user' }) },
			openPrivacyPolicy() { uni.navigateTo({ url: '/pages/protocol/privacy' }) },
			decodeRedirect(value) {
				if (!value) return '/pages/index/index'
				try { return decodeURIComponent(value) } catch (e) { return value }
			},
			goNext() {
				if (this.leaving) return
				this.leaving = true
				let target = this.decodeRedirect(this.redirect)
				if (!target.startsWith('/pages/') || target.startsWith('/pages/login/login')) target = '/pages/index/index'
				if (target === '/pages/index/index') {
					uni.reLaunch({ url: target, fail: () => { this.leaving = false } })
					return
				}
				uni.reLaunch({
					url: '/pages/index/index?after=' + encodeURIComponent(target),
					fail: () => { this.leaving = false }
				})
			}
		}
	}
</script>

<style>
	page{background:#f8fcfb}
	.login{min-height:100vh;display:flex;flex-direction:column;padding-bottom:0;background:#f8fcfb;color:#0b3134}
	.login-visual{position:relative;z-index:1;flex:0 0 570rpx;height:570rpx;overflow:hidden;background:#0b6669}
	.login-photo,.login-scrim{position:absolute;inset:0;width:100%;height:100%}
	.login-scrim{background:linear-gradient(180deg,rgba(2,60,64,.08),rgba(2,52,55,.08) 45%,rgba(1,39,42,.55))}
	.login-back{position:absolute;z-index:4;left:12rpx;width:88rpx;height:88rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;color:#f8fffe}
	.login-back::before{content:'';position:absolute;inset:8rpx;border:1rpx solid rgba(248,255,254,.48);border-radius:50%;background:rgba(4,55,58,.28)}
	.login-back-icon{position:relative;z-index:1;width:22rpx;height:22rpx;border-left:4rpx solid currentColor;border-bottom:4rpx solid currentColor;transform:translateX(4rpx) rotate(45deg)}
	.login-back-pressed{opacity:.68;background:rgba(4,55,58,.46)}
	.brand-row{position:absolute;z-index:2;left:112rpx;display:flex;align-items:center;gap:16rpx;color:#f8fffe}
	.brand-logo{width:68rpx;height:68rpx;border:1rpx solid rgba(248,255,254,.72);border-radius:15rpx;background:#f8fffe}
	.brand-name{font-size:34rpx;font-weight:900;letter-spacing:-1rpx}
	.hero-copy{position:absolute;z-index:2;left:36rpx;right:32rpx;bottom:62rpx;color:#f8fffe}
	.hero-title,.hero-sub{display:block}.hero-title{font-size:52rpx;line-height:1.12;font-weight:900;letter-spacing:-2rpx}.hero-sub{margin-top:17rpx;font-size:24rpx;font-weight:700}
	.login-panel{position:relative;z-index:3;flex:1;min-height:560rpx;margin-top:-28rpx;padding:36rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));display:flex;align-items:center;border-radius:28rpx 28rpx 0 0;background:#f8fcfb;box-shadow:0 -10rpx 30rpx rgba(3,75,77,.08)}
	.login-content{width:100%;max-width:690rpx;margin:0 auto}
	.panel-head{display:flex;align-items:center;gap:18rpx}
	.login-emblem{width:76rpx;height:76rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:22rpx;background:#e2f6f4;color:#079f9d}
	.emblem-check{width:29rpx;height:15rpx;border-left:5rpx solid currentColor;border-bottom:5rpx solid currentColor;transform:translateY(-3rpx) rotate(-45deg)}
	.panel-copy{flex:1;min-width:0}.panel-kicker,.panel-title,.panel-sub{display:block}.panel-kicker{color:#6e8587;font-size:19rpx;font-weight:700}.panel-title{margin-top:2rpx;font-size:38rpx;font-weight:900;letter-spacing:-1rpx}.panel-sub{max-width:620rpx;margin-top:17rpx;color:#6e8385;font-size:22rpx;line-height:1.65}
	.nickname-card{margin-top:22rpx;padding:20rpx 22rpx;border:1rpx solid #cee5e3;border-radius:18rpx;background:#fff}
	.nickname-head{display:flex;align-items:center;justify-content:space-between}.nickname-label{color:#123e41;font-size:22rpx;font-weight:900}.nickname-optional{padding:4rpx 10rpx;border-radius:999rpx;background:#edf8f7;color:#078f91;font-size:17rpx;font-weight:800}
	.nickname-input{height:72rpx;margin-top:10rpx;padding:0 18rpx;border-radius:13rpx;background:#f1f8f7;color:#123e41;font-size:25rpx;font-weight:700;box-sizing:border-box}.nickname-input::placeholder{color:#8aa0a1;font-weight:500}.nickname-tip{display:block;margin-top:11rpx;color:#789092;font-size:18rpx;line-height:1.55}
	.account-assurance{height:104rpx;margin-top:24rpx;padding:0 12rpx;display:flex;align-items:center;border-top:1rpx solid #dfeae9;border-bottom:1rpx solid #dfeae9}
	.account-assurance>view:not(.assurance-divider){flex:1;display:flex;flex-direction:column;align-items:center;gap:5rpx}.assurance-value{color:#123e41;font-size:22rpx;font-weight:900}.assurance-label{color:#839496;font-size:17rpx}.assurance-divider{width:1rpx;height:46rpx;background:#dce8e7}
	.login-actions{position:static;width:100%;margin-top:28rpx;padding:0;background:transparent;border:0}
	.login-primary{position:relative;width:100%;height:92rpx;margin:0;padding:0;display:flex;align-items:center;justify-content:center;gap:15rpx;border:0;border-radius:16rpx;background:#08aaa6;color:#f8fffe;font-size:29rpx;font-weight:900;line-height:1;box-shadow:0 13rpx 28rpx rgba(6,133,133,.22)}
	.login-primary:after,.login-secondary:after{border:0}.login-primary[disabled]{opacity:.62;box-shadow:none}
	.login-primary:active{transform:scale(.985);opacity:.94}
	.wx-icon{width:34rpx;height:27rpx;border-radius:50%;background:currentColor;position:relative;color:#f8fffe;flex-shrink:0}.wx-icon:after{content:'';position:absolute;right:-10rpx;bottom:-5rpx;width:21rpx;height:18rpx;border:4rpx solid #f8fffe;border-radius:50%}
	.login-agreement{width:100%;margin-top:20rpx;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;column-gap:4rpx;color:#667d7f;font-size:19rpx;line-height:1.6;text-align:center}
	.agreement-toggle{display:flex;align-items:center;flex-shrink:0}.agreement-checkbox{transform:scale(.78);transform-origin:center}.agreement-links{display:flex;align-items:center;justify-content:center;gap:2rpx}.agreement-link{color:#078f91;font-weight:800}
	.login-secondary{width:100%;height:62rpx;margin:4rpx 0 0;padding:0;display:flex;align-items:center;justify-content:center;border:0;background:transparent;color:#507477;font-size:21rpx;font-weight:700;line-height:1}
	@media (max-width:360px){.login-visual{flex-basis:520rpx;height:520rpx}.brand-row{left:104rpx}.brand-logo{width:60rpx;height:60rpx}.brand-name{font-size:30rpx}.hero-copy{bottom:50rpx}.hero-title{font-size:45rpx}.login-panel{padding-left:24rpx;padding-right:24rpx}.panel-title{font-size:34rpx}.account-assurance{padding:0}.assurance-label{font-size:16rpx}.login-primary{height:88rpx}}
	@media (max-height:720px){.login-visual{flex-basis:400rpx;height:400rpx}.hero-copy{bottom:32rpx}.hero-title{font-size:39rpx}.hero-sub{margin-top:8rpx;font-size:19rpx}.login-panel{min-height:590rpx;padding-top:22rpx;align-items:flex-start}.panel-sub{margin-top:10rpx}.nickname-card{margin-top:15rpx;padding:15rpx 18rpx}.nickname-input{height:64rpx}.account-assurance{height:78rpx;margin-top:14rpx}.login-actions{margin-top:16rpx}.login-primary{height:78rpx}.login-agreement{margin-top:12rpx}.login-secondary{height:50rpx}}
</style>
