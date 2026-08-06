<template>
	<view class="app guide has-account-tabbar has-brand-header">
		<brand-header title="操作指引" theme="light" layout="compact" :back="true" />
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">操作指引</text>
			</view>
		</view>

		<view class="steps">
			<view class="step" v-for="(item, idx) in steps" :key="idx">
				<view class="step-num">{{ idx + 1 }}</view>
				<view class="step-body">
					<view class="step-icon" :class="item.icon"></view>
					<view class="step-text">
						<text class="step-title">{{ item.title }}</text>
						<text class="step-desc">{{ item.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="tips card">
			<text class="tips-title">温馨提示</text>
			<view class="tip-item" v-for="(tip, idx) in tips" :key="idx">
				<text class="tip-dot">•</text>
				<text class="tip-text">{{ tip }}</text>
			</view>
		</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	export default {
		data() {
			return {
				steps: [
					{ icon: 'hic-scanin', title: '下竿计时', desc: '在首页点击“下竿计时”，确认计费规则后开始；也可扫描钓场二维码快捷进入' },
					{ icon: 'hic-timer', title: '享受垂钓', desc: '计时期间可随时查看已用时长和预估费用，安心享受垂钓时光' },
					{ icon: 'hic-scanout', title: '收竿结算', desc: '准备离开时点击“收竿结算”，核对时长和金额后确认；再次扫描同一钓场码也可进入结算' },
					{ icon: 'hic-wxpay', title: '在线支付', desc: '确认账单金额后，通过微信支付完成付款，即可离场' }
				],
				tips: [
					'起步时间内按起步价计费，超出后按阶梯递增',
					'如有优惠券可在结算时使用，自动抵扣',
					'钓场二维码会按当前计时状态进入开始或结算页面',
					'计时以服务端时间为准，本地显示仅供参考',
					'如遇问题请联系现场工作人员或在线客服'
				]
			}
		}
	}
</script>

<style>
	.guide {
		padding-bottom: 60rpx;
	}

	.hero {
		position: relative;
		margin: 0;
		padding: 40rpx 32rpx 36rpx;
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
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 600;
		color: #ffffff;
		letter-spacing: 2rpx;
		display: block;
	}

	.hero-sub {
		font-size: 22rpx;
		color: var(--gold);
		letter-spacing: 4rpx;
		display: block;
		margin-top: 8rpx;
	}

	.steps {
		margin: 24rpx 28rpx 0;
		background: var(--surface);
		border-radius: var(--r);
		padding: 20rpx 24rpx;
	}

	.step {
		display: flex;
		align-items: flex-start;
		padding: 24rpx 0;
		border-bottom: 1rpx solid var(--surface-2);
	}

	.step:last-child {
		border-bottom: none;
	}

	.step-num {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background: var(--g-600);
		color: #fff;
		font-size: 24rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 8rpx;
	}

	.step-body {
		flex: 1;
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
		margin-left: 20rpx;
	}

	.step-icon {
		font-size: 40rpx;
		flex-shrink: 0;
		margin-top: 4rpx;
	}

	.step-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.step-title {
		font-size: 28rpx;
		font-weight: 500;
		color: var(--ink);
	}

	.step-desc {
		font-size: 24rpx;
		color: var(--ink-2);
		line-height: 1.5;
	}

	.tips {
		margin-top: 24rpx;
	}

	.tips-title {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: var(--ink);
		margin-bottom: 16rpx;
	}

	.tip-item {
		display: flex;
		align-items: flex-start;
		gap: 12rpx;
		padding: 8rpx 0;
	}

	.tip-dot {
		color: var(--gold);
		font-size: 28rpx;
		font-weight: 500;
		line-height: 1.5;
	}

	.tip-text {
		flex: 1;
		font-size: 24rpx;
		color: var(--ink-2);
		line-height: 1.5;
	}
	.step-icon { width: 64rpx; height: 64rpx; border-radius: var(--r-sm); background-color: #fff; background-size: 38rpx 38rpx; flex-shrink: 0; }
</style>

<style>
.guide{min-height:100vh;padding:18rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#fff}.guide>.hero{display:none}.steps{position:relative;padding-left:10rpx}.steps::before{content:'';position:absolute;left:41rpx;top:45rpx;bottom:45rpx;width:2rpx;background:#b8d6d4}.step{min-height:148rpx;position:relative}.step-num{z-index:2;width:34rpx;height:34rpx;background:#0a9f9d;font-size:19rpx}.step-body{padding-left:18rpx;gap:20rpx}.step-icon{width:92rpx;height:92rpx;border:1rpx solid #cfe2e0;border-radius:50%;background-color:#fff}.step-title{font-size:26rpx}.step-desc{font-size:20rpx}.guide .tips{margin:15rpx 0 0;padding:18rpx;border:1rpx solid #8ac9c7;border-radius:9rpx;background:#f5fbfa}.guide .tips-title{font-size:23rpx;color:#078f8e}.guide .tip-item{display:none}.guide .tips::after{content:'离场未结算的订单将持续计费，请及时完成结算与支付，避免产生额外费用。';display:block;margin-top:9rpx;color:#526f71;font-size:20rpx;line-height:1.5}
</style>
