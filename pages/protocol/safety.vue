<template>
	<view class="app safety-page has-brand-header">
		<brand-header title="垂钓安全协议" theme="light" layout="compact" :back="true" />
		<view class="safety-hero">
			<view class="safety-mark">!</view>
			<view class="safety-hero-copy">
				<text class="safety-title">垂钓安全须知及责任确认书</text>
				<text class="safety-version">版本 {{ version }} · 开始计时前必读</text>
			</view>
		</view>

		<view class="important-note">
			<text class="important-title">请先确认</text>
			<text class="important-text">垂钓活动临近水域，涉及湿滑、鱼钩、雷雨、用电等风险。如您身体不适、饮酒或无法安全参与，请不要开始垂钓并及时联系工作人员。</text>
		</view>

		<view class="agreement-card">
			<view v-for="(section, index) in sections" :key="section.index" class="agreement-section" :class="{ 'agreement-section-last': index === sections.length - 1 }">
				<text class="section-index">{{ section.index }}</text>
				<view class="section-copy">
					<text class="section-title">{{ section.title }}</text>
					<text v-for="(line, lineIndex) in section.lines" :key="lineIndex" class="section-line">{{ line }}</text>
				</view>
			</view>
		</view>

		<view class="confirm-card">
			<text class="confirm-title">本人确认</text>
			<text class="confirm-text">我已逐条阅读、理解上述内容，确认当前身体状况适合参与，并同意遵守钓场安全规则。</text>
		</view>

		<view class="safety-footer">
			<button class="accept-button" @click="acceptAndBack">我已阅读并同意</button>
			<text class="footer-tip">同意后返回钓位确认页，仍需点击“开始计时”</text>
		</view>
	</view>
</template>

<script>
	import { SAFETY_AGREEMENT_VERSION } from '../../utils/fishingStore.js'

	const SAFETY_SECTIONS = [
		{
			index: '01',
			title: '入场与健康条件',
			lines: [
				'1. 参与者应根据自身健康状况谨慎参与；有心脑血管疾病、晕厥史或其他不宜临水活动情形的，应先征询专业意见。',
				'2. 饮酒、服用影响判断能力的药物或明显疲劳时，不得临水垂钓。',
				'3. 未成年人须经监护人同意并由监护人全程陪同看护。'
			]
		},
		{
			index: '02',
			title: '临水和现场规则',
			lines: [
				'1. 仅在已扫码确认的钓位及指定区域活动，不下水、不游泳、不越过护栏或安全警示线。',
				'2. 注意水边湿滑、台阶和夜间视线，不奔跑、推挤或在岸边打闹。',
				'3. 遵守现场标识和工作人员指引；发现护栏、地面、用电或其他设施异常时应立即停止使用并报告。'
			]
		},
		{
			index: '03',
			title: '钓具、天气与用电',
			lines: [
				'1. 抛竿、收竿和取钩前应确认周边无人，如被鱼钩刺伤不得强行拔出，应及时求助。',
				'2. 鱼竿、钓线与架杆应远离架空电线和电气设施；非工作人员不得擅自接驳用电设备。',
				'3. 出现雷电、大风、暴雨、高温等不适宜垂钓情况时，应立即停止并按指引撤离。'
			]
		},
		{
			index: '04',
			title: '物品、环境与紧急处置',
			lines: [
				'1. 请自行妥善保管手机、钓具和其他随身物品，不留置钩线、饵料包装或其他废弃物。',
				'2. 遇有人员落水、触电、受伤或突发疾病，应立即呼叫现场工作人员，视情况拨打 110 或 120，不盲目下水施救。'
			]
		},
		{
			index: '05',
			title: '风险确认与责任边界',
			lines: [
				'1. 参与者确认已知悉垂钓的一般风险，并同意对自身违规、不当操作或个人过错造成的损失依法承担相应责任。',
				'2. 钓场将依法履行安全保障、警示、设施维护和紧急协助义务。本确认书不免除经营者依法不得免除的责任，也不免除因故意或重大过失应承担的责任。'
			]
		}
	]

	export default {
		data() { return { version: SAFETY_AGREEMENT_VERSION, sections: SAFETY_SECTIONS } },
		methods: {
			acceptAndBack() {
				uni.$emit('safety-agreement-accepted', this.version)
				uni.navigateBack()
			}
		}
	}
</script>

<style>
	.safety-page { min-height: 100vh; padding: 24rpx 24rpx calc(48rpx + env(safe-area-inset-bottom)); background: #f5faf9; box-sizing: border-box; color: #123e41; }
	.safety-hero { padding: 28rpx; display: flex; align-items: center; gap: 20rpx; border-radius: 22rpx; background: linear-gradient(135deg, #087f80, #09aaa6); color: #fff; }
	.safety-mark { width: 66rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2rpx solid rgba(255,255,255,.75); border-radius: 24rpx 24rpx 32rpx 32rpx; background: rgba(255,255,255,.15); font-size: 34rpx; font-weight: 900; }
	.safety-hero-copy { display: flex; flex: 1; flex-direction: column; min-width: 0; }.safety-title { font-size: 31rpx; font-weight: 900; line-height: 1.35; }.safety-version { margin-top: 8rpx; color: rgba(255,255,255,.78); font-size: 20rpx; }
	.important-note { margin-top: 18rpx; padding: 24rpx 26rpx; border: 1rpx solid #f1d18d; border-radius: 18rpx; background: #fff8e8; }.important-title,.important-text { display: block; }.important-title { color: #8c5c00; font-size: 24rpx; font-weight: 900; }.important-text { margin-top: 9rpx; color: #765f34; font-size: 21rpx; line-height: 1.7; }
	.agreement-card { margin-top: 18rpx; padding: 0 26rpx; border: 1rpx solid #d9e7e5; border-radius: 22rpx; background: #fff; }
	.agreement-section { padding: 26rpx 0; display: flex; align-items: flex-start; gap: 18rpx; border-bottom: 1rpx solid #e1ecea; }.agreement-section-last { border-bottom: 0; }.section-index { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 14rpx; background: #e5f6f4; color: #078f8e; font-size: 18rpx; font-weight: 900; }.section-copy { display: flex; flex: 1; flex-direction: column; min-width: 0; }.section-title { color: #123e41; font-size: 25rpx; font-weight: 900; }.section-line { display: block; margin-top: 10rpx; color: #536e70; font-size: 21rpx; line-height: 1.75; }
	.confirm-card { margin-top: 18rpx; padding: 24rpx 26rpx; border-radius: 18rpx; background: #e8f7f5; }.confirm-title,.confirm-text { display: block; }.confirm-title { color: #087f80; font-size: 24rpx; font-weight: 900; }.confirm-text { margin-top: 8rpx; color: #365f61; font-size: 21rpx; line-height: 1.7; }
	.safety-footer { margin-top: 24rpx; }.accept-button { width: 100%; height: 92rpx; margin: 0; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 18rpx; background: #08aaa6; box-shadow: 0 10rpx 24rpx rgba(6,133,133,.2); color: #fff; font-size: 29rpx; font-weight: 900; line-height: 1; }.accept-button:after { border: 0; }.accept-button:active { transform: scale(.985); }.footer-tip { display: block; margin-top: 13rpx; color: #789092; font-size: 19rpx; text-align: center; }
</style>
