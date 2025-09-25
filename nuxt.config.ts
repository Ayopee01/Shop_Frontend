// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // เปิดใช้ nuxt-icon เพื่อเรียก <Icon name="lucide:home" /> เป็นต้น
  modules: ['nuxt-icon'],

  // ใช้ global CSS จาก assets (Tailwind v4 ใช้ไฟล์เดียวพอ)
  css: ['~/pages/main.css'],

  app: {
    baseURL: '/', // กันปัญหา /undefined/* ขณะ navigate
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080/api',
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})

