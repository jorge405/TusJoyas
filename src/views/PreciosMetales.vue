<script setup>
import { ref, computed, watch } from 'vue'
import { usePreciosStore } from '../stores/precios'
import { useConfigStore } from '../stores/config'
import { icons } from '../components/icons'

const store = usePreciosStore()
const configStore = useConfigStore()

const editandoId = ref(null)
const valorTemp = ref('')
const mostrarHistorial = ref(false)
const metalHistorial = ref(null)

function fmtMoney(n, decimals = 2) {
  const num = Number(n) || 0
  if (num === 0) return '—'
  return `${configStore.simbolo} ${num.toLocaleString('es-BO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function fmtFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function abrirEdicion(m) {
  editandoId.value = m.id
  valorTemp.value = m.precio || ''
}

function guardarEdicion(m) {
  store.actualizarPrecio(m.id, valorTemp.value)
  editandoId.value = null
  valorTemp.value = ''
}

function cancelarEdicion() {
  editandoId.value = null
  valorTemp.value = ''
}

function abrirHistorial(m) {
  metalHistorial.value = m
  mostrarHistorial.value = true
}

function cerrarHistorial() {
  metalHistorial.value = null
  mostrarHistorial.value = false
}

function claseColor(color) {
  return {
    gold:   'from-gold-400/20 to-gold-600/5 border-gold-500/30',
    silver: 'from-slate-300/20 to-slate-500/5 border-slate-400/30',
    sky:    'from-sky-400/20 to-sky-600/5 border-sky-500/30',
    orange: 'from-orange-400/20 to-orange-600/5 border-orange-500/30',
  }[color] || 'from-gold-400/20 to-gold-600/5 border-gold-500/30'
}

function claseTexto(color) {
  return {
    gold:   'text-gold-300',
    silver: 'text-slate-200',
    sky:    'text-sky-300',
    orange: 'text-orange-300',
  }[color] || 'text-gold-300'
}

const preciosDisponibles = computed(() => {
  return store.metales.filter(m => m.precio > 0).length
})

watch(mostrarHistorial, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Mercado</p>
        <h2 class="section-title mt-1">Precios de Metales</h2>
        <p v-if="store.ultimaActualizacion" class="text-xs text-ink-400 mt-1">
          Última actualización: {{ fmtFechaHora(store.ultimaActualizacion) }}
        </p>
        <p v-else class="text-xs text-ink-500 mt-1">Sin actualizaciones registradas</p>
      </div>
      <button
        @click="store.resetear"
        class="btn-secondary text-sm"
        onclick="return confirm('¿Resetear todos los precios a 0?')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Resetear
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card-hover relative overflow-hidden">
        <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-gold-400/25"></div>
        <div class="relative">
          <p class="text-xs uppercase tracking-wider text-ink-400">Metales con precio</p>
          <p class="font-display text-3xl font-semibold text-gold-300 mt-1.5">
            {{ preciosDisponibles }}<span class="text-ink-500 text-xl">/{{ store.metales.length }}</span>
          </p>
        </div>
      </div>
      <div class="card-hover relative overflow-hidden">
        <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-sky-400/25"></div>
        <div class="relative">
          <p class="text-xs uppercase tracking-wider text-ink-400">Oro 18k (gramo)</p>
          <p class="font-display text-3xl font-semibold text-sky-300 mt-1.5">
            {{ fmtMoney(store.oro18?.precio || 0) }}
          </p>
        </div>
      </div>
      <div class="card-hover relative overflow-hidden">
        <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-emerald-400/25"></div>
        <div class="relative">
          <p class="text-xs uppercase tracking-wider text-ink-400">Cambios registrados</p>
          <p class="font-display text-3xl font-semibold text-emerald-300 mt-1.5">
            {{ store.historial.length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Grid de metales -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="m in store.metales"
        :key="m.id"
        :class="['card-hover relative overflow-hidden bg-gradient-to-br', claseColor(m.color)]"
      >
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="min-w-0">
            <h3 class="font-display text-lg font-semibold text-ink-50 truncate">{{ m.nombre }}</h3>
            <p class="text-[10px] uppercase tracking-wider text-ink-400">por gramo</p>
          </div>
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center bg-ink-950/60 border border-ink-800 shrink-0', claseTexto(m.color)]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5L12 2z"/>
            </svg>
          </div>
        </div>

        <!-- Precio actual -->
        <div class="mb-4">
          <p :class="['font-display text-3xl font-bold', claseTexto(m.color)]">
            {{ fmtMoney(m.precio) }}
          </p>
          <p v-if="m.fechaActualizacion" class="text-[10px] text-ink-500 mt-1">
            Actualizado: {{ fmtFechaHora(m.fechaActualizacion) }}
          </p>
          <p v-else class="text-[10px] text-ink-500 mt-1">Sin actualizar</p>
        </div>

        <!-- Edición inline -->
        <div v-if="editandoId === m.id" class="flex gap-2">
          <input
            v-model="valorTemp"
            type="number"
            step="0.01"
            class="input text-sm"
            placeholder="0.00"
            autofocus
            @keydown.enter="guardarEdicion(m)"
            @keydown.escape="cancelarEdicion"
          />
          <button
            @click="guardarEdicion(m)"
            class="btn-primary text-xs px-3"
            title="Guardar"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
          <button
            @click="cancelarEdicion"
            class="btn-secondary text-xs px-3"
            title="Cancelar"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div v-else class="flex gap-2">
          <button
            @click="abrirEdicion(m)"
            class="btn-secondary flex-1 text-xs"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Actualizar
          </button>
          <button
            @click="abrirHistorial(m)"
            class="btn-secondary text-xs px-3"
            :disabled="store.historialDe(m.id).length === 0"
            :title="store.historialDe(m.id).length === 0 ? 'Sin historial' : 'Ver historial'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Nota informativa -->
    <div class="card border-sky-700/30 relative overflow-hidden">
      <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-sky-500/10"></div>
      <div class="relative flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-sky-200 mb-1">Sobre los precios de metales</h3>
          <p class="text-sm text-ink-300 leading-relaxed">
            Registra el precio por gramo de cada metal para calcular el valor real de tus joyas.
            Los precios se guardan en tu dispositivo y se pueden actualizar cuando cambien en el mercado.
            Cada cambio queda registrado en el historial.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal Historial -->
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mostrarHistorial && metalHistorial"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="cerrarHistorial"
      >
        <div class="bg-ink-900 border border-ink-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-ink-800 flex items-center justify-between shrink-0">
            <div>
              <p class="eyebrow">Historial</p>
              <h3 class="font-display text-lg font-semibold text-gold-200">
                {{ metalHistorial.nombre }}
              </h3>
            </div>
            <button @click="cerrarHistorial" class="p-2 rounded-lg text-ink-400 hover:text-red-400 hover:bg-red-500/10 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Lista -->
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <div
              v-for="(h, i) in store.historialDe(metalHistorial.id)"
              :key="i"
              class="p-3 rounded-xl bg-ink-800/60 border border-ink-700 flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="text-[10px] uppercase tracking-wider text-ink-500">
                  {{ fmtFechaHora(h.fecha) }}
                </p>
                <p class="text-sm text-ink-300 mt-0.5">
                  <span class="text-ink-500">{{ fmtMoney(h.precioAnterior) }}</span>
                  <span class="text-ink-600 mx-1.5">→</span>
                  <span class="font-bold text-gold-300">{{ fmtMoney(h.precioNuevo) }}</span>
                </p>
              </div>
              <div
                v-if="h.precioAnterior > 0"
                :class="[
                  'text-xs font-semibold shrink-0',
                  h.precioNuevo >= h.precioAnterior ? 'text-emerald-400' : 'text-red-400'
                ]"
              >
                {{ h.precioNuevo >= h.precioAnterior ? '▲' : '▼' }}
                {{ Math.abs(((h.precioNuevo - h.precioAnterior) / h.precioAnterior) * 100).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>