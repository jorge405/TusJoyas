<script setup>
import { ref, computed, watch } from 'vue'
import { usePrestamosStore } from '../stores/prestamos'
import { useConfigStore } from '../stores/config'
import { icons } from '../components/icons'
import ComprobantePrestamo from '../components/ComprobantePrestamo.vue'
import { generarPDFPrestamo } from '../utils/comprobantePDF'
import ClienteAutocomplete from '../components/ClienteAutocomplete.vue'

const store = usePrestamosStore()
const configStore = useConfigStore()

const mostrarForm = ref(false)
const editandoId = ref(null)
const pagoModal = ref(null)
const montoPago = ref('')

const comprobanteVisible = ref(false)
const prestamoComprobante = ref(null)
const comprobanteAutoPrint = ref(false)

const menuAbiertoId = ref(null)
const estadoMenuId = ref(null)

const ESTADOS = [
  { value: 'activo', label: 'Activo', color: 'badge-amber' },
  { value: 'pagado', label: 'Pagado', color: 'badge-green' },
  { value: 'vencido', label: 'Vencido', color: 'badge-red' },
  { value: 'cancelado', label: 'Cancelado', color: 'badge-gold' },
]

function estadoInfo(valor) {
  return ESTADOS.find(e => e.value === valor) || ESTADOS[0]
}

function toggleMenu(id) {
  menuAbiertoId.value = menuAbiertoId.value === id ? null : id
  estadoMenuId.value = null
}

function toggleEstadoMenu(id) {
  estadoMenuId.value = estadoMenuId.value === id ? null : id
  menuAbiertoId.value = null
}

function cambiarEstado(p, nuevo) {
  store.actualizarEstado(p.id, nuevo)
  estadoMenuId.value = null
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-comprobante')) menuAbiertoId.value = null
    if (!e.target.closest('.menu-estado')) estadoMenuId.value = null
  })
}

function hoyLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

const formVacio = () => ({
  cliente: '',
  descripcionJoya: '',
  peso: '',
  montoPrincipal: '',
  tasaInteres: configStore.config.tasaInteresDefault,
  plazoCantidad: 1,
  plazoUnidad: 'dias',
  fechaInicio: hoyLocal(),
  estado: 'activo',
})

const form = ref(formVacio())

const mesesOpciones = Array.from({ length: 12 }, (_, i) => i + 1)

function fmtMoney(n) {
  return configStore.formatMoney(n)
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const soloFecha = String(iso).slice(0, 10)
  const [y, m, d] = soloFecha.split('-')
  if (!y || !m || !d) return iso
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const mesNombre = meses[parseInt(m, 10) - 1] || m
  return `${parseInt(d, 10)} ${mesNombre} ${y}`
}

const plazoEnDias = computed(() => {
  const cant = Number(form.value.plazoCantidad) || 0
  return form.value.plazoUnidad === 'meses' ? cant * 30 : cant
})

const montoTotal = computed(() => {
  const p = Number(form.value.montoPrincipal) || 0
  const i = (Number(form.value.tasaInteres) || 0) / 100
  return Math.round(p * (1 + i))
})

const fechaVencimientoPreview = computed(() => {
  const base = form.value.fechaInicio ? new Date(form.value.fechaInicio + 'T12:00:00') : new Date()
  base.setDate(base.getDate() + plazoEnDias.value)
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  return `${d}/${m}/${y}`
})

