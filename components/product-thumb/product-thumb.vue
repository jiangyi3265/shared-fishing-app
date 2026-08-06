<template><view class="product-thumb" :style="thumbStyle"></view></template>
<script>
export default {
	props: { name: { type: String, default: '' }, goodsId: { type: [String, Number], default: 0 } },
	computed: {
		positionIndex() {
			const text = String(this.name || '')
			if (/水|饮|可乐|矿泉/.test(text)) return 1
			if (/线|主线/.test(text)) return 2
			if (/漂|浮/.test(text)) return 3
			return 0
		},
		thumbStyle() {
			const positions = ['0% 0%', '100% 0%', '0% 100%', '100% 100%']
			return { backgroundPosition: positions[this.positionIndex] }
		}
	}
}
</script>
<style scoped>
.product-thumb{width:100%;height:100%;background-image:url('/static/mall-products-v1.jpg');background-size:200% 200%;background-repeat:no-repeat;background-color:#f3f4f3}
</style>
