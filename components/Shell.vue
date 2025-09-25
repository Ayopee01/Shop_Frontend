<!-- components/Shell.vue -->
<script setup lang="ts">
import Sidebar from '~/components/Sidebar.vue'
import Topbar from '~/components/Topbar.vue'
const open = ref(false)
</script>

<template>
  <div class="fixed inset-0 bg-gray-50 text-slate-900">
    <div class="flex h-full">
      <!-- overlay (mobile) -->
      <div
        v-show="open"
        class="fixed inset-0 z-40 bg-black/40 md:hidden"
        @click="open = false"
      ></div>

      <!-- sidebar -->
      <Sidebar :open="open" :onClose="() => (open = false)" />

      <!-- main area -->
      <div class="flex-1 flex flex-col relative z-0">
        <Topbar @toggle-sidebar="open = !open">
          <template #title>
            <slot name="title">Albaly Insights</slot>
          </template>
          <template #right>
            <slot name="right"></slot>
          </template>
        </Topbar>

        <main
          class="flex-1 overflow-auto p-4 md:p-6"
          style="padding-bottom:max(env(safe-area-inset-bottom),1rem);"
        >
          <slot></slot>
        </main>
      </div>
    </div>
  </div>
</template>
