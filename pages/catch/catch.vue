<template>
	<view class="app catch-page">
		<view class="page-head">
			<text class="page-head-title">钓获社区</text>
			<view class="publish-btn" @click="goPublish">晒一单</view>
		</view>

		<view v-if="list.length === 0 && !loading" class="empty">
			<text class="empty-text">还没有人晒鱼，快来第一个</text>
		</view>

		<view class="catch-list">
			<view class="catch-card" v-for="item in list" :key="item.catchId">
				<view class="catch-user">
					<image class="catch-avatar" :src="item.avatar || '/static/default-avatar.png'" />
					<text class="catch-nick">{{ item.nickname }}</text>
					<text class="catch-time">{{ formatTime(item.createTime) }}</text>
				</view>
				<text v-if="item.content" class="catch-content">{{ item.content }}</text>
				<view class="catch-tags">
					<text v-if="item.fishSpecies" class="catch-tag">{{ item.fishSpecies }}</text>
					<text v-if="item.weightJin" class="catch-tag">{{ item.weightJin }}斤</text>
					<text v-if="item.fishingMethod" class="catch-tag">{{ item.fishingMethod }}</text>
				</view>
				<view v-if="item.images" class="catch-imgs">
					<image v-for="(img, idx) in item.images.split(',')" :key="idx" :src="img" class="catch-img" mode="aspectFill" @click="previewImg(item.images.split(','), idx)" />
				</view>
				<view class="catch-footer">
					<view class="catch-like" :class="{liked: item.liked}" @click="doLike(item)">
						<text>{{ item.liked ? '❤️' : '🤍' }} {{ item.likeCount }}</text>
					</view>
					<view class="catch-comment-btn" @click="openComments(item)">
						<text>💬 {{ item.commentCount || 0 }}</text>
					</view>
					<text v-if="item.isFeatured" class="catch-featured">⭐ 精选</text>
				</view>
			</view>
		</view>

		<!-- 评论弹窗 -->
		<view v-if="showComments" class="comment-mask" @click.self="showComments=false">
			<view class="comment-panel">
				<text class="comment-title">评论 ({{ comments.length }})</text>
				<scroll-view scroll-y class="comment-scroll">
					<view class="comment-item" v-for="c in comments" :key="c.commentId">
						<image :src="c.avatar || '/static/default-avatar.png'" class="comment-avatar" />
						<view class="comment-body">
							<view class="comment-head">
								<text class="comment-nick">{{ c.nickname }}</text>
								<text v-if="c.replyToNickname" class="comment-reply">回复 {{ c.replyToNickname }}</text>
							</view>
							<text class="comment-text">{{ c.content }}</text>
							<view class="comment-actions">
								<text class="comment-time">{{ formatTime(c.createTime) }}</text>
								<text class="comment-reply-btn" @click="setReply(c)">回复</text>
							</view>
						</view>
					</view>
					<view v-if="comments.length===0" class="comment-empty">暂无评论，快来抢沙发</view>
				</scroll-view>
				<view class="comment-input-bar">
					<input class="comment-input" v-model="commentText" :placeholder="replyTo ? '回复 '+replyTo.nickname : '写评论...'" @confirm="submitComment" />
					<view class="comment-send" @click="submitComment">发送</view>
				</view>
			</view>
		</view>

		<!-- 发布弹窗 -->
		<view v-if="showPublish" class="publish-mask" @click.self="showPublish=false">
			<view class="publish-panel">
				<text class="publish-title">晒出你的渔获</text>
				<input class="pub-input" v-model="pubForm.fishSpecies" placeholder="鱼种(如鲤鱼)" />
				<input class="pub-input" v-model="pubForm.weightJin" placeholder="重量(斤)" type="digit" />
				<input class="pub-input" v-model="pubForm.fishingMethod" placeholder="钓法(台钓/路亚)" />
				<textarea class="pub-textarea" v-model="pubForm.content" placeholder="说点什么..." />
				<view class="pub-img-row">
					<image v-for="(img,i) in pubImages" :key="i" :src="img" class="pub-img" />
					<view v-if="pubImages.length < 3" class="pub-img-add" @click="chooseImg">+</view>
				</view>
				<view class="pub-submit" @click="doPublish">发布</view>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchCatchList, publishCatch, toggleCatchLike, fetchCatchComments, addCatchComment } from '../../utils/fishingStore.js'
