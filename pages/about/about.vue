<template>
	<view class="app about has-account-tabbar has-brand-header">
		<brand-header title="关于我们" theme="light" layout="compact" :back="true" />
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<image class="logo" src="/static/logo-mark.svg" mode="aspectFit"></image>
				<text class="app-name">共享钓场</text>
				<text class="app-version">v{{ version }}</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">关于我们</text>
			<text class="about-text">
				共享钓场是一款面向钓场用户的计时与钓场服务小程序。用户可在首页直接下竿计时、实时查看费用并收竿结算，也可扫描钓场二维码快捷进入对应流程；同一个码会根据当前计时状态进入开始或结算页面。
			</text>
		</view>

		<view class="card">
			<text class="card-title">核心功能</text>
			<view class="feature" v-for="(f, idx) in features" :key="idx">
				<view class="feature-icon" :class="f.icon"></view>
				<view class="feature-text">
					<text class="feature-title">{{ f.title }}</text>
					<text class="feature-desc">{{ f.desc }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="kv-row">
				<text class="kv-key">版本号</text>
				<text class="kv-val">v{{ version }}</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">技术支持</text>
				<text class="kv-val">共享钓场团队</text>
			</view>
		</view>

		<view class="footer-text">© {{ currentYear }} 共享钓场 · All Rights Reserved</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	export default {
		data() {
			return {
				version: '1.0.3',
				currentYear: new Date().getFullYear(),
				features: [
					{ icon: 'hic-scanin', title: '下竿计时', desc: '首页直接开始，也可扫描钓场码快捷进入' },
					{ icon: 'hic-timer', title: '实时计费', desc: '透明计费，随时查看费用明细' },
					{ icon: 'hic-wxpay', title: '便捷支付', desc: '微信支付一键结算，快速离场' },
					{ icon: 'hic-cal', title: '钓场服务', desc: '查看公告、活动、预订和租赁信息' }
				]
			}
		}
	}
</script>

<style>
	.about {
		padding-bottom: 60rpx;
	}

	.hero {
		position: relative;
		margin: 0;
		padding: 60rpx 32rpx;
		border-radius: 0;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, var(--g-900) 0%, var(--g-950) 100%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
	}

	.logo {
		width: 140rpx;
		height: 140rpx;
		border-radius: var(--r-lg);
		background: rgba(245, 194, 59, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 72rpx;
		margin-bottom: 12rpx;
	}

	.app-name {
		font-size: 40rpx;
		font-weight: 600;
		color: #ffffff;
		letter-spacing: 4rpx;
	}

	.app-version {
		font-size: 24rpx;
		color: var(--ink-3);
	}

	.about-text {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: var(--ink-2);
		line-height: 1.8;
	}

	.feature {
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
		padding: 20rpx 0;
		border-bottom: 1rpx solid var(--surface-2);
	}

	.feature:last-child {
		border-bottom: none;
	}

	.feature-icon {
		font-size: 36rpx;
		margin-top: 4rpx;
	}

	.feature-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.feature-title {
		font-size: 28rpx;
		font-weight: 500;
		color: var(--ink);
	}

	.feature-desc {
		font-size: 24rpx;
		color: var(--ink-2);
	}

	.footer-text {
		text-align: center;
		color: var(--ink-3);
		font-size: 22rpx;
		margin: 40rpx 0 24rpx;
	}
	.logo { background-size: 80rpx 80rpx; }
	.feature-icon { width: 60rpx; height: 60rpx; border-radius: var(--r-sm); background-color: #fff; background-size: 36rpx 36rpx; flex-shrink: 0; }
</style>

<style>
.about{min-height:100vh;padding:30rpx 24rpx calc(122rpx + env(safe-area-inset-bottom));background:#fff}.about .hero{padding:20rpx;background:transparent}.about .hero-bg{display:none}.about .logo{width:112rpx;height:112rpx;border:1rpx solid #cce1df;border-radius:14rpx;background-color:#fff}.about .app-name{color:#123f42;font-size:34rpx}.about .app-version{color:#6d8082}.about .card{margin:12rpx 0;padding:18rpx 0;border:0;border-radius:0;background:transparent}.about .card:first-of-type .card-title{display:none}.about .about-text{font-size:20rpx;line-height:1.7;text-align:center;color:#617678}.about .card-title{font-size:25rpx}.about .feature{padding:13rpx 0}.about .feature-icon{width:54rpx;height:54rpx;border-radius:50%;background-color:#0aa9a5}.about .feature-title{font-size:23rpx}.about .feature-desc{font-size:19rpx}.about .card:nth-last-of-type(1){display:none}.footer-text{font-size:18rpx}
</style>
