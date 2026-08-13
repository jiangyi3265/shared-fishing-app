<template>
	<view class="app services-page has-brand-header">
		<brand-header title="全部服务" theme="teal" layout="compact" :back="true" />
		<view class="search-band">
			<view class="search-box">
				<view class="search-icon"></view>
				<input v-model.trim="keyword" class="search-input" type="text" maxlength="20" confirm-type="search" placeholder="搜索计时、钓位、商城或帮助" placeholder-class="search-placeholder" />
				<view v-if="keyword" class="search-clear" @click="keyword=''">×</view>
			</view>
		</view>

		<view class="service-body">
			<view v-if="keyword" class="search-results-section">
				<view class="section-heading">
					<text class="section-title">搜索结果</text>
					<text class="section-caption">{{ searchResults.length }} 项服务</text>
				</view>
				<view v-if="searchResults.length" class="compact-list search-result-list">
					<view v-for="item in searchResults" :key="item.url" class="compact-row" @click="openService(item)">
						<view class="row-mark">{{ item.mark }}</view>
						<view class="row-copy"><text>{{ displayLabel(item) }}</text><text>{{ item.desc }}</text></view>
						<text class="row-arrow">›</text>
					</view>
				</view>
				<view v-else class="search-empty">
					<view class="empty-search-icon"></view>
					<text>没有找到相关服务</text>
					<text>可以搜索“计时”“钱包”“退款”等关键词</text>
				</view>
			</view>

			<view v-else class="service-sections">
				<view class="core-section">
					<view class="section-heading core-heading">
						<text class="section-title">核心流程</text>
						<text class="section-caption">从下竿到结算</text>
					</view>
					<view class="core-flow">
						<view class="flow-line"></view>
						<view v-for="(item,index) in coreItems" :key="item.url" :class="['core-step',{active:index===0}]" @click="openService(item)">
							<view :class="['core-icon','core-icon-'+index]"><view></view></view>
							<text>{{ displayLabel(item) }}</text>
						</view>
					</view>
				</view>

				<view v-if="weighItem" class="weigh-service-entry" @click="openService(weighItem)">
					<view class="weigh-service-icon"><view class="weigh-service-scale"><view></view></view></view>
					<view class="weigh-service-copy">
						<text>鱼获称重</text>
						<text>录入电子秤重量，自动计算鱼获金额</text>
					</view>
					<text class="weigh-service-tag">现场结算</text>
					<text class="weigh-service-arrow">›</text>
				</view>

				<view class="directory-section">
					<view class="section-heading"><text class="section-title">钓场与社区</text></view>
					<view class="icon-directory">
						<view v-for="item in venueCommunityItems" :key="item.url" class="directory-item" @click="openService(item)">
							<view :class="['service-icon', iconClass(item)]"><view class="icon-shape"></view></view>
							<text>{{ displayLabel(item) }}</text>
						</view>
					</view>
				</view>

				<view class="directory-section">
					<view class="section-heading"><text class="section-title">会员与资产</text></view>
					<view class="icon-directory">
						<view v-for="item in memberAssetItems" :key="item.url" class="directory-item" @click="openService(item)">
							<view :class="['service-icon', iconClass(item)]"><view class="icon-shape"></view></view>
							<text>{{ displayLabel(item) }}</text>
						</view>
					</view>
				</view>

				<view class="directory-section compact-section">
					<view class="section-heading"><text class="section-title">活动与帮助</text></view>
					<view class="compact-list two-columns">
						<view v-for="item in activityHelpItems" :key="item.url" class="compact-row" @click="openService(item)">
							<view class="row-mark">{{ item.mark }}</view><text class="row-title">{{ displayLabel(item) }}</text><text class="row-arrow">›</text>
						</view>
					</view>
				</view>

				<view class="directory-section compact-section more-section">
					<view class="section-heading"><text class="section-title">更多与协议</text></view>
					<view class="compact-list two-columns">
						<view v-for="item in moreItems" :key="item.url" class="compact-row" @click="openService(item)">
							<view class="row-mark">{{ item.mark }}</view><text class="row-title">{{ displayLabel(item) }}</text><text class="row-arrow">›</text>
						</view>
					</view>
				</view>

				<view v-if="merchantItem" class="merchant-entry" @click="openService(merchantItem)">
					<view class="merchant-icon"><view></view></view>
					<text class="merchant-title">商家工作台</text>
					<text class="merchant-tag">员工专属</text>
					<text class="merchant-arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { isLoggedIn } from '../../utils/fishingStore.js'

	const DISPLAY_LABELS = {
		'/pages/rank/rank': '钓王排行',
		'/pages/fishCard/fishCard': '鱼卡图鉴',
		'/pages/weighFish/weighFish': '鱼获称重',
		'/pages/coupons/coupons': '优惠券',
		'/pages/mall/index': '补给商城',
		'/pages/staff/workbench': '商家工作台'
	}

	const ICON_CLASSES = {
		'/pages/venue/venue': 'icon-location',
		'/pages/reserve/reserve': 'icon-calendar',
		'/pages/stocking/stocking': 'icon-fish',
		'/pages/catch/catch': 'icon-record',
		'/pages/rank/rank': 'icon-trophy',
		'/pages/fishCard/fishCard': 'icon-fish-card',
		'/pages/competition/competition': 'icon-crown',
		'/pages/weighFish/weighFish': 'icon-scale',
		'/pages/member/member': 'icon-person',
		'/pages/points/points': 'icon-star',
		'/pages/checkin/checkin': 'icon-calendar',
		'/pages/coupons/coupons': 'icon-coupon',
		'/pages/wallet/wallet': 'icon-wallet',
		'/pages/wallet/recharge': 'icon-wallet-plus',
		'/pages/rental/rental': 'icon-rental',
		'/pages/mall/index': 'icon-bag'
	}

	export default {
		data() {
			return {
				keyword: '',
				groups: [
					{
						title: '计时结算', desc: '从入场到支付完成的核心流程',
						items: [
							{ name: '开始计时', desc: '确认钓场和计费规则后下竿', mark: '计', url: '/pages/start/start?direct=1', auth: true },
							{ name: '计时状态', desc: '查看已用时长与预估费用', mark: '时', url: '/pages/session/session', auth: true },
							{ name: '订单结算', desc: '处理待付款账单与优惠抵扣', mark: '结', url: '/pages/pay/pay', auth: true },
							{ name: '我的订单', desc: '查看计时记录、状态与退款入口', mark: '单', url: '/pages/orders/orders', auth: true }
						]
					},
					{
						title: '钓场服务', desc: '查看场地、钓位和放鱼信息',
						items: [
							{ name: '钓场详情', desc: '地址、设施、营业信息与现场导航', mark: '场', url: '/pages/venue/venue' },
							{ name: '钓位预订', desc: '查看钓位状态并提前预约', mark: '位', url: '/pages/reserve/reserve', auth: true },
							{ name: '放鱼动态', desc: '查看鱼种、数量与最新放鱼记录', mark: '鱼', url: '/pages/stocking/stocking' }
						]
					},
					{
						title: '钓获成绩', desc: '查看个人钓获与真实成绩排行',
						items: [
							{ name: '我的钓获', desc: '仅查看自己的称重与审核记录', mark: '获', url: '/pages/catch/catch', auth: true },
							{ name: '钓王排行榜', desc: '查看重量榜与积分榜', mark: '榜', url: '/pages/rank/rank' },
							{ name: '冲榜目标', desc: '查看个人目标与冲榜进度', mark: '标', url: '/pages/goal/goal', auth: true }
						]
					},
					{
						title: '鱼卡比赛', desc: '鱼种识别和赛事参与',
						items: [
							{ name: '极智鱼鉴', desc: '识别鱼种并生成电子鱼卡', mark: '卡', url: '/pages/fishCard/fishCard', auth: true },
							{ name: '钓王争霸', desc: '查看赛事并在线报名参赛', mark: '赛', url: '/pages/competition/competition', auth: true }
						]
					},
					{
						title: '鱼获称重', desc: '现场称重与鱼获结算',
						items: [
							{ name: '鱼获称重', desc: '录入重量并完成鱼获计价', mark: '称', url: '/pages/weighFish/weighFish', auth: true }
						]
					},
					{
						title: '会员积分', desc: '等级、签到、积分和优惠权益',
						items: [
							{ name: '会员中心', desc: '查看等级成长和会员权益', mark: '会', url: '/pages/member/member', auth: true },
							{ name: '积分商城', desc: '查看积分明细并兑换好礼', mark: '分', url: '/pages/points/points', auth: true },
							{ name: '每日签到', desc: '签到领取积分并查看日历', mark: '签', url: '/pages/checkin/checkin', auth: true },
							{ name: '我的优惠券', desc: '查看可用、已用和过期优惠券', mark: '券', url: '/pages/coupons/coupons', auth: true }
						]
					},
					{
						title: '活动报名', desc: '钓场优惠、专题活动与报名入口',
						items: [
							{ name: '活动中心', desc: '查看活动列表，进入详情后报名', mark: '活', url: '/pages/promotions/promotions', badge: '报名入口' }
						]
					},
					{
						title: '补给商城', desc: '钓具、饵料和现场商品服务',
						items: [
							{ name: '钓场补给', desc: '选购钓具、饵料和现场用品', mark: '购', url: '/pages/mall/index' },
							{ name: '补给订单', desc: '查看订单、凭证和领取状态', mark: '取', url: '/pages/mall/orders', auth: true }
						]
					},
					{
						title: '钱包租赁', desc: '储值、充值和装备租用',
						items: [
							{ name: '储值钱包', desc: '查看余额、充值和交易明细', mark: '钱', url: '/pages/wallet/wallet', auth: true },
							{ name: '钱包充值', desc: '选择金额并完成在线充值', mark: '充', url: '/pages/wallet/recharge', auth: true },
							{ name: '装备租赁', desc: '在线租用钓竿和现场装备', mark: '租', url: '/pages/rental/rental', auth: true }
						]
					},
					{
						title: '退款客服', desc: '订单售后、退款进度和帮助支持',
						items: [
							{ name: '退款记录', desc: '查看退款申请与处理进度', mark: '退', url: '/pages/refund/list', auth: true },
							{ name: '联系客服', desc: '遇到问题时联系钓场客服', mark: '客', url: '/pages/contact/contact' },
							{ name: '账户设置', desc: '管理个人信息与账户状态', mark: '设', url: '/pages/settings/settings', auth: true }
						]
					},
					{
						title: '指引与协议', desc: '费率、使用说明和平台规则',
						items: [
							{ name: '操作指引', desc: '了解入场、计时和结算流程', mark: '引', url: '/pages/guide/guide' },
							{ name: '费率说明', desc: '查看计费单位、起步和封顶规则', mark: '费', url: '/pages/rateInfo/rateInfo' },
							{ name: '用户服务协议', desc: '查看平台服务条款', mark: '协', url: '/pages/protocol/user' },
							{ name: '隐私政策', desc: '了解个人信息处理规则', mark: '隐', url: '/pages/protocol/privacy' },
							{ name: '关于我们', desc: '查看产品信息与版本说明', mark: '关', url: '/pages/about/about' }
						]
					},
					{
						title: '商家工作台', desc: '面向钓场店员的订单核验工具', business: true,
						items: [
							{ name: '进入商家工作台', desc: '扫码核验、手动确认和查看记录', mark: '商', url: '/pages/staff/workbench', auth: true, badge: '商家专属' }
						]
					}
				]
			}
		},
		computed: {
			flatItems() {
				return this.groups.reduce((items, group) => items.concat(group.items || []), [])
			},
			coreItems() { return this.groups[0].items },
			weighItem() { return this.findItem('/pages/weighFish/weighFish') },
			venueCommunityItems() {
				return this.pickItems([
					'/pages/venue/venue', '/pages/reserve/reserve', '/pages/stocking/stocking', '/pages/catch/catch',
					'/pages/rank/rank', '/pages/fishCard/fishCard', '/pages/competition/competition'
				])
			},
			memberAssetItems() {
				return this.pickItems([
					'/pages/member/member', '/pages/points/points', '/pages/checkin/checkin', '/pages/coupons/coupons',
					'/pages/wallet/wallet', '/pages/wallet/recharge', '/pages/rental/rental', '/pages/mall/index'
				])
			},
			activityHelpItems() {
				return this.pickItems([
					'/pages/promotions/promotions', '/pages/mall/orders', '/pages/refund/list',
					'/pages/contact/contact', '/pages/settings/settings', '/pages/guide/guide', '/pages/rateInfo/rateInfo'
				])
			},
			moreItems() {
				return this.pickItems(['/pages/goal/goal', '/pages/protocol/user', '/pages/protocol/privacy', '/pages/about/about'])
			},
			merchantItem() { return this.findItem('/pages/staff/workbench') },
			searchResults() {
				const query = String(this.keyword || '').trim().toLowerCase()
				if (!query) return []
				return this.flatItems.filter((item) => `${this.displayLabel(item)} ${item.name} ${item.desc || ''}`.toLowerCase().includes(query))
			}
		},
		methods: {
			normalizedUrl(item) { return String(item && item.url || '').split('?')[0] },
			findItem(url) { return this.flatItems.find((item) => this.normalizedUrl(item) === url) || null },
			pickItems(urls) { return urls.map((url) => this.findItem(url)).filter(Boolean) },
			displayLabel(item) { return DISPLAY_LABELS[this.normalizedUrl(item)] || item.name },
			iconClass(item) {
				return ICON_CLASSES[this.normalizedUrl(item)] || 'icon-grid'
			},
			openService(item) {
				if (!item || !item.url) return
				if (item.auth && !isLoggedIn()) {
					uni.navigateTo({ url: '/pages/login/login?redirect=' + encodeURIComponent(item.url) })
					return
				}
				uni.navigateTo({ url: item.url })
			}
		}
	}
