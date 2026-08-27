<template>
	<view class="app atlas-page has-brand-header">
		<brand-header title="极智鱼鉴" theme="light" layout="compact" :back="true" />
		<view v-if="loading" class="loading-state">
			<view class="loading-dot"></view>
			<text>正在展开鱼鉴…</text>
		</view>

		<block v-else-if="game">
			<view class="atlas-hero">
				<view class="summary-cell prize-cell">
					<text class="summary-label"><text class="crown-mark">★</text> 本轮集齐奖励</text>
					<view class="prize-value"><text>¥</text>{{ formatMoney(game.campaign.rewardCents) }}</view>
				</view>
				<view class="summary-divider"></view>
				<view class="summary-cell progress-cell">
					<text class="summary-label">收集进度</text>
					<view class="summary-progress-number"><text>{{ game.round.obtainedCount }}</text>/{{ game.round.totalCount }}</view>
					<view class="progress-track"><view class="progress-fill" :style="{ width: progressPercent + '%' }"></view></view>
				</view>
			</view>

			<view class="card-grid">
				<view
					v-for="(card, index) in game.cards"
					:key="card.speciesId"
					class="fish-card"
					:class="'card-' + card.cardStatus"
					@click="openCard(card)"
				>
					<text class="card-index">{{ index + 1 }}</text>
					<view class="card-art" :style="spriteStyle(index)">
						<view class="card-shade"></view>
						<view v-if="card.cardStatus === 'obtained'" class="obtained-stamp">已获得</view>
						<view v-else-if="card.cardStatus === 'pending'" class="pending-stamp">审核中</view>
						<view v-else class="lock-mark">{{ card.cardStatus === 'rejected' ? '!' : card.cardStatus === 'unavailable' ? '锁' : '?' }}</view>
					</view>
					<view class="card-copy">
						<text class="species-name">{{ card.speciesName }}</text>
						<text class="fish-weight">{{ cardWeight(card, index) }}</text>
						<text class="card-status">{{ cardStatusLabel(card) }}</text>
					</view>
				</view>
			</view>
			<view class="upload-tip"><view class="bulb-icon"></view><text>认证六种常见鱼，审核通过即可点亮</text></view>
			<view class="atlas-upload-btn" @click="openNextCard"><view class="camera-icon"></view><text>上传认证视频</text></view>

			<view class="rules-panel">
				<view class="section-head">
					<text class="section-title">认定标准</text>
				</view>
				<view class="rule-step">
					<text class="rule-index">01</text>
					<text>清晰拍到钓获，并在视频中说出鱼种</text>
				</view>
				<view class="rule-step">
					<text class="rule-index">02</text>
					<text>连续记录将鱼完整放回鱼塘的过程</text>
				</view>
				<view class="rule-step">
					<text class="rule-index">03</text>
					<text>后台审核通过，鱼卡由黑白变彩色</text>
				</view>
				<text class="rule-foot">集齐后自动开启下一轮。单轮完成越快，季度排名越高。</text>
			</view>

			<view class="ranking-panel">
				<view class="ranking-head">
					<view>
						<text class="section-title">季度极速榜</text>
					</view>
					<text class="ranking-note">单轮最快用时</text>
				</view>
				<view v-if="game.ranking && game.ranking.length" class="ranking-list">
					<view v-for="(row, index) in game.ranking" :key="row.userId" class="ranking-row">
						<text class="rank-no">{{ index + 1 }}</text>
						<image class="rank-avatar" :src="row.avatar || '/static/logo-mark.svg'" mode="aspectFill" />
						<view class="rank-user">
							<text class="rank-name">{{ row.nickname || '神秘钓友' }}</text>
							<text class="rank-rounds">已完成 {{ row.completedRounds }} 轮</text>
						</view>
						<view class="rank-result">
							<text>{{ formatDuration(row.bestDurationSeconds) }}</text>
							<text class="rank-prize">奖 ¥{{ rankPrize(index) }}</text>
						</view>
					</view>
				</view>
				<view v-else class="ranking-empty">还没人集齐第一轮，等你来占榜首。</view>
			</view>
		</block>
		<view v-else class="atlas-state">
			<view class="atlas-state-mark">鱼</view>
			<text class="atlas-state-title">{{ loadError ? '鱼鉴暂时加载失败' : '本期鱼鉴正在准备' }}</text>
			<text class="atlas-state-desc">{{ loadError || '活动开放后，六种常见鱼和66元奖励会在这里展示' }}</text>
			<view class="atlas-state-retry" @click="loadGame">重新加载</view>
		</view>

		<view v-if="sheetOpen" class="sheet-mask" @click.self="closeSheet">
			<view class="submit-sheet">
				<view class="sheet-handle"></view>
				<text class="sheet-title">认证 {{ selectedCard.speciesName }}</text>
				<text class="sheet-desc">请上传一段连续视频：展示钓获、说出鱼种、完整放流。建议 60 秒内并开启压缩。</text>
				<video
					v-if="videoTempPath"
					class="video-preview"
					:src="videoTempPath"
					controls
					object-fit="contain"
				/>
				<view v-else class="video-placeholder" @click="chooseVideo">
					<view class="play-mark">▶</view>
					<text>选择认证视频</text>
				</view>
				<button v-if="videoTempPath" class="replace-btn" @click="chooseVideo">重新选择</button>
				<button class="submit-btn" :disabled="!videoTempPath || submitting" @click="submitVideo">
					{{ submitting ? '上传并提交中…' : '提交后台审核' }}
				</button>
				<text class="sheet-safe">视频仅用于鱼卡认定与争议复核</text>
			</view>
		</view>
		<community-tabbar active="" />
	</view>
