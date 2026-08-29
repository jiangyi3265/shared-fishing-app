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
			<text class="upload-build">{{ runtimeLabel }}</text>

			<view v-if="submittedCards.length" class="submission-panel">
				<view class="submission-head">
					<view>
						<text class="submission-title">我的认证视频</text>
						<text class="submission-caption">已上传 {{ submittedCards.length }} 条，点击可播放查看</text>
					</view>
					<text class="submission-count">{{ submittedCards.length }}</text>
				</view>
				<view
					v-for="card in submittedCards"
					:key="'video-' + card.speciesId"
					class="submission-row"
					@click="previewSubmitted(card)"
				>
					<view class="submission-play">▶</view>
					<view class="submission-copy">
						<text class="submission-name">{{ card.speciesName }}认证视频</text>
						<text class="submission-time">{{ formatSubmittedTime(card.submittedTime) }}</text>
					</view>
					<text class="submission-status" :class="'status-' + card.cardStatus">{{ cardStatusText(card) }}</text>
				</view>
			</view>

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
				<text class="sheet-desc">请上传一段连续视频：展示钓获、说出鱼种、完整放流。相册视频最长 5 分钟，文件需小于 48MB。</text>
				<text class="sheet-runtime">{{ runtimeLabel }} · {{ runtimeInfo.apiBaseUrl }}</text>
				<video
					v-if="videoTempPath"
					class="video-preview"
					:src="videoTempPath"
					controls
					show-center-play-btn
					show-play-btn
					object-fit="contain"
				/>
				<view v-else class="video-placeholder" @click="chooseVideo">
					<view class="play-mark">▶</view>
					<text>选择认证视频</text>
				</view>
				<view v-if="videoTempPath" class="selected-video-state">
					<view class="selected-check">✓</view>
					<view class="selected-copy">
						<text>视频已选择，可先播放检查</text>
						<text>{{ selectedVideoInfo }}</text>
					</view>
					<button class="replace-btn" :disabled="submitting" @click="chooseVideo">重选</button>
				</view>
				<view v-if="submitting" class="upload-progress-block">
					<view class="upload-progress-copy"><text>正在上传到审核后台</text><text>{{ uploadProgress }}%</text></view>
					<view class="upload-progress-track"><view class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></view></view>
				</view>
				<view v-if="lastUploadDiagnostic" class="upload-diagnostic" :class="'diag-' + lastUploadDiagnostic.status">
					<view class="diagnostic-head"><text>{{ lastUploadStatusLabel }}</text><text>{{ lastUploadDiagnostic.attemptId || '' }}</text></view>
					<text v-if="lastUploadDiagnostic.message" class="diagnostic-message">{{ lastUploadDiagnostic.message }}</text>
				</view>
				<button class="submit-btn" :disabled="!videoTempPath || submitting" @click="submitVideo">
					{{ submitting ? `正在上传 ${uploadProgress}%` : '立即上传并生成审核单' }}
				</button>
				<text class="sheet-safe">只有看到“上传成功”和审核单号，后台才算真正收到视频</text>
			</view>
		</view>

		<view v-if="playerOpen && playingCard" class="viewer-mask" @click.self="closePlayer">
			<view class="viewer-panel">
				<view class="viewer-head">
					<view>
						<text class="viewer-title">{{ playingCard.speciesName }}认证视频</text>
						<text class="viewer-status">{{ cardStatusText(playingCard) }} · {{ formatSubmittedTime(playingCard.submittedTime) }}</text>
					</view>
					<view class="viewer-close" @click="closePlayer">×</view>
				</view>
				<video
					class="submitted-video-player"
					:src="playingCard.videoUrl"
					controls
					autoplay
					show-center-play-btn
					show-play-btn
					object-fit="contain"
				/>
				<text class="viewer-note">这是已提交到后台的视频，审核状态会在此同步更新。</text>
			</view>
		</view>
		<community-tabbar active="" />
	</view>
