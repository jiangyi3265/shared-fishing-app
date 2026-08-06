<template>
	<view :class="['brand-header', 'theme-' + theme, 'layout-' + layout, { 'has-scene': scene }]">
		<view :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="brand-nav" :style="{ height: navBarHeight + 'px' }">
			<view v-if="back" class="brand-back" role="button" aria-label="返回上一页" hover-class="brand-back-pressed" @click="goBack">
				<view class="brand-back-icon"></view>
			</view>
			<view v-else-if="showBrand" class="brand-lockup">
				<image class="brand-lockup-logo" src="/static/logo-mark.svg" mode="aspectFit"></image>
				<text class="brand-lockup-name">{{ brandName }}</text>
			</view>
			<text v-if="layout === 'compact' || back" class="brand-page-title">{{ title }}</text>
		</view>
		<view v-if="layout === 'stacked' && !back" class="brand-stacked-title">
			<view v-if="backOnTitle" class="brand-stacked-back" role="button" aria-label="返回上一页" hover-class="brand-back-pressed" @click="goBack"><view class="brand-chevron"></view></view>
			<text>{{ title }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'BrandHeader',
		props: {
			title: { type: String, default: '' },
			brandName: { type: String, default: '共享钓场' },
			theme: { type: String, default: 'teal' },
			layout: { type: String, default: 'compact' },
			back: { type: Boolean, default: false },
			backOnTitle: { type: Boolean, default: false },
			scene: { type: Boolean, default: false },
			showBrand: { type: Boolean, default: true }
		},
		data() {
			return { statusBarHeight: 20, navBarHeight: 44 }
		},
		created() {
			try {
				const system = uni.getSystemInfoSync()
				this.statusBarHeight = Number(system.statusBarHeight || 20)
				// #ifdef MP-WEIXIN
				const capsule = wx.getMenuButtonBoundingClientRect()
				if (capsule && capsule.height) this.navBarHeight = (capsule.top - this.statusBarHeight) * 2 + capsule.height
				// #endif
			} catch (e) {}
		},
		methods: {
			goBack() {
				const pages = getCurrentPages()
				if (pages.length > 1) uni.navigateBack()
				else uni.reLaunch({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style>
	.brand-header {
		position: relative;
		z-index: 30;
		width: 100vw;
		max-width: none;
		margin-left: calc(50% - 50vw);
		box-sizing: border-box;
	}

	.theme-teal {
		background: var(--g-600);
		color: #f8fffe;
	}

	.theme-teal.has-scene {
		background-image: linear-gradient(90deg, rgba(4, 142, 143, 0.90), rgba(8, 184, 178, 0.82)), url('/static/hero-lake.jpg');
		background-position: center 44%;
		background-size: cover;
	}

	.theme-light {
		background: var(--surface-strong);
		color: var(--ink);
		border-bottom: 1rpx solid var(--line);
	}

	.brand-nav {
		position: relative;
		display: flex;
		align-items: center;
		padding: 0 196rpx 0 28rpx;
		box-sizing: border-box;
	}

	.brand-lockup {
		display: flex;
		align-items: center;
		gap: 14rpx;
		min-width: 0;
	}

	.brand-lockup-logo {
		width: 58rpx;
		height: 58rpx;
		border: 1rpx solid var(--line);
		border-radius: 14rpx;
		background: var(--surface-strong);
	}

	.brand-lockup-name {
		font-size: 27rpx;
		font-weight: 800;
		white-space: nowrap;
	}

	.brand-page-title {
		position: absolute;
		left: 0;
		right: 0;
		pointer-events: none;
		font-size: 30rpx;
		font-weight: 800;
		text-align: center;
	}

	.layout-compact .brand-lockup + .brand-page-title {
		left: 300rpx;
		right: 190rpx;
		text-align: left;
	}

	.brand-stacked-title {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 82rpx;
		font-size: 31rpx;
		font-weight: 800;
	}

	.brand-stacked-back {
		position: absolute;
		left: 16rpx;
		top: 0;
		bottom: 0;
		width: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.brand-chevron {
		width: 22rpx;
		height: 22rpx;
		border-left: 4rpx solid currentColor;
		border-bottom: 4rpx solid currentColor;
		transform: rotate(45deg);
	}

	.brand-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 88rpx;
		height: 88rpx;
		margin-left: -20rpx;
		border-radius: 50%;
	}

	.brand-back-icon {
		width: 22rpx;
		height: 22rpx;
		border-left: 4rpx solid currentColor;
		border-bottom: 4rpx solid currentColor;
		transform: translateX(4rpx) rotate(45deg);
	}

	.brand-back-pressed {
		background: rgba(6, 72, 75, 0.10);
		opacity: 0.72;
	}

	@media (max-width: 360px) {
		.brand-nav {
			padding-left: 22rpx;
			padding-right: 178rpx;
		}

		.brand-lockup-logo {
			width: 52rpx;
			height: 52rpx;
		}

		.brand-lockup-name {
			font-size: 24rpx;
		}

		.layout-compact .brand-lockup + .brand-page-title {
			left: 270rpx;
			right: 176rpx;
			font-size: 27rpx;
		}
	}
</style>
