<script setup>
import { ref, computed, watch } from 'vue'
import { useFabricacionStore } from '../stores/fabricacion'
import { useInventarioStore } from '../stores/inventario'
import { useConfigStore } from '../stores/config'
import { icons } from '../components/icons'
import ComprobanteFabricacion from '../components/ComprobanteFabricacion.vue'
import { generarPDFFabricacion } from '../utils/comprobanteFabricacionPDF'

const store = useFabricacionStore()
const inventario = useInventarioStore()
const configStore = useConfigStore()

const mostrarForm = ref(false)
const editandoId = ref(null)

const comprobanteVisible = ref(false)
const ordenComprobante = ref(null)
const comprobanteAutoPrint = ref(false)

const menuAbiertoId = ref(null)
const estadoMenuId = ref(null)

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'badge-amber' },
  { value: 'en_proceso', label: 'En proceso', color: 'badge-blue' },
  { value: 'terminado', label: 'Terminado', color: 'badge-purple' },
  { value: 'entregado', label: 'Entregado', color: 'badge-green' },
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

function cambiarEstado(o, nuevo) {
  store.actualizarEstado(o.id, nuevo)
  estadoMenuId.value = null
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-comprobante')) menuAbiertoId.value = null
    if (!e.target.closest('.menu-estado')) estadoMenuId.value = null
  })
}

const materiales = [
  'oro 18k', 'oro 14k', 'oro 10k', 'plata 925',
  'platino', 'acero', 'piedras preciosas',
]

const tipos = [
  'anillos matrimonio', 'anillo de compromiso', 'joyas de fiesta',
  'anillos de promoción', 'grabado', 'reparación', 'diseño personalizado', 'otro',
]

function hoyLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

const formVacio = () => ({
  cliente: '',
  tipoTrabajo: 'anillos matrimonio',
  descripcion: '',
  material: 'oro 18k',
  pesoEstimado: '',
  precio: '',
  anticipo: '',
  fechaInicio: hoyLocal(),
  fechaEntrega: '',
  estado: 'pendiente',
})

const form = ref(formVacio())

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

const saldoForm = computed(() => {
  const precio = Number(form.value.precio) || 0
  const anticipo = Number(form.value.anticipo) || 0
  return Math.max(0, precio - anticipo)
})

function abrirNuevo() {
  form.value = formVacio()
  editandoId.value = null
  mostrarForm.value = true
}