</template>

<script>
import { isLoggedIn, fetchFishCardGame, formatMoney, formatDuration } from '../../utils/fishingStore.js'
import { submitFishCardVideo, resolveAssetUrl } from '../../utils/request.js'

const RANK_PRIZES = [688, 588, 488, 388, 288, 188]

export default {
	data() {
		return {
			loading: true,
			game: null,
			loadError: '',
			sheetOpen: false,
			selectedCard: null,
			videoTempPath: '',
			submitting: false
		}
	},
	computed: {
		progressPercent() {
			if (!this.game || !this.game.round.totalCount) return 0
			return Math.round(this.game.round.obtainedCount * 100 / this.game.round.totalCount)
		},
		phaseText() {
			return { upcoming: '即将开始', active: '进行中', ended: '已结束' }[this.game.phase] || '进行中'
		}
	},
	onShow() {
		if (!isLoggedIn()) {
			uni.redirectTo({ url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/fishCard/fishCard') })
			return
		}
		this.loadGame()
	},
	onShareAppMessage() {
		return { title: '极智鱼鉴：集齐6种常见鱼，获得66元奖励', path: '/pages/fishCard/fishCard' }
	},
	methods: {
		loadGame() {
			this.loading = true
			this.loadError = ''
			fetchFishCardGame().then((data) => {
				if (data && data.cards) {
					data.cards = data.cards.map((card) => ({
						...card,
						videoUrl: resolveAssetUrl(card.videoUrl || ''),
						avatar: resolveAssetUrl(card.avatar || '')
					}))
				}
				if (data && data.ranking) {
					data.ranking = data.ranking.map(row => ({ ...row, avatar: resolveAssetUrl(row.avatar || '') }))
				}
				this.game = data
			}).catch((e) => {
				this.game = null
				this.loadError = (e && (e.msg || e.message)) || '请检查网络和登录状态后重试'
			}).finally(() => { this.loading = false })
		},
		spriteStyle(index) {
			const col = index % 5
			const row = Math.floor(index / 5)
			return {
				backgroundImage: "url('/static/fish-card-atlas.jpg')",
				backgroundSize: '500% 200%',
				backgroundPosition: `${col * 25}% ${row * 100}%`
			}
		},
		cardStatusText(card) {
			if (card.cardStatus === 'obtained') return '审核通过 · 已点亮'
			if (card.cardStatus === 'pending') return '视频审核中'
			if (card.cardStatus === 'rejected') return card.rejectReason || '未通过 · 可重传'
			if (card.cardStatus === 'unavailable') return '待解锁'
			return '待解锁'
		},
		cardStatusLabel(card) {
			if (card.cardStatus === 'obtained') return '已获得'
			if (card.cardStatus === 'pending') return '审核中'
			if (card.cardStatus === 'rejected') return '未通过，可重传'
			if (card.cardStatus === 'unavailable' || card.available === false) return '待解锁'
			return '待认证'
		},
		cardWeight(card, index) {
			if (card.cardStatus !== 'obtained') return '--'
			return ['7.65kg','4.32kg','9.18kg','2.85kg','3.40kg','3.08kg','0.68kg','2.15kg','0.46kg','1.20kg'][index] || '--'
		},
		openNextCard() {
			const card = this.game && this.game.cards.find((item) => item.available !== false && item.cardStatus !== 'obtained' && item.cardStatus !== 'pending')
			if (card) this.openCard(card)
			else uni.showToast({ title: '当前没有待认证鱼卡', icon: 'none' })
		},
		openCard(card) {
			if (card.available === false || card.cardStatus === 'unavailable') {
				uni.showToast({ title: '该鱼种待后续活动解锁', icon: 'none' })
				return
			}
			if (this.game.phase === 'upcoming') {
				uni.showToast({ title: '活动还未开始，先收藏鱼鉴', icon: 'none' })
				return
			}
			if (this.game.phase === 'ended') {
				uni.showToast({ title: '本期活动已结束', icon: 'none' })
				return
			}
			if (card.cardStatus === 'obtained') {
				uni.showToast({ title: '这张鱼卡已经点亮', icon: 'success' })
				return
			}
			if (card.cardStatus === 'pending') {
				uni.showToast({ title: '视频审核中，请耐心等待', icon: 'none' })
				return
			}
			this.selectedCard = card
			this.videoTempPath = ''
			this.sheetOpen = true
		},
		closeSheet() {
			if (this.submitting) return
			this.sheetOpen = false
			this.videoTempPath = ''
		},
		chooseVideo() {
			uni.chooseVideo({
				sourceType: ['camera', 'album'],
				compressed: true,
				maxDuration: 60,
				camera: 'back',
				success: (res) => { this.videoTempPath = res.tempFilePath }
			})
		},
		async submitVideo() {
			if (!this.videoTempPath || !this.selectedCard || this.submitting) return
			this.submitting = true
			uni.showLoading({ title: '上传认证视频', mask: true })
			try {
				await submitFishCardVideo(this.videoTempPath, this.selectedCard.speciesId)
				this.sheetOpen = false
				this.videoTempPath = ''
				uni.showToast({ title: '已提交，等待审核', icon: 'success' })
				this.loadGame()
			} catch (e) {
				uni.showToast({ title: (e && (e.msg || e.message)) || '提交失败，请重试', icon: 'none' })
			} finally {
				uni.hideLoading()
				this.submitting = false
			}
		},
		formatDate(value) {
			if (!value) return '--'
			const date = new Date(value)
			return `${date.getMonth() + 1}月${date.getDate()}日`
		},
		rankPrize(index) { return RANK_PRIZES[index] || 0 },
		formatMoney,
		formatDuration
	}
}
</script>

<style scoped>
.atlas-page { min-height: 100vh; padding: 24rpx 24rpx calc(138rpx + env(safe-area-inset-bottom)); background: var(--g-50); color: var(--ink); }
.loading-state { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18rpx; color: var(--ink-2); font-size: 26rpx; }
.loading-dot { width: 22rpx; height: 22rpx; border-radius: 50%; background: var(--gold-ink); animation: pulse 900ms ease-in-out infinite alternate; }
@keyframes pulse { from { opacity: .35; transform: scale(.8); } to { opacity: 1; transform: scale(1.1); } }
.atlas-state { min-height: 620rpx; padding: 90rpx 42rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1rpx solid #d9e8e7; border-radius: 24rpx; background: #fff; text-align: center; }
.atlas-state-mark { width: 112rpx; height: 112rpx; display: flex; align-items: center; justify-content: center; border-radius: 32rpx; background: #e8f8f7; color: #0caaa6; font-size: 42rpx; font-weight: 900; }
.atlas-state-title { margin-top: 26rpx; color: #123f43; font-size: 32rpx; font-weight: 800; }
.atlas-state-desc { max-width: 500rpx; margin-top: 12rpx; color: #789092; font-size: 24rpx; line-height: 1.6; }
.atlas-state-retry { margin-top: 30rpx; min-width: 210rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 12rpx; background: #0bafab; color: #fff; font-size: 26rpx; font-weight: 700; }

.atlas-hero { position: relative; overflow: hidden; padding: 34rpx 32rpx 28rpx; border-radius: var(--r-lg); color: #ffd486; background: var(--g-800); }
.atlas-hero::after { content: ''; position: absolute; width: 300rpx; height: 300rpx; right: -100rpx; top: -120rpx; border-radius: 50%; border: 50rpx solid rgba(229, 193, 119, .08); }
.hero-topline, .hero-prize, .date-row { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; }
.hero-kicker,.atlas-hero.phase-tag { padding: 7rpx 16rpx; border-radius: 99rpx; font-size: 20rpx; font-weight: 600; background: rgba(247, 243, 232, .12); }
.phase-active { color: var(--g-200); }.phase-upcoming { color: var(--gold-line); }.phase-ended { color: var(--ink-4); }
.atlas-title { position: relative; z-index: 1; display: block; margin-top: 24rpx; font-size: 46rpx; line-height: 1.15; font-weight: 600; letter-spacing: 1rpx; }
.atlas-subtitle { position: relative; z-index: 1; display: block; margin-top: 12rpx; color: rgba(247, 243, 232, .72); font-size: 24rpx; line-height: 1.5; }
.hero-prize { margin-top: 38rpx; align-items: flex-end; }
.prize-label { display: block; color: rgba(247, 243, 232, .62); font-size: 21rpx; }
.prize-value { margin-top: 2rpx; color: var(--gold); font-size: 58rpx; line-height: 1; font-weight: 600; }
.prize-value text { margin-right: 4rpx; font-size: 28rpx; }
.round-seal { padding: 14rpx 20rpx; border: 1rpx solid rgba(232, 198, 125, .48); border-radius: var(--r-sm); color: var(--gold); font-size: 24rpx; font-weight: 600; }
.date-row { justify-content: flex-start; gap: 14rpx; margin-top: 26rpx; color: rgba(247, 243, 232, .65); font-size: 21rpx; }
.date-line { width: 44rpx; height: 1rpx; background: rgba(247, 243, 232, .34); }

.progress-section, .rules-panel, .ranking-panel { margin-top: 22rpx; padding: 28rpx; border: 1rpx solid var(--ink-4); border-radius: var(--r); background: var(--g-50); }
.progress-copy, .ranking-head { display: flex; align-items: flex-end; justify-content: space-between; }
.section-title { display: block; margin-top: 10rpx; color: var(--ink); font-size: 32rpx; line-height: 1.2; font-weight: 600; }
.progress-number { color: var(--ink-2); font-size: 26rpx; font-weight: 500; }
.progress-number text { margin-right: 4rpx; color: var(--gold-ink); font-size: 48rpx; line-height: 1; font-weight: 600; }
.progress-track { height: 16rpx; margin-top: 24rpx; overflow: hidden; border-radius: 99rpx; background: var(--ink-4); }
.progress-fill { height: 100%; border-radius: 99rpx; background: var(--gold-ink); transition: width 260ms cubic-bezier(.22, 1, .36, 1); }
.pending-note { display: block; margin-top: 14rpx; color: var(--ink-2); font-size: 22rpx; }

.card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18rpx; margin-top: 22rpx; }
.fish-card { overflow: hidden; border: 1rpx solid var(--ink-4); border-radius: var(--r); background: var(--g-50); }
.card-art { position: relative; height: 0; padding-top: 100%; background-repeat: no-repeat; }
.card-shade { position: absolute; inset: 0; background: rgba(30, 39, 35, .06); }
.card-locked .card-art, .card-pending .card-art, .card-rejected .card-art, .card-unavailable .card-art { -webkit-filter: grayscale(1) saturate(.25); filter: grayscale(1) saturate(.25); }
.card-locked .card-art { opacity: .56; }
.card-pending .card-art { opacity: .74; }
.card-rejected .card-art { opacity: .64; }
.card-unavailable .card-art { opacity: .38; }
.obtained-stamp, .pending-stamp, .lock-mark { position: absolute; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.obtained-stamp { right: 14rpx; top: 14rpx; padding: 8rpx 13rpx; border-radius: 99rpx; color: #ffd486; background: var(--g-700); font-size: 20rpx; }
.pending-stamp { right: 14rpx; top: 14rpx; padding: 8rpx 13rpx; border-radius: 99rpx; color: #12383a; background: var(--gold); font-size: 20rpx; }
.lock-mark { inset: 0; color: rgba(23, 37, 31, .62); font-size: 60rpx; }
.card-copy { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; padding: 18rpx 18rpx 20rpx; }
.species-name { color: var(--ink); font-size: 28rpx; font-weight: 600; }
.card-status { max-width: 150rpx; overflow: hidden; color: var(--ink-2); font-size: 19rpx; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.card-obtained { border-color: rgba(29, 98, 77, .42); }
.card-obtained .card-status { color: var(--jade); }
.card-rejected .card-status { color: var(--danger); }
.card-unavailable .card-status { color: var(--ink-2); }

.section-head { margin-bottom: 8rpx; }
.rule-step { display: flex; align-items: flex-start; gap: 18rpx; padding: 20rpx 0; border-bottom: 1rpx solid var(--ink-4); color: var(--jade); font-size: 25rpx; line-height: 1.55; }
.rule-index { flex: 0 0 auto; color: var(--gold-ink); font-size: 22rpx; font-weight: 600; }
.rule-foot { display: block; margin-top: 20rpx; color: var(--ink-2); font-size: 22rpx; line-height: 1.6; }
.ranking-note { color: var(--ink-2); font-size: 21rpx; }
.ranking-list { margin-top: 20rpx; }
.ranking-row { display: flex; align-items: center; gap: 14rpx; padding: 18rpx 0; border-top: 1rpx solid var(--ink-4); }
.rank-no { width: 36rpx; color: var(--gold-ink); font-size: 28rpx; font-weight: 600; text-align: center; }
.rank-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: var(--ink-4); }
.rank-user { flex: 1; min-width: 0; }
.rank-name, .rank-rounds { display: block; }
.rank-name { overflow: hidden; color: var(--ink); font-size: 25rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.rank-rounds { margin-top: 4rpx; color: var(--ink-2); font-size: 19rpx; }
.rank-result { text-align: right; color: var(--jade); font-size: 22rpx; font-weight: 600; }
.rank-prize { display: block; margin-top: 5rpx; color: var(--gold-ink); font-size: 19rpx; }
.ranking-empty { margin-top: 24rpx; padding: 30rpx 12rpx; color: var(--ink-2); font-size: 24rpx; text-align: center; }

.sheet-mask { position: fixed; inset: 0; z-index: 999; display: flex; align-items: flex-end; background: rgba(9, 21, 16, .58); }
.submit-sheet { width: 100%; padding: 18rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 30rpx 30rpx 0 0; background: var(--g-50); }
.sheet-handle { width: 70rpx; height: 8rpx; margin: 0 auto 24rpx; border-radius: 99rpx; background: var(--ink-3); }
.sheet-title { display: block; color: var(--ink); font-size: 36rpx; font-weight: 600; }
.sheet-desc { display: block; margin-top: 12rpx; color: var(--ink-2); font-size: 24rpx; line-height: 1.55; }
.video-placeholder, .video-preview { width: 100%; height: 360rpx; margin-top: 24rpx; border-radius: var(--r); background: var(--ink-4); }
.video-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx; color: var(--jade); font-size: 25rpx; font-weight: 600; }
.play-mark { width: 76rpx; height: 76rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; background: var(--g-700); font-size: 28rpx; }
.replace-btn { margin-top: 14rpx; border: 0; background: transparent; color: var(--jade); font-size: 24rpx; }
.replace-btn::after, .submit-btn::after { border: 0; }
.submit-btn { height: 96rpx; margin-top: 18rpx; border: 0; border-radius: var(--r-sm); color: #fff; background: var(--g-700); font-size: 30rpx; line-height: 96rpx; font-weight: 600; }
.submit-btn[disabled] { color: #fff; background: var(--ink-3); }
.sheet-safe { display: block; margin-top: 14rpx; color: var(--ink-2); font-size: 20rpx; text-align: center; }
</style>

<style scoped>
.atlas-page{padding:14rpx 20rpx calc(126rpx + env(safe-area-inset-bottom));background:#f8fbfb}.atlas-hero{height:132rpx;padding:20rpx 24rpx;box-sizing:border-box;display:flex;align-items:center;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff;color:#123f43}.atlas-hero::after{display:none}.summary-cell{flex:1;min-width:0}.summary-divider{width:1rpx;height:84rpx;background:#dce7e6;margin:0 24rpx}.summary-label{display:block;color:#637779;font-size:22rpx}.crown-mark{color:#eea500}.prize-value{margin-top:5rpx;color:#e99c00;font-size:49rpx;font-weight:800}.prize-value text{font-size:27rpx}.summary-progress-number{margin-top:6rpx;color:#36595b;font-size:25rpx}.summary-progress-number text{font-size:38rpx;color:#08a6a3;font-weight:800}.progress-cell .progress-track{height:9rpx;margin-top:8rpx;background:#e2ebea}.progress-cell .progress-fill{background:#08aaa6}.card-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:10rpx;margin-top:16rpx}.fish-card{position:relative;border-radius:11rpx;border-color:#9ccdcc;background:#fff}.card-index{position:absolute;z-index:3;left:6rpx;top:6rpx;width:28rpx;height:28rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#0a9f9c;color:#fff;font-size:18rpx;font-weight:800}.card-art{padding-top:158%;background-size:500% 200%}.card-shade{background:rgba(30,39,35,.02)}.obtained-stamp,.pending-stamp,.lock-mark{display:none}.card-copy{min-height:90rpx;padding:7rpx 4rpx 8rpx;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-start;text-align:center;gap:2rpx}.species-name{font-size:20rpx;font-weight:800}.fish-weight{font-size:17rpx;color:#526b6d}.card-status{margin-top:auto;padding:4rpx 2rpx;border-radius:5rpx;background:#e6eeee;color:#637779;font-size:15rpx;line-height:1.2}.card-obtained .card-status{background:#0ba9a5;color:#fff}.card-pending .card-status{background:#fff0cb;color:#a66b00}.rules-panel,.ranking-panel{display:none}.upload-tip{height:84rpx;display:flex;align-items:center;justify-content:center;gap:12rpx;color:#6d8082;font-size:22rpx}.bulb-icon{width:22rpx;height:28rpx;border:3rpx solid #eca600;border-radius:50% 50% 8rpx 8rpx;position:relative}.bulb-icon::after{content:'';position:absolute;left:5rpx;right:5rpx;bottom:-8rpx;border-top:4rpx solid #eca600}.atlas-upload-btn{height:82rpx;display:flex;align-items:center;justify-content:center;gap:15rpx;border-radius:12rpx;background:#0bafab;color:#fff;font-size:28rpx;font-weight:800}.camera-icon{width:38rpx;height:29rpx;border:5rpx solid #fff;border-radius:6rpx;position:relative}.camera-icon::before{content:'';position:absolute;left:9rpx;top:4rpx;width:11rpx;height:11rpx;border:4rpx solid #fff;border-radius:50%}.camera-icon::after{content:'';position:absolute;left:6rpx;top:-12rpx;width:17rpx;height:10rpx;border-radius:4rpx 4rpx 0 0;background:#fff}
@media(max-width:360px){.atlas-hero{padding-left:18rpx;padding-right:18rpx}.summary-divider{margin-left:16rpx;margin-right:16rpx}.card-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:8rpx}.card-copy{min-height:86rpx}.species-name{font-size:19rpx}.card-status{font-size:15rpx}.fish-weight{font-size:16rpx}.atlas-upload-btn{height:88rpx}}
</style>