import { uploadFile } from '../../utils/request.js'

export default {
	data() {
		return {
			list: [], loading: true, showPublish: false,
			pubForm: { fishSpecies: '', weightJin: '', fishingMethod: '', content: '' },
			pubImages: [],
			pubUploaded: [],
			showComments: false, comments: [], commentText: '', currentCatchId: null, replyTo: null
		}
	},
	onShow() { this.loadData() },
	methods: {
		loadData() {
			this.loading = true
			fetchCatchList().then(rows => { this.list = rows; this.loading = false }).catch(() => { this.loading = false })
		},
		formatTime(t) { return t ? t.replace('T', ' ').substring(0, 16) : '' },
		previewImg(urls, idx) { uni.previewImage({ urls, current: urls[idx] }) },
		doLike(item) {
			toggleCatchLike(item.catchId).then(r => {
				item.liked = !item.liked
				item.likeCount += item.liked ? 1 : -1
			}).catch(() => uni.showToast({ title: '请先登录', icon: 'none' }))
		},
		goPublish() { this.showPublish = true; this.pubForm = { fishSpecies:'', weightJin:'', fishingMethod:'', content:'' }; this.pubImages = []; this.pubUploaded = [] },
		chooseImg() {
			uni.chooseImage({ count: 3 - this.pubImages.length, success: res => {
				res.tempFilePaths.forEach(p => {
					this.pubImages.push(p)
					uploadFile(p).then(url => { this.pubUploaded.push(url) }).catch(() => uni.showToast({ title: '图片上传失败', icon: 'none' }))
				})
			}})
		},
		doPublish() {
			if (!this.pubForm.fishSpecies) { uni.showToast({ title: '请填写鱼种', icon: 'none' }); return }
			const data = { ...this.pubForm, images: this.pubUploaded.join(',') }
			if (data.weightJin) data.weightJin = parseFloat(data.weightJin)
			publishCatch(data).then(() => {
				uni.showToast({ title: '发布成功，等待审核' })
				this.showPublish = false
				this.loadData()
			}).catch(e => uni.showToast({ title: e.message || '发布失败', icon: 'none' }))
		},
		openComments(item) {
			this.currentCatchId = item.catchId
			this.replyTo = null
			this.commentText = ''
			this.showComments = true
			fetchCatchComments(item.catchId).then(rows => { this.comments = rows })
		},
		setReply(c) {
			this.replyTo = c
		},
		submitComment() {
			if (!this.commentText.trim()) return
			const data = {
				catchId: this.currentCatchId,
				content: this.commentText.trim(),
				replyToId: this.replyTo ? this.replyTo.commentId : null,
				replyToUser: this.replyTo ? this.replyTo.userId : null
			}
			addCatchComment(data).then(() => {
				this.commentText = ''
				this.replyTo = null
				fetchCatchComments(this.currentCatchId).then(rows => { this.comments = rows })
				const item = this.list.find(i => i.catchId === this.currentCatchId)
				if (item) item.commentCount = (item.commentCount || 0) + 1
			}).catch(e => uni.showToast({ title: e.message || '评论失败', icon: 'none' }))
		}
	}
}
</script>

