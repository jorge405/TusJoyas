<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { icons } from './icons'

defineProps({ title: { type: String, default: '' } })
defineEmits(['toggle-menu'])

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-ink-950/85 backdrop-blur-xl border-b border-ink-800/60 shrink-0">
    <div class="flex items-center justify-between gap-3 px-4 lg:px-8 h-16">
      <!-- Botón menú móvil -->
      <button
        @click="$emit('toggle-menu')"
        class="lg:hidden p-2 -ml-2 rounded-lg text-gold-400 hover:bg-ink-800/60 transition"
        aria-label="Abrir menú"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" :d="icons.menu"/>
        </svg>
      </button>

      <h1 class="font-display text-lg lg:text-xl font-semibold text-gold-300 truncate flex-1">
        {{ title }}
      </h1>

      <!-- User info -->
      <div class="flex items-center gap-2">
        <div class="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-ink-900/70 border border-ink-800">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 text-ink-950 flex items-center justify-center font-bold text-xs">
            {{ auth.user?.nombre?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div class="leading-tight">
            <p class="text-xs font-semibold text-ink-100">{{ auth.user?.nombre }}</p>
            <p class="text-[10px] text-ink-400 capitalize">{{ auth.user?.rol }}</p>
          </div>
        </div>
        <button
          @click="logout"
          class="p-2.5 rounded-xl text-ink-300 hover:text-red-400 hover:bg-red-500/10 transition"
          title="Cerrar sesión"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icons.logout"/>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>