<template>
	<view class="exact-mine">
		<view class="mine-header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="brand-row" :style="{ height: navBarHeight + 'px' }">
				<image src="/static/logo-mark.svg" mode="aspectFit" /><text>共享钓场</text>
			</view>
			<view class="account-card" @click="$emit(loggedIn ? 'settings' : 'login')">
				<view class="profile-row">
					<image class="avatar" :src="user && user.avatar ? user.avatar : '/static/logo-mark.svg'" mode="aspectFill" />
					<view class="profile-copy">
						<view class="name-row">
							<text class="nickname">{{ displayName }}</text>
							<text v-if="needsNickname" class="nickname-cta">设置昵称</text>
						</view>
						<view class="member-tag"><view class="crown"></view><text>{{ loggedIn ? '普通会员' : '登录后查看会员权益' }}</text></view>
					</view>
					<text class="arrow">›</text>
				</view>
				<view class="stats-row">
					<view><text class="stat-number pending">{{ stats.pendingCount }}</text><text>待支付</text></view>
					<view class="divider"></view>
					<view><text class="stat-number">{{ stats.paidCount }}</text><text>已完成</text></view>
					<view class="divider"></view>
					<view><text class="stat-number">¥{{ money(stats.totalAmount) }}</text><text>累计消费</text></view>
				</view>
			</view>
		</view>

		<view v-if="stats.pendingCount > 0" class="pending-card" @click="$emit('pay')">
			<view><text>您有 <text class="pending-count">{{ stats.pendingCount }}</text> 笔订单待支付</text><text>请尽快完成支付，避免订单取消</text></view>
			<text class="pending-btn">立即支付</text>
		</view>

		<view class="menu-card">
			<view v-for="item in tools" :key="item.name" class="menu-row" @click="$emit('tool', item)">
				<view class="menu-icon"><view :class="['glyph', item.icon]"></view></view>
				<text class="menu-name">{{ item.name }}</text>
				<text v-if="item.value" class="menu-value">{{ item.value }}</text>
				<text class="menu-arrow">›</text>
			</view>
		</view>

		<view v-if="loggedIn" class="secondary-row" @click="$emit('logout')">退出登录</view>

		<view class="mine-tabbar">
			<view class="tab" @click="$emit('home')"><view class="tab-icon home-icon"></view><text>首页</text></view>
			<view class="tab settle" @click="$emit('checkout')"><view class="settle-icon"></view><text>结算钓场</text></view>
			<view class="tab active"><view class="tab-icon user-icon"></view><text>我的</text></view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ExactMine',
		props: {
			statusBarHeight: { type: Number, default: 20 },
			navBarHeight: { type: Number, default: 44 },
			user: { type: Object, default: null },
			loggedIn: { type: Boolean, default: false },
			stats: { type: Object, default: () => ({ pendingCount: 0, paidCount: 0, totalAmount: 0 }) },
			tools: { type: Array, default: () => [] }
		},
		computed: {
			displayName() {
				if (!this.user) return '游客'
				return this.user.nickname || this.user.name || '钓友'
			},
			// 微信不再静默下发昵称，未填写的账号会落到 “钓友_1234”，这里提示去设置页补一次
			needsNickname() {
				if (!this.loggedIn || !this.user) return false
				const name = this.user.nickname || this.user.name || ''
				return !name || /^钓友_\d+$/.test(name)
			}
		},
		methods: { money(cents) { return (Number(cents || 0) / 100).toFixed(2) } }
	}
</script>