<style scoped>
.catch-page { padding: 0 24rpx 40rpx; }
.page-head { display: flex; justify-content: space-between; align-items: center; padding: 30rpx 0 20rpx; }
.page-head-title { font-size: 36rpx; font-weight: bold; color: #1a2030; }
.publish-btn { background: #f5a623; color: #fff; padding: 12rpx 28rpx; border-radius: 30rpx; font-size: 26rpx; }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: #999; font-size: 28rpx; }
.catch-list { display: flex; flex-direction: column; gap: 20rpx; }
.catch-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05); }
.catch-user { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
.catch-avatar { width: 56rpx; height: 56rpx; border-radius: 50%; }
.catch-nick { font-size: 26rpx; font-weight: bold; flex: 1; }
.catch-time { font-size: 22rpx; color: #999; }
.catch-content { font-size: 28rpx; color: #333; margin-bottom: 12rpx; line-height: 1.5; }
.catch-tags { display: flex; gap: 12rpx; margin-bottom: 12rpx; flex-wrap: wrap; }
.catch-tag { background: #f5f5f5; padding: 6rpx 16rpx; border-radius: 6rpx; font-size: 24rpx; color: #666; }
.catch-imgs { display: flex; gap: 10rpx; margin-bottom: 12rpx; }
.catch-img { width: 200rpx; height: 200rpx; border-radius: 8rpx; }
.catch-footer { display: flex; justify-content: space-between; align-items: center; }
.catch-like { font-size: 26rpx; color: #999; }
.catch-like.liked { color: #e74c3c; }
.catch-featured { font-size: 22rpx; color: #f5a623; }
.publish-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 999; }
.publish-panel { background: #fff; width: 100%; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx; }
.publish-title { font-size: 32rpx; font-weight: bold; margin-bottom: 24rpx; }
.pub-input { border: 1rpx solid #eee; border-radius: 8rpx; padding: 16rpx; margin-bottom: 16rpx; font-size: 28rpx; }
.pub-textarea { border: 1rpx solid #eee; border-radius: 8rpx; padding: 16rpx; height: 120rpx; font-size: 28rpx; margin-bottom: 16rpx; width: 100%; }
.pub-img-row { display: flex; gap: 12rpx; margin-bottom: 24rpx; }
.pub-img { width: 140rpx; height: 140rpx; border-radius: 8rpx; }
.pub-img-add { width: 140rpx; height: 140rpx; border: 2rpx dashed #ccc; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; font-size: 48rpx; color: #ccc; }
.pub-submit { background: #f5a623; color: #fff; text-align: center; padding: 20rpx; border-radius: 12rpx; font-size: 30rpx; font-weight: bold; }
.catch-comment-btn { font-size: 26rpx; color: #999; margin-left: 24rpx; }
.comment-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 999; }
.comment-panel { background: #fff; width: 100%; border-radius: 24rpx 24rpx 0 0; padding: 30rpx; max-height: 70vh; display: flex; flex-direction: column; }
.comment-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.comment-scroll { flex: 1; max-height: 50vh; }
.comment-item { display: flex; gap: 12rpx; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.comment-avatar { width: 56rpx; height: 56rpx; border-radius: 50%; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-head { display: flex; gap: 8rpx; align-items: center; margin-bottom: 4rpx; }
.comment-nick { font-size: 24rpx; font-weight: bold; color: #333; }
.comment-reply { font-size: 22rpx; color: #999; }
.comment-text { font-size: 28rpx; color: #333; line-height: 1.5; }
.comment-actions { display: flex; gap: 20rpx; margin-top: 6rpx; }
.comment-time { font-size: 22rpx; color: #ccc; }
.comment-reply-btn { font-size: 22rpx; color: #3b82f6; }
.comment-empty { text-align: center; padding: 40rpx 0; color: #999; font-size: 26rpx; }
.comment-input-bar { display: flex; gap: 12rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; margin-top: 12rpx; }
.comment-input { flex: 1; background: #f5f5f5; border-radius: 30rpx; padding: 14rpx 24rpx; font-size: 28rpx; }
.comment-send { background: #3b82f6; color: #fff; padding: 14rpx 24rpx; border-radius: 30rpx; font-size: 26rpx; }
</style>
