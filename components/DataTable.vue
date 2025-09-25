<script setup lang="ts">
defineProps<{ columns: string[] }>()
</script>

<template>
  <div class="overflow-hidden rounded border bg-white">
    <table class="w-full text-sm">
      <thead class="bg-slate-900/90 text-white">
        <tr>
          <th v-for="h in columns" :key="h" class="px-3 py-2 text-left font-semibold">
            {{ h }}
          </th>
        </tr>
      </thead>

      <!-- สำคัญ: slot ต้องอยู่ใน tbody -->
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>
