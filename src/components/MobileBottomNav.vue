<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { icons } from './icons'

defineProps({ menu: { type: Array, required: true } })
const route = useRoute()
</script>

<template>
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-950/90 backdrop-blur-xl border-t border-ink-800/60 safe-bottom">
    <div class="flex items-stretch justify-around px-1 py-1.5">
      <RouterLink
        v-for="m in menu"
        :key="m.to"
        :to="m.to"
        class="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-colors"
        :class="route.path === m.to ? 'text-gold-300' : 'text-ink-400'"
      >
        <div class="relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icons[m.icon]"/>
          </svg>
          <span
            v-if="route.path === m.to"
            class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gold-400"
          ></span>
        </div>
        <span class="text-[10px] font-medium truncate max-w-full">{{ m.short }}</span>
      </RouterLink>
    </div>
  </nav>
</template>