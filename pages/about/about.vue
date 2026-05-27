<template>
	<view class="app about">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<view class="logo">🎣</view>
				<text class="app-name">共享钓场</text>
				<text class="app-version">v1.0.0</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">关于我们</text>
			<text class="about-text">
				共享钓场是一款面向钓场用户的扫码计时与钓场服务小程序。用户可在合作钓场扫码入场、实时查看计费、离场结算，并查看钓场公告、钓位预订、放鱼动态、钓具租赁与客服信息。
			</text>
		</view>

		<view class="card">
			<text class="card-title">核心功能</text>
			<view class="feature" v-for="(f, idx) in features" :key="idx">
				<text class="feature-icon">{{ f.icon }}</text>
				<view class="feature-text">
					<text class="feature-title">{{ f.title }}</text>
					<text class="feature-desc">{{ f.desc }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<view class="kv-row">
				<text class="kv-key">版本号</text>
				<text class="kv-val">v1.0.0</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">技术支持</text>
				<text class="kv-val">共享钓场团队</text>
			</view>
		</view>

		<view class="footer-text">© 2025 共享钓场 · All Rights Reserved</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				features: [
					{ icon: '📱', title: '扫码入场', desc: '无需排队，扫码即可开始计时' },
					{ icon: '⏱️', title: '实时计费', desc: '透明计费，随时查看费用明细' },
					{ icon: '💳', title: '便捷支付', desc: '微信支付一键结算，快速离场' },
					{ icon: '🎫', title: '钓场服务', desc: '查看公告、活动、预订和租赁信息' }
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
		margin: 20rpx 28rpx 0;
		padding: 60rpx 32rpx;
		border-radius: 28rpx;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0; right: 0; bottom: 0; left: 0;
		background: linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%);
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
		border-radius: 32rpx;
		background: rgba(245, 194, 59, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 72rpx;
		margin-bottom: 12rpx;
	}

	.app-name {
		font-size: 40rpx;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 4rpx;
	}

	.app-version {
		font-size: 24rpx;
		color: #9aa3b2;
	}

	.about-text {
		display: block;
		margin-top: 12rpx;
		font-size: 26rpx;
		color: #6b7280;
		line-height: 1.8;
	}

	.feature {
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f4f5f7;
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
		font-weight: 700;
		color: #1a2030;
	}

	.feature-desc {
		font-size: 24rpx;
		color: #6b7280;
	}

	.footer-text {
		text-align: center;
		color: #9aa3b2;
		font-size: 22rpx;
		margin: 40rpx 0 24rpx;
	}
</style>
