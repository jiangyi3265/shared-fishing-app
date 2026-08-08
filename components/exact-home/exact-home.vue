<template>
	<view class="exact-home">
		<view class="home-hero" @click="$emit('venue')">
			<image class="hero-image" src="/static/hero-fishing-v2.jpg" mode="aspectFill" />
			<view class="hero-shade"></view>
			<view class="brand" :style="{ top: (statusBarHeight + 14) + 'px' }">
				<image class="brand-logo" src="/static/logo-mark.svg" mode="aspectFit" />
				<text>共享钓场</text>
			</view>
			<view class="hero-status">
				<view class="open-status"><view class="open-dot" :class="{ muted: !venueReady }"></view><text>{{ venueStatusText }}</text></view>
				<view class="weather-line"><view class="weather-icon"></view><text>{{ weatherLine }}</text></view>
			</view>
		</view>

		<view class="control-sheet">
			<view class="primary-actions">
				<view class="scan-action" @click.stop="$emit('start')">
					<view class="scan-icon"><view></view></view>
					<text>扫码下竿</text>
				</view>
				<view class="settle-action" @click.stop="$emit('checkout')">
					<view class="receipt-icon"><view></view></view>
					<text>收竿结算</text>
				</view>
			</view>
			<view class="secondary-actions">
				<view class="secondary-action weigh-action" @click.stop="$emit('weigh')">
					<view class="secondary-action-icon"><view class="weigh-scale"><view></view></view></view>
					<view class="secondary-action-copy"><text>鱼获称重</text><text>现场计价结算</text></view>
				</view>
				<view class="secondary-action points-action" @click.stop="$emit('points')">
					<view class="secondary-action-icon points-star">★</view>
					<view class="secondary-action-copy"><text>积分兑换</text><text>消费1元得5分</text></view>
				</view>
			</view>
			<view class="sheet-divider"></view>
			<view class="account-strip">
				<view class="account-cell" @click.stop="$emit('wallet')">
					<text class="account-label">余额</text>
					<text class="account-value">{{ user ? '¥' + money(account.balanceCents) : '--' }}</text>
				</view>
				<view class="account-divider"></view>
				<view class="account-cell" @click.stop="$emit('points')">
					<text class="account-label">积分</text>
					<text class="account-value">{{ user ? account.points : '--' }}</text>
				</view>
				<view class="account-divider"></view>
				<view class="account-cell" @click.stop="$emit('coupons')">
					<text class="account-label">优惠券</text>
					<text class="account-value">{{ user ? account.coupons : '--' }}</text>
				</view>
			</view>
		</view>

		<view v-if="pendingOrder" class="order-banner warning" @click="$emit('pay')">
			<view class="order-main"><view class="order-icon wallet-order"></view><text class="order-title">待支付订单</text><text class="order-amount">¥{{ money(pendingOrder.amountCents) }}</text></view>
			<text class="order-link">去支付 ›</text>
		</view>
		<view v-else-if="runningOrder" class="order-banner running" @click="$emit('session')">
			<view class="order-main"><view class="order-icon timer-order"></view><text class="order-title">正在计时</text><text class="order-amount">{{ duration(liveSeconds) }}</text></view>
			<text class="order-link">查看 ›</text>
		</view>

		<view class="shortcut-section">
			<view class="section-heading"><text class="section-title">快捷服务</text></view>
			<view class="shortcut-grid">
				<view class="shortcut-item" @click="$emit('reserve')"><view class="shortcut-icon icon-calendar"><view class="icon-shape"></view></view><text>钓位预订</text></view>
				<view class="shortcut-item" @click="$emit('stocking')"><view class="shortcut-icon icon-fish"><view class="icon-shape"></view></view><text>放鱼动态</text></view>
				<view class="shortcut-item" @click="$emit('catch')"><view class="shortcut-icon icon-chat"><view class="icon-shape"></view></view><text>钓获社区</text></view>
				<view class="shortcut-item" @click="$emit('rank')"><view class="shortcut-icon icon-trophy"><view class="icon-shape"></view></view><text>排行榜</text></view>
				<view class="shortcut-item" @click="$emit('competition')"><view class="shortcut-icon icon-crown"><view class="icon-shape"></view></view><text>钓王争霸</text></view>
				<view class="shortcut-item" @click="$emit('fish-card')"><view class="shortcut-icon icon-card"><view class="icon-shape"></view></view><text>极智鱼鉴</text></view>
				<view class="shortcut-item" @click="$emit('mall')"><view class="shortcut-icon icon-bag"><view class="icon-shape"></view></view><text>补给商城</text></view>
				<view class="shortcut-item" @click="$emit('services')"><view class="shortcut-icon icon-grid"><view class="icon-shape"></view></view><text>全部服务</text></view>
			</view>
		</view>

		<view class="news-section">
			<view class="section-heading news-heading">
				<text class="section-title">今日鱼讯</text>
				<view class="section-more" @click="$emit('stocking')"><text>更多</text><text>›</text></view>
			</view>
			<view class="news-layout">
				<view class="stocking-feature" @click="$emit('stocking')">
					<image class="feature-image" :src="stockingImage" mode="aspectFill" />
					<view class="feature-shade"></view>
					<view class="feature-copy"><text>今日放鱼</text><text>{{ stockingWeight }}</text></view>
				</view>
				<view class="event-feature" @click="$emit('competition')">
					<view class="event-copy"><text class="event-title">{{ competitionTitle }}</text><text class="event-status">{{ competitionStatus }}</text></view>
					<view class="event-trophy"><view class="trophy-star">★</view></view>
					<view class="event-water"><view></view><view></view><view></view></view>
				</view>
			</view>
		</view>

		<view class="home-tabbar">
			<view class="tab active"><view class="tab-icon home-icon"></view><text>首页</text></view>
			<view class="tab settle" @click="$emit('checkout')"><view class="settle-button"><view class="tab-scan-icon"></view></view><text>结算钓场</text></view>
			<view class="tab" @click="$emit('mine')"><view class="tab-icon user-icon"></view><text>我的</text></view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ExactHome',
		props: {
			statusBarHeight: { type: Number, default: 20 },
			user: { type: Object, default: null },
			account: { type: Object, default: () => ({ balanceCents: 0, points: 0, coupons: 0 }) },
			pendingOrder: { type: Object, default: null },
			runningOrder: { type: Object, default: null },
			liveSeconds: { type: Number, default: 0 },
			estimate: { type: Object, default: () => ({ amountCents: 0 }) },
			weather: { type: Object, default: null },
			venue: { type: Object, default: null },
			stocking: { type: Object, default: null },
			competition: { type: Object, default: null }
		},
		computed: {
			venueReady() {
				return !!(this.venue && this.venue.venueId)
			},
			venueStatusText() {
				if (!this.venueReady) return '钓场信息加载中'
				return String(this.venue.status == null ? '0' : this.venue.status) === '0' ? '正常开放' : '暂停开放'
			},
			weatherLine() {
				const data = this.weather || {}
				if (data.temp == null || data.temp === '') return '天气信息暂未更新'
				const wind = data.windDir || ''
				const scale = data.windScale != null && data.windScale !== '' ? `${data.windScale}级` : ''
				return `今日 ${data.temp}°C${wind || scale ? ` · ${wind}${scale}` : ''}`
			},
			stockingImage() {
				return (this.stocking && this.stocking.image) || '/static/stocking-carp-v1.jpg'
			},
			stockingWeight() {
				const weight = this.stocking && Number(this.stocking.weightJin)
				return weight > 0 ? `${weight}斤` : '查看最新动态'
			},
			competitionTitle() {
				return (this.competition && this.competition.title) || '暂无赛事'
			},
			competitionStatus() {
				if (!this.competition) return '等待后台发布'
				return ({ 0: '报名中', 1: '进行中', 2: '称重中', 3: '已结束', 4: '已取消' })[this.competition.status] || '查看赛事'
			}
		},
		methods: {
			money(cents) { return (Number(cents || 0) / 100).toFixed(2) },
			duration(seconds) {
				const total = Math.max(0, Number(seconds || 0))
				const h = String(Math.floor(total / 3600)).padStart(2, '0')
				const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
				const s = String(total % 60).padStart(2, '0')
				return `${h}:${m}:${s}`
			}
		}
	}
