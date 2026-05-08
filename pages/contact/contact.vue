<template>
	<view class="app contact">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<text class="hero-title">联系客服</text>
				<text class="hero-sub">SHARED · FISHING SUPPORT</text>
			</view>
		</view>

		<view class="card">
			<text class="card-title">在线客服</text>
			<text class="card-sub">工作时间：每日 08:00 - 22:00</text>
			<!-- #ifdef MP-WEIXIN -->
			<button class="contact-btn" open-type="contact">
				<text class="contact-btn-icon">💬</text>
				<text class="contact-btn-text">微信在线客服</text>
			</button>
			<!-- #endif -->
			<!-- #ifndef MP-WEIXIN -->
			<view class="contact-btn" @click="copyWechat">
				<text class="contact-btn-icon">💬</text>
				<text class="contact-btn-text">复制客服微信</text>
			</view>
			<!-- #endif -->
		</view>

		<view class="card">
			<text class="card-title">电话咨询</text>
			<view class="phone-row" @click="callPhone">
				<text class="phone-icon">📞</text>
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
				<text class="addr-icon">📍</text>
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
	</view>
</template>

<script>
	import { getCachedVenue, loadDefaultVenue } from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				phone: '400-000-0000',
				wechat: 'gxdc_kefu',
				venue: { address: '' },
				faqs: [
					{ q: '忘记扫码出场怎么办？', a: '请联系现场工作人员或拨打客服电话，我们会为您手动结束计时。', open: false },
					{ q: '支付失败怎么办？', a: '请检查微信支付是否正常，如仍无法支付请联系客服处理。', open: false },
					{ q: '可以中途暂停计时吗？', a: '目前不支持暂停，入场后持续计时直到扫码出场。', open: false },
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
				if (!this.venue.address) return
				// #ifdef MP-WEIXIN
				uni.openLocation({
					latitude: this.venue.latitude || 0,
					longitude: this.venue.longitude || 0,
					name: this.venue.name || '共享钓场',
					address: this.venue.address
				})
				// #endif
				// #ifndef MP-WEIXIN
				uni.showToast({ title: this.venue.address, icon: 'none' })
				// #endif
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
		margin: 20rpx 28rpx 0;
		padding: 40rpx 32rpx 36rpx;
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
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 2rpx;
		display: block;
	}

	.hero-sub {
		font-size: 22rpx;
		color: #f5c23b;
		letter-spacing: 4rpx;
		display: block;
		margin-top: 8rpx;
	}

	.contact-btn {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		height: 96rpx;
		background: #f5c23b;
		border-radius: 20rpx;
		border: none;
		padding: 0;
	}

	.contact-btn::after {
		border: none;
	}

	.contact-btn-icon {
		font-size: 32rpx;
	}

	.contact-btn-text {
		font-size: 30rpx;
		font-weight: 700;
		color: #1a1306;
	}

	.phone-row, .addr-row {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 20rpx;
		background: #f9fafb;
		border-radius: 16rpx;
	}

	.phone-icon, .addr-icon {
		font-size: 36rpx;
	}

	.phone-info, .addr-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}

	.phone-number {
		font-size: 32rpx;
		font-weight: 700;
		color: #1a2030;
	}

	.phone-tip, .addr-tip {
		font-size: 22rpx;
		color: #9aa3b2;
	}

	.phone-arrow, .addr-arrow {
		font-size: 28rpx;
		color: #c8cdd5;
	}

	.addr-text {
		font-size: 28rpx;
		color: #1a2030;
	}

	.faq {
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f4f5f7;
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
		color: #1a2030;
	}

	.faq-toggle {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background: #f4f5f7;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #6b7280;
		font-weight: 700;
	}

	.faq-a {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #6b7280;
		line-height: 1.6;
		padding-right: 60rpx;
	}
</style>