<style scoped>
	.exact-mine{min-height:100vh;padding-bottom:calc(108rpx + env(safe-area-inset-bottom));background:#f5fbfa;color:#0b3134;box-sizing:border-box}
	.mine-header{padding-bottom:22rpx;background:#08b8b2}
	.brand-row{padding:0 196rpx 0 24rpx;display:flex;align-items:center;gap:13rpx;color:#fff;font-size:28rpx;font-weight:800;box-sizing:border-box}
	.brand-row image{width:56rpx;height:56rpx;border:1rpx solid rgba(255,255,255,.72);border-radius:12rpx;background:#fff}
	.account-card{margin:8rpx 16rpx 0;overflow:hidden;border-radius:15rpx;background:#fff;box-shadow:0 10rpx 24rpx rgba(4,90,92,.10)}
	.profile-row{height:112rpx;padding:0 19rpx;display:flex;align-items:center}
	.avatar{width:66rpx;height:66rpx;border:1rpx solid #b9dcda;border-radius:50%;background:#eef9f8}
	.profile-copy{flex:1;min-width:0;margin-left:15rpx;display:flex;flex-direction:column;gap:7rpx}
	.name-row{display:flex;align-items:center;gap:10rpx;min-width:0}
	.nickname{min-width:0;overflow:hidden;font-size:28rpx;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.nickname-cta{padding:3rpx 10rpx;flex-shrink:0;border:1rpx solid #b6e2df;border-radius:6rpx;background:#e6f7f5;color:#078f91;font-size:17rpx;font-weight:800}.member-tag{width:max-content;padding:4rpx 9rpx;display:flex;align-items:center;gap:6rpx;border:1rpx solid #f1c879;border-radius:6rpx;background:#fff8e9;color:#ac6900;font-size:18rpx}
	.crown{width:18rpx;height:13rpx;border-radius:0 0 3rpx 3rpx;background:#d79519;position:relative}.crown:before{content:'';position:absolute;left:0;top:-8rpx;border-left:5rpx solid transparent;border-right:5rpx solid transparent;border-bottom:10rpx solid #d79519;box-shadow:8rpx 0 0 -1rpx #d79519}
	.arrow{color:#83999b;font-size:36rpx}
	.stats-row{height:88rpx;display:flex;align-items:center;border-top:1rpx solid #dce9e8}
	.stats-row>view:not(.divider){flex:1;display:flex;flex-direction:column;align-items:center;gap:5rpx;color:#718688;font-size:18rpx}.stat-number{color:#078f91;font-size:27rpx;font-weight:900;font-variant-numeric:tabular-nums}.stat-number.pending{color:#ef8b00}.divider{width:1rpx;height:48rpx;background:#dce9e8}
	.pending-card{margin:14rpx 16rpx 0;padding:16rpx 18rpx;display:flex;align-items:center;justify-content:space-between;border:1rpx solid #efc677;border-radius:11rpx;background:#fff9ed}.pending-card>view{display:flex;flex-direction:column;gap:4rpx;font-size:20rpx}.pending-card>view>text:last-child{color:#7e8583;font-size:17rpx}.pending-count{color:#ed8100;font-weight:900}.pending-btn{padding:10rpx 15rpx;border-radius:7rpx;background:#ee8d00;color:#fff;font-size:19rpx;font-weight:800}
	.menu-card{margin:14rpx 16rpx 0;padding:0 16rpx;overflow:hidden;border:1rpx solid #d8e7e6;border-radius:13rpx;background:#fff}
	.menu-row{height:70rpx;display:flex;align-items:center;border-bottom:1rpx solid #e0ebe9}.menu-row:last-child{border-bottom:0}
	.menu-icon{width:44rpx;height:44rpx;margin-right:12rpx;display:flex;align-items:center;justify-content:center;border-radius:9rpx;background:#eaf8f7;color:#079b99}.glyph{width:25rpx;height:25rpx;background-position:center;background-repeat:no-repeat;background-size:25rpx}
	.menu-name{flex:1;font-size:23rpx;font-weight:800}.menu-value{margin-right:9rpx;color:#6f8587;font-size:18rpx}.menu-arrow{color:#8ea2a4;font-size:31rpx}
	.hic-order{border:3rpx solid currentColor;border-radius:3rpx;position:relative}.hic-order:after{content:'';position:absolute;left:4rpx;right:4rpx;top:5rpx;height:3rpx;background:currentColor;box-shadow:0 7rpx 0 currentColor}
	.hic-coupon{border:3rpx solid currentColor;border-radius:3rpx;position:relative}.hic-coupon:before,.hic-coupon:after{content:'';position:absolute;top:5rpx;width:6rpx;height:6rpx;border-radius:50%;background:#eaf8f7}.hic-coupon:before{left:-5rpx}.hic-coupon:after{right:-5rpx}
	.hic-member{position:relative;border-bottom:9rpx solid currentColor}.hic-member:before{content:'';position:absolute;left:1rpx;top:2rpx;border-left:11rpx solid transparent;border-right:11rpx solid transparent;border-bottom:16rpx solid currentColor}
	.hic-coin{border:4rpx solid currentColor;border-radius:50%;position:relative}.hic-coin:after{content:'¥';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14rpx;font-weight:900}
	.hic-wallet{border:3rpx solid currentColor;border-radius:4rpx;position:relative}.hic-wallet:after{content:'';position:absolute;right:-3rpx;top:6rpx;width:10rpx;height:8rpx;border:3rpx solid currentColor;border-radius:3rpx;background:#eaf8f7}
	.hic-workbench{border:3rpx solid currentColor;border-radius:3rpx;position:relative}.hic-workbench:before{content:'';position:absolute;left:5rpx;right:5rpx;top:-8rpx;height:7rpx;border:3rpx solid currentColor;border-bottom:0;border-radius:5rpx 5rpx 0 0}.hic-workbench:after{content:'';position:absolute;left:0;right:0;top:7rpx;border-top:3rpx solid currentColor}
	.hic-services{position:relative}.hic-services:before{content:'';position:absolute;left:1rpx;top:1rpx;width:8rpx;height:8rpx;border:3rpx solid currentColor;border-radius:3rpx;box-shadow:14rpx 0 0 -3rpx #eaf8f7,14rpx 0 0 0 currentColor,0 14rpx 0 -3rpx #eaf8f7,0 14rpx 0 0 currentColor,14rpx 14rpx 0 -3rpx #eaf8f7,14rpx 14rpx 0 0 currentColor}
	.secondary-row{height:70rpx;margin:14rpx 16rpx 0;display:flex;align-items:center;justify-content:center;border:1rpx solid #d8e7e6;border-radius:12rpx;background:#fff;color:#d94f49;font-size:22rpx}
	.mine-tabbar{position:fixed;z-index:20;left:0;right:0;bottom:0;height:calc(102rpx + env(safe-area-inset-bottom));padding:5rpx 72rpx env(safe-area-inset-bottom);display:flex;align-items:flex-start;justify-content:space-between;border-top:1rpx solid #dce9e8;background:rgba(255,255,255,.98);box-sizing:border-box}
	.tab{width:112rpx;height:88rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5rpx;color:#7d9092;font-size:20rpx}.tab.active{color:#08a8a4;font-weight:700}.tab-icon{width:32rpx;height:32rpx;position:relative;color:currentColor}.home-icon{margin-top:8rpx;height:25rpx;border:4rpx solid currentColor;border-top:0}.home-icon:before{content:'';position:absolute;left:1rpx;top:-11rpx;width:21rpx;height:21rpx;border:4rpx solid currentColor;border-right:0;border-bottom:0;transform:rotate(45deg)}.user-icon:before{content:'';position:absolute;left:9rpx;top:0;width:14rpx;height:14rpx;border:4rpx solid currentColor;border-radius:50%}.user-icon:after{content:'';position:absolute;left:2rpx;bottom:0;width:28rpx;height:15rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:18rpx 18rpx 0 0}.settle-icon{width:32rpx;height:32rpx;border:4rpx solid currentColor;border-radius:50%;position:relative}.settle-icon:before{content:'';position:absolute;left:14rpx;top:4rpx;width:4rpx;height:12rpx;background:currentColor}.settle-icon:after{content:'';position:absolute;left:14rpx;top:15rpx;width:9rpx;height:4rpx;background:currentColor;transform:rotate(25deg);transform-origin:left}
	@media (max-width:360px){.brand-row{padding-left:20rpx}.mine-tabbar{padding-left:56rpx;padding-right:56rpx}.menu-row{height:66rpx}}
</style>
