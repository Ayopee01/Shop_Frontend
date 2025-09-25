<!-- components/Modal.vue -->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** ควบคุมการเปิด/ปิดผ่าน v-model */
  modelValue: boolean
  /** ปิดได้ด้วยการคลิกฉากหลัง (overlay) */
  closeOnBackdrop?: boolean
  /** ปิดได้ด้วยปุ่ม Esc */
  closeOnEsc?: boolean
  /** กว้างของกล่อง modal (tailwind class) */
  widthClass?: string
}>(), {
  closeOnBackdrop: true,
  closeOnEsc: true,
  widthClass: 'max-w-lg',  // ปรับได้ตามต้องการ เช่น max-w-2xl
})

const emit = defineEmits<{ (e:'update:modelValue', v:boolean):void }>()

function close() {
  emit('update:modelValue', false)
}

function onBackdrop() {
  if (props.closeOnBackdrop) close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closeOnEsc) close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <transition name="fade" appear>
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[1000] flex items-center justify-center"
        aria-modal="true"
        role="dialog"
      >
        <!-- overlay -->
        <div class="absolute inset-0 bg-black/40" @click="onBackdrop" />

        <!-- modal panel -->
        <div
          class="relative w-[92vw] md:w-auto bg-white text-slate-900 rounded-lg shadow-xl mx-4"
          :class="widthClass"
        >
          <!-- header -->
          <div class="px-4 py-3 border-b font-medium">
            <slot name="title">Modal</slot>
          </div>

          <!-- body: *** สำคัญ ต้องมี default slot ตรงนี้ *** -->
          <div class="px-4 py-4">
            <slot />
          </div>

          <!-- footer -->
          <div class="px-4 py-3 border-t flex items-center justify-end gap-2">
            <slot name="actions">
              <button class="px-3 py-2 border rounded" @click="close">Close</button>
            </slot>
          </div>

          <!-- ปุ่ม X (ถ้าต้องการ) -->
          <button
            class="absolute right-2 top-2 p-1 rounded hover:bg-slate-100"
            aria-label="Close"
            @click="close"
          >
            ✕
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-from, .fade-leave-to { opacity: 0 }
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
</style>
