<template>
	<view class="app activity-reg">
		<view class="reg-header" :style="{ background: ad.bgColor || '#fff3d1' }">
			<text class="reg-title">{{ ad.title }}</text>
			<text class="reg-desc">{{ ad.desc }}</text>
		</view>

		<view class="reg-info">
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

		<view class="reg-form">
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
				<text class="form-label">备注</text>
				<input class="form-input" v-model="form.remark" placeholder="选填" />
			</view>
		</view>

		<view class="reg-footer">
			<view class="submit-btn" @click="onSubmit">
				确认报名并支付 ¥{{ formatMoney(activity.feeCents) }}
			</view>
		</view>
	</view>
</template>

<script>
import { getAdById, getUser, submitRegistration, payRegistration, grantCoupon, formatMoney } from '../../utils/fishingStore.js'

export default {
	data() {
		return {
			ad: {},
			activity: {},
			form: { name: '', phone: '', remark: '' }
		}
	},
	onLoad(option) {
		const ad = getAdById(option.id)
		if (ad && ad.type === 'activity') {
			this.ad = ad
			this.activity = ad.activityInfo || {}
		} else {
			uni.showToast({ title: '活动不存在', icon: 'none' })
			setTimeout(() => this.goBack(), 1500)
		}
	},
	methods: {
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
			const reg = submitRegistration(this.ad.id, user.id, {
				name: this.form.name.trim(),
				phone: this.form.phone,
				remark: this.form.remark,
				feeCents: this.activity.feeCents
			})
			if (reg.paid) {
				uni.showToast({ title: '您已报名过该活动', icon: 'none' })
				return
			}
			const paid = payRegistration(reg.id)
			if (paid) {
				grantCoupon(user.id, {
					type: 'duration',
					title: '报名赠券·免费30分钟',
					value: 30,
					minAmountCents: 0,
					source: 'activity_' + this.ad.id
				})
				uni.showModal({
					title: '报名成功',
					content: `已成功报名「${this.ad.title}」，报名费 ¥${formatMoney(this.activity.feeCents)} 已支付。\n\n已赠送您一张【免费30分钟】优惠券！`,
					showCancel: false,
					success: () => this.goBack()
				})
			}
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
	background: #f4f5f7;
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
	font-weight: 800;
	color: #1a2030;
}

.reg-desc {
	font-size: 26rpx;
	color: #4a5567;
}

.reg-info {
	margin: 24rpx 28rpx;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx 32rpx;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f1f3;
}

.info-row:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 26rpx;
	color: #6b7280;
}

.info-value {
	font-size: 26rpx;
	color: #1a2030;
	font-weight: 600;
}

.info-value.fee {
	color: #e85d04;
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
	color: #4a5567;
	line-height: 1.8;
	white-space: pre-wrap;
}

.reg-form {
	margin: 24rpx 28rpx;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx 32rpx;
}

.form-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1a2030;
	margin-bottom: 24rpx;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f1f3;
}

.form-item:last-child {
	border-bottom: none;
}

.form-label {
	font-size: 26rpx;
	color: #3a4355;
	width: 140rpx;
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	font-size: 26rpx;
	color: #1a2030;
}

.reg-footer {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 24rpx 28rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
	background: #f5c23b;
	color: #1a1306;
	text-align: center;
	padding: 24rpx 0;
	border-radius: 999rpx;
	font-size: 30rpx;
	font-weight: 700;
}
</style>