</script>

<style scoped>
	.exact-home{min-height:100vh;padding-bottom:calc(122rpx + env(safe-area-inset-bottom));background:#f7faf9;color:#123d40;box-sizing:border-box}
	.home-hero{position:relative;height:500rpx;overflow:hidden;background:#0a6667}
	.hero-image,.hero-shade{position:absolute;inset:0;width:100%;height:100%}
	.hero-shade{background:linear-gradient(180deg,rgba(7,44,47,.08) 16%,rgba(7,46,48,.04) 48%,rgba(4,37,40,.6) 100%)}
	.brand{position:absolute;z-index:2;left:32rpx;display:flex;align-items:center;gap:13rpx;color:#f8fbfa;font-size:30rpx;font-weight:800;text-shadow:0 2rpx 8rpx rgba(4,34,36,.25)}
	.brand-logo{width:58rpx;height:58rpx;border:1rpx solid rgba(248,251,250,.78);border-radius:50%;background:#f8fbfa}
	.hero-status{position:absolute;z-index:2;left:34rpx;bottom:92rpx;color:#f8fbfa}.open-status{width:max-content;height:54rpx;padding:0 18rpx;display:flex;align-items:center;gap:12rpx;border:1rpx solid rgba(248,251,250,.38);border-radius:999rpx;background:rgba(5,56,58,.76);font-size:26rpx;font-weight:700}.open-dot{width:15rpx;height:15rpx;border-radius:50%;background:#62d47d;box-shadow:0 0 0 5rpx rgba(98,212,125,.16)}.weather-line{margin-top:17rpx;display:flex;align-items:center;gap:13rpx;font-size:23rpx;font-weight:650;text-shadow:0 2rpx 8rpx rgba(4,34,36,.3)}
	.weather-icon{width:34rpx;height:22rpx;border-radius:14rpx;background:#f8fbfa;position:relative}.weather-icon::before{content:'';position:absolute;left:-3rpx;top:-10rpx;width:21rpx;height:21rpx;border-radius:50%;background:#f0b53c;box-shadow:13rpx 8rpx 0 3rpx #f8fbfa}.weather-icon::after{content:'';position:absolute;right:-6rpx;bottom:0;width:19rpx;height:15rpx;border-radius:50%;background:#f8fbfa}
	.control-sheet{position:relative;z-index:5;margin:-56rpx 20rpx 0;overflow:hidden;border:1rpx solid #dce7e6;border-radius:24rpx;background:#fbfdfc;box-shadow:0 18rpx 42rpx rgba(11,65,67,.12)}
	.primary-actions{height:128rpx;padding:18rpx 22rpx 12rpx;display:flex;align-items:center;box-sizing:border-box}.scan-action{height:92rpx;flex:1;display:flex;align-items:center;justify-content:center;gap:20rpx;border-radius:17rpx;background:#0aa5a2;color:#f7fbfa;font-size:29rpx;font-weight:900}.scan-icon{width:42rpx;height:42rpx;position:relative;background:linear-gradient(currentColor,currentColor) left top/14rpx 4rpx no-repeat,linear-gradient(currentColor,currentColor) left top/4rpx 14rpx no-repeat,linear-gradient(currentColor,currentColor) right top/14rpx 4rpx no-repeat,linear-gradient(currentColor,currentColor) right top/4rpx 14rpx no-repeat,linear-gradient(currentColor,currentColor) left bottom/14rpx 4rpx no-repeat,linear-gradient(currentColor,currentColor) left bottom/4rpx 14rpx no-repeat,linear-gradient(currentColor,currentColor) right bottom/14rpx 4rpx no-repeat,linear-gradient(currentColor,currentColor) right bottom/4rpx 14rpx no-repeat}.scan-icon view{position:absolute;left:7rpx;right:7rpx;top:19rpx;height:4rpx;border-radius:99rpx;background:currentColor}
	.settle-action{width:42%;height:72rpx;margin-left:24rpx;padding-left:24rpx;display:flex;align-items:center;justify-content:center;gap:14rpx;border-left:1rpx solid #dbe6e5;color:#153f42;font-size:25rpx;font-weight:850}.receipt-icon{width:34rpx;height:39rpx;border:4rpx solid #0a5f61;border-radius:4rpx;position:relative;box-sizing:border-box}.receipt-icon::before,.receipt-icon::after,.receipt-icon view{content:'';position:absolute;left:6rpx;right:6rpx;height:3rpx;border-radius:9rpx;background:#0a5f61}.receipt-icon::before{top:8rpx}.receipt-icon::after{top:16rpx}.receipt-icon view{top:24rpx}
	.secondary-actions{padding:0 22rpx 18rpx;display:grid;grid-template-columns:1fr 1fr;gap:12rpx}.secondary-action{height:92rpx;padding:0 16rpx;display:flex;align-items:center;min-width:0;border:1rpx solid #cbe3e1;border-radius:14rpx;background:#eaf7f5;box-sizing:border-box}.secondary-action:active{background:#dff1ef}.secondary-action-icon{width:54rpx;height:54rpx;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:12rpx;background:#0aa5a2;color:#f7fbfa}.secondary-action-copy{min-width:0;margin-left:12rpx;display:flex;flex-direction:column}.secondary-action-copy text:first-child{color:#143f42;font-size:23rpx;font-weight:900;white-space:nowrap}.secondary-action-copy text:last-child{margin-top:3rpx;color:#698082;font-size:17rpx;white-space:nowrap}.points-action{border-color:#ecd7ad;background:#fff8e9}.points-action:active{background:#fff1d5}.points-action .secondary-action-icon{background:#e7a72b;color:#fffaf0}.points-star{font-size:26rpx}.weigh-scale{width:34rpx;height:33rpx;position:relative;box-sizing:border-box}.weigh-scale::before{content:'';position:absolute;left:1rpx;right:1rpx;bottom:0;height:22rpx;border:3rpx solid currentColor;border-radius:6rpx;box-sizing:border-box}.weigh-scale::after{content:'';position:absolute;left:8rpx;top:0;width:18rpx;height:18rpx;border:3rpx solid currentColor;border-radius:50%;background:#0aa5a2;box-sizing:border-box}.weigh-scale view{position:absolute;z-index:1;left:16rpx;top:4rpx;width:3rpx;height:7rpx;border-radius:99rpx;background:currentColor;transform:rotate(35deg);transform-origin:bottom}
	.sheet-divider{height:1rpx;margin:0 22rpx;background:#e2eae9}.account-strip{height:104rpx;display:flex;align-items:center}.account-cell{flex:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5rpx}.account-label{color:#76888a;font-size:20rpx}.account-value{color:#0b4b4d;font-size:30rpx;font-weight:900;font-variant-numeric:tabular-nums}.account-divider{width:1rpx;height:50rpx;background:#dce6e5}
	.order-banner{height:78rpx;margin:16rpx 20rpx 0;padding:0 20rpx;display:flex;align-items:center;justify-content:space-between;border:1rpx solid #e9c98f;border-radius:15rpx;background:#fff9ef;box-sizing:border-box}.order-banner.running{border-color:#aed8d5;background:#edf9f7}.order-main{display:flex;align-items:center;min-width:0}.order-title{font-size:22rpx;font-weight:800}.order-amount{margin-left:15rpx;color:#d97e17;font-size:26rpx;font-weight:900}.running .order-amount,.running .order-link{color:#078f8d}.order-link{color:#d97e17;font-size:21rpx;font-weight:800}.order-icon{width:34rpx;height:30rpx;margin-right:12rpx;position:relative;color:#d7892b}.wallet-order{border:3rpx solid currentColor;border-radius:5rpx;box-sizing:border-box}.wallet-order::after{content:'';position:absolute;right:-4rpx;top:7rpx;width:13rpx;height:11rpx;border-radius:4rpx;background:currentColor}.timer-order{border:3rpx solid #078f8d;border-radius:50%;box-sizing:border-box}.timer-order::before{content:'';position:absolute;left:13rpx;top:5rpx;width:3rpx;height:10rpx;background:#078f8d;transform:rotate(25deg);transform-origin:bottom}
	.shortcut-section{padding:38rpx 24rpx 12rpx}.section-heading{min-height:52rpx;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box}.section-title{font-size:31rpx;font-weight:900;line-height:1.2;color:#17383b}.shortcut-grid{margin-top:20rpx;display:grid;grid-template-columns:repeat(4,1fr);row-gap:30rpx}.shortcut-item{min-height:112rpx;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;color:#263f42;font-size:21rpx;font-weight:700}.shortcut-icon{width:72rpx;height:72rpx;margin-bottom:12rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#e7f5f4;color:#07696b}.icon-shape{position:relative;box-sizing:border-box}
	.icon-calendar .icon-shape{width:34rpx;height:32rpx;border:4rpx solid currentColor;border-radius:5rpx}.icon-calendar .icon-shape::before{content:'';position:absolute;left:3rpx;right:3rpx;top:7rpx;border-top:4rpx solid currentColor}.icon-calendar .icon-shape::after{content:'';position:absolute;left:6rpx;top:-8rpx;width:4rpx;height:10rpx;background:currentColor;box-shadow:14rpx 0 0 currentColor}
	.icon-fish .icon-shape{width:36rpx;height:21rpx;border-radius:60% 45% 45% 60%;background:currentColor}.icon-fish .icon-shape::before{content:'';position:absolute;left:-13rpx;top:2rpx;border-top:9rpx solid transparent;border-bottom:9rpx solid transparent;border-right:14rpx solid currentColor}.icon-fish .icon-shape::after{content:'';position:absolute;right:7rpx;top:7rpx;width:4rpx;height:4rpx;border-radius:50%;background:#e7f5f4}
	.icon-chat .icon-shape{width:37rpx;height:30rpx;border:4rpx solid currentColor;border-radius:10rpx}.icon-chat .icon-shape::before{content:'';position:absolute;left:6rpx;bottom:-9rpx;border-top:10rpx solid currentColor;border-right:10rpx solid transparent}.icon-chat .icon-shape::after{content:'···';position:absolute;left:3rpx;right:3rpx;top:-12rpx;text-align:center;font-size:25rpx;font-weight:900;letter-spacing:1rpx}
	.icon-trophy .icon-shape{width:32rpx;height:27rpx;border-radius:4rpx 4rpx 12rpx 12rpx;background:currentColor}.icon-trophy .icon-shape::before,.icon-trophy .icon-shape::after{content:'';position:absolute;top:4rpx;width:12rpx;height:16rpx;border:4rpx solid currentColor}.icon-trophy .icon-shape::before{left:-11rpx;border-right:0;border-radius:8rpx 0 0 8rpx}.icon-trophy .icon-shape::after{right:-11rpx;border-left:0;border-radius:0 8rpx 8rpx 0}.icon-trophy{background:#fff2dc;color:#9d670b}
	.icon-crown .icon-shape{width:39rpx;height:30rpx;background:currentColor;clip-path:polygon(0 10%,25% 62%,50% 0,75% 62%,100% 10%,88% 100%,12% 100%)}.icon-crown{background:#fff2dc;color:#a66b0a}
	.icon-card .icon-shape{width:34rpx;height:42rpx;border:4rpx solid currentColor;border-radius:5rpx;transform:rotate(-5deg)}.icon-card .icon-shape::before{content:'';position:absolute;left:7rpx;top:7rpx;width:12rpx;height:9rpx;border-radius:60% 45% 45% 60%;background:currentColor}.icon-card .icon-shape::after{content:'';position:absolute;left:7rpx;right:7rpx;bottom:8rpx;border-top:3rpx solid currentColor;box-shadow:0 -7rpx 0 currentColor}
	.icon-person .icon-shape{width:38rpx;height:39rpx}.icon-person .icon-shape::before{content:'';position:absolute;left:11rpx;top:0;width:16rpx;height:16rpx;border:4rpx solid currentColor;border-radius:50%;box-sizing:border-box}.icon-person .icon-shape::after{content:'';position:absolute;left:2rpx;right:2rpx;bottom:0;height:18rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:20rpx 20rpx 0 0;box-sizing:border-box}
	.icon-bag .icon-shape{width:34rpx;height:34rpx;border:4rpx solid currentColor;border-radius:5rpx}.icon-bag .icon-shape::before{content:'';position:absolute;left:7rpx;top:-12rpx;width:12rpx;height:12rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:10rpx 10rpx 0 0;box-sizing:border-box}
	.icon-grid .icon-shape{width:15rpx;height:15rpx;border:4rpx solid currentColor;border-radius:4rpx;box-sizing:border-box;box-shadow:23rpx 0 0 -4rpx #e7f5f4,23rpx 0 0 0 currentColor,0 23rpx 0 -4rpx #e7f5f4,0 23rpx 0 0 currentColor,23rpx 23rpx 0 -4rpx #e7f5f4,23rpx 23rpx 0 0 currentColor}.icon-grid .icon-shape{margin-left:-22rpx;margin-top:-22rpx}
	.news-section{padding:24rpx 24rpx 36rpx}.news-heading{height:auto;min-height:88rpx;padding:26rpx 0 18rpx;border-top:1rpx solid #dde7e6;align-items:flex-end;box-sizing:border-box}.section-more{display:flex;align-items:center;gap:7rpx;color:#7a8b8c;font-size:21rpx;line-height:1.2}.section-more text:last-child{font-size:30rpx}.news-layout{height:270rpx;margin-top:12rpx;display:grid;grid-template-columns:1.65fr 1fr;gap:14rpx}.stocking-feature,.event-feature{position:relative;overflow:hidden;border-radius:18rpx}.feature-image,.feature-shade{position:absolute;inset:0;width:100%;height:100%}.feature-shade{background:linear-gradient(180deg,rgba(8,38,40,.04) 25%,rgba(5,34,36,.72) 100%)}.feature-copy{position:absolute;z-index:2;left:20rpx;bottom:18rpx;display:flex;flex-direction:column;color:#f8fbfa}.feature-copy text:first-child{font-size:23rpx;font-weight:750}.feature-copy text:last-child{margin-top:3rpx;font-size:40rpx;font-weight:900;line-height:1.05}
	.event-feature{padding:24rpx 18rpx;background:#fff0d5;color:#8c5206;box-sizing:border-box}.event-copy{position:relative;z-index:3}.event-title{display:block;overflow:hidden;font-size:25rpx;font-weight:900;line-height:1.25;white-space:nowrap;text-overflow:ellipsis}.event-status{display:inline-flex;margin-top:12rpx;padding:7rpx 12rpx;border-radius:7rpx;background:#dc8320;color:#fff8ed;font-size:18rpx;font-weight:800}.event-trophy{position:absolute;z-index:2;right:25rpx;bottom:32rpx;width:62rpx;height:56rpx;border-radius:8rpx 8rpx 18rpx 18rpx;background:#dba13d;color:#dba13d}.event-trophy::before,.event-trophy::after{content:'';position:absolute;top:7rpx;width:18rpx;height:28rpx;border:6rpx solid currentColor}.event-trophy::before{left:-18rpx;border-right:0;border-radius:14rpx 0 0 14rpx}.event-trophy::after{right:-18rpx;border-left:0;border-radius:0 14rpx 14rpx 0}.trophy-star{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff0bd;font-size:25rpx}.event-water{position:absolute;left:0;right:0;bottom:0;height:66rpx;opacity:.42}.event-water view{position:absolute;left:-15%;width:130%;height:45rpx;border-radius:50%;border-top:3rpx solid #ce9f55}.event-water view:nth-child(1){bottom:-14rpx}.event-water view:nth-child(2){bottom:-27rpx;transform:translateX(12%)}.event-water view:nth-child(3){bottom:-40rpx;transform:translateX(-10%)}
	.home-tabbar{position:fixed;z-index:20;left:0;right:0;bottom:0;height:calc(112rpx + env(safe-area-inset-bottom));padding:5rpx 72rpx env(safe-area-inset-bottom);display:flex;align-items:flex-start;justify-content:space-between;border-top:1rpx solid #dce6e5;background:rgba(251,253,252,.98);box-sizing:border-box}.tab{width:112rpx;height:96rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6rpx;color:#7e8e90;font-size:20rpx}.tab.active{color:#079f9c;font-weight:800}.tab-icon{width:32rpx;height:32rpx;position:relative;color:currentColor}.home-icon{margin-top:8rpx;height:25rpx;border:4rpx solid currentColor;border-top:0}.home-icon::before{content:'';position:absolute;left:1rpx;top:-11rpx;width:21rpx;height:21rpx;border:4rpx solid currentColor;border-right:0;border-bottom:0;transform:rotate(45deg)}.user-icon::before{content:'';position:absolute;left:9rpx;top:0;width:14rpx;height:14rpx;border:4rpx solid currentColor;border-radius:50%}.user-icon::after{content:'';position:absolute;left:2rpx;bottom:0;width:28rpx;height:15rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:18rpx 18rpx 0 0}.settle{position:relative;color:#16494b;font-weight:800}.settle-button{width:80rpx;height:80rpx;margin-top:-30rpx;display:flex;align-items:center;justify-content:center;border:7rpx solid #f7faf9;border-radius:50%;background:#08aaa6;color:#f8fbfa;box-shadow:0 6rpx 18rpx rgba(6,92,93,.18);box-sizing:border-box}.tab-scan-icon{width:32rpx;height:32rpx;position:relative;background:linear-gradient(currentColor,currentColor) left top/11rpx 3rpx no-repeat,linear-gradient(currentColor,currentColor) left top/3rpx 11rpx no-repeat,linear-gradient(currentColor,currentColor) right top/11rpx 3rpx no-repeat,linear-gradient(currentColor,currentColor) right top/3rpx 11rpx no-repeat,linear-gradient(currentColor,currentColor) left bottom/11rpx 3rpx no-repeat,linear-gradient(currentColor,currentColor) left bottom/3rpx 11rpx no-repeat,linear-gradient(currentColor,currentColor) right bottom/11rpx 3rpx no-repeat,linear-gradient(currentColor,currentColor) right bottom/3rpx 11rpx no-repeat}.tab-scan-icon::after{content:'';position:absolute;left:6rpx;right:6rpx;top:14rpx;height:3rpx;border-radius:99rpx;background:currentColor}
	@media (max-width:360px){.home-hero{height:470rpx}.control-sheet{margin-left:16rpx;margin-right:16rpx}.primary-actions{padding-left:16rpx;padding-right:16rpx}.settle-action{margin-left:15rpx;padding-left:15rpx;font-size:23rpx}.secondary-actions{padding-left:16rpx;padding-right:16rpx;gap:9rpx}.secondary-action{padding-left:11rpx;padding-right:10rpx}.secondary-action-copy{margin-left:9rpx}.secondary-action-copy text:first-child{font-size:21rpx}.secondary-action-copy text:last-child{font-size:16rpx}.shortcut-section,.news-section{padding-left:18rpx;padding-right:18rpx}.shortcut-grid{row-gap:24rpx}.shortcut-item{font-size:19rpx}.news-layout{height:246rpx}.event-feature{padding-left:14rpx;padding-right:14rpx}.event-title{font-size:22rpx}.home-tabbar{padding-left:56rpx;padding-right:56rpx}}
	.open-dot.muted{background:#f0b53c;box-shadow:0 0 0 5rpx rgba(240,181,60,.16)}
</style>