</script>

<style scoped>
	.services-page{min-height:100vh;padding-bottom:calc(42rpx + env(safe-area-inset-bottom));background:#f6faf9;color:#123d40;box-sizing:border-box}
	.search-band{padding:10rpx 24rpx 28rpx;background:#08aaa6}.search-box{height:78rpx;padding:0 18rpx;display:flex;align-items:center;border-radius:17rpx;background:#fbfdfc;box-shadow:0 8rpx 20rpx rgba(4,65,66,.12)}.search-icon{width:28rpx;height:28rpx;margin:0 18rpx 0 4rpx;flex-shrink:0;border:4rpx solid #315d60;border-radius:50%;box-sizing:border-box;position:relative}.search-icon::after{content:'';position:absolute;right:-9rpx;bottom:-7rpx;width:13rpx;height:4rpx;border-radius:99rpx;background:#315d60;transform:rotate(45deg)}.search-input{flex:1;height:78rpx;color:#193f42;font-size:24rpx}.search-placeholder{color:#849596}.search-clear{width:52rpx;height:52rpx;display:flex;align-items:center;justify-content:center;color:#7f9293;font-size:34rpx}
	.service-body{background:#fbfdfc}.service-sections{background:#fbfdfc}.section-heading{display:flex;align-items:baseline;gap:18rpx}.section-title{font-size:30rpx;font-weight:900;line-height:1.2;color:#123d40}.section-caption{color:#7b8d8f;font-size:20rpx}
	.core-section{padding:34rpx 24rpx 28rpx}.core-flow{position:relative;margin-top:30rpx;display:grid;grid-template-columns:repeat(4,1fr)}.flow-line{position:absolute;z-index:0;left:12.5%;right:12.5%;top:36rpx;height:2rpx;background:#cbd9d8}.core-step{position:relative;z-index:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:14rpx;color:#263f42;font-size:21rpx;font-weight:750}.core-step.active{color:#079f9c}.core-icon{width:72rpx;height:72rpx;display:flex;align-items:center;justify-content:center;border:3rpx solid #c5d3d2;border-radius:50%;background:#fbfdfc;color:#31585a;box-sizing:border-box}.core-step.active .core-icon{border-color:#079f9c;color:#079f9c;box-shadow:0 0 0 6rpx #e7f6f4}.core-icon view{position:relative;box-sizing:border-box}
	.core-icon-0 view{width:31rpx;height:31rpx;border:4rpx solid currentColor;border-radius:50%}.core-icon-0 view::before{content:'';position:absolute;left:12rpx;top:5rpx;width:4rpx;height:11rpx;background:currentColor}.core-icon-0 view::after{content:'';position:absolute;left:13rpx;top:14rpx;width:9rpx;height:4rpx;background:currentColor;transform:rotate(35deg);transform-origin:left center}.core-icon-1 view{width:7rpx;height:25rpx;background:currentColor;box-shadow:-13rpx 9rpx 0 currentColor,13rpx -8rpx 0 currentColor}.core-icon-2 view{width:28rpx;height:34rpx;border:4rpx solid currentColor;border-radius:4rpx}.core-icon-2 view::after{content:'¥';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18rpx;font-weight:900}.core-icon-3 view{width:29rpx;height:34rpx;border:4rpx solid currentColor;border-radius:4rpx}.core-icon-3 view::before{content:'';position:absolute;left:6rpx;right:6rpx;top:-9rpx;height:9rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:6rpx 6rpx 0 0}.core-icon-3 view::after{content:'';position:absolute;left:6rpx;right:6rpx;top:10rpx;height:4rpx;background:currentColor;box-shadow:0 9rpx 0 currentColor}
	.directory-section{padding:30rpx 24rpx 28rpx;border-top:1rpx solid #dce6e5}.icon-directory{margin-top:25rpx;display:grid;grid-template-columns:repeat(4,1fr);row-gap:30rpx}.directory-item{min-width:0;min-height:112rpx;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10rpx;color:#263f42;font-size:20rpx;font-weight:700;text-align:center}.directory-item>text{width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.service-icon{width:64rpx;height:64rpx;display:flex;align-items:center;justify-content:center;color:#0b5d60}.icon-shape{position:relative;box-sizing:border-box}
	.icon-location .icon-shape{width:32rpx;height:38rpx;border:4rpx solid currentColor;border-radius:50% 50% 50% 0;transform:rotate(-45deg)}.icon-location .icon-shape::after{content:'';position:absolute;left:8rpx;top:8rpx;width:9rpx;height:9rpx;border:3rpx solid currentColor;border-radius:50%}
	.icon-calendar .icon-shape{width:35rpx;height:33rpx;border:4rpx solid currentColor;border-radius:5rpx}.icon-calendar .icon-shape::before{content:'';position:absolute;left:3rpx;right:3rpx;top:7rpx;border-top:4rpx solid currentColor}.icon-calendar .icon-shape::after{content:'';position:absolute;left:6rpx;top:-8rpx;width:4rpx;height:10rpx;background:currentColor;box-shadow:15rpx 0 0 currentColor}
	.icon-fish .icon-shape{width:38rpx;height:22rpx;border-radius:60% 45% 45% 60%;background:currentColor}.icon-fish .icon-shape::before{content:'';position:absolute;left:-14rpx;top:2rpx;border-top:9rpx solid transparent;border-bottom:9rpx solid transparent;border-right:15rpx solid currentColor}.icon-fish .icon-shape::after{content:'';position:absolute;right:8rpx;top:7rpx;width:4rpx;height:4rpx;border-radius:50%;background:#fbfdfc}
	.icon-chat .icon-shape{width:39rpx;height:31rpx;border:4rpx solid currentColor;border-radius:11rpx}.icon-chat .icon-shape::before{content:'';position:absolute;left:6rpx;bottom:-10rpx;border-top:11rpx solid currentColor;border-right:11rpx solid transparent}.icon-chat .icon-shape::after{content:'···';position:absolute;left:2rpx;right:2rpx;top:-13rpx;text-align:center;font-size:26rpx;font-weight:900}
	.icon-record .icon-shape{width:36rpx;height:42rpx;border:4rpx solid currentColor;border-radius:5rpx}.icon-record .icon-shape::before{content:'';position:absolute;left:7rpx;right:7rpx;top:11rpx;border-top:3rpx solid currentColor;box-shadow:0 8rpx 0 currentColor,0 16rpx 0 currentColor}
	.icon-trophy .icon-shape{width:33rpx;height:28rpx;border-radius:4rpx 4rpx 12rpx 12rpx;background:currentColor}.icon-trophy .icon-shape::before,.icon-trophy .icon-shape::after{content:'';position:absolute;top:4rpx;width:12rpx;height:17rpx;border:4rpx solid currentColor}.icon-trophy .icon-shape::before{left:-11rpx;border-right:0;border-radius:8rpx 0 0 8rpx}.icon-trophy .icon-shape::after{right:-11rpx;border-left:0;border-radius:0 8rpx 8rpx 0}
	.icon-crown .icon-shape{width:40rpx;height:31rpx;background:currentColor;clip-path:polygon(0 10%,25% 62%,50% 0,75% 62%,100% 10%,88% 100%,12% 100%)}
	.icon-group .icon-shape{width:46rpx;height:42rpx}.icon-group .icon-shape::before{content:'';position:absolute;left:16rpx;top:1rpx;width:15rpx;height:15rpx;border:4rpx solid currentColor;border-radius:50%;box-sizing:border-box;box-shadow:-15rpx 7rpx 0 -3rpx #fbfdfc,-15rpx 7rpx 0 0 currentColor,15rpx 7rpx 0 -3rpx #fbfdfc,15rpx 7rpx 0 0 currentColor}.icon-group .icon-shape::after{content:'';position:absolute;left:6rpx;right:6rpx;bottom:0;height:20rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:22rpx 22rpx 0 0}
	.icon-fish-card .icon-shape{width:39rpx;height:39rpx;border:4rpx solid currentColor;border-radius:5rpx}.icon-fish-card .icon-shape::before{content:'';position:absolute;left:8rpx;top:11rpx;width:18rpx;height:11rpx;border-radius:60%;background:currentColor}.icon-fish-card .icon-shape::after{content:'';position:absolute;left:3rpx;top:12rpx;border-top:5rpx solid transparent;border-bottom:5rpx solid transparent;border-right:8rpx solid currentColor}
	.icon-person .icon-shape{width:39rpx;height:41rpx}.icon-person .icon-shape::before{content:'';position:absolute;left:11rpx;top:0;width:17rpx;height:17rpx;border:4rpx solid currentColor;border-radius:50%;box-sizing:border-box}.icon-person .icon-shape::after{content:'';position:absolute;left:2rpx;right:2rpx;bottom:0;height:19rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:21rpx 21rpx 0 0;box-sizing:border-box}
	.icon-star .icon-shape{width:39rpx;height:39rpx;border:4rpx solid currentColor;border-radius:50%}.icon-star .icon-shape::after{content:'★';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20rpx}
	.icon-coupon .icon-shape{width:42rpx;height:30rpx;border:4rpx solid currentColor;border-radius:5rpx}.icon-coupon .icon-shape::after{content:'券';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16rpx;font-weight:900}
	.icon-wallet .icon-shape,.icon-wallet-plus .icon-shape{width:42rpx;height:31rpx;border:4rpx solid currentColor;border-radius:6rpx}.icon-wallet .icon-shape::after,.icon-wallet-plus .icon-shape::after{content:'';position:absolute;right:-5rpx;top:7rpx;width:16rpx;height:12rpx;border-radius:4rpx;background:currentColor}.icon-wallet-plus .icon-shape::before{content:'+';position:absolute;left:4rpx;top:-6rpx;font-size:25rpx;font-weight:900}
	.icon-rental .icon-shape{width:44rpx;height:40rpx}.icon-rental .icon-shape::before{content:'';position:absolute;left:4rpx;top:18rpx;width:40rpx;height:4rpx;border-radius:99rpx;background:currentColor;transform:rotate(-45deg)}.icon-rental .icon-shape::after{content:'';position:absolute;right:0;bottom:0;width:11rpx;height:15rpx;border:3rpx solid currentColor;border-top:0;border-left:0;border-radius:0 0 10rpx 0}
	.icon-bag .icon-shape{width:36rpx;height:35rpx;border:4rpx solid currentColor;border-radius:5rpx}.icon-bag .icon-shape::before{content:'';position:absolute;left:7rpx;top:-13rpx;width:13rpx;height:13rpx;border:4rpx solid currentColor;border-bottom:0;border-radius:10rpx 10rpx 0 0;box-sizing:border-box}
	.icon-grid .icon-shape{width:38rpx;height:38rpx;border:4rpx solid currentColor;border-radius:6rpx}.icon-grid .icon-shape::after{content:'···';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26rpx;font-weight:900}
	.weigh-service-entry{min-height:118rpx;margin:0 24rpx 8rpx;padding:16rpx 18rpx;display:flex;align-items:center;border:1rpx solid #cde3e1;border-radius:16rpx;background:#edf8f6;color:#143f42;box-sizing:border-box}.weigh-service-entry:active{background:#e2f2f0}.weigh-service-icon{width:74rpx;height:74rpx;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:16rpx;background:#0aa5a2;color:#f7fbfa}.weigh-service-scale{width:44rpx;height:42rpx;position:relative;box-sizing:border-box}.weigh-service-scale::before{content:'';position:absolute;left:2rpx;right:2rpx;bottom:0;height:28rpx;border:4rpx solid currentColor;border-radius:7rpx;box-sizing:border-box}.weigh-service-scale::after{content:'';position:absolute;left:11rpx;top:0;width:22rpx;height:22rpx;border:4rpx solid currentColor;border-radius:50%;background:#0aa5a2;box-sizing:border-box}.weigh-service-scale view{position:absolute;z-index:1;left:21rpx;top:5rpx;width:3rpx;height:9rpx;border-radius:99rpx;background:currentColor;transform:rotate(35deg);transform-origin:bottom}.weigh-service-copy{flex:1;min-width:0;margin-left:18rpx;display:flex;flex-direction:column}.weigh-service-copy text:first-child{font-size:26rpx;font-weight:900}.weigh-service-copy text:last-child{margin-top:5rpx;overflow:hidden;color:#657d7f;font-size:19rpx;white-space:nowrap;text-overflow:ellipsis}.weigh-service-tag{margin-left:12rpx;padding:6rpx 10rpx;border-radius:7rpx;background:#d6eeeb;color:#087c7a;font-size:17rpx;font-weight:800}.weigh-service-arrow{margin-left:10rpx;color:#789091;font-size:32rpx;font-weight:300}
	.compact-section{padding-bottom:18rpx}.compact-list{margin-top:18rpx;border-top:1rpx solid #e0e8e7}.two-columns{display:grid;grid-template-columns:1fr 1fr}.compact-row{min-width:0;height:76rpx;padding:0 10rpx;display:flex;align-items:center;border-bottom:1rpx solid #e0e8e7;box-sizing:border-box}.two-columns .compact-row:nth-child(odd){padding-right:18rpx;border-right:1rpx solid #e0e8e7}.two-columns .compact-row:nth-child(even){padding-left:18rpx}.row-mark{width:38rpx;height:38rpx;margin-right:11rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:11rpx;background:#eaf6f5;color:#078f8d;font-size:17rpx;font-weight:900}.row-title{flex:1;min-width:0;overflow:hidden;font-size:21rpx;font-weight:750;white-space:nowrap;text-overflow:ellipsis}.row-arrow{margin-left:8rpx;color:#91a2a3;font-size:28rpx;font-weight:300}.more-section{padding-top:26rpx}
	.merchant-entry{height:86rpx;margin:24rpx;display:flex;align-items:center;padding:0 20rpx;border:1rpx solid #e9bd7d;border-radius:13rpx;background:#fff5e8;color:#9d5707;box-sizing:border-box}.merchant-icon{width:42rpx;height:42rpx;margin-right:15rpx;display:flex;align-items:center;justify-content:center}.merchant-icon view{width:34rpx;height:27rpx;border:4rpx solid currentColor;border-radius:4rpx;position:relative;box-sizing:border-box}.merchant-icon view::before{content:'';position:absolute;left:-5rpx;right:-5rpx;top:-11rpx;height:10rpx;border-radius:5rpx 5rpx 2rpx 2rpx;background:currentColor}.merchant-title{font-size:25rpx;font-weight:900}.merchant-tag{margin-left:17rpx;padding:5rpx 10rpx;border-radius:7rpx;background:#ffe9ca;color:#a86616;font-size:17rpx;font-weight:750}.merchant-arrow{margin-left:auto;font-size:31rpx;font-weight:300}
	.search-results-section{min-height:620rpx;padding:34rpx 24rpx}.search-result-list{margin-top:22rpx}.search-result-list .compact-row{height:92rpx}.row-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:4rpx}.row-copy text:first-child{font-size:23rpx;font-weight:800}.row-copy text:last-child{overflow:hidden;color:#7a8c8d;font-size:18rpx;white-space:nowrap;text-overflow:ellipsis}.search-empty{padding:120rpx 20rpx;display:flex;flex-direction:column;align-items:center;color:#7c8e90;text-align:center}.search-empty text:nth-child(2){margin-top:22rpx;color:#31585a;font-size:26rpx;font-weight:850}.search-empty text:nth-child(3){margin-top:8rpx;font-size:19rpx}.empty-search-icon{width:62rpx;height:62rpx;border:5rpx solid #9eb1b1;border-radius:50%;position:relative;box-sizing:border-box}.empty-search-icon::after{content:'';position:absolute;right:-18rpx;bottom:-9rpx;width:26rpx;height:5rpx;border-radius:99rpx;background:#9eb1b1;transform:rotate(45deg)}
	@media (max-width:360px){.search-band{padding-left:18rpx;padding-right:18rpx}.core-section,.directory-section,.search-results-section{padding-left:18rpx;padding-right:18rpx}.section-title{font-size:28rpx}.core-step{font-size:19rpx}.core-icon{width:66rpx;height:66rpx}.flow-line{top:33rpx}.directory-item{font-size:18rpx}.service-icon{width:58rpx;height:58rpx}.compact-row{padding-left:7rpx;padding-right:7rpx}.two-columns .compact-row:nth-child(odd){padding-right:10rpx}.two-columns .compact-row:nth-child(even){padding-left:10rpx}.row-title{font-size:19rpx}.merchant-entry{margin-left:18rpx;margin-right:18rpx}}
</style>
