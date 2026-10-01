<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { icons } from './icons'

defineProps({
  menu: { type: Array, required: true },
  collapsed: { type: Boolean, default: false }
})

const route = useRoute()
</script>

<template>
  <nav class="flex-1 p-3 space-y-1.5 overflow-y-auto">
    <RouterLink
      v-for="m in menu"
      :key="m.to"
      :to="m.to"
      :title="collapsed ? m.label : ''"
      :class="[
        'group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
        route.path === m.to
          ? 'bg-gradient-to-r from-gold-500/20 via-sky-500/5 to-transparent text-gold-300 border border-gold-500/30'
          : 'text-ink-300 hover:text-gold-300 hover:bg-ink-800/60 border border-transparent',
        collapsed ? 'justify-center' : ''
      ]"
    >
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" :d="icons[m.icon]"/>
      </svg>
      <span v-if="!collapsed" class="whitespace-nowrap">{{ m.label }}</span>
      <span
        v-if="route.path === m.to && !collapsed"
        class="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400"
        style="box-shadow: 0 0 8px #d4a017;"
      ></span>
    </RouterLink>
  </nav>
</template>