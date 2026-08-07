<template>
	<view class="app activity-reg has-brand-header">
		<brand-header title="活动报名" theme="teal" layout="stacked" :back-on-title="true" />
		<view v-if="loading || loadError" class="activity-state">
			<text class="state-title">{{ loading ? '正在读取活动信息' : '活动信息加载失败' }}</text>
			<text class="state-desc">{{ loadError || '请稍候…' }}</text>
			<view v-if="loadError" class="state-retry" @click="loadActivity">重新加载</view>
		</view>
		<view v-if="!loading && !loadError" class="reg-header">
			<image class="reg-cover" :src="ad.image || '/static/hero-fishing-v2.jpg'" mode="aspectFill" />
			<view class="reg-summary"><text class="reg-title">{{ ad.title }}</text><text v-if="ad.desc" class="reg-desc">{{ ad.desc }}</text><text class="reg-meta">◷ {{ activity.date || '时间待钓场公布' }}</text><text class="reg-meta">⌖ {{ activity.location || '地点待钓场公布' }}</text><text class="reg-fee">报名费：¥{{ formatMoney(activity.feeCents || 0) }} / 人</text></view>
		</view>

		<view v-if="!loading && !loadError" class="reg-info compact-info">
			<view class="info-row">
				<text class="info-label">活动日期</text>
				<text class="info-value">{{ activity.date }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">活动地点</text>
				<text class="info-value">{{ activity.location }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">报名费</text>
				<text class="info-value fee">¥{{ formatMoney(activity.feeCents) }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">名额</text>
				<text class="info-value">{{ activity.slots }} 人</text>
			</view>
			<view v-if="activity.rules" class="info-rules">
				<text class="info-label">比赛规则</text>
				<text class="rules-text">{{ activity.rules }}</text>
			</view>
		</view>

		<view v-if="!loading && !loadError" class="reg-form">
			<text class="form-title">填写报名信息</text>
			<view class="form-item">
				<text class="form-label">姓名</text>
				<input class="form-input" v-model="form.name" placeholder="请输入真实姓名" />
			</view>
			<view class="form-item">
				<text class="form-label">手机号</text>
				<input class="form-input" v-model="form.phone" type="number" maxlength="11" placeholder="请输入手机号" />
			</view>
			<view class="form-item">
				<text class="form-label">备注 <text class="optional">（选填）</text></text>
				<textarea class="form-input remark-input" v-model="form.remark" maxlength="100" placeholder="请输入备注信息" />
				<text class="remark-count">{{ form.remark.length }}/100</text>
			</view>
		</view>

		<view v-if="!loading && !loadError" class="reg-footer">
			<view class="submit-btn" @click="onSubmit">
				提交报名
			</view>
		</view>
	</view>
</template>

<script>
import { fetchAdById, getUser, isLoggedIn, submitRegistration, payRegistration, grantCoupon, formatMoney } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			ad: {},
			activity: {},
			adId: '', loading: true, loadError: '',
			form: { name: '', phone: '', remark: '' }
		}
	},
	onLoad(option) {
		if (!isLoggedIn()) { uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/activityRegister/activityRegister?id=' + option.id) }); return }
		this.adId = option.id
		this.loadActivity()
	},
	methods: {
		loadActivity() {
			this.loading = true
			this.loadError = ''
			fetchAdById(this.adId).then((ad) => {
			if (ad && ad.type === 'activity') {
				this.ad = ad
				this.activity = ad.activityInfo || {}
			} else {
				throw new Error('该活动不存在或已下架')
			}
			}).catch((error) => {
				this.ad = {}
				this.activity = {}
				this.loadError = (error && (error.msg || error.message)) || '请检查网络后重试'
			}).finally(() => { this.loading = false })
		},
		onSubmit() {
			if (!this.form.name.trim()) {
				uni.showToast({ title: '请输入姓名', icon: 'none' })
				return
			}
			if (!/^1\d{10}$/.test(this.form.phone)) {
				uni.showToast({ title: '请输入正确手机号', icon: 'none' })
				return
			}
			const user = getUser()
			if (!user) return
			submitRegistration(this.ad.adId, user.userId, {
				name: this.form.name.trim(),
				phone: this.form.phone,
				remark: this.form.remark
			}).then((reg) => {
				if (reg.paid) {
					uni.showToast({ title: '您已报名过该活动', icon: 'none' })
					return
				}
				payRegistration(reg.regId).then(() => {
					const grantPromise = this.ad.couponTemplateId
						? grantCoupon(user.userId, this.ad.couponTemplateId, 'activity_' + this.ad.adId).catch(() => null)
						: Promise.resolve(null)
					grantPromise.then((coupon) => {
						const extra = coupon ? `\n\n已赠送您一张【${coupon.title}】优惠券！` : ''
						uni.showModal({
							title: '报名成功',
							content: `已成功报名「${this.ad.title}」，报名费 ¥${formatMoney(this.activity.feeCents)} 已支付。${extra}`,
							showCancel: false,
							success: () => this.goBack()
						})
					})
				})
			})
		},
		goBack() {
			uni.navigateBack({ delta: 1, fail: () => uni.redirectTo({ url: '/pages/index/index' }) })
		},
		formatMoney
	}
}
</script>

<style>
.activity-reg {
	min-height: 100vh;
	background: var(--surface-2);
	padding-bottom: 160rpx;
}

.reg-header {
	padding: 50rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
}

.reg-title {
	font-size: 40rpx;
	font-weight: 600;
	color: var(--ink);
}

.reg-desc {
	font-size: 26rpx;
	color: var(--ink-2);
}

.reg-info {
	margin: 24rpx 28rpx;
	background: var(--surface);
	border-radius: var(--r);
	padding: 30rpx 32rpx;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid var(--bg);
}

.info-row:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 26rpx;
	color: var(--ink-2);
}

