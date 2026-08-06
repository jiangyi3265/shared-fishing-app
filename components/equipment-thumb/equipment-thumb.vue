<template><view class="equipment-thumb" :style="thumbStyle"></view></template>
<script>
export default{props:{name:{type:String,default:''}},computed:{positionIndex(){const t=String(this.name||'');if(/网|抄/.test(t))return 1;if(/箱|钓椅|椅/.test(t))return 2;if(/伞/.test(t))return 3;return 0},thumbStyle(){return{backgroundPosition:['0% 0%','100% 0%','0% 100%','100% 100%'][this.positionIndex]}}}}
</script>
<style scoped>.equipment-thumb{width:100%;height:100%;background-image:url('/static/rental-equipment-v1.jpg');background-size:200% 200%;background-repeat:no-repeat;background-color:#f3f4f3}</style>
