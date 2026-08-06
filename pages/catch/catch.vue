<template>
	<view class="app catch-page has-brand-header">
		<brand-header title="钓获社区" theme="light" layout="compact" :back="true" />
		<view class="page-head catch-tabs">
			<text class="catch-tab active">推荐</text>
			<text class="catch-tab">最新</text>
			<view class="publish-btn" @click="goPublish">晒一单</view>
		</view>

		<view v-if="list.length === 0 && !loading" class="empty">
			<view class="empty-mark catch-empty-mark"><view class="empty-fish"></view></view>
			<text class="empty-title">还没有钓友晒单</text>
			<text class="empty-desc">记录鱼种、重量和钓位，分享今天的第一份渔获</text>
			<view class="empty-btn" @click="goPublish">晒出第一单</view>
		</view>

		<view class="catch-list">
			<view class="catch-card" v-for="(item, itemIndex) in list" :key="item.catchId">
				<view class="catch-user">
					<image class="catch-avatar" :src="item.avatar || '/static/logo-mark.svg'" />
					<view class="catch-user-copy"><view class="catch-name-row"><text class="catch-nick">{{ item.nickname }}</text><text v-if="item.isFeatured" class="catch-featured">精选</text></view><text class="catch-venue">共享钓场 · A区</text></view>
					<text class="catch-time">{{ formatTime(item.createTime) }}</text>
				</view>
				<view class="catch-cover" @click="previewImg([primaryImage(item, itemIndex)], 0)">
					<image :src="primaryImage(item, itemIndex)" class="catch-img" mode="aspectFill" />
					<text v-if="item.fishSpecies || item.weightJin" class="catch-weight">{{ item.fishSpecies || '渔获' }} {{ item.weightJin ? item.weightJin + 'kg' : '' }}</text>
				</view>
				<text v-if="item.content" class="catch-content">{{ item.content }}</text>
				<view class="catch-tags">
					<text class="catch-tag">#共享钓场</text>
					<text v-if="item.fishingMethod" class="catch-tag">#{{ item.fishingMethod }}</text>
				</view>
				<view class="catch-footer">
					<view class="catch-like" :class="{liked: item.liked}" @click="doLike(item)">
						<text class="like-icon"></text><text>{{ item.likeCount || 0 }}</text>
					</view>
					<view class="catch-comment-btn" @click="openComments(item)">
						<text class="comment-icon"></text><text>{{ item.commentCount || 0 }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 评论弹窗 -->
		<view v-if="showComments" class="comment-mask" @click.self="showComments=false">
			<view class="comment-panel">
				<text class="comment-title">评论 ({{ comments.length }})</text>
				<scroll-view scroll-y class="comment-scroll">
					<view class="comment-item" v-for="c in comments" :key="c.commentId">
						<image :src="c.avatar || '/static/logo-mark.svg'" class="comment-avatar" />
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
		<community-tabbar active="catch" />
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
		primaryImage(item, index) {
			if (item && item.images) return item.images.split(',')[0]
			return index % 2 ? '/static/hero-pond.jpg' : '/static/hero-fishing-v2.jpg'
		},
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
.page-head-title { font-size: 38rpx; font-weight: 600; color: var(--text-main); letter-spacing: 0.5rpx; }
.publish-btn { background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; padding: 12rpx 28rpx; border-radius: 99rpx; font-size: 26rpx; font-weight: 600; }
.publish-btn:active { transform: scale(0.97); }
.empty { text-align: center; padding: 120rpx 0; }
.empty-text { color: var(--text-light); font-size: 28rpx; }
.catch-list { display: flex; flex-direction: column; gap: 20rpx; }
.catch-card { background: var(--surface); border: 1rpx solid var(--border-color); border-radius: var(--r); padding: 24rpx; }
.catch-user { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
.catch-avatar { width: 56rpx; height: 56rpx; border-radius: 50%; }
.catch-nick { font-size: 26rpx; font-weight: 600; color: var(--text-main); flex: 1; }
.catch-time { font-size: 22rpx; color: var(--text-light); }
.catch-content { font-size: 28rpx; color: var(--text-main); margin-bottom: 12rpx; line-height: 1.5; }
.catch-tags { display: flex; gap: 12rpx; margin-bottom: 12rpx; flex-wrap: wrap; }
.catch-tag { background: var(--surface-soft); padding: 4rpx 14rpx; border-radius: 99rpx; font-size: 22rpx; color: var(--text-muted); }
.catch-imgs { display: flex; gap: 10rpx; margin-bottom: 12rpx; }
.catch-img { width: 200rpx; height: 200rpx; border-radius: var(--r-xs); }
.catch-footer { display: flex; justify-content: space-between; align-items: center; }
.catch-like { font-size: 26rpx; color: var(--text-light); }
.catch-like.liked { color: var(--danger); }
.catch-featured { font-size: 22rpx; color: var(--gold); font-weight: 500; }
.publish-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(11, 31, 25, 0.5); display: flex; align-items: flex-end; z-index: 999; }
.publish-panel { background: var(--surface); width: 100%; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx; }
.publish-title { font-size: 32rpx; font-weight: 600; color: var(--text-main); margin-bottom: 24rpx; }
.pub-input { border: 1rpx solid var(--border-color); border-radius: var(--r-xs); padding: 16rpx; margin-bottom: 16rpx; font-size: 28rpx; color: var(--text-main); }
.pub-textarea { border: 1rpx solid var(--border-color); border-radius: var(--r-xs); padding: 16rpx; height: 120rpx; font-size: 28rpx; color: var(--text-main); margin-bottom: 16rpx; width: 100%; }
.pub-img-row { display: flex; gap: 12rpx; margin-bottom: 24rpx; }
.pub-img { width: 140rpx; height: 140rpx; border-radius: var(--r-xs); }
.pub-img-add { width: 140rpx; height: 140rpx; border: 2rpx dashed var(--border-color); border-radius: var(--r-xs); display: flex; align-items: center; justify-content: center; font-size: 48rpx; color: var(--text-light); }
.pub-submit { background: linear-gradient(135deg,var(--g-700),var(--g-800)); color: #fff; text-align: center; padding: 20rpx; border-radius: 99rpx; font-size: 30rpx; font-weight: 600; }
.pub-submit:active { transform: scale(0.97); }
.catch-comment-btn { font-size: 26rpx; color: var(--text-light); margin-left: 24rpx; }
.comment-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(11, 31, 25, 0.5); display: flex; align-items: flex-end; z-index: 999; }
.comment-panel { background: var(--surface); width: 100%; border-radius: 24rpx 24rpx 0 0; padding: 30rpx; max-height: 70vh; display: flex; flex-direction: column; }
.comment-title { font-size: 30rpx; font-weight: 600; color: var(--text-main); margin-bottom: 16rpx; }
.comment-scroll { flex: 1; max-height: 50vh; }
.comment-item { display: flex; gap: 12rpx; padding: 16rpx 0; border-bottom: 1rpx solid var(--border-color); }
.comment-avatar { width: 56rpx; height: 56rpx; border-radius: 50%; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-head { display: flex; gap: 8rpx; align-items: center; margin-bottom: 4rpx; }
.comment-nick { font-size: 24rpx; font-weight: 600; color: var(--text-main); }
.comment-reply { font-size: 22rpx; color: var(--text-light); }
.comment-text { font-size: 28rpx; color: var(--text-main); line-height: 1.5; }
.comment-actions { display: flex; gap: 20rpx; margin-top: 6rpx; }
.comment-time { font-size: 22rpx; color: var(--text-light); }
.comment-reply-btn { font-size: 22rpx; color: var(--jade); }
.comment-empty { text-align: center; padding: 40rpx 0; color: var(--text-light); font-size: 26rpx; }
.comment-input-bar { display: flex; gap: 12rpx; padding-top: 16rpx; border-top: 1rpx solid var(--border-color); margin-top: 12rpx; }
.comment-input { flex: 1; background: var(--surface-soft); border-radius: 99rpx; padding: 14rpx 24rpx; font-size: 28rpx; color: var(--text-main); }
.comment-send { background: var(--g-700); color: #fff; padding: 14rpx 24rpx; border-radius: 99rpx; font-size: 26rpx; font-weight: 600; }
</style>

<style>
.catch-page .empty{margin:24rpx 0;padding:72rpx 36rpx 82rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid #dce9e8;border-radius:18rpx;background:#fff}.catch-page .empty-desc{max-width:480rpx}.catch-page .empty-btn{margin-top:26rpx}
</style>

<style scoped>
.catch-page{min-height:100vh;padding:0 24rpx calc(126rpx + env(safe-area-inset-bottom));background:#f7fbfb}.catch-tabs{position:relative;padding:0 0;border-bottom:1rpx solid #dce8e7;height:82rpx;justify-content:flex-start;gap:150rpx}.catch-tab{height:82rpx;min-width:80rpx;display:flex;align-items:center;justify-content:center;font-size:29rpx;color:#586e70;position:relative}.catch-tab.active{color:#08a9a5;font-weight:800}.catch-tab.active::after{content:'';position:absolute;left:8rpx;right:8rpx;bottom:0;height:6rpx;border-radius:99rpx;background:#08a9a5}.publish-btn{position:fixed;z-index:80;right:26rpx;bottom:calc(126rpx + env(safe-area-inset-bottom));width:104rpx;height:104rpx;padding:0;border-radius:50%;display:flex;align-items:flex-end;justify-content:center;padding-bottom:15rpx;box-sizing:border-box;background:#08aaa6;font-size:21rpx;box-shadow:0 10rpx 28rpx rgba(4,114,112,.22)}.publish-btn::before{content:'';position:absolute;top:23rpx;width:34rpx;height:26rpx;border:5rpx solid #fff;border-radius:7rpx}.publish-btn::after{content:'';position:absolute;top:29rpx;width:11rpx;height:11rpx;border:4rpx solid #fff;border-radius:50%}.catch-list{gap:16rpx;padding-top:16rpx}.catch-card{padding:0;overflow:hidden;border-radius:18rpx;border:1rpx solid #dce8e7;background:#fff}.catch-user{padding:18rpx 20rpx 14rpx;margin:0}.catch-avatar{width:54rpx;height:54rpx}.catch-user-copy{flex:1;min-width:0}.catch-name-row{display:flex;align-items:center;gap:9rpx}.catch-nick{flex:0;font-size:25rpx}.catch-venue{display:block;margin-top:3rpx;font-size:20rpx;color:#768d8f}.catch-featured{padding:4rpx 9rpx;border:1rpx solid #eca820;border-radius:6rpx;color:#d88d00;font-size:18rpx}.catch-time{font-size:20rpx}.catch-cover{position:relative;width:100%;height:340rpx}.catch-img{width:100%;height:100%;display:block;border-radius:0}.catch-weight{position:absolute;right:16rpx;bottom:14rpx;padding:8rpx 12rpx;border-radius:7rpx;background:rgba(5,35,35,.62);color:#fff;font-size:25rpx;font-weight:800}.catch-content{display:block;margin:16rpx 20rpx 0;font-size:25rpx;line-height:1.5}.catch-tags{margin:8rpx 20rpx 0;gap:10rpx}.catch-tag{background:transparent;padding:0;color:#08a09c;font-size:21rpx}.catch-footer{justify-content:flex-end;gap:36rpx;padding:10rpx 20rpx 18rpx}.catch-like,.catch-comment-btn{display:flex;align-items:center;gap:8rpx;margin:0;color:#5f7577;font-size:22rpx}.like-icon{width:19rpx;height:25rpx;border:3rpx solid currentColor;border-radius:5rpx;transform:rotate(-9deg)}.comment-icon{width:27rpx;height:22rpx;border:3rpx solid currentColor;border-radius:6rpx;position:relative}.comment-icon::after{content:'';position:absolute;left:3rpx;bottom:-7rpx;width:8rpx;height:8rpx;border-left:3rpx solid currentColor;transform:skew(-25deg)}
</style>
