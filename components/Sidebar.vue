<script setup lang="ts">
import { Icon } from '@iconify/vue'           // ← ใช้ Iconify โดยตรง
const props = defineProps<{ open?: boolean; onClose?: () => void }>()
const route = useRoute()
const router = useRouter()

type MenuItem = { to: string; label: string; icon: string }

const menu: MenuItem[] = [
  { to: '/products',   label: 'Products',   icon: 'lucide:package' },
  { to: '/categories', label: 'Categories', icon: 'lucide:tags' },
]

const isActive = (p: string) => route.path.startsWith(p)
const go = (to: string) => { router.push(to); props.onClose?.() }
</script>

<template>
  <!-- overlay เฉพาะ mobile -->
  <div
    v-show="open"
    class="fixed inset-0 z-40 bg-black/40 md:hidden"
    @click="onClose?.()"
  />

  <!-- Sidebar -->
  <aside
    class="fixed z-50 md:static md:z-auto w-64 h-full bg-slate-900 text-slate-100
           transition-transform md:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <div class="flex h-full flex-col p-4">
      <div class="text-xl font-semibold mb-6">Admin</div>

      <!-- ใช้แท็กปกติ -->
      <nav class="space-y-1" role="navigation" aria-label="Sidebar">
        <div
          v-for="m in menu" :key="m.to"
          class="px-3 py-2 rounded flex items-center gap-3 cursor-pointer
                 text-slate-300 hover:text-white hover:bg-slate-800"
          :class="isActive(m.to) ? 'bg-slate-800 text-white' : ''"
          @click="go(m.to)"
        >
          <Icon :icon="m.icon" class="w-4 h-4 shrink-0" />
          <div class="truncate">{{ m.label }}</div>
        </div>
      </nav>

      <div class="mt-auto pt-4">
        <button
          type="button"
          class="w-full inline-flex items-center justify-center gap-2 rounded
                 bg-indigo-600 hover:bg-indigo-500 py-2"
        >
          <Icon icon="lucide:log-out" class="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>