function abrirEditar(o) {
  form.value = {
    cliente: o.cliente || '',
    tipoTrabajo: o.tipoTrabajo || 'anillos matrimonio',
    descripcion: o.descripcion || '',
    material: o.material || 'oro 18k',
    pesoEstimado: o.pesoEstimado || '',
    precio: o.precio || '',
    anticipo: o.anticipo || '',
    fechaInicio: o.fechaInicio ? String(o.fechaInicio).slice(0, 10) : hoyLocal(),
    fechaEntrega: o.fechaEntrega ? String(o.fechaEntrega).slice(0, 10) : '',
    estado: o.estado || 'pendiente',
  }
  editandoId.value = o.id
  mostrarForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cerrarForm() {
  mostrarForm.value = false
  editandoId.value = null
  form.value = formVacio()
}

function guardar() {
  if (!form.value.cliente || !form.value.precio) return

  const payload = {
    cliente: form.value.cliente,
    tipoTrabajo: form.value.tipoTrabajo,
    descripcion: form.value.descripcion,
    material: form.value.material,
    pesoEstimado: form.value.pesoEstimado === '' ? '' : Number(form.value.pesoEstimado),
    precio: Number(form.value.precio) || 0,
    anticipo: Number(form.value.anticipo) || 0,
    fechaInicio: form.value.fechaInicio || '',
    fechaEntrega: form.value.fechaEntrega || '',
    estado: form.value.estado,
  }

  if (editandoId.value) {
    store.actualizar(editandoId.value, payload)
  } else {
    store.crear(payload)
  }
  cerrarForm()
}

function confirmarEliminar(o) {
  if (confirm(`¿Eliminar la orden de ${o.cliente}? Esta acción no se puede deshacer.`)) {
    store.eliminar(o.id)
  }
}

function pasarAInventario(o) {
  inventario.agregar({
    nombre: `${o.tipoTrabajo} - ${o.cliente}`,
    tipo: 'otro',
    material: o.material,
    peso: o.pesoEstimado,
    cantidad: 1,
    precioCompra: o.precio,
    precioVenta: '',
    proveedor: 'Fabricación propia',
    descripcion: o.descripcion,
    estado: 'disponible',
    origen: 'fabricacion',
  })
  alert('Añadido al inventario')
}

function abrirComprobante(o, autoPrint = false) {
  ordenComprobante.value = { ...o }
  comprobanteAutoPrint.value = autoPrint
  comprobanteVisible.value = true
  menuAbiertoId.value = null
}

function cerrarComprobante() {
  comprobanteVisible.value = false
  ordenComprobante.value = null
  comprobanteAutoPrint.value = false
}

function descargarPDF(o) {
  generarPDFFabricacion(o, configStore)
  menuAbiertoId.value = null
}

watch(mostrarForm, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Taller</p>
        <h2 class="section-title mt-1">Fabricación</h2>
      </div>
      <button @click="abrirNuevo" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Nueva Orden
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Total órdenes</p>
        <p class="font-display text-2xl font-semibold text-ink-50 mt-1">{{ store.ordenes.length }}</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Pendientes</p>
        <p class="font-display text-2xl font-semibold text-amber-300 mt-1">
          {{ store.ordenes.filter(o => o.estado === 'pendiente').length }}
        </p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">En proceso</p>
        <p class="font-display text-2xl font-semibold text-blue-300 mt-1">
          {{ store.ordenes.filter(o => o.estado === 'en_proceso').length }}
        </p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Entregadas</p>
        <p class="font-display text-2xl font-semibold text-emerald-300 mt-1">
          {{ store.ordenes.filter(o => o.estado === 'entregado').length }}
        </p>
      </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="o in store.ordenes.slice().reverse()"
        :key="o.id"
        class="card-hover relative overflow-visible"
      >
        <div class="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl bg-purple-400/15 pointer-events-none"></div>

        <div class="relative">
          <div class="flex justify-between items-start mb-3">
            <div class="min-w-0">
              <h4 class="font-display text-lg font-semibold text-ink-50 capitalize truncate">
                {{ o.tipoTrabajo }}
              </h4>
              <p class="text-xs text-ink-400 mt-0.5 truncate">👤 {{ o.cliente }}</p>
            </div>

            <!-- ESTADO EDITABLE -->
            <div class="relative menu-estado shrink-0">
              <button
                @click.stop="toggleEstadoMenu(o.id)"
                :class="[estadoInfo(o.estado).color, 'cursor-pointer hover:scale-105 transition']"
                title="Cambiar estado"
              >
                {{ estadoInfo(o.estado).label }}
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
                  v-if="estadoMenuId === o.id"
                  class="absolute right-0 top-full mt-2 w-40 bg-ink-900 border border-ink-700 rounded-xl shadow-2xl overflow-hidden z-30"
                  @click.stop
                >
                  <button
                    v-for="e in ESTADOS"
                    :key="e.value"
                    @click="cambiarEstado(o, e.value)"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2.5 text-xs transition text-left hover:bg-ink-800',
                      o.estado === e.value ? 'bg-ink-800/60 text-gold-300' : 'text-ink-200'
                    ]"
                  >
                    <span :class="[e.color, 'w-2 h-2 rounded-full p-0']"></span>
                    <span class="font-medium">{{ e.label }}</span>
                    <svg v-if="o.estado === e.value" class="w-3.5 h-3.5 ml-auto text-gold-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                </div>
              </transition>
            </div>
          </div>

          <p v-if="o.descripcion" class="text-sm text-ink-300 mb-3 italic">"{{ o.descripcion }}"</p>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-ink-400">Material</span>
              <span class="text-ink-200 capitalize">{{ o.material }}</span>
            </div>
            <div v-if="o.pesoEstimado" class="flex justify-between">
              <span class="text-ink-400">Peso est.</span>
              <span class="text-ink-200">{{ o.pesoEstimado }} g</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Fecha inicio</span>
              <span class="text-ink-300 text-xs">{{ fmtFecha(o.fechaInicio) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Fecha entrega</span>
              <span class="text-ink-300 text-xs">
                {{ o.fechaEntrega ? fmtFecha(o.fechaEntrega) : 'Sin fecha' }}
              </span>
            </div>
            <div class="gold-divider my-1.5"></div>
            <div class="flex justify-between">
              <span class="text-ink-400">Precio</span>
              <span class="font-medium text-ink-100">{{ fmtMoney(o.precio) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Anticipo</span>
              <span class="text-emerald-300">{{ fmtMoney(o.anticipo) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-400">Saldo</span>
              <span class="font-bold text-gold-300">
                {{ fmtMoney(Number(o.precio) - Number(o.anticipo)) }}
              </span>
            </div>
          </div>

          <div class="mt-4 flex gap-2 flex-wrap">
            <button @click="pasarAInventario(o)" class="btn-secondary flex-1 text-xs min-w-[70px]">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              A inventario
            </button>

            <div class="relative menu-comprobante">
              <button
                @click.stop="toggleMenu(o.id)"
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
                  v-if="menuAbiertoId === o.id"
                  class="absolute right-0 bottom-full mb-2 w-56 bg-ink-900 border border-ink-700 rounded-xl shadow-2xl overflow-hidden z-30"
                  @click.stop
                >
                  <div class="px-3 py-2 border-b border-ink-800">
                    <p class="text-[10px] uppercase tracking-wider text-ink-500">Comprobante</p>
                  </div>

                  <button
                    @click="abrirComprobante(o, true)"
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
                    @click="descargarPDF(o)"
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
                    @click="abrirComprobante(o, false)"
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
              @click="abrirEditar(o)"
              class="btn-secondary text-xs px-3"
              title="Editar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              @click="confirmarEliminar(o)"
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

      <div v-if="store.ordenes.length === 0" class="col-span-full card text-center py-16 text-ink-500">
        <svg class="w-14 h-14 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5L12 2z"/>
        </svg>
        <p>No hay órdenes registradas</p>
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
              <h3 class="font-display text-xl font-semibold text-purple-200">
                {{ editandoId ? 'Editar orden' : 'Nueva orden de fabricación' }}
              </h3>
            </div>
            <button
              @click="cerrarForm"
              class="p-2 rounded-lg text-ink-400 hover:text-gold-400 hover:bg-ink-800 transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="icons.close"/>
              </svg>
            </button>
          </div>

          <div class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-2">
              <label class="label">Cliente *</label>
              <input v-model="form.cliente" class="input" placeholder="Nombre del cliente" />
            </div>

            <!-- ESTADO -->
            <div>
              <label class="label">Estado</label>
              <select v-model="form.estado" class="input">
                <option v-for="e in ESTADOS" :key="e.value" :value="e.value">{{ e.label }}</option>
              </select>
            </div>

            <div>
              <label class="label">Tipo de trabajo</label>
              <select v-model="form.tipoTrabajo" class="input">
                <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>

            <div>
              <label class="label">Material</label>
              <select v-model="form.material" class="input">
                <option v-for="m in materiales" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <div>
              <label class="label">Peso estimado (g)</label>
              <input v-model="form.pesoEstimado" type="number" step="0.01" class="input" placeholder="0.00" />
            </div>

            <div>
              <label class="label">Precio total *</label>
              <input v-model="form.precio" type="number" class="input" placeholder="0" />
            </div>

            <div>
              <label class="label">Anticipo</label>
              <input v-model="form.anticipo" type="number" class="input" placeholder="0" />
            </div>

            <div>
              <label class="label">Fecha de inicio</label>
              <input v-model="form.fechaInicio" type="date" class="input" />
            </div>

            <div>
              <label class="label">Fecha de entrega</label>
              <input v-model="form.fechaEntrega" type="date" class="input" />
            </div>

            <div>
              <label class="label">Saldo restante</label>
              <div class="input bg-gold-500/10 border-gold-500/30 font-bold text-gold-300 cursor-not-allowed">
                {{ fmtMoney(saldoForm) }}
              </div>
            </div>

            <div class="md:col-span-2 lg:col-span-3">
              <label class="label">Descripción / Detalles</label>
              <textarea
                v-model="form.descripcion"
                class="input"
                rows="2"
                placeholder="Grabado, talla, detalles específicos..."
              ></textarea>
            </div>
          </div>

          <div class="sticky bottom-0 bg-ink-900/95 backdrop-blur border-t border-ink-800 px-5 py-4 flex gap-2 justify-end">
            <button @click="cerrarForm" class="btn-secondary">Cancelar</button>
            <button @click="guardar" class="btn-primary">
              {{ editandoId ? 'Guardar cambios' : 'Crear orden' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <ComprobanteFabricacion
      :orden="ordenComprobante"
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