.info-value {
	font-size: 26rpx;
	color: var(--ink);
	font-weight: 600;
}

.info-value.fee {
	color: var(--gold);
	font-size: 30rpx;
}

.info-rules {
	padding-top: 20rpx;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.rules-text {
	font-size: 24rpx;
	color: var(--ink-2);
	line-height: 1.8;
	white-space: pre-wrap;
}

.reg-form {
	margin: 24rpx 28rpx;
	background: var(--surface);
	border-radius: var(--r);
	padding: 30rpx 32rpx;
}

.form-title {
	font-size: 30rpx;
	font-weight: 500;
	color: var(--ink);
	margin-bottom: 24rpx;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid var(--bg);
}

.form-item:last-child {
	border-bottom: none;
}

.form-label {
	font-size: 26rpx;
	color: var(--ink);
	width: 140rpx;
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	font-size: 26rpx;
	color: var(--ink);
}

.reg-footer {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 24rpx 28rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	background: var(--surface);
}

.submit-btn {
	background: var(--g-600);
	color: #fff;
	text-align: center;
	padding: 24rpx 0;
	border-radius: var(--r-pill);
	font-size: 30rpx;
	font-weight: 500;
}
</style>

<style>
.activity-reg{padding:14rpx 20rpx 40rpx;background:#f7fbfb}.activity-reg .reg-header{min-height:238rpx;padding:20rpx;box-sizing:border-box;display:flex;flex-direction:row;align-items:stretch;gap:20rpx;border:1rpx solid #d6e5e3;border-radius:14rpx;background:#fff!important}.reg-cover{width:190rpx;border-radius:10rpx;flex-shrink:0}.reg-summary{flex:1;display:flex;flex-direction:column}.activity-reg .reg-title{font-size:31rpx;color:#153f42}.activity-reg .reg-desc{margin-top:6rpx;font-size:21rpx;color:#667a7c}.reg-meta{display:block;margin-top:12rpx;font-size:20rpx;color:#536e70}.reg-fee{display:block;margin-top:auto;color:#163f42;font-size:23rpx;font-weight:700}.compact-info{display:none}.activity-reg .reg-form{margin:16rpx 0;padding:24rpx;border:1rpx solid #d6e5e3;border-radius:14rpx}.activity-reg .form-title{font-size:28rpx;font-weight:800}.activity-reg .form-item{display:block;border:0;padding:13rpx 0}.activity-reg .form-label{display:block;margin-bottom:10rpx;font-size:23rpx;color:#173f42}.activity-reg .form-input{height:76rpx;padding:0 18rpx;border:1rpx solid #d4e3e2;border-radius:9rpx;background:#fbfdfd;font-size:22rpx}.activity-reg .reg-footer{position:static;padding:0}.activity-reg .submit-btn{height:82rpx;padding:0;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#0aa9a5;font-size:27rpx}.activity-reg::after{content:'我们将严格保护您的个人信息，仅用于活动报名及相关通知';display:block;margin-top:14rpx;padding-left:28rpx;color:#798b8c;font-size:18rpx;line-height:1.5}
.activity-state{margin-top:14rpx;padding:72rpx 30rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid #d6e5e3;border-radius:14rpx;background:#fff;text-align:center}.state-title{font-size:28rpx;font-weight:800;color:#174246}.state-desc{margin-top:12rpx;color:#6e8183;font-size:22rpx}.state-retry{margin-top:28rpx;width:220rpx;height:72rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#0aa9a5;color:#fff;font-size:24rpx;font-weight:700}
.optional{color:#879697;font-size:19rpx}.activity-reg .remark-input{height:130rpx;padding:18rpx;box-sizing:border-box}.remark-count{display:block;margin-top:-31rpx;margin-right:12rpx;text-align:right;color:#93a0a1;font-size:18rpx}
</style>
