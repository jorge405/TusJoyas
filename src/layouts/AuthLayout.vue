<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-ink-950 relative overflow-hidden">
    <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl bg-gold-500/15 pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl bg-sky-500/15 pointer-events-none"></div>
    <div class="w-full max-w-md relative z-10">
      <RouterView />
    </div>
  </div>
</template>