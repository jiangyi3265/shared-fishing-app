<template>
	<view class="community-tabbar">
		<view v-for="item in items" :key="item.key" class="community-tab" :class="{ active: active === item.key }" @click="go(item)">
			<view class="community-icon" :class="'icon-' + item.key"><text v-if="item.key === 'rank'">★</text></view>
			<text class="community-label">{{ item.label }}</text>
		</view>
	</view>
</template>

<script>
export default {
	props: { active: { type: String, default: '' } },
	data() {
		return {
			items: [
				{ key: 'home', label: '首页', url: '/pages/index/index' },
				{ key: 'catch', label: '钓获社区', url: '/pages/catch/catch' },
				{ key: 'rank', label: '钓王榜', url: '/pages/rank/rank' },
				{ key: 'mine', label: '我的', url: '/pages/mine/mine' }
			]
		}
	},
	methods: {
		go(item) {
			if (item.key === this.active) return
			uni.reLaunch({ url: item.url })
		}
	}
}
</script>

<style scoped>
.community-tabbar{position:fixed;z-index:90;left:0;right:0;bottom:0;height:calc(102rpx + env(safe-area-inset-bottom));padding:8rpx 36rpx env(safe-area-inset-bottom);box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;background:rgba(255,255,255,.98);border-top:1rpx solid #dce7e6}.community-tab{width:116rpx;height:84rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5rpx;color:#53696b}.community-label{font-size:21rpx;line-height:1.1}.community-icon{position:relative;width:38rpx;height:38rpx;box-sizing:border-box;color:currentColor}.community-tab.active{color:#08a9a5}.icon-home{margin-top:7rpx;width:30rpx;height:27rpx;border:4rpx solid currentColor;border-top:0;border-radius:3rpx}.icon-home::before{content:'';position:absolute;left:-4rpx;top:-10rpx;width:24rpx;height:24rpx;border:4rpx solid currentColor;border-right:0;border-bottom:0;transform:rotate(45deg);border-radius:3rpx}.icon-catch{border:4rpx solid currentColor;border-radius:50%}.icon-catch::before,.icon-catch::after{content:'';position:absolute;left:8rpx;right:8rpx;height:4rpx;border-radius:99rpx;background:currentColor}.icon-catch::before{top:10rpx}.icon-catch::after{top:21rpx}.icon-rank{width:42rpx;height:31rpx;margin-top:6rpx;border:4rpx solid currentColor;border-top:0;border-radius:0 0 5rpx 5rpx}.icon-rank::before{content:'';position:absolute;left:-4rpx;top:-12rpx;width:0;height:0;border-left:12rpx solid transparent;border-right:12rpx solid transparent;border-bottom:18rpx solid currentColor}.icon-rank text{position:absolute;z-index:2;left:8rpx;top:-4rpx;color:#fff;font-size:14rpx}.icon-user::before{content:'';position:absolute;left:11rpx;top:1rpx;width:16rpx;height:16rpx;border:4rpx solid currentColor;border-radius:50%;box-sizing:border-box}.icon-user::after{content:'';position:absolute;left:4rpx;bottom:1rpx;width:30rpx;height:18rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:18rpx 18rpx 0 0;box-sizing:border-box}
</style>
