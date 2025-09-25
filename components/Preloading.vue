<!-- components/Preloading.vue -->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** 'bars' | 'skeleton' */
  type?: 'bars' | 'skeleton'
  /** จำนวนแท่งแบบ bars */
  barCount?: number
  /** ความสูงของกล่อง bars เช่น 'h-40' */
  barsHeightClass?: string
  /** เวลาขยับแต่ละแท่ง (ms) */
  delayStepMs?: number
  /** จำนวนแถวของ skeleton */
  rows?: number
  /** ความกว้าง max ของ skeleton */
  maxWidthClass?: string
  /** คลาสเพิ่มเติม */
  className?: string
}>(), {
  type: 'bars',
  barCount: 5,
  barsHeightClass: 'h-40',
  delayStepMs: 120,
  rows: 4,
  maxWidthClass: 'max-w-xl',
  className: '',
})
</script>

<template>
  <div
    class="w-full"
    role="status"
    aria-label="Loading"
    :class="className"
  >
    <!-- ===== Variant: Bars (แท่งเด้งไล่เฉดสี) ===== -->
    <div
      v-if="type === 'bars'"
      class="flex items-end justify-center gap-1"
      :class="barsHeightClass"
    >
      <div
        v-for="i in barCount"
        :key="i"
        class="bar w-2 rounded shimmer"
        :style="{
          // หน่วงเวลาขึ้นลงของแต่ละแท่ง
          animationDelay: `${(i-1) * delayStepMs}ms`,
        }"
      />
    </div>

    <!-- ===== Variant: Skeleton (ชิมเมอร์ไล่เฉดสี) ===== -->
    <div v-else class="space-y-3" :class="maxWidthClass">
      <!-- หัวกล่อง -->
      <div class="h-6 rounded shimmer" />
      <!-- แถวข้อความ -->
      <div
        v-for="i in rows"
        :key="i"
        class="h-4 rounded shimmer"
        :style="{
          width: i === rows ? '70%' : '100%' // แถวสุดท้ายสั้นลง
        }"
      />
      <!-- การ์ดสามช่อง -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div class="h-24 rounded shimmer" />
        <div class="h-24 rounded shimmer" />
        <div class="h-24 rounded shimmer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------- Shimmer ไล่เฉดสี ---------- */
/* ใช้ CSS variables เพื่อเปลี่ยนโทนสีง่ายๆ จากภายนอก */
:root,
:host {
  --shimmer-from: #1f2937;  /* slate-800 */
  --shimmer-mid:  #334155;  /* slate-700 */
  --shimmer-to:   #1f2937;  /* slate-800 */
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--shimmer-from) 0%,
    var(--shimmer-mid) 50%,
    var(--shimmer-to) 100%
  );
  background-size: 200% 100%;
  animation: shimmer-slide 1.3s linear infinite;
  opacity: 0.9;
}

/* ---------- Bars เด้งขึ้นลง ---------- */
.bar {
  /* ให้สูงเริ่มต้น */
  height: 20%;
  /* ไล่เฉดแบบเดียวกับ shimmer */
  background: linear-gradient(
    180deg,
    #6366f1 0%,   /* indigo-500 */
    #8b5cf6 50%,  /* violet-500 */
    #6366f1 100%
  );
  background-size: 100% 200%;
  animation:
    bar-bounce 0.9s ease-in-out infinite,
    bar-gradient 1.2s linear infinite;
}

/* เด้งขึ้น-ลง */
@keyframes bar-bounce {
  0%, 100% { height: 20%; transform: translateY(0); }
  50%      { height: 90%; transform: translateY(-4%); }
}

/* ไล่เฉดสีขึ้น-ลง */
@keyframes bar-gradient {
  0%   { background-position: 0% 0%; }
  50%  { background-position: 0% 100%; }
  100% { background-position: 0% 0%; }
}

/* ไถลชิมเมอร์ซ้าย -> ขวา */
@keyframes shimmer-slide {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