</template>

<script>
import { isLoggedIn, fetchFishCardGame, formatMoney, formatDuration } from '../../utils/fishingStore.js'
import {
	submitFishCardVideo,
	reportFishCardUploadDiagnostic,
	resolveAssetUrl,
	getMiniProgramRuntimeInfo
} from '../../utils/request.js'

const RANK_PRIZES = [688, 588, 488, 388, 288, 188]
const BUILD_VERSION = '1.0.18'
const MAX_VIDEO_BYTES = 48 * 1024 * 1024
const MAX_VIDEO_DURATION_SECONDS = 5 * 60
const LAST_UPLOAD_DIAGNOSTIC_KEY = 'fishcard_last_upload_diagnostic'

export default {
	data() {
		return {
			loading: true,
			game: null,
			loadError: '',
			sheetOpen: false,
			selectedCard: null,
			videoTempPath: '',
			videoMeta: { duration: 0, size: 0 },
			submitting: false,
			uploadProgress: 0,
			runtimeInfo: getMiniProgramRuntimeInfo(),
			lastUploadDiagnostic: null,
			playerOpen: false,
			playingCard: null
		}
	},
	computed: {
		progressPercent() {
			if (!this.game || !this.game.round.totalCount) return 0
			return Math.round(this.game.round.obtainedCount * 100 / this.game.round.totalCount)
		},
		phaseText() {
			return { upcoming: '即将开始', active: '进行中', ended: '已结束' }[this.game.phase] || '进行中'
		},
		submittedCards() {
			if (!this.game || !Array.isArray(this.game.cards)) return []
			return this.game.cards.filter(card => card.videoUrl)
		},
		selectedVideoInfo() {
			const parts = []
			if (this.videoMeta.duration) parts.push(`${Math.ceil(this.videoMeta.duration)} 秒`)
			if (this.videoMeta.size) parts.push(this.formatFileSize(this.videoMeta.size))
			return parts.length ? parts.join(' · ') + ' · 尚未上传' : '已准备好，尚未上传'
		},
		runtimeLabel() {
			const envLabel = { develop: '开发版', trial: '体验版', release: '正式版' }[this.runtimeInfo.envVersion] || this.runtimeInfo.envVersion
			const platform = this.runtimeInfo.platformVersion && this.runtimeInfo.platformVersion !== BUILD_VERSION
				? ` · 平台 ${this.runtimeInfo.platformVersion}`
				: ''
			return `上传模块 v${BUILD_VERSION} · ${envLabel}${platform}`
		},
		lastUploadStatusLabel() {
			if (!this.lastUploadDiagnostic) return ''
			return {
				selected: '视频已选择，尚未上传',
				uploading: '正在上传',
				verifying: '服务器已接收，正在核验',
				success: '上传成功',
				failed: '上次上传未成功'
			}[this.lastUploadDiagnostic.status] || '上传状态'
		}
	},
	onShow() {
		this.runtimeInfo = getMiniProgramRuntimeInfo()
		this.restoreUploadDiagnostic()
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
		restoreUploadDiagnostic() {
			try {
				this.lastUploadDiagnostic = uni.getStorageSync(LAST_UPLOAD_DIAGNOSTIC_KEY) || null
			} catch (e) {
				this.lastUploadDiagnostic = null
			}
		},
		saveUploadDiagnostic(payload) {
			const value = {
				...payload,
				updatedAt: Date.now(),
				clientVersion: BUILD_VERSION,
				envVersion: this.runtimeInfo.envVersion,
				apiBaseUrl: this.runtimeInfo.apiBaseUrl
			}
			this.lastUploadDiagnostic = value
			try { uni.setStorageSync(LAST_UPLOAD_DIAGNOSTIC_KEY, value) } catch (e) {}
		},
		createUploadAttemptId() {
			return `FC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
		},
		getVideoFileSize(filePath) {
			return new Promise((resolve) => {
				if (!uni.getFileInfo) {
					resolve(Number(this.videoMeta.size) || 0)
					return
				}
				uni.getFileInfo({
					filePath,
					success: res => resolve(Number(res.size) || Number(this.videoMeta.size) || 0),
					fail: () => resolve(Number(this.videoMeta.size) || 0)
				})
			})
		},
		async validateSelectedVideo() {
			if (!this.videoTempPath) throw new Error('请重新选择认证视频')
			const size = await this.getVideoFileSize(this.videoTempPath)
			this.videoMeta = { ...this.videoMeta, size }
			if (size > MAX_VIDEO_BYTES) throw new Error(`视频为 ${this.formatFileSize(size)}，请压缩到 48MB 以内再上传`)
			if (Number(this.videoMeta.duration) > MAX_VIDEO_DURATION_SECONDS) {
				throw new Error('认证视频请控制在 5 分钟以内')
			}
		},
		async loadGame() {
			this.loading = true
			this.loadError = ''
			try {
				const data = await fetchFishCardGame()
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
			} catch (e) {
				this.game = null
				this.loadError = (e && (e.msg || e.message)) || '请检查网络和登录状态后重试'
			} finally {
				this.loading = false
			}
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
				if (card.videoUrl) this.previewSubmitted(card)
				else uni.showToast({ title: '这张鱼卡已经点亮', icon: 'success' })
				return
			}
			if (card.cardStatus === 'pending') {
				if (card.videoUrl) this.previewSubmitted(card)
				else uni.showToast({ title: '视频审核中，请耐心等待', icon: 'none' })
				return
			}
			this.selectedCard = card
			this.videoTempPath = ''
			this.videoMeta = { duration: 0, size: 0 }
			this.uploadProgress = 0
			this.sheetOpen = true
		},
		closeSheet() {
			if (this.submitting) return
			this.sheetOpen = false
			this.videoTempPath = ''
			this.videoMeta = { duration: 0, size: 0 }
			this.uploadProgress = 0
		},
		chooseVideo() {
			const onSuccess = async (res) => {
				const selected = Array.isArray(res.tempFiles) && res.tempFiles.length ? res.tempFiles[0] : res
				this.videoTempPath = selected.tempFilePath || selected.path || res.tempFilePath || ''
				this.videoMeta = { duration: Number(selected.duration) || 0, size: Number(selected.size) || 0 }
				this.uploadProgress = 0
				try {
					await this.validateSelectedVideo()
				} catch (e) {
					this.videoTempPath = ''
					uni.showModal({ title: '视频无法上传', content: e.message || '请重新选择视频', showCancel: false })
					return
				}
				this.saveUploadDiagnostic({
					status: 'selected',
					attemptId: '',
					speciesId: this.selectedCard && this.selectedCard.speciesId,
					message: `${this.selectedVideoInfo}。请点击“立即上传”才会进入后台。`
				})
				uni.showModal({
					title: '视频已选好（尚未上传）',
					content: `${this.selectedVideoInfo}\n可先播放检查，也可以现在立即上传。`,
					cancelText: '先预览',
					confirmText: '立即上传',
					success: modal => { if (modal.confirm) this.submitVideo() }
				})
			}
			const onFail = (err) => {
				const detail = String((err && err.errMsg) || '')
				if (/cancel/i.test(detail)) return
				uni.showModal({ title: '未能选择视频', content: detail || '请检查相册权限后重试', showCancel: false })
			}

			// chooseMedia 的 maxDuration 只限制现场拍摄，不限制相册已有视频；
			// 因此可以选择接近 5 分钟的认证视频，同时仍把现场拍摄控制在 60 秒内。
			if (typeof uni.chooseMedia === 'function') {
				uni.chooseMedia({
					count: 1,
					mediaType: ['video'],
					sourceType: ['album', 'camera'],
					sizeType: ['compressed'],
					maxDuration: 60,
					camera: 'back',
					success: onSuccess,
					fail: onFail
				})
				return
			}

			uni.chooseVideo({
				sourceType: ['album', 'camera'],
				compressed: true,
				maxDuration: 60,
				camera: 'back',
				success: onSuccess,
				fail: onFail
			})
		},
		async submitVideo() {
			if (!this.videoTempPath || !this.selectedCard || this.submitting) return
			const attemptId = this.createUploadAttemptId()
			const speciesId = this.selectedCard.speciesId
			this.submitting = true
			this.uploadProgress = 1
			this.saveUploadDiagnostic({
				status: 'uploading',
				attemptId,
				speciesId,
				message: '正在连接上传服务器，请不要关闭小程序'
			})
			try {
				await this.validateSelectedVideo()
				const receipt = await submitFishCardVideo(this.videoTempPath, speciesId, (progress) => {
					this.uploadProgress = Math.max(1, progress)
				}, {
					attemptId,
					clientVersion: BUILD_VERSION,
					envVersion: this.runtimeInfo.envVersion
				})
				if (!receipt || !receipt.catchId || !receipt.videoUrl) {
					throw new Error('服务器未返回审核凭证，请勿重复上传并联系工作人员')
				}
				this.uploadProgress = 100
				this.saveUploadDiagnostic({ status: 'verifying', attemptId, speciesId, catchId: receipt.catchId, message: '服务器已接收，正在核对审核记录' })
				await this.loadGame()
				const submitted = this.game && this.game.cards && this.game.cards.find(card =>
					Number(card.speciesId) === Number(speciesId) &&
					Number(card.catchId) === Number(receipt.catchId) &&
					card.videoUrl
				)
				if (!submitted) {
					throw new Error(`审核单 #${receipt.catchId} 已创建，但页面回读失败，请联系工作人员`)
				}
				this.saveUploadDiagnostic({ status: 'success', attemptId, speciesId, catchId: receipt.catchId, message: `审核单 #${receipt.catchId} 已进入后台` })
				this.sheetOpen = false
				this.videoTempPath = ''
				this.videoMeta = { duration: 0, size: 0 }
				uni.showModal({
					title: '上传成功',
					content: `审核单 #${receipt.catchId} 已提交。\n上传编号：${attemptId}\n可在“我的认证视频”中播放查看。`,
					showCancel: false,
					success: () => this.previewSubmitted(submitted)
				})
			} catch (e) {
				const message = (e && (e.msg || e.message)) || '提交失败，请重试'
				const detail = String((e && e.detail) || '')
				this.saveUploadDiagnostic({ status: 'failed', attemptId, speciesId, message })
				reportFishCardUploadDiagnostic({
					stage: (e && e.stage) || 'client-catch',
					attemptId,
					clientMessage: `${message}${detail ? ` | ${detail}` : ''}`.slice(0, 500),
					clientVersion: BUILD_VERSION,
					envVersion: this.runtimeInfo.envVersion,
					speciesId,
					fileSize: Number(this.videoMeta.size) || 0,
					duration: Number(this.videoMeta.duration) || 0
				}).catch(() => {})
				uni.showModal({
					title: '视频未上传成功',
					content: `${message}\n\n本次未生成审核单，后台不会有记录。\n上传编号：${attemptId}\n${this.runtimeLabel}`,
					showCancel: false,
					confirmText: '知道了'
				})
			} finally {
				this.submitting = false
			}
		},
		previewSubmitted(card) {
			if (!card || !card.videoUrl) {
				uni.showToast({ title: '暂时找不到已上传视频', icon: 'none' })
				return
			}
			this.playingCard = card
			this.playerOpen = true
		},
		closePlayer() {
			this.playerOpen = false
			this.playingCard = null
		},
		formatFileSize(bytes) {
			const size = Number(bytes) || 0
			if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
			return `${(size / 1024 / 1024).toFixed(1)} MB`
		},
		formatSubmittedTime(value) {
			if (!value) return '已提交到审核后台'
			const normalized = typeof value === 'string'
				? value.replace(/-/g, '/').replace('T', ' ')
				: value
			const date = new Date(normalized)
			if (Number.isNaN(date.getTime())) return String(value)
			const pad = number => String(number).padStart(2, '0')
			return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
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

.submission-panel { margin-top: 18rpx; overflow: hidden; border: 1rpx solid #cfe2e1; border-radius: 16rpx; background: #fbfdfd; }
.submission-head { display: flex; align-items: center; justify-content: space-between; padding: 22rpx 24rpx 18rpx; background: #edf7f6; }
.submission-title, .submission-caption { display: block; }
.submission-title { color: #123f43; font-size: 28rpx; font-weight: 800; }
.submission-caption { margin-top: 5rpx; color: #687f81; font-size: 19rpx; }
.submission-count { min-width: 44rpx; height: 44rpx; padding: 0 8rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; border-radius: 22rpx; background: #0a9f9c; color: #f8fbfb; font-size: 21rpx; font-weight: 800; }
.submission-row { min-height: 92rpx; display: flex; align-items: center; gap: 16rpx; padding: 16rpx 20rpx; border-top: 1rpx solid #dce9e8; box-sizing: border-box; }
.submission-play { flex: 0 0 auto; width: 54rpx; height: 54rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; border: 2rpx solid #0a9f9c; border-radius: 50%; color: #0a9f9c; font-size: 20rpx; text-indent: 3rpx; }
.submission-copy { flex: 1; min-width: 0; }
.submission-name, .submission-time { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.submission-name { color: #123f43; font-size: 24rpx; font-weight: 700; }
.submission-time { margin-top: 5rpx; color: #718789; font-size: 18rpx; }
.submission-status { flex: 0 0 auto; max-width: 190rpx; padding: 7rpx 11rpx; border-radius: 7rpx; background: #e7efee; color: #627779; font-size: 18rpx; line-height: 1.25; text-align: center; }
.submission-status.status-pending { background: #fff0cb; color: #9a6500; }
.submission-status.status-obtained { background: #def3ea; color: #197655; }
.submission-status.status-rejected { background: #fde8e5; color: #a74438; }

.sheet-mask { position: fixed; inset: 0; z-index: 999; display: flex; align-items: flex-end; background: rgba(9, 21, 16, .58); }
.submit-sheet { width: 100%; padding: 18rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 30rpx 30rpx 0 0; background: var(--g-50); }
.sheet-handle { width: 70rpx; height: 8rpx; margin: 0 auto 24rpx; border-radius: 99rpx; background: var(--ink-3); }
.sheet-title { display: block; color: var(--ink); font-size: 36rpx; font-weight: 600; }
.sheet-desc { display: block; margin-top: 12rpx; color: var(--ink-2); font-size: 24rpx; line-height: 1.55; }
.video-placeholder, .video-preview { width: 100%; height: 360rpx; margin-top: 24rpx; border-radius: var(--r); background: var(--ink-4); }
.video-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx; color: var(--jade); font-size: 25rpx; font-weight: 600; }
.play-mark { width: 76rpx; height: 76rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; background: var(--g-700); font-size: 28rpx; }
.selected-video-state { min-height: 78rpx; margin-top: 14rpx; padding: 12rpx 12rpx 12rpx 16rpx; display: flex; align-items: center; gap: 12rpx; box-sizing: border-box; border: 1rpx solid #c5e1df; border-radius: 12rpx; background: #edf8f7; }
.selected-check { flex: 0 0 auto; width: 40rpx; height: 40rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #0a9f9c; color: #f8fbfb; font-size: 24rpx; font-weight: 800; }
.selected-copy { flex: 1; min-width: 0; }
.selected-copy text { display: block; color: #123f43; font-size: 21rpx; line-height: 1.4; }
.selected-copy text + text { margin-top: 2rpx; color: #6b8284; font-size: 18rpx; }
.replace-btn { flex: 0 0 auto; min-width: 96rpx; height: 56rpx; margin: 0; padding: 0 16rpx; border: 1rpx solid #0a9f9c; border-radius: 8rpx; background: #f8fbfb; color: #087f7c; font-size: 21rpx; line-height: 54rpx; }
.replace-btn[disabled] { border-color: #b8c8c7; color: #8ca09f; background: #edf2f2; }
.replace-btn::after, .submit-btn::after { border: 0; }
.upload-progress-block { margin-top: 16rpx; }
.upload-progress-copy { display: flex; justify-content: space-between; color: #4f696b; font-size: 20rpx; }
.upload-progress-copy text:last-child { color: #087f7c; font-weight: 800; }
.upload-progress-track { height: 12rpx; margin-top: 10rpx; overflow: hidden; border-radius: 6rpx; background: #dce8e7; }
.upload-progress-fill { height: 100%; border-radius: 6rpx; background: #0a9f9c; transition: width 180ms cubic-bezier(.22, 1, .36, 1); }
.submit-btn { height: 96rpx; margin-top: 18rpx; border: 0; border-radius: var(--r-sm); color: #fff; background: var(--g-700); font-size: 30rpx; line-height: 96rpx; font-weight: 600; }
.submit-btn[disabled] { color: #fff; background: var(--ink-3); }
.sheet-safe { display: block; margin-top: 14rpx; color: var(--ink-2); font-size: 20rpx; text-align: center; }

.viewer-mask { position: fixed; inset: 0; z-index: 1001; display: flex; align-items: center; justify-content: center; padding: 34rpx; box-sizing: border-box; background: rgba(9, 21, 16, .76); }
.viewer-panel { width: 100%; max-width: 690rpx; overflow: hidden; border-radius: 22rpx; background: #f8fbfb; }
.viewer-head { min-height: 108rpx; padding: 20rpx 22rpx; display: flex; align-items: center; justify-content: space-between; gap: 18rpx; box-sizing: border-box; }
.viewer-title, .viewer-status { display: block; }
.viewer-title { color: #123f43; font-size: 28rpx; font-weight: 800; }
.viewer-status { margin-top: 5rpx; color: #687f81; font-size: 19rpx; }
.viewer-close { flex: 0 0 auto; width: 58rpx; height: 58rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e5eeee; color: #315658; font-size: 38rpx; line-height: 1; }
.submitted-video-player { width: 100%; height: 720rpx; max-height: 58vh; background: #0b1818; }
.viewer-note { display: block; padding: 18rpx 22rpx 22rpx; color: #607779; font-size: 20rpx; line-height: 1.55; }
</style>

<style scoped>
.atlas-page{padding:14rpx 20rpx calc(126rpx + env(safe-area-inset-bottom));background:#f8fbfb}.atlas-hero{height:132rpx;padding:20rpx 24rpx;box-sizing:border-box;display:flex;align-items:center;border:1rpx solid #d7e5e4;border-radius:13rpx;background:#fff;color:#123f43}.atlas-hero::after{display:none}.summary-cell{flex:1;min-width:0}.summary-divider{width:1rpx;height:84rpx;background:#dce7e6;margin:0 24rpx}.summary-label{display:block;color:#637779;font-size:22rpx}.crown-mark{color:#eea500}.prize-value{margin-top:5rpx;color:#e99c00;font-size:49rpx;font-weight:800}.prize-value text{font-size:27rpx}.summary-progress-number{margin-top:6rpx;color:#36595b;font-size:25rpx}.summary-progress-number text{font-size:38rpx;color:#08a6a3;font-weight:800}.progress-cell .progress-track{height:9rpx;margin-top:8rpx;background:#e2ebea}.progress-cell .progress-fill{background:#08aaa6}.card-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:10rpx;margin-top:16rpx}.fish-card{position:relative;border-radius:11rpx;border-color:#9ccdcc;background:#fff}.card-index{position:absolute;z-index:3;left:6rpx;top:6rpx;width:28rpx;height:28rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#0a9f9c;color:#fff;font-size:18rpx;font-weight:800}.card-art{padding-top:158%;background-size:500% 200%}.card-shade{background:rgba(30,39,35,.02)}.obtained-stamp,.pending-stamp,.lock-mark{display:none}.card-copy{min-height:90rpx;padding:7rpx 4rpx 8rpx;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-start;text-align:center;gap:2rpx}.species-name{font-size:20rpx;font-weight:800}.fish-weight{font-size:17rpx;color:#526b6d}.card-status{margin-top:auto;padding:4rpx 2rpx;border-radius:5rpx;background:#e6eeee;color:#637779;font-size:15rpx;line-height:1.2}.card-obtained .card-status{background:#0ba9a5;color:#fff}.card-pending .card-status{background:#fff0cb;color:#a66b00}.rules-panel,.ranking-panel{display:none}.upload-tip{height:84rpx;display:flex;align-items:center;justify-content:center;gap:12rpx;color:#6d8082;font-size:22rpx}.bulb-icon{width:22rpx;height:28rpx;border:3rpx solid #eca600;border-radius:50% 50% 8rpx 8rpx;position:relative}.bulb-icon::after{content:'';position:absolute;left:5rpx;right:5rpx;bottom:-8rpx;border-top:4rpx solid #eca600}.atlas-upload-btn{height:82rpx;display:flex;align-items:center;justify-content:center;gap:15rpx;border-radius:12rpx;background:#0bafab;color:#fff;font-size:28rpx;font-weight:800}.camera-icon{width:38rpx;height:29rpx;border:5rpx solid #fff;border-radius:6rpx;position:relative}.camera-icon::before{content:'';position:absolute;left:9rpx;top:4rpx;width:11rpx;height:11rpx;border:4rpx solid #fff;border-radius:50%}.camera-icon::after{content:'';position:absolute;left:6rpx;top:-12rpx;width:17rpx;height:10rpx;border-radius:4rpx 4rpx 0 0;background:#fff}
.upload-build{display:block;margin-top:10rpx;color:#819394;font-size:18rpx;line-height:1.4;text-align:center}.sheet-runtime{display:block;margin-top:8rpx;overflow:hidden;color:#7b8f90;font-size:18rpx;line-height:1.4;text-overflow:ellipsis;white-space:nowrap}.upload-diagnostic{margin-top:14rpx;padding:14rpx 16rpx;border:1rpx solid #c8dedd;border-radius:10rpx;background:#eef7f6}.diagnostic-head{display:flex;align-items:center;justify-content:space-between;gap:12rpx;color:#22585a;font-size:19rpx;font-weight:700}.diagnostic-head text:last-child{max-width:290rpx;overflow:hidden;color:#6a8082;font-size:16rpx;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.diagnostic-message{display:block;margin-top:6rpx;color:#607779;font-size:18rpx;line-height:1.45}.upload-diagnostic.diag-failed{border-color:#edc2bd;background:#fff1ef}.upload-diagnostic.diag-failed .diagnostic-head,.upload-diagnostic.diag-failed .diagnostic-message{color:#9b4036}.upload-diagnostic.diag-success{border-color:#b7dfcc;background:#eaf8f1}.upload-diagnostic.diag-success .diagnostic-head{color:#18704f}
@media(max-width:360px){.atlas-hero{padding-left:18rpx;padding-right:18rpx}.summary-divider{margin-left:16rpx;margin-right:16rpx}.card-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:8rpx}.card-copy{min-height:86rpx}.species-name{font-size:19rpx}.card-status{font-size:15rpx}.fish-weight{font-size:16rpx}.atlas-upload-btn{height:88rpx}}
</style>
