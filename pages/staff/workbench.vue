<template>
	<view class="app workbench has-brand-header">
		<brand-header title="商家工作台" brand-name="商家工作台" theme="light" layout="compact" :back="true" />
		<view class="shift-card"><view class="shift-user-icon"></view><text>今日值班 · {{ info.nickname || '店员小周' }}</text><text>›</text></view>
		<view class="hero">
			<view class="hero-content">
				<view class="stats">
					<view class="stat">
						<text class="stat-num">{{ info.pendingCount || 0 }}</text>
						<text class="stat-label">待领取</text>
					</view>
					<view class="stat-sep"></view>
					<view class="stat">
						<text class="stat-num">{{ todayRedeemed }}</text>
						<text class="stat-label">今日已确认</text>
					</view>
					<view class="stat-sep"></view>
					<view class="stat">
						<text class="stat-num">¥{{ formatMoney(todayAmount) }}</text>
						<text class="stat-label">今日商品额</text>
					</view>
				</view>
			</view>
		</view>

		<view class="scan-card" @click="scan">
			<view class="scan-icon hic-scan-w"></view>
			<view class="scan-text">
				<text class="scan-title">扫订单号</text>
				<text class="scan-desc">可扫用户订单页里的订单号，不需要核销码</text>
			</view>
			<text class="scan-arrow">›</text>
		</view>

		<view class="card">
			<text class="card-title">手动确认领取</text>
			<view class="manual">
				<input class="manual-input" v-model="manualCode" placeholder="输入订单号" maxlength="40" />
				<button class="manual-btn" :disabled="redeeming || !manualCode" @click="doRedeem(manualCode)">{{ redeeming ? '处理中' : '确认' }}</button>
			</view>
		</view>

		<view class="card">
			<view class="card-title-row">
				<text class="card-title">最近确认</text>
				<text class="refresh" @click="load">刷新</text>
			</view>
			<view v-if="!recent.length" class="empty">暂无确认记录</view>
			<view v-for="r in recent" :key="r.mallOrderId" class="rec">
				<view class="rec-info">
					<text class="rec-no">{{ r.mallOrderNo }}</text>
					<text class="rec-time">{{ formatDatetime(r.redeemedTime || r.paidTime) }}</text>
				</view>
				<view class="rec-amount">¥{{ formatMoney(r.totalCents) }}</view>
			</view>
		</view>
		<view v-if="lastOrder" class="success-mask">
			<view class="success-sheet"><view class="success-check">✓</view><text class="success-title">已确认领取</text><text class="success-sub">此订单已完成领取</text><view class="success-ticket"><text>取货凭证号</text><text>{{ lastOrder.mallOrderNo }}</text><text>确认时间　{{ formatDatetime(lastOrder.redeemedTime || new Date().toISOString()) }}</text></view><view class="success-amount"><text>实付金额</text><text>¥{{ formatMoney(lastOrder.totalCents) }}</text></view><view class="continue-scan" @click="lastOrder=null">继续扫码</view><view class="back-workbench" @click="lastOrder=null">返回工作台</view></view>
		</view>
		<staff-tabbar />
	</view>
</template>

<script>
	import {
		fetchStaffInfo,
		staffRedeem,
		formatMoney,
		formatDatetime,
		isLoggedIn
	} from '../../utils/fishingStore.js'

	export default {
		data() {
			return {
				info: {},
				recent: [],
				manualCode: '',
				redeeming: false,
				lastOrder: null
			}
		},
		computed: {
			todayRedeemed() {
				const today = new Date().toISOString().slice(0, 10)
				return this.recent.filter((r) => (r.redeemedTime || '').slice(0, 10) === today).length
			},
			todayAmount() {
				const today = new Date().toISOString().slice(0, 10)
				return this.recent
					.filter((r) => (r.redeemedTime || '').slice(0, 10) === today)
					.reduce((a, r) => a + (r.totalCents || 0), 0)
			}
		},
		onShow() {
			if (!isLoggedIn()) {
				uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/staff/workbench') })
				return
			}
			this.load()
		},
		methods: {
			formatMoney,
			formatDatetime,
			load() {
				fetchStaffInfo().then((data) => {
					if (!data || !data.isStaff) {
						uni.showToast({ title: '无工作台权限', icon: 'none' })
						setTimeout(() => uni.redirectTo({ url: '/pages/mine/mine' }), 800)
						return
					}
					this.info = data
					this.recent = (data.recent || []).slice(0, 12)
				}).catch(() => {})
			},
			scan() {
				uni.scanCode({
					onlyFromCamera: false,
					success: (res) => {
						const code = (res && (res.result || res.code)) || ''
						if (code) this.doRedeem(code)
					},
					fail: () => {}
				})
			},
			doRedeem(rawCode) {
				if (this.redeeming) return
				const code = (rawCode || '').trim()
				if (!code) return
				this.redeeming = true
				staffRedeem(code).then((order) => {
					this.lastOrder = order
					this.manualCode = ''
					this.load()
				}).catch(() => {}).finally(() => { this.redeeming = false })
			}
		}
	}
