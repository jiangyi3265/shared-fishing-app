<template>
	<view class="app rate-info has-account-tabbar has-brand-header">
		<brand-header title="费率说明" theme="light" layout="compact" :back="true" />
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">费率说明</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">当前计费规则</text>
			<view class="rule-highlight">
				<view class="rule-main">
					<text class="rule-price">¥{{ formatMoney(rule.pricePerStepCents) }}</text>
					<text class="rule-unit">/ {{ rule.stepMinutes }}分钟</text>
				</view>
				<text class="rule-sub">起步 {{ rule.minDurationMinutes }} 分钟</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">计费详情</text>
			<view class="kv-row">
				<text class="kv-key">起步时长</text>
				<text class="kv-val">{{ rule.minDurationMinutes }} 分钟</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">起步价格</text>
				<text class="kv-val">¥{{ formatMoney(rule.pricePerStepCents) }}</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">递增单位</text>
				<text class="kv-val">每 {{ rule.stepMinutes }} 分钟</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">递增价格</text>
				<text class="kv-val">¥{{ formatMoney(rule.pricePerStepCents) }} / 段</text>
			</view>
			<view class="kv-row">
				<text class="kv-key">封顶金额</text>
				<text class="kv-val">{{ rule.capAmountCents > 0 ? '¥' + formatMoney(rule.capAmountCents) : '无封顶' }}</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">计费示例</text>
			<view class="example" v-for="(ex, idx) in examples" :key="idx">
				<view class="example-left">
					<text class="example-duration">{{ ex.duration }}</text>
					<text class="example-label">垂钓时长</text>
				</view>
				<view class="example-right">
					<text class="example-amount">¥{{ ex.amount }}</text>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="card-title">说明</text>
			<view class="note-item" v-for="(note, idx) in notes" :key="idx">
				<text class="note-dot">•</text>
				<text class="note-text">{{ note }}</text>
			</view>
		</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	import { formatMoney, loadDefaultVenue, getCachedVenue, calcAmount } from '../../utils/fishingStore.js'

	const FALLBACK_RULE = { stepMinutes: 30, minDurationMinutes: 30, pricePerStepCents: 300, capAmountCents: 0 }

	export default {
		data() {
			return {
				rule: FALLBACK_RULE,
				notes: [
					'不足一个计费单位按一个单位计算',
					'起步时间内离场仍按起步价收费',
					'最终金额以结算页面显示为准',
					'优惠券可在结算时抵扣部分费用'
				]
			}
		},
		computed: {
			examples() {
				const durations = [30, 60, 90, 120, 180]
				return durations.map((min) => {
					const result = calcAmount(min * 60 * 1000, this.rule)
					return {
						duration: min >= 60 ? (min / 60) + '小时' : min + '分钟',
						amount: formatMoney(result.amountCents)
					}
				})
			}
		},
		onShow() {
			const cached = getCachedVenue()
			if (cached && cached.rule) this.rule = Object.assign({}, FALLBACK_RULE, cached.rule)
			loadDefaultVenue().then((data) => {
				if (data && data.rule) this.rule = Object.assign({}, FALLBACK_RULE, data.rule)
			}).catch(() => {})
		},
		methods: { formatMoney }
	}
</script>

<style>
	.rate-info {
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

	.rule-highlight {
		margin-top: 20rpx;
		padding: 32rpx;
		background: var(--surface-2);
		border-radius: var(--r-sm);
		text-align: center;
	}

	.rule-main {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 8rpx;
	}

	.rule-price {
		font-size: 56rpx;
		font-weight: 600;
		color: var(--gold);
		font-variant-numeric: tabular-nums;
	}

	.rule-unit {
		font-size: 26rpx;
		color: var(--ink-2);
	}

	.rule-sub {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: var(--ink-3);
	}

	.example {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 0;
		border-bottom: 1rpx solid var(--surface-2);
	}

	.example:last-child {
		border-bottom: none;
	}

	.example-left {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.example-duration {
		font-size: 28rpx;
		font-weight: 500;
		color: var(--ink);
	}

	.example-label {
		font-size: 22rpx;
		color: var(--ink-3);
	}

	.example-amount {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--gold);
		font-variant-numeric: tabular-nums;
	}

	.note-item {
		display: flex;
		align-items: flex-start;
		gap: 12rpx;
		padding: 8rpx 0;
	}

	.note-dot {
		color: var(--gold);
		font-size: 28rpx;
		font-weight: 500;
		line-height: 1.5;
	}

	.note-text {
		flex: 1;
		font-size: 24rpx;
		color: var(--ink-2);
		line-height: 1.5;
	}
</style>

<style>
.rate-info{min-height:100vh;padding:16rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.rate-info>.hero{display:none}.rate-info .card{margin:0 0 14rpx;padding:18rpx;border:1rpx solid #d7e5e4;border-radius:12rpx;background:#fff}.rate-info .card-title{font-size:25rpx}.rate-info .rule-highlight{margin-top:12rpx;padding:15rpx;background:#f4f9f8}.rate-info .rule-price{color:#079f9d}.rate-info .kv-row{min-height:54rpx}.rate-info .kv-key,.rate-info .kv-val{font-size:21rpx}.rate-info .example{min-height:56rpx;padding:8rpx;border:1rpx solid #dce7e6;border-bottom:0;border-radius:0}.rate-info .example:last-child{border-bottom:1rpx solid #dce7e6}.rate-info .example-label{display:none}.rate-info .example-duration,.rate-info .example-amount{font-size:20rpx}.rate-info .note-item{font-size:20rpx}
</style>
