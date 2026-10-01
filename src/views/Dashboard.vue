<script setup>
import { computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'
import { usePrestamosStore } from '../stores/prestamos'
import { useFabricacionStore } from '../stores/fabricacion'
import { useClientesStore } from '../stores/clientes'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { icons } from '../components/icons'

const inventario = useInventarioStore()
const prestamos = usePrestamosStore()
const fabricacion = useFabricacionStore()
const clientes = useClientesStore()
const auth = useAuthStore()
const configStore = useConfigStore()

const stats = computed(() => {
  const items = inventario.items
  const disp = items.filter(i => i.estado === 'disponible')
  return {
    totalItems: items.length,
    disponibles: disp.length,
    valorInventario: disp.reduce((s, i) => s + Number(i.totalCompra || i.precioCompra || 0), 0),
    totalVendido: items.filter(i => i.estado === 'vendido').reduce((s, i) => s + Number(i.totalVenta || i.precioVenta || 0), 0),
    prestamosActivos: prestamos.prestamos.filter(p => p.estado === 'activo').length,
    totalPrestado: prestamos.totalPrestado,
    ordenesPendientes: fabricacion.ordenes.filter(o => o.estado !== 'entregado').length,
    clientes: clientes.clientes.length
  }
})

const cards = computed(() => [
  {
    label: 'Joyas en Inventario',
    valor: stats.value.totalItems,
    sub: `${stats.value.disponibles} disponibles`,
    icon: 'gem', iconColor: 'text-gold-300', border: 'border-gold-500/20'
  },
  {
    label: 'Valor Inventario',
    valor: configStore.formatMoney(stats.value.valorInventario),
    sub: 'En stock disponible',
    icon: 'box', iconColor: 'text-sky-300', border: 'border-sky-500/20'
  },
  {
    label: 'Préstamos Activos',
    valor: stats.value.prestamosActivos,
    sub: `${configStore.formatMoney(stats.value.totalPrestado)} prestado`,
    icon: 'coins', iconColor: 'text-sky-300', border: 'border-sky-500/20'
  },
  {
    label: 'Órdenes en Proceso',
    valor: stats.value.ordenesPendientes,
    sub: 'Fabricación pendiente',
    icon: 'hammer', iconColor: 'text-gold-300', border: 'border-gold-500/20'
  },
  {
    label: 'Total Vendido',
    valor: configStore.formatMoney(stats.value.totalVendido),
    sub: 'Histórico',
    icon: 'chart', iconColor: 'text-gold-300', border: 'border-gold-500/20'
  },
  {
    label: 'Clientes',
    valor: stats.value.clientes,
    sub: 'Registrados',
    icon: 'users', iconColor: 'text-sky-300', border: 'border-sky-500/20'
  }
])
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="eyebrow">Panel principal</p>
      <h2 class="section-title mt-1">Hola, {{ auth.user?.nombre }} 👋</h2>
      <p class="text-xs text-sky-400/80 mt-1">
        {{ configStore.nombreMoneda }} · {{ configStore.simbolo }} ·
        {{ new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="c in cards"
        :key="c.label"
        :class="['card-hover relative overflow-hidden', c.border]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] uppercase tracking-wider text-ink-400">{{ c.label }}</p>
            <p class="mt-1.5 font-display text-2xl sm:text-3xl font-semibold text-ink-50 truncate">{{ c.valor }}</p>
            <p class="text-xs text-ink-500 mt-1">{{ c.sub }}</p>
          </div>
          <div :class="['w-11 h-11 rounded-xl flex items-center justify-center bg-ink-800/80 border border-ink-700 shrink-0', c.iconColor]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" :d="icons[c.icon]"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-sky-700/30 relative overflow-hidden">
      <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-sky-500/10"></div>
      <div class="relative flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-sky-200 mb-1">Almacenamiento local</h3>
          <p class="text-sm text-ink-300 leading-relaxed">
            Los datos se guardan en tu dispositivo (localStorage). Exporta respaldos desde Inventario.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>