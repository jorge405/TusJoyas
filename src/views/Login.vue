<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { icons } from '../components/icons'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const showPass = ref(false)
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 400)) // pequeña espera UX
  const res = auth.login(username.value, password.value)
  loading.value = false
  if (res.ok) router.push({ name: 'dashboard' })
  else error.value = res.error
}

function rellenarDemo() {
  username.value = 'admin'
  password.value = 'admin123'
}
</script>

<template>
  <div class="card p-6 sm:p-8 border-gold-700/20 shadow-2xl">
    <!-- Logo -->
    <div class="flex flex-col items-center mb-8">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-sky-500 flex items-center justify-center shadow-2xl shadow-gold-500/30 mb-4">
        <svg class="w-8 h-8 text-ink-950" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5L12 2z"/>
        </svg>
      </div>
      <h1 class="font-display text-3xl font-bold bg-gradient-to-r from-gold-200 via-gold-400 to-sky-400 bg-clip-text text-transparent">
        Aurum Joyas
      </h1>
      <p class="text-xs uppercase tracking-[0.25em] text-sky-400/80 mt-1">Sistema de gestión</p>
    </div>

    <h2 class="font-display text-2xl font-semibold text-gold-200 mb-1 text-center">Bienvenido</h2>
    <p class="text-sm text-ink-400 text-center mb-6">Inicia sesión para continuar</p>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- Usuario -->
      <div>
        <label class="label">Usuario</label>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icons.user"/>
          </svg>
          <input
            v-model="username"
            type="text"
            class="input pl-10"
            placeholder="admin"
            autocomplete="username"
            required
          />
        </div>
      </div>

      <!-- Contraseña -->
      <div>
        <label class="label">Contraseña</label>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icons.lock"/>
          </svg>
          <input
            v-model="password"
            :type="showPass ? 'text' : 'password'"
            class="input pl-10 pr-10"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            @click="showPass = !showPass"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-500 hover:text-gold-400 transition"
            tabindex="-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" :d="showPass ? icons.eyeOff : icons.eye"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Error -->
      <transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-1"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="error" class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ error }}
        </div>
      </transition>

      <!-- Botón -->
      <button type="submit" class="btn-primary w-full py-3" :disabled="loading">
        <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
        {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
      </button>
    </form>

    <!-- Demo -->
    <div class="mt-6 pt-6 border-t border-ink-800">
      <p class="text-xs text-ink-400 text-center mb-3">Credenciales de prueba</p>
      <button
        type="button"
        @click="rellenarDemo"
        class="w-full px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition text-xs font-medium"
      >
        Usar demo → admin / admin123
      </button>
      <span class="text-xs text-ink-400 text-center block mt-3">Desarrollado por DigitalDevTech Derechos Reservados</span>
    </div>
  </div>
</template>