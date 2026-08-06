<template>
	<view class="app contact has-account-tabbar has-brand-header">
		<brand-header title="联系客服" theme="light" layout="compact" :back="true" />
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">联系客服</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">在线客服</text>
			<text class="card-sub">工作时间：每日 08:00 - 22:00</text>
			<!-- #ifdef MP-WEIXIN -->
			<button class="contact-btn" open-type="contact">
				<text class="contact-btn-text">微信在线客服</text>
			</button>
			<!-- #endif -->
			<!-- #ifndef MP-WEIXIN -->
			<view class="contact-btn" @click="copyWechat">
				<text class="contact-btn-text">复制客服微信</text>
			</view>
			<!-- #endif -->
		</view>

		<view class="card">
			<text class="card-title">电话咨询</text>
			<view class="phone-row" @click="callPhone">
				<view class="c-ico hic-phone"></view>
				<view class="phone-info">
					<text class="phone-number">{{ phone }}</text>
					<text class="phone-tip">点击拨打</text>
				</view>
				<text class="phone-arrow">›</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">钓场地址</text>
			<view class="addr-row" @click="openMap">
				<view class="c-ico hic-nav"></view>
				<view class="addr-info">
					<text class="addr-text">{{ venue.address || '暂无地址信息' }}</text>
					<text class="addr-tip">点击导航</text>
				</view>
				<text class="addr-arrow">›</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">常见问题</text>
			<view class="faq" v-for="(item, idx) in faqs" :key="idx" @click="toggleFaq(idx)">
				<view class="faq-q">
					<text class="faq-q-text">{{ item.q }}</text>
					<text class="faq-toggle">{{ item.open ? '−' : '+' }}</text>
				</view>
				<text v-if="item.open" class="faq-a">{{ item.a }}</text>
			</view>
		</view>
		<account-tabbar active="mine" />
	</view>
</template>

<script>
	import { getCachedVenue, loadDefaultVenue } from '../../utils/fishingStore.js'
	import { openVenueLocation } from '../../utils/location.js'

	export default {
		data() {
			return {
				phone: '400-000-0000',
				wechat: 'gxdc_kefu',
				venue: { address: '' },
				faqs: [
					{ q: '如何收竿结算？', a: '在首页点击“收竿结算”即可核对时长和费用；再次扫描钓场二维码也会进入结算确认页。', open: false },
					{ q: '支付失败怎么办？', a: '请检查微信支付是否正常，如仍无法支付请联系客服处理。', open: false },
					{ q: '可以中途暂停计时吗？', a: '目前不支持暂停，开始后会持续计时，直到您确认收竿结算。', open: false },
					{ q: '优惠券如何使用？', a: '在结算页面选择可用优惠券即可自动抵扣。', open: false }
				]
			}
		},
		onShow() {
			const cached = getCachedVenue()
			if (cached && cached.venue) {
				this.venue = cached.venue
				this.phone = this.venue.phone || '400-000-0000'
			}
			loadDefaultVenue().then((data) => {
				if (data && data.venue) {
					this.venue = data.venue
					this.phone = this.venue.phone || '400-000-0000'
				}
			}).catch(() => {})
		},
		methods: {
			callPhone() {
				uni.makePhoneCall({ phoneNumber: this.phone })
			},
			copyWechat() {
				uni.setClipboardData({
					data: this.wechat,
					success: () => uni.showToast({ title: '已复制客服微信', icon: 'success' })
				})
			},
			openMap() {
				openVenueLocation(this.venue)
			},
			toggleFaq(idx) {
				this.faqs[idx].open = !this.faqs[idx].open
			}
		}
	}
</script>

<style>
	.contact {
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

	.contact-btn {
		margin-top: 24rpx;
		/* 一个是 <button> 一个是 <view>，不给 width 两颗按钮宽度会不一样 */
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		height: 96rpx;
		background: var(--g-600);
		border-radius: var(--r);
		border: none;
		padding: 0;
	}

	.contact-btn::after {
		border: none;
	}

	.contact-btn-icon {
		font-size: 32rpx;
	}

	/* 按钮底已是品牌绿，文字必须白（旧值 gold-ink 会金字压绿底看不清） */
	.contact-btn-text {
		font-size: var(--t-h3);
		font-weight: 500;
		color: #fff;
	}

	.phone-row, .addr-row {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 20rpx;
		background: var(--surface-2);
		border-radius: var(--r-sm);
	}

	.c-ico {
		width: 64rpx;
		height: 64rpx;
		border-radius: var(--r);
		background-color: #fff;
		background-size: 36rpx 36rpx;
		flex-shrink: 0;
	}

	.phone-info, .addr-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.phone-number {
		font-size: 32rpx;
		font-weight: 500;
		color: var(--ink);
	}

	.phone-tip, .addr-tip {
		font-size: 22rpx;
		color: var(--ink-3);
	}

	.phone-arrow, .addr-arrow {
		font-size: 28rpx;
		color: var(--ink-4);
	}

	.addr-text {
		font-size: 28rpx;
		color: var(--ink);
	}

	.faq {
		padding: 20rpx 0;
		border-bottom: 1rpx solid var(--surface-2);
	}

	.faq:last-child {
		border-bottom: none;
	}

	.faq-q {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.faq-q-text {
		flex: 1;
		font-size: 26rpx;
		font-weight: 600;
		color: var(--ink);
	}

	.faq-toggle {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background: var(--surface-2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: var(--ink-2);
		font-weight: 500;
	}

	.faq-a {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: var(--ink-2);
		line-height: 1.6;
		padding-right: 60rpx;
	}
</style>

<style>
.contact{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.contact>.hero{display:none}.contact .card{margin:0 0 14rpx;padding:20rpx;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff}.contact .card-title{font-size:25rpx}.contact .card-sub{font-size:19rpx}.contact .contact-btn{height:64rpx;margin-top:14rpx;border-radius:8rpx;background:#0aa9a5;font-size:21rpx}.contact .phone-row,.contact .addr-row{padding:12rpx 0}.contact .c-ico{background-color:#0aa9a5}.contact .phone-number,.contact .addr-text{font-size:22rpx}.contact .phone-tip,.contact .addr-tip{font-size:18rpx}.contact .faq{padding:14rpx 0}.contact .faq-q-text{font-size:20rpx}.contact .faq-toggle{font-size:25rpx}.contact .faq-a{font-size:19rpx}
</style>
