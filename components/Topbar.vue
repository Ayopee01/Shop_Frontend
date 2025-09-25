<script setup lang="ts">

const emit = defineEmits<{ (e: 'toggle-sidebar'): void }>()
</script>

<template>
  <header class="h-18 bg-white border-b flex items-center justify-between px-4">
    <div class="flex items-center gap-2">
      <!-- ปุ่มเฉพาะ mobile -->
      <button
        class="md:hidden px-3 py-1 border rounded"
        @click="emit('toggle-sidebar')"
        aria-label="Toggle sidebar"
        type="button"
      >
        Menu
      </button>

      <div class="font-medium">
        <slot name="title">Admin</slot>
      </div>
    </div>
  </header>
</template>
