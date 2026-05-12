<template>
	<view class="app workbench">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<view class="hero-row">
					<view>
						<text class="hero-title">商家工作台</text>
						<text class="hero-sub">SHARED · STAFF</text>
					</view>
					<view class="hero-pill">{{ info.nickname || '店员' }}</view>
				</view>
				<view class="stats">
					<view class="stat">
						<text class="stat-num">{{ info.pendingCount || 0 }}</text>
						<text class="stat-label">待核销</text>
					</view>
					<view class="stat-sep"></view>
					<view class="stat">
						<text class="stat-num">{{ todayRedeemed }}</text>
						<text class="stat-label">今日已核销</text>
					</view>
					<view class="stat-sep"></view>
					<view class="stat">
						<text class="stat-num">¥{{ formatMoney(todayAmount) }}</text>
						<text class="stat-label">今日营业</text>
					</view>
				</view>
			</view>
		</view>

		<view class="scan-card" @click="scan">
			<view class="scan-icon">📷</view>
			<view class="scan-text">
				<text class="scan-title">扫一扫核销</text>
				<text class="scan-desc">扫顾客小程序里的核销码</text>
			</view>
			<text class="scan-arrow">›</text>
		</view>

		<view class="card">
			<text class="card-title">手动输入核销码</text>
			<view class="manual">
				<input class="manual-input" v-model="manualCode" placeholder="订单号 或 8 位数字" maxlength="40" />
				<button class="manual-btn" :disabled="redeeming || !manualCode" @click="doRedeem(manualCode)">{{ redeeming ? '处理中' : '核销' }}</button>
			</view>
		</view>

		<view class="card">
			<view class="card-title-row">
				<text class="card-title">最近核销</text>
				<text class="refresh" @click="load">刷新 ↻</text>
			</view>
			<view v-if="!recent.length" class="empty">暂无核销记录</view>
			<view v-for="r in recent" :key="r.mallOrderId" class="rec">
				<view class="rec-info">
					<text class="rec-no">{{ r.mallOrderNo }}</text>
					<text class="rec-time">{{ formatDatetime(r.redeemedTime || r.paidTime) }}</text>
				</view>
				<view class="rec-amount">¥{{ formatMoney(r.totalCents) }}</view>
			</view>
		</view>
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
				redeeming: false
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
				uni.redirectTo({ url: '/pages/login/login' })
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
						uni.showToast({ title: '无核销权限', icon: 'none' })
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
					uni.showModal({
						title: '核销成功',
						content: `订单 ${order.mallOrderNo}\n金额 ¥${formatMoney(order.totalCents)}`,
						showCancel: false
					})
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
	.hero-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg,#1a1a1a,#2e2e2e); }
	.hero-content { position: relative; z-index: 1; color: #fff; }
	.hero-row { display: flex; justify-content: space-between; align-items: flex-end; }
	.hero-title { display: block; font-size: 44rpx; font-weight: 800; letter-spacing: 2rpx; }
	.hero-sub { display: block; color: #f5c23b; font-size: 22rpx; letter-spacing: 4rpx; margin-top: 8rpx; }
	.hero-pill { padding: 8rpx 22rpx; border-radius: 999rpx; background: rgba(245,194,59,.2); color: #f5c23b; font-size: 22rpx; font-weight: 700; }

	.stats { margin-top: 32rpx; padding: 28rpx 20rpx; border-radius: 22rpx; background: rgba(255,255,255,.08); display: flex; }
	.stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
	.stat-num { font-size: 38rpx; font-weight: 800; color: #fff; }
	.stat-label { font-size: 22rpx; color: #a8a8a8; }
	.stat-sep { width: 1rpx; height: 56rpx; background: rgba(255,255,255,.12); }

	.scan-card { margin: 24rpx 28rpx; padding: 36rpx 28rpx; background: linear-gradient(135deg,#f5c23b,#e0a523); border-radius: 24rpx; display: flex; align-items: center; gap: 20rpx; box-shadow: 0 12rpx 30rpx rgba(245,194,59,.3); }
	.scan-icon { width: 100rpx; height: 100rpx; border-radius: 50%; background: rgba(0,0,0,.15); display: flex; align-items: center; justify-content: center; font-size: 56rpx; }
	.scan-text { flex: 1; display: flex; flex-direction: column; }
	.scan-title { color: #1a1306; font-size: 36rpx; font-weight: 800; }
	.scan-desc { color: #5a4a17; font-size: 24rpx; margin-top: 6rpx; }
	.scan-arrow { color: #1a1306; font-size: 48rpx; font-weight: 800; }

	.card { margin: 20rpx 28rpx; padding: 28rpx; background: #fff; border-radius: 22rpx; box-shadow: 0 6rpx 20rpx rgba(26,32,48,.04); }
	.card-title { display: block; font-size: 28rpx; font-weight: 800; color: #1a2030; margin-bottom: 18rpx; }
	.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
	.card-title-row .card-title { margin-bottom: 0; }
	.refresh { color: #b8860b; font-size: 24rpx; font-weight: 700; }

	.manual { display: flex; gap: 16rpx; }
	.manual-input { flex: 1; height: 80rpx; padding: 0 24rpx; background: #f4f5f7; border-radius: 999rpx; font-size: 28rpx; }
	.manual-btn { height: 80rpx; line-height: 80rpx; padding: 0 36rpx; background: #1a2030; color: #f5c23b; border-radius: 999rpx; font-size: 28rpx; font-weight: 800; }
	.manual-btn[disabled] { opacity: .5; }

	.empty { color: #9aa3b2; text-align: center; padding: 40rpx 0; font-size: 26rpx; }

	.rec { display: flex; justify-content: space-between; align-items: center; padding: 18rpx 0; border-bottom: 1rpx dashed #eef0f5; }
	.rec:last-child { border-bottom: 0; }
	.rec-info { display: flex; flex-direction: column; gap: 4rpx; }
	.rec-no { color: #1a2030; font-size: 26rpx; font-weight: 700; }
	.rec-time { color: #9aa3b2; font-size: 22rpx; }
	.rec-amount { color: #b8860b; font-size: 30rpx; font-weight: 800; }
</style>