function fechaLocalAObjeto(str) {
  if (!str) return new Date()
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

watch(() => form.value.plazoUnidad, (nueva, anterior) => {
  if (nueva === anterior) return
  form.value.plazoCantidad = nueva === 'meses' ? 1 : 30
})

function abrirNuevo() {
  form.value = formVacio()
  editandoId.value = null
  mostrarForm.value = true
}

function abrirEditar(p) {
  form.value = {
    cliente: p.cliente || '',
    descripcionJoya: p.descripcionJoya || '',
    peso: p.peso || '',
    montoPrincipal: p.montoPrincipal || '',
    tasaInteres: p.tasaInteres || configStore.config.tasaInteresDefault,
    plazoCantidad: p.plazoCantidad || p.plazoDias || 30,
    plazoUnidad: p.plazoUnidad || 'dias',
    fechaInicio: p.fechaInicio ? String(p.fechaInicio).slice(0, 10) : hoyLocal(),
    estado: p.estado || 'activo',
  }
  editandoId.value = p.id
  mostrarForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cerrarForm() {
  mostrarForm.value = false
  editandoId.value = null
  form.value = formVacio()
}

function guardar() {
  if (!form.value.cliente || !form.value.montoPrincipal) return

  const inicio = fechaLocalAObjeto(form.value.fechaInicio)
  const venc = new Date(inicio)
  venc.setDate(venc.getDate() + plazoEnDias.value)

  const payload = {
    cliente: form.value.cliente,
    descripcionJoya: form.value.descripcionJoya,
    peso: form.value.peso === '' ? '' : Number(form.value.peso),
    montoPrincipal: Number(form.value.montoPrincipal),
    tasaInteres: Number(form.value.tasaInteres) || 0,
    plazoCantidad: Number(form.value.plazoCantidad) || 0,
    plazoUnidad: form.value.plazoUnidad,
    plazoDias: plazoEnDias.value,
    montoTotal: montoTotal.value,
    fechaInicio: form.value.fechaInicio,
    fechaVencimiento: venc.toISOString().slice(0, 10),
    estado: form.value.estado,
  }

  if (editandoId.value) {
    store.actualizar(editandoId.value, payload)
  } else {
    store.crear(payload)
  }
  cerrarForm()
}

function abrirComprobante(p, autoPrint = false) {
  prestamoComprobante.value = { ...p }
  comprobanteAutoPrint.value = autoPrint
  comprobanteVisible.value = true
  menuAbiertoId.value = null
}

function descargarPDF(p) {
  generarPDFPrestamo(p, configStore)
  menuAbiertoId.value = null
}

function cerrarComprobante() {
  comprobanteVisible.value = false
  prestamoComprobante.value = null
  comprobanteAutoPrint.value = false
}

function pagar() {
  if (!montoPago.value) return
  store.registrarPago(pagoModal.value.id, montoPago.value)
  pagoModal.value = null
  montoPago.value = ''
}

function confirmarEliminar(p) {
  if (confirm(`¿Eliminar el préstamo de ${p.cliente}? Esta acción no se puede deshacer.`)) {
    store.eliminar(p.id)
  }
}

const totalPagado = p => p.pagos?.reduce((s, x) => s + x.monto, 0) || 0
const restante = p => Math.max(0, Number(p.montoTotal) - totalPagado(p))

function plazoTexto(p) {
  if (p.plazoCantidad && p.plazoUnidad) {
    const u = p.plazoUnidad === 'meses'
      ? (p.plazoCantidad === 1 ? 'mes' : 'meses')
      : (p.plazoCantidad === 1 ? 'día' : 'días')
    return `${p.plazoCantidad} ${u}`
  }
  if (p.plazoDias) return `${p.plazoDias} días`
  return '—'
}

function diasRestantes(p) {
  if (!p.fechaVencimiento) return null
  const venc = fechaLocalAObjeto(String(p.fechaVencimiento).slice(0, 10))
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  venc.setHours(0, 0, 0, 0)
  return Math.ceil((venc - hoy) / 86400000)
}

function vencimientoClase(p) {
  const d = diasRestantes(p)
  if (d === null || p.estado !== 'activo') return 'text-ink-400'
  if (d < 0) return 'text-red-400'
  if (d <= 5) return 'text-amber-400'
  return 'text-emerald-400'
}

function vencimientoTexto(p) {
  const d = diasRestantes(p)
  if (d === null) return '—'
  if (p.estado !== 'activo') return fmtFecha(p.fechaVencimiento)
  if (d < 0) return `Vencido hace ${Math.abs(d)}d`
  if (d === 0) return 'Vence hoy'
  return `${d} día${d === 1 ? '' : 's'} restantes`
}

watch(mostrarForm, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Finanzas</p>
        <h2 class="section-title mt-1">Préstamos sobre Joyas</h2>
      </div>
      <button @click="abrirNuevo" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Nuevo Préstamo
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card-hover relative overflow-hidden">
        <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-emerald-400/20"></div>
        <div class="relative">
          <p class="text-xs uppercase tracking-wider text-ink-400">Capital activo</p>
          <p class="font-display text-3xl font-semibold text-emerald-300 mt-1.5">
            {{ fmtMoney(store.totalPrestado) }}
          </p>
        </div>
      </div>
      <div class="card-hover relative overflow-hidden">
        <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-gold-400/25"></div>
        <div class="relative">
          <p class="text-xs uppercase tracking-wider text-ink-400">Intereses ganados</p>
          <p class="font-display text-3xl font-semibold text-gold-300 mt-1.5">
            {{ fmtMoney(store.totalIntereses) }}
          </p>
        </div>
      </div>
      <div class="card-hover relative overflow-hidden">
        <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-sky-400/20"></div>
        <div class="relative">
          <p class="text-xs uppercase tracking-wider text-ink-400">Préstamos activos</p>
          <p class="font-display text-3xl font-semibold text-sky-300 mt-1.5">
            {{ store.prestamos.filter(p => p.estado === 'activo').length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Lista -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="p in store.prestamos.slice().reverse()"
        :key="p.id"
        class="card-hover relative overflow-visible"
      >
        <div :class="['absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none',
          p.estado === 'activo' ? 'bg-amber-400/15' : p.estado === 'pagado' ? 'bg-emerald-400/15' : p.estado === 'vencido' ? 'bg-red-400/15' : 'bg-gold-400/15']"></div>

        <div class="relative">
          <div class="flex justify-between items-start mb-4">
            <div class="min-w-0">
              <h4 class="font-display text-lg font-semibold text-ink-50 truncate">{{ p.cliente }}</h4>
              <p class="text-xs text-ink-400 mt-0.5 truncate">{{ p.descripcionJoya }}</p>
              <p v-if="p.peso" class="text-[10px] text-sky-400/80 mt-0.5">⚖ {{ p.peso }} g</p>
            </div>

            <!-- 🎯 ESTADO EDITABLE -->
            <div class="relative menu-estado shrink-0">
              <button
                @click.stop="toggleEstadoMenu(p.id)"
                :class="[estadoInfo(p.estado).color, 'cursor-pointer hover:scale-105 transition']"
                title="Cambiar estado"
              >
                {{ estadoInfo(p.estado).label }}
                <svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <transition
                enter-active-class="transition-all duration-150"
                leave-active-class="transition-all duration-100"
                enter-from-class="opacity-0 -translate-y-1"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <div
                  v-if="estadoMenuId === p.id"
                  class="absolute right-0 top-full mt-2 w-40 bg-ink-900 border border-ink-700 rounded-xl shadow-2xl overflow-hidden z-30"
                  @click.stop
                >
                  <button
                    v-for="e in ESTADOS"
                    :key="e.value"
                    @click="cambiarEstado(p, e.value)"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2.5 text-xs transition text-left hover:bg-ink-800',
                      p.estado === e.value ? 'bg-ink-800/60 text-gold-300' : 'text-ink-200'
                    ]"
                  >
                    <span :class="[e.color, 'w-2 h-2 rounded-full p-0']"></span>
                    <span class="font-medium">{{ e.label }}</span>
                    <svg v-if="p.estado === e.value" class="w-3.5 h-3.5 ml-auto text-gold-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                </div>
              </transition>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-ink-400">Capital</span>
              <span class="font-medium text-ink-100">{{ fmtMoney(p.montoPrincipal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Total a pagar</span>
              <span class="font-medium text-ink-100">{{ fmtMoney(p.montoTotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Interés</span>
              <span class="text-sky-300">{{ p.tasaInteres }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Plazo</span>
              <span class="text-ink-200">{{ plazoTexto(p) }}</span>
            </div>

            <div class="gold-divider my-1.5"></div>

            <div class="flex justify-between">
              <span class="text-ink-400">📅 Fecha inicio</span>
              <span class="text-ink-200 text-xs font-medium">{{ fmtFecha(p.fechaInicio) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">⏰ Vencimiento</span>
              <span class="text-xs font-medium text-ink-200">{{ fmtFecha(p.fechaVencimiento) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Estado vencimiento</span>
              <span :class="vencimientoClase(p)" class="text-xs font-semibold">
                {{ vencimientoTexto(p) }}
              </span>
            </div>

            <div class="gold-divider my-1.5"></div>

            <div class="flex justify-between">
              <span class="text-ink-400">Pagado</span>
              <span class="font-medium text-emerald-300">{{ fmtMoney(totalPagado(p)) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Restante</span>
              <span class="font-bold text-gold-300">{{ fmtMoney(restante(p)) }}</span>
            </div>
          </div>

          <div class="mt-4 w-full bg-ink-800 rounded-full h-2 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-gold-400 to-emerald-400 rounded-full transition-all duration-500"
              :style="{ width: Math.min(100, (totalPagado(p) / p.montoTotal) * 100) + '%' }"
            ></div>
          </div>

          <div class="mt-4 flex gap-2 flex-wrap">
            <button
              v-if="p.estado === 'activo'"
              @click="pagoModal = p"
              class="btn-primary flex-1 text-xs min-w-[70px]"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Pago
            </button>

            <div class="relative menu-comprobante">
              <button
                @click.stop="toggleMenu(p.id)"
                class="btn-secondary text-xs px-3"
                title="Comprobante"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </button>

              <transition
                enter-active-class="transition-all duration-150"
                leave-active-class="transition-all duration-100"
                enter-from-class="opacity-0 -translate-y-1"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <div
                  v-if="menuAbiertoId === p.id"
                  class="absolute right-0 bottom-full mb-2 w-56 bg-ink-900 border border-ink-700 rounded-xl shadow-2xl overflow-hidden z-30"
                  @click.stop
                >
                  <div class="px-3 py-2 border-b border-ink-800">
                    <p class="text-[10px] uppercase tracking-wider text-ink-500">Comprobante</p>
                  </div>

                  <button
                    @click="abrirComprobante(p, true)"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-ink-200 hover:bg-ink-800 hover:text-gold-300 transition text-left"
                  >
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    <div>
                      <p class="font-medium">Imprimir térmico</p>
                      <p class="text-[10px] text-ink-500">58mm / 80mm</p>
                    </div>
                  </button>

                  <button
                    @click="descargarPDF(p)"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-ink-200 hover:bg-ink-800 hover:text-sky-300 transition text-left border-t border-ink-800"
                  >
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div>
                      <p class="font-medium">Descargar PDF</p>
                      <p class="text-[10px] text-ink-500">Formato A4</p>
                    </div>
                  </button>

                  <button
                    @click="abrirComprobante(p, false)"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-ink-200 hover:bg-ink-800 hover:text-ink-50 transition text-left border-t border-ink-800"
                  >
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <div>
                      <p class="font-medium">Previsualizar</p>
                      <p class="text-[10px] text-ink-500">Ver antes de imprimir</p>
                    </div>
                  </button>
                </div>
              </transition>
            </div>

            <button
              @click="abrirEditar(p)"
              class="btn-secondary text-xs px-3"
              title="Editar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              @click="confirmarEliminar(p)"
              class="btn-danger text-xs px-3"
              title="Eliminar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="icons.trash"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="store.prestamos.length === 0" class="col-span-full card text-center py-16 text-ink-500">
        <svg class="w-14 h-14 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>No hay préstamos registrados</p>
      </div>
    </div>

    <!-- Modal Crear/Editar -->
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mostrarForm"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="cerrarForm"
      >
        <div class="bg-ink-900 border border-ink-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up">
          <div class="sticky top-0 z-10 bg-ink-900/95 backdrop-blur border-b border-ink-800 px-5 py-4 flex items-center justify-between">
            <div>
              <p class="eyebrow">{{ editandoId ? 'Editar' : 'Registrar' }}</p>
              <h3 class="font-display text-xl font-semibold text-emerald-200">
                {{ editandoId ? 'Editar préstamo' : 'Nuevo préstamo' }}
              </h3>
            </div>
            <button @click="cerrarForm" class="p-2 rounded-lg text-ink-400 hover:text-gold-400 hover:bg-ink-800 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="icons.close"/>
              </svg>
            </button>
          </div>

          <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
                <label class="label">Cliente *</label>
                <ClienteAutocomplete
                  v-model="form.cliente"
                  placeholder="Nombre del cliente"
                />
            </div>

            <div class="md:col-span-2">
              <label class="label">Joya empeñada</label>
              <input v-model="form.descripcionJoya" class="input" placeholder="Ej: Cadena oro 18k con dije" />
            </div>

            <div>
              <label class="label">Peso (g)</label>
              <input v-model="form.peso" type="number" step="0.01" class="input" placeholder="0.00" />
            </div>

            <div>
              <label class="label">Monto a prestar *</label>
              <input v-model="form.montoPrincipal" type="number" class="input" placeholder="0" />
            </div>

            <div>
              <label class="label">Tasa interés (%)</label>
              <input v-model="form.tasaInteres" type="number" step="0.5" class="input" />
            </div>

            <div>
              <label class="label">Total a pagar</label>
              <div class="input bg-gold-500/10 border-gold-500/30 font-bold text-gold-300 cursor-not-allowed">
                {{ fmtMoney(montoTotal) }}
              </div>
            </div>

            <div>
              <label class="label">Fecha de inicio</label>
              <input v-model="form.fechaInicio" type="date" class="input" />
            </div>

            <!-- 🎯 ESTADO -->
            <div>
              <label class="label">Estado</label>
              <select v-model="form.estado" class="input">
                <option v-for="e in ESTADOS" :key="e.value" :value="e.value">{{ e.label }}</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="label">Plazo</label>
              <div class="grid grid-cols-2 gap-2">
                <select v-model="form.plazoUnidad" class="input">
                  <option value="dias">Días</option>
                  <option value="meses">Meses</option>
                </select>

                <input
                  v-if="form.plazoUnidad === 'dias'"
                  v-model="form.plazoCantidad"
                  type="number"
                  min="1"
                  class="input"
                  placeholder="Ej: 45"
                />

                <select v-else v-model="form.plazoCantidad" class="input">
                  <option v-for="m in mesesOpciones" :key="m" :value="m">
                    {{ m }} {{ m === 1 ? 'mes' : 'meses' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="md:col-span-2 rounded-xl p-4 bg-sky-500/5 border border-sky-500/25">
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <p class="text-[10px] uppercase tracking-wider text-sky-400/80 mb-0.5">Inicio</p>
                  <p class="font-display text-sm font-semibold text-sky-200">
                    {{ fmtFecha(form.fechaInicio) }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider text-sky-400/80 mb-0.5">Plazo</p>
                  <p class="font-display text-sm font-semibold text-sky-200">{{ plazoEnDias }} días</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wider text-sky-400/80 mb-0.5">Vencimiento</p>
                  <p class="font-display text-sm font-semibold text-sky-200">
                    {{ fechaVencimientoPreview }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 bg-ink-900/95 backdrop-blur border-t border-ink-800 px-5 py-4 flex gap-2 justify-end">
            <button @click="cerrarForm" class="btn-secondary">Cancelar</button>
            <button @click="guardar" class="btn-primary">
              {{ editandoId ? 'Guardar cambios' : 'Guardar préstamo' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal Pago -->
    <transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="pagoModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="card max-w-sm w-full animate-slide-up border-gold-700/30">
          <h3 class="font-display text-xl font-semibold text-gold-200 mb-1">Registrar pago</h3>
          <p class="text-sm text-ink-400 mb-5">
            {{ pagoModal.cliente }} — Restante:
            <span class="text-gold-300 font-semibold">{{ fmtMoney(restante(pagoModal)) }}</span>
          </p>
          <label class="label">Monto</label>
          <input v-model="montoPago" type="number" class="input mb-2" placeholder="0" autofocus />
          <div class="flex gap-2 mb-5">
            <button
              type="button"
              @click="montoPago = restante(pagoModal)"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition"
            >Pago total</button>
            <button
              type="button"
              @click="montoPago = Math.round(restante(pagoModal) / 2)"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition"
            >Mitad</button>
          </div>
          <div class="flex gap-2">
            <button @click="pagoModal = null" class="btn-secondary flex-1">Cancelar</button>
            <button @click="pagar" class="btn-primary flex-1">Guardar</button>
          </div>
        </div>
      </div>
    </transition>

    <ComprobantePrestamo
      :prestamo="prestamoComprobante"
      :visible="comprobanteVisible"
      :auto-print="comprobanteAutoPrint"
      @cerrar="cerrarComprobante"
    />
  </div>
</template>

<style scoped>
select.input {
  background-color: #101218 !important;
  color: #eceef2;
}
select.input option {
  background-color: #101218;
  color: #eceef2;
}
</style>