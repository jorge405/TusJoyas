<script setup>
import { ref } from 'vue'
import { useConfigStore } from '../stores/config'
import { useAuthStore } from '../stores/auth'

const config = useConfigStore()
const auth = useAuthStore()

const guardado = ref(false)

const locales = {
  BOB: { simbolo: 'Bs', nombre: 'Boliviano', pais: 'Bolivia' },
  USD: { simbolo: '$', nombre: 'Dólar', pais: 'Estados Unidos' },
}

const form = ref({
  nombreNegocio: config.config.nombreNegocio,
  moneda: config.config.moneda,
  tasaInteresDefault: config.config.tasaInteresDefault,
  plazoDiasDefault: config.config.plazoDiasDefault,
})

function guardar() {
  config.config.nombreNegocio = form.value.nombreNegocio
  config.setMoneda(form.value.moneda)
  config.config.tasaInteresDefault = Number(form.value.tasaInteresDefault) || 10
  config.config.plazoDiasDefault = Number(form.value.plazoDiasDefault) || 30

  guardado.value = true
  setTimeout(() => (guardado.value = false), 2000)
}

function resetear() {
  if (!confirm('¿Restaurar valores por defecto?')) return
  config.reset()
  form.value = {
    nombreNegocio: config.config.nombreNegocio,
    moneda: config.config.moneda,
    tasaInteresDefault: config.config.tasaInteresDefault,
    plazoDiasDefault: config.config.plazoDiasDefault,
  }
}

const ejemplo = 12500
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Sistema</p>
        <h2 class="section-title mt-1">Configuración</h2>
      </div>
      <div class="flex gap-2">
        <button @click="resetear" class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Restaurar
        </button>
        <button @click="guardar" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Guardar cambios
        </button>
      </div>
    </div>

    <transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="guardado" class="card border-emerald-500/40 bg-emerald-500/5 flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="text-sm text-emerald-300">Configuración guardada correctamente</p>
      </div>
    </transition>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Moneda -->
      <div class="card border-l-2 border-gold-500">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-gold-300" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-display text-lg font-semibold text-gold-200">Tipo de moneda</h3>
            <p class="text-xs text-ink-400">Afecta a todo el sistema</p>
          </div>
        </div>

        <label class="label">Moneda del sistema</label>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <button
            v-for="(info, code) in locales"
            :key="code"
            type="button"
            @click="form.moneda = code"
            :class="[
              'p-4 rounded-xl border-2 text-left transition-all',
              form.moneda === code
                ? 'border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/10'
                : 'border-ink-700 bg-ink-900/60 hover:border-sky-500/50'
            ]"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-display text-2xl font-bold" :class="form.moneda === code ? 'text-gold-300' : 'text-ink-300'">
                {{ info.simbolo }}
              </span>
              <span
                v-if="form.moneda === code"
                class="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center"
              >
                <svg class="w-3 h-3 text-ink-950" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </span>
            </div>
            <p class="text-sm font-semibold" :class="form.moneda === code ? 'text-gold-200' : 'text-ink-200'">
              {{ info.nombre }}
            </p>
            <p class="text-[10px] uppercase tracking-wider text-ink-500 mt-0.5">{{ info.pais }}</p>
          </button>
        </div>

        <div class="rounded-xl p-3 bg-ink-800/60 border border-ink-700">
          <p class="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Vista previa</p>
          <p class="font-display text-xl font-semibold text-gold-300">
            {{ form.moneda === 'BOB' ? 'Bs' : '$' }} {{ ejemplo.toLocaleString('es-BO') }}
          </p>
        </div>
      </div>

      <!-- Negocio -->
      <div class="card border-l-2 border-sky-500">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div>
            <h3 class="font-display text-lg font-semibold text-sky-200">Datos del negocio</h3>
            <p class="text-xs text-ink-400">Información general</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="label">Nombre del negocio</label>
            <input v-model="form.nombreNegocio" class="input" placeholder="Mi Joyería" />
          </div>

          <div>
            <label class="label">Usuario activo</label>
            <div class="input bg-ink-800/60 cursor-not-allowed flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 text-ink-950 flex items-center justify-center font-bold text-xs">
                {{ auth.user?.nombre?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <span class="text-ink-200">{{ auth.user?.nombre }}</span>
              <span class="text-[10px] uppercase tracking-wider text-ink-500 ml-auto">{{ auth.user?.rol }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Préstamos defaults -->
      <div class="card border-l-2 border-emerald-500 lg:col-span-2">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-display text-lg font-semibold text-emerald-200">Valores por defecto — Préstamos</h3>
            <p class="text-xs text-ink-400">Se usarán al crear nuevos préstamos</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Tasa de interés (%)</label>
            <input v-model="form.tasaInteresDefault" type="number" step="0.5" class="input" />
          </div>
          <div>
            <label class="label">Plazo por defecto (días)</label>
            <input v-model="form.plazoDiasDefault" type="number" class="input" />
          </div>
        </div>
      </div>
    </div>

    <div class="card border-sky-700/30">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm text-ink-200 font-medium mb-1">Sobre el cambio de moneda</p>
          <p class="text-xs text-ink-400 leading-relaxed">
            Al cambiar la moneda, todos los valores en inventario, préstamos, fabricación y dashboard
            se mostrarán con el nuevo símbolo. Los montos guardados no se convierten automáticamente.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>