</script>

<style>
	.workbench { padding-bottom: 60rpx; }

	.hero { position: relative; padding: 50rpx 28rpx 32rpx; }
	.hero-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg,var(--g-900),var(--g-950)); }
	.hero-content { position: relative; z-index: 1; color: #fff; }
	.hero-row { display: flex; justify-content: space-between; align-items: flex-end; }
	.hero-title { display: block; font-size: 44rpx; font-weight: 600; letter-spacing: 2rpx; }
	.hero-sub { display: block; color: var(--gold); font-size: 22rpx; letter-spacing: 4rpx; margin-top: 8rpx; }
	.hero-pill { padding: 8rpx 22rpx; border-radius: var(--r-pill); background: rgba(245,194,59,.2); color: #ffd486; font-size: 22rpx; font-weight: 500; }

	.stats { margin-top: 32rpx; padding: 28rpx 20rpx; border-radius: var(--r); background: rgba(255,255,255,.08); display: flex; }
	.stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
	.stat-num { font-size: 38rpx; font-weight: 600; color: #fff; }
	.stat-label { font-size: 22rpx; color: var(--ink-3); }
	.stat-sep { width: 1rpx; height: 56rpx; background: rgba(255,255,255,.12); }

	/* 旧版是金底 + 金字，对比度不足几乎读不出来。改成品牌绿底白字。 */
	.scan-card { margin: 24rpx 28rpx; padding: 36rpx 28rpx; background: var(--g-600); border-radius: var(--r); display: flex; align-items: center; gap: 20rpx; }
	.scan-icon { width: 100rpx; height: 100rpx; border-radius: 50%; background: rgba(255, 255, 255, .16); display: flex; align-items: center; justify-content: center; font-size: 56rpx; }
	.scan-text { flex: 1; display: flex; flex-direction: column; }
	.scan-title { color: #fff; font-size: var(--t-h2); font-weight: 600; }
	.scan-desc { color: rgba(255, 255, 255, .68); font-size: var(--t-sm); margin-top: 6rpx; }
	.scan-arrow { color: rgba(255, 255, 255, .68); font-size: 44rpx; }

	.card { margin: 20rpx 28rpx; padding: 28rpx; background: var(--surface); border-radius: var(--r); }
	.card-title { display: block; font-size: 28rpx; font-weight: 600; color: var(--ink); margin-bottom: 18rpx; }
	.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
	.card-title-row .card-title { margin-bottom: 0; }
	.refresh { color: var(--ink-3); font-size: var(--t-sm); font-weight: 400; }

	.manual { display: flex; gap: 16rpx; }
	.manual-input { flex: 1; height: 80rpx; padding: 0 24rpx; background: var(--surface-2); border-radius: var(--r-pill); font-size: 28rpx; }
	.manual-btn { height: 80rpx; line-height: 80rpx; padding: 0 36rpx; background: var(--g-600); color: #fff; border-radius: var(--r-pill); font-size: var(--t-body); font-weight: 500; }
	.manual-btn[disabled] { opacity: .5; }

	.empty { color: var(--ink-3); text-align: center; padding: 40rpx 0; font-size: 26rpx; }

	.rec { display: flex; justify-content: space-between; align-items: center; padding: 18rpx 0; border-bottom: 1rpx dashed var(--bg); }
	.rec:last-child { border-bottom: 0; }
	.rec-info { display: flex; flex-direction: column; gap: 4rpx; }
	.rec-no { color: var(--ink); font-size: 26rpx; font-weight: 500; }
	.rec-time { color: var(--ink-3); font-size: 22rpx; }
	.rec-amount { color: var(--gold); font-size: 30rpx; font-weight: 600; }
	.scan-icon { background-size: 52rpx 52rpx; }
</style>

<style>
.workbench{min-height:100vh;padding:14rpx 20rpx calc(122rpx + env(safe-area-inset-bottom));background:#f7fbfb}.shift-card{height:68rpx;padding:0 18rpx;display:flex;align-items:center;gap:12rpx;border:1rpx solid #d7e5e4;border-radius:10rpx;background:#fff;color:#204e51;font-size:21rpx}.shift-card text:last-child{margin-left:auto;font-size:30rpx}.shift-user-icon{width:29rpx;height:29rpx;border-radius:50%;background:#079f9d;position:relative}.workbench .hero{margin:14rpx 0 0;padding:0;background:transparent}.workbench .hero-bg,.workbench .hero-row{display:none}.workbench .stats{height:132rpx;margin:0;padding:20rpx;background:#fff;border:1rpx solid #d7e5e4;border-radius:13rpx}.workbench .stat-num{color:#079f9d;font-size:38rpx}.workbench .stat:first-child .stat-num{color:#ef7000}.workbench .stat-label{color:#617577;font-size:20rpx}.workbench .stat-sep{background:#dce7e6}.workbench .scan-card{height:136rpx;margin:16rpx 0 0;padding:22rpx 60rpx;border-radius:12rpx;background:#079f9d}.workbench .scan-icon{width:78rpx;height:78rpx;background-color:transparent}.workbench .scan-title{font-size:33rpx}.workbench .scan-desc{font-size:20rpx}.workbench .scan-arrow{display:none}.workbench .card{margin:14rpx 0 0;padding:20rpx;border:1rpx solid #d7e5e4;border-radius:12rpx;background:#fff}.workbench .manual{display:flex}.workbench .manual-input{height:68rpx;border:1rpx solid #0aa6a3;border-radius:8rpx;background:#fff}.workbench .manual-btn{height:68rpx;line-height:68rpx;border-radius:8rpx;background:#0aa9a5}.workbench .card-title{font-size:24rpx}.workbench .rec{min-height:66rpx;padding:11rpx 0}.workbench .rec-no{font-size:22rpx}.workbench .rec-time{font-size:18rpx}.workbench .rec-amount{font-size:23rpx}.success-mask{position:fixed;z-index:999;inset:0;padding:100rpx 24rpx 30rpx;box-sizing:border-box;background:#f7fbfb}.success-sheet{text-align:center}.success-check{width:86rpx;height:86rpx;margin:0 auto;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#079f9d;color:#fff;font-size:55rpx}.success-title{display:block;margin-top:17rpx;color:#078f8e;font-size:40rpx;font-weight:800}.success-sub{display:block;color:#637779;font-size:22rpx}.success-ticket{margin-top:24rpx;padding:24rpx;display:flex;flex-direction:column;gap:10rpx;border:1rpx solid #d7e5e4;border-radius:12rpx;background:#fff}.success-ticket text:nth-child(2){color:#078f8e;font-size:34rpx;font-weight:800}.success-ticket text:nth-child(3){color:#617577;font-size:20rpx}.success-amount{height:74rpx;padding:0 20rpx;display:flex;align-items:center;justify-content:space-between;border:1rpx solid #d7e5e4;border-top:0;background:#fff;font-size:23rpx}.success-amount text:last-child{color:#ef7200;font-size:32rpx}.continue-scan,.back-workbench{height:76rpx;margin-top:16rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;font-size:26rpx}.continue-scan{background:#0aa9a5;color:#fff}.back-workbench{border:2rpx solid #0aa6a3;color:#079b99;background:#fff}
</style>
