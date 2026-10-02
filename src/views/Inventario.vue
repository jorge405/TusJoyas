<script setup>
import { ref, computed, watch } from 'vue'
import * as XLSX from 'xlsx'
import { useInventarioStore } from '../stores/inventario'
import { useConfigStore } from '../stores/config'
import { icons } from '../components/icons'
import ComprobanteVenta from '../components/ComprobanteVenta.vue'
import ClienteAutocomplete from '../components/ClienteAutocomplete.vue'

const store = useInventarioStore()
const configStore = useConfigStore()

const mostrarForm = ref(false)
const editandoId = ref(null)
const filtro = ref('todos')
const busqueda = ref('')

const empenoModal = ref(null)
const ventaModal = ref(null)
const comprobanteVisible = ref(false)
const ventaComprobante = ref(null)

const formVacio = () => ({
  nombre: '',
  tipo: 'anillo',
  material: 'oro 18k',
  peso: '',
  cantidad: 1,
  precioCompra: '',
  precioVenta: '',
  proveedor: '',
  descripcion: '',
  estado: 'disponible',
})

const form = ref(formVacio())

const tipos = ['anillo', 'collar', 'pulsera', 'aretes', 'dije', 'cadena', 'reloj', 'otro']
const materiales = ['oro 18k', 'oro 14k', 'oro 10k', 'plata 925', 'platino', 'acero', 'piedras preciosas']
const estados = ['disponible', 'no_disponible', 'empeñado', 'vendido']
const filtros = ['todos', 'disponible', 'no_disponible', 'empeñado', 'vendido']

const empenoForm = ref({
  cliente: '',
  fecha: new Date().toISOString().slice(0, 10),
  precio: '',
  cantidad: 1,
})

const ventaForm = ref({
  cliente: '',
  fecha: new Date().toISOString().slice(0, 10),
  precio: '',
  cantidad: 1,
})

// 🧮 Total a mostrar en el modal (precio unitario × cantidad)
const empenoTotal = computed(() => {
  const p = Number(empenoForm.value.precio) || 0
  const c = Number(empenoForm.value.cantidad) || 0
  return p * c
})

const ventaTotal = computed(() => {
  const p = Number(ventaForm.value.precio) || 0
  const c = Number(ventaForm.value.cantidad) || 0
  return p * c
})

const totalCompraForm = computed(() =>
  (Number(form.value.cantidad) || 0) * (Number(form.value.precioCompra) || 0)
)
const totalVentaForm = computed(() =>
  (Number(form.value.cantidad) || 0) * (Number(form.value.precioVenta) || 0)
)

const itemsFiltrados = computed(() =>
  store.items
    .filter(i => {
      const ok = filtro.value === 'todos' || i.estado === filtro.value
      const b = !busqueda.value ||
        i.nombre?.toLowerCase().includes(busqueda.value.toLowerCase()) ||
        i.tipo?.toLowerCase().includes(busqueda.value.toLowerCase()) ||
        i.proveedor?.toLowerCase().includes(busqueda.value.toLowerCase())
      return ok && b
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
)

function abrirNuevo() {
  form.value = formVacio()
  editandoId.value = null
  mostrarForm.value = true
}

function abrirEditar(item) {
  form.value = {
    nombre: item.nombre || '',
    tipo: item.tipo || 'anillo',
    material: item.material || 'oro 18k',
    peso: item.peso || '',
    cantidad: item.cantidad || 1,
    precioCompra: item.precioCompra || '',
    precioVenta: item.precioVenta || '',
    proveedor: item.proveedor || '',
    descripcion: item.descripcion || '',
    estado: item.estado || 'disponible',
  }
  editandoId.value = item.id
  mostrarForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cerrarForm() {
  mostrarForm.value = false
  editandoId.value = null
  form.value = formVacio()
}

function guardar() {
  if (!form.value.nombre || !form.value.precioCompra) return

  // Crear
  if (!editandoId.value) {
    const payload = {
      ...form.value,
      cantidad: Number(form.value.cantidad) || 1,
      precioCompra: Number(form.value.precioCompra) || 0,
      precioVenta: Number(form.value.precioVenta) || 0,
      peso: form.value.peso === '' ? '' : Number(form.value.peso),
    }
    store.agregar({ ...payload, origen: 'compra' })
    cerrarForm()
    return
  }

  // Editar
  const itemActual = store.items.find(i => i.id === editandoId.value)
  if (!itemActual) { cerrarForm(); return }

  const estadoAnterior = itemActual.estado
  const estadoNuevo = form.value.estado

  const payload = {
    nombre: form.value.nombre,
    tipo: form.value.tipo,
    material: form.value.material,
    peso: form.value.peso === '' ? '' : Number(form.value.peso),
    cantidad: Number(form.value.cantidad) || 1,
    precioCompra: Number(form.value.precioCompra) || 0,
    precioVenta: Number(form.value.precioVenta) || 0,
    proveedor: form.value.proveedor,
    descripcion: form.value.descripcion,
  }

  store.actualizar(editandoId.value, { ...payload, estado: itemActual.estado })

  // Volver desde empeñado/vendido a disponible/no_disponible
  if ((estadoAnterior === 'empeñado' || estadoAnterior === 'vendido') &&
      (estadoNuevo === 'disponible' || estadoNuevo === 'no_disponible')) {
    store.liberar(editandoId.value)
    if (estadoNuevo === 'no_disponible') {
      store.actualizar(editandoId.value, { estado: 'no_disponible' })
    }
    cerrarForm()
    return
  }

  // Cambiar a empeñado
  if (estadoNuevo === 'empeñado' && estadoAnterior !== 'empeñado') {
    const stockActual = Number(itemActual.cantidad) || 1
    empenoModal.value = { ...itemActual, ...payload, cantidad: stockActual }
    empenoForm.value = {
      cliente: itemActual.empeno?.cliente || '',
      fecha: itemActual.empeno?.fecha || new Date().toISOString().slice(0, 10),
      precio: itemActual.empeno?.precioUnitario || form.value.precioVenta || '',
      cantidad: 1,
    }
    cerrarForm()
    return
  }

  // Cambiar a vendido
  if (estadoNuevo === 'vendido' && estadoAnterior !== 'vendido') {
    const stockActual = Number(itemActual.cantidad) || 1
    ventaModal.value = { ...itemActual, ...payload, cantidad: stockActual }
    ventaForm.value = {
      cliente: itemActual.venta?.cliente || '',
      fecha: itemActual.venta?.fecha || new Date().toISOString().slice(0, 10),
      precio: itemActual.venta?.precioUnitario || form.value.precioVenta || '',
      cantidad: 1,
    }
    cerrarForm()
    return
  }

  // Cambios simples
  store.actualizar(editandoId.value, { estado: estadoNuevo })
  cerrarForm()
}

function guardarEmpeno() {
  if (!empenoModal.value) return
  const cant = Number(empenoForm.value.cantidad) || 1
  if (cant < 1) return
  store.empeñar(empenoModal.value.id, empenoForm.value)
  empenoModal.value = null
}

function cerrarEmpeno() {
  empenoModal.value = null
}

function guardarVenta() {
  if (!ventaModal.value) return
  const cant = Number(ventaForm.value.cantidad) || 1
  if (cant < 1) return
  store.vender(ventaModal.value.id, ventaForm.value)
  ventaModal.value = null
}

function cerrarVenta() {
  ventaModal.value = null
}

function abrirComprobante(item) {
  ventaComprobante.value = { ...item }
  comprobanteVisible.value = true
}

function cerrarComprobante() {
  comprobanteVisible.value = false
  ventaComprobante.value = null
}

function exportarExcel() {
  const s = configStore.simbolo

  const data = store.items.map(i => {
    const row = {
      'ID': i.id,
      'Fecha registro': i.fecha ? new Date(i.fecha).toLocaleString('es-ES') : '',
      'Nombre': i.nombre || '',
      'Tipo': i.tipo || '',
      'Material': i.material || '',
      'Peso (g)': i.peso || '',
      'Cantidad': i.cantidad || 1,
      'Proveedor': i.proveedor || '',
      'Estado': i.estado || '',
      'Origen': i.origen || '',
      'Descripción': i.descripcion || '',
    }

    row[`Precio Compra (${s})`] = i.precioCompra || 0
    row[`Total Compra (${s})`] = i.totalCompra || (i.cantidad || 1) * (i.precioCompra || 0)
    row[`Precio Venta (${s})`] = i.precioVenta || 0
    row[`Total Venta (${s})`] = i.totalVenta || (i.cantidad || 1) * (i.precioVenta || 0)

    if (i.estado === 'empeñado' && i.empeno) {
      row['Empeñado a'] = i.empeno.cliente
      row['Fecha empeño'] = i.empeno.fecha
      row['Cant. empeñada'] = i.empeno.cantidad || i.cantidad
      row[`Precio empeño (${s})`] = i.empeno.precio
    }
    if (i.estado === 'vendido' && i.venta) {
      row['Vendido a'] = i.venta.cliente
      row['Fecha venta'] = i.venta.fecha
      row['Cant. vendida'] = i.venta.cantidad || i.cantidad
      row[`Precio venta (${s})`] = i.venta.precio
    }

    return row
  })

  if (data.length === 0) {
    alert('No hay joyas para exportar')
    return
  }

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 16 }, { wch: 20 }, { wch: 24 }, { wch: 12 }, { wch: 16 },
    { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
    { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 30 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
  ]

  const totales = store.totales
  const resumen = [
    { Métrica: 'Total de registros', Valor: store.items.length },
    { Métrica: 'Unidades en stock', Valor: totales.unidades },
  ]
  resumen.push({ Métrica: `Inversión total (${s})`, Valor: totales.inversion })
  resumen.push({ Métrica: `Valor estimado de venta (${s})`, Valor: totales.valorVenta })
  resumen.push({ Métrica: `Ganancia potencial (${s})`, Valor: totales.valorVenta - totales.inversion })
  resumen.push({ Métrica: `Unidades empeñadas`, Valor: store.unidadesEmpeñadas })
  resumen.push({ Métrica: `Unidades vendidas`, Valor: store.unidadesVendidas })
  resumen.push({ Métrica: `Total vendido real (${s})`, Valor: store.totalVendidoReal })
  resumen.push({ Métrica: `Total empeñado (${s})`, Valor: store.totalEmpeñado })
  resumen.push({ Métrica: 'Moneda del sistema', Valor: configStore.nombreMoneda })
  resumen.push({ Métrica: 'Fecha de exportación', Valor: new Date().toLocaleString('es-ES') })

  const wsResumen = XLSX.utils.json_to_sheet(resumen)
  wsResumen['!cols'] = [{ wch: 34 }, { wch: 26 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  const nombreArchivo = `inventario_aurum_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}

function estadoClass(e) {
  return {
    'disponible': 'badge-green',
    'no_disponible': 'badge-red',
    'vendido': 'badge-blue',
    'empeñado': 'badge-amber',
  }[e] || 'badge-gold'
}

function estadoDot(e) {
  return {
    'disponible': 'bg-emerald-400',
    'no_disponible': 'bg-red-400',
    'vendido': 'bg-blue-400',
    'empeñado': 'bg-amber-400',
  }[e] || 'bg-gold-400'
}

function fmtMoney(n) {
  return configStore.formatMoney(n)
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const s = String(iso).slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

watch(mostrarForm, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
watch(empenoModal, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
watch(ventaModal, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Colección</p>
        <h2 class="section-title mt-1">Inventario</h2>
      </div>
      <div class="flex gap-2">
        <button @click="exportarExcel" class="btn-sky">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Excel
        </button>
        <button @click="abrirNuevo" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="icons.plus"/>
          </svg>
          Nueva Joya
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Registros</p>
        <p class="font-display text-2xl font-semibold text-ink-50 mt-1">{{ store.items.length }}</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Stock</p>
        <p class="font-display text-2xl font-semibold text-sky-300 mt-1">{{ store.totales.unidades }}</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Inversión</p>
        <p class="font-display text-2xl font-semibold text-gold-300 mt-1">{{ fmtMoney(store.totales.inversion) }}</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Empeñados</p>
        <p class="font-display text-2xl font-semibold text-amber-300 mt-1">
          {{ store.unidadesEmpeñadas }}
        </p>
        <p class="text-[10px] text-ink-500 mt-0.5">{{ store.empeñados.length }} registro(s)</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Vendidos</p>
        <p class="font-display text-2xl font-semibold text-emerald-300 mt-1">
          {{ store.unidadesVendidas }}
        </p>
        <p class="text-[10px] text-ink-500 mt-0.5">{{ store.vendidos.length }} registro(s)</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col md:flex-row gap-3">
      <div class="relative flex-1 md:max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" :d="icons.search"/>
        </svg>
        <input v-model="busqueda" class="input pl-9" placeholder="Buscar por nombre, tipo, proveedor..." />
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="f in filtros"
          :key="f"
          @click="filtro = f"
          :class="[
            'px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all',
            filtro === f
              ? 'bg-gradient-to-b from-gold-400 to-gold-500 text-ink-950 shadow-lg shadow-gold-500/20'
              : 'bg-ink-800/60 text-ink-300 border border-ink-700 hover:border-sky-500/50 hover:text-sky-300'
          ]"
        >{{ f.replace('_', ' ') }}</button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[1000px]">
          <thead class="bg-ink-800/50 border-b border-ink-700">
            <tr class="text-[11px] uppercase tracking-wider text-ink-400">
              <th class="px-4 py-3.5 text-left font-semibold">Nombre</th>
              <th class="px-4 py-3.5 text-left font-semibold">Tipo</th>
              <th class="px-4 py-3.5 text-left font-semibold">Material</th>
              <th class="px-4 py-3.5 text-right font-semibold">Peso</th>
              <th class="px-4 py-3.5 text-center font-semibold">Cant.</th>
              <th class="px-4 py-3.5 text-right font-semibold">P. Compra</th>
              <th class="px-4 py-3.5 text-right font-semibold">Total Compra</th>
              <th class="px-4 py-3.5 text-right font-semibold">P. Venta</th>
              <th class="px-4 py-3.5 text-right font-semibold">Total Venta</th>
              <th class="px-4 py-3.5 text-left font-semibold">Proveedor</th>
              <th class="px-4 py-3.5 text-center font-semibold">Estado</th>
              <th class="px-4 py-3.5 text-center font-semibold sticky right-0 bg-ink-800/95 backdrop-blur">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="itemsFiltrados.length === 0">
              <td colspan="12" class="text-center py-16 text-ink-500">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="icons.gem"/>
                </svg>
                <p>Sin joyas registradas</p>
              </td>
            </tr>
            <tr
              v-for="i in itemsFiltrados"
              :key="i.id"
              class="border-t border-ink-800/60 hover:bg-ink-800/30 transition-colors"
            >
              <td class="px-4 py-3">
                <p class="font-medium text-ink-100">{{ i.nombre }}</p>
                <p class="text-[10px] text-ink-500">{{ new Date(i.fecha).toLocaleDateString('es-ES') }}</p>

                <!-- 🆕 Info de empeño/vendido con cantidad -->
                <p v-if="i.estado === 'empeñado' && i.empeno" class="text-[10px] text-amber-400 mt-0.5">
                  🔒 {{ i.empeno.cliente }} · {{ fmtFecha(i.empeno.fecha) }} ·
                  {{ i.empeno.cantidad || i.cantidad }} {{ (i.empeno.cantidad || i.cantidad) === 1 ? 'unidad' : 'unidades' }} ·
                  {{ fmtMoney(i.empeno.precio) }}
                </p>
                <p v-if="i.estado === 'vendido' && i.venta" class="text-[10px] text-emerald-400 mt-0.5">
                  🛒 {{ i.venta.cliente }} · {{ fmtFecha(i.venta.fecha) }} ·
                  {{ i.venta.cantidad || i.cantidad }} {{ (i.venta.cantidad || i.cantidad) === 1 ? 'unidad' : 'unidades' }} ·
                  {{ fmtMoney(i.venta.precio) }}
                </p>
              </td>
              <td class="px-4 py-3 text-ink-300 capitalize">{{ i.tipo }}</td>
              <td class="px-4 py-3 text-ink-300 capitalize">{{ i.material }}</td>
              <td class="px-4 py-3 text-right text-ink-300">{{ i.peso ? i.peso + ' g' : '—' }}</td>
              <td class="px-4 py-3 text-center">
                <span class="badge-sky">{{ i.cantidad || 1 }}</span>
              </td>
              <td class="px-4 py-3 text-right text-ink-200">{{ fmtMoney(i.precioCompra) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-gold-300">
                {{ fmtMoney(i.totalCompra || (i.cantidad || 1) * (i.precioCompra || 0)) }}
              </td>
              <td class="px-4 py-3 text-right text-ink-200">{{ i.precioVenta ? fmtMoney(i.precioVenta) : '—' }}</td>
              <td class="px-4 py-3 text-right font-semibold text-emerald-300">
                {{ i.precioVenta ? fmtMoney(i.totalVenta || (i.cantidad || 1) * (i.precioVenta || 0)) : '—' }}
              </td>
              <td class="px-4 py-3 text-ink-300">{{ i.proveedor || '—' }}</td>

              <td class="px-4 py-3 text-center">
                <span :class="estadoClass(i.estado)">
                  <span :class="['w-1.5 h-1.5 rounded-full', estadoDot(i.estado)]"></span>
                  {{ i.estado?.replace('_', ' ') }}
                </span>
              </td>

              <td class="px-4 py-3 text-center sticky right-0 bg-ink-900/95 backdrop-blur">
                <div class="inline-flex gap-1">
                  <button
                    v-if="i.estado === 'vendido' && i.venta"
                    @click="abrirComprobante(i)"
                    class="p-2 rounded-lg text-ink-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
                    title="Imprimir comprobante"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                  </button>
                  <button
                    @click="abrirEditar(i)"
                    class="p-2 rounded-lg text-ink-400 hover:text-sky-300 hover:bg-sky-500/10 transition"
                    title="Editar"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="store.eliminar(i.id)"
                    class="p-2 rounded-lg text-ink-400 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Eliminar"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" :d="icons.trash"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== MODAL FORMULARIO JOYA ==================== -->
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
              <h3 class="font-display text-xl font-semibold text-gold-200">
                {{ editandoId ? 'Editar joya' : 'Nueva joya' }}
              </h3>
            </div>
            <button @click="cerrarForm" class="p-2 rounded-lg text-ink-400 hover:text-gold-400 hover:bg-ink-800 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="icons.close"/>
              </svg>
            </button>
          </div>

          <div class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="md:col-span-2 lg:col-span-3">
              <label class="label">Nombre *</label>
              <input v-model="form.nombre" class="input" placeholder="Ej: Anillo solitario oro 18k" />
            </div>

            <div>
              <label class="label">Tipo</label>
              <select v-model="form.tipo" class="input">
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
              <label class="label">Peso (g)</label>
              <input v-model="form.peso" type="number" step="0.01" class="input" placeholder="0.00" />
            </div>

            <div>
              <label class="label">Cantidad *</label>
              <input v-model="form.cantidad" type="number" min="1" class="input" placeholder="1" />
            </div>

            <div>
              <label class="label">Precio Compra (unit.) *</label>
              <input v-model="form.precioCompra" type="number" class="input" placeholder="0" />
            </div>

            <div>
              <label class="label">Precio Venta (unit.)</label>
              <input v-model="form.precioVenta" type="number" class="input" placeholder="0" />
            </div>

            <div>
              <label class="label">Proveedor</label>
              <input v-model="form.proveedor" class="input" placeholder="Nombre del proveedor" />
            </div>

            <div v-if="editandoId">
              <label class="label">Estado</label>
              <select v-model="form.estado" class="input">
                <option v-for="e in estados" :key="e" :value="e">{{ e.replace('_', ' ') }}</option>
              </select>
              <p class="text-[10px] text-ink-500 mt-1">
                Si eliges <strong>empeñado</strong> o <strong>vendido</strong>, se abrirá un formulario adicional.
              </p>
            </div>

            <div class="md:col-span-2 lg:col-span-2">
              <label class="label">Descripción (opcional)</label>
              <input v-model="form.descripcion" class="input" placeholder="Detalles adicionales" />
            </div>

            <div class="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div class="rounded-xl p-4 bg-gold-500/5 border border-gold-500/25">
                <p class="text-[10px] uppercase tracking-wider text-gold-400/80 mb-1">Total Compra</p>
                <p class="font-display text-2xl font-semibold text-gold-300">{{ fmtMoney(totalCompraForm) }}</p>
              </div>
              <div class="rounded-xl p-4 bg-sky-500/5 border border-sky-500/25">
                <p class="text-[10px] uppercase tracking-wider text-sky-400/80 mb-1">Total Venta</p>
                <p class="font-display text-2xl font-semibold text-sky-300">{{ fmtMoney(totalVentaForm) }}</p>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 bg-ink-900/95 backdrop-blur border-t border-ink-800 px-5 py-4 flex gap-2 justify-end">
            <button @click="cerrarForm" class="btn-secondary">Cancelar</button>
            <button @click="guardar" class="btn-primary">
              {{ editandoId ? 'Guardar cambios' : 'Registrar joya' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== MODAL EMPEÑO ==================== -->
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="empenoModal"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="cerrarEmpeno"
      >
        <div class="bg-ink-900 border border-ink-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up">
          <div class="px-5 py-4 border-b border-ink-800 flex items-center justify-between">
            <div>
              <p class="eyebrow">Empeñar</p>
              <h3 class="font-display text-xl font-semibold text-amber-200">Registrar empeño</h3>
            </div>
            <button @click="cerrarEmpeno" class="p-2 rounded-lg text-ink-400 hover:text-amber-400 hover:bg-amber-500/10 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="icons.close"/>
              </svg>
            </button>
          </div>

          <div class="p-5 space-y-4">
            <div class="rounded-xl p-3 bg-ink-800/60 border border-ink-700">
              <p class="text-[10px] uppercase tracking-wider text-ink-500 mb-1">Joya</p>
              <p class="font-medium text-ink-100">{{ empenoModal.nombre }}</p>
              <p class="text-xs text-ink-400 capitalize">{{ empenoModal.tipo }} · {{ empenoModal.material }}</p>
              <p class="text-xs text-sky-400 mt-1">
                Stock disponible: <strong>{{ empenoModal.cantidad }}</strong> {{ empenoModal.cantidad === 1 ? 'unidad' : 'unidades' }}
              </p>
            </div>

            <div>
              <label class="label">Cantidad a empeñar *</label>
              <input
                v-model="empenoForm.cantidad"
                type="number"
                min="1"
                :max="empenoModal.cantidad"
                class="input"
                placeholder="1"
              />
              <p v-if="Number(empenoForm.cantidad) > empenoModal.cantidad" class="text-[10px] text-red-400 mt-1">
                ⚠️ No puedes empeñar más de {{ empenoModal.cantidad }} unidades
              </p>
              <div class="flex gap-1 mt-2">
                <button
                  type="button"
                  @click="empenoForm.cantidad = 1"
                  class="text-[10px] px-2 py-1 rounded-lg bg-ink-800 text-ink-300 border border-ink-700 hover:bg-ink-700 transition"
                >1</button>
                <button
                  v-if="empenoModal.cantidad > 1"
                  type="button"
                  @click="empenoForm.cantidad = empenoModal.cantidad"
                  class="text-[10px] px-2 py-1 rounded-lg bg-ink-800 text-ink-300 border border-ink-700 hover:bg-ink-700 transition"
                >Todo ({{ empenoModal.cantidad }})</button>
              </div>
            </div>

            <div>
                <label class="label">Cliente *</label>
                <ClienteAutocomplete
                v-model="empenoForm.cliente"
                placeholder="Nombre de quien empeña"
                />
            </div>

            <div>
              <label class="label">Fecha de empeño</label>
              <input v-model="empenoForm.fecha" type="date" class="input" />
            </div>

            <div>
              <label class="label">Precio unitario del empeño *</label>
              <input v-model="empenoForm.precio" type="number" class="input" placeholder="0" />
            </div>

            <!-- 🧮 Total -->
            <div class="rounded-xl p-3 bg-amber-500/5 border border-amber-500/25">
              <div class="flex justify-between items-center">
                <p class="text-[10px] uppercase tracking-wider text-amber-400/80">Total empeño</p>
                <p class="font-display text-xl font-bold text-amber-300">
                  {{ fmtMoney(empenoTotal) }}
                </p>
              </div>
              <p class="text-[10px] text-ink-500 mt-1">
                {{ empenoForm.cantidad }} × {{ fmtMoney(empenoForm.precio) }}
              </p>
            </div>
          </div>

          <div class="px-5 py-4 border-t border-ink-800 flex gap-2 justify-end">
            <button @click="cerrarEmpeno" class="btn-secondary">Cancelar</button>
            <button
              @click="guardarEmpeno"
              :disabled="!empenoForm.cliente || !empenoForm.precio || Number(empenoForm.cantidad) > empenoModal.cantidad || Number(empenoForm.cantidad) < 1"
              class="btn-primary"
            >
              Guardar empeño
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== MODAL VENTA ==================== -->
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="ventaModal"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="cerrarVenta"
      >
        <div class="bg-ink-900 border border-ink-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up">
          <div class="px-5 py-4 border-b border-ink-800 flex items-center justify-between">
            <div>
              <p class="eyebrow">Vender</p>
              <h3 class="font-display text-xl font-semibold text-emerald-200">Registrar venta</h3>
            </div>
            <button @click="cerrarVenta" class="p-2 rounded-lg text-ink-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="icons.close"/>
              </svg>
            </button>
          </div>

          <div class="p-5 space-y-4">
            <div class="rounded-xl p-3 bg-ink-800/60 border border-ink-700">
              <p class="text-[10px] uppercase tracking-wider text-ink-500 mb-1">Joya</p>
              <p class="font-medium text-ink-100">{{ ventaModal.nombre }}</p>
              <p class="text-xs text-ink-400 capitalize">{{ ventaModal.tipo }} · {{ ventaModal.material }}</p>
              <p class="text-xs text-sky-400 mt-1">
                Stock disponible: <strong>{{ ventaModal.cantidad }}</strong> {{ ventaModal.cantidad === 1 ? 'unidad' : 'unidades' }}
              </p>
              <p v-if="ventaModal.precioVenta" class="text-xs text-emerald-400 mt-1">
                Precio sugerido: {{ fmtMoney(ventaModal.precioVenta) }}
              </p>
            </div>

            <div>
              <label class="label">Cantidad a vender *</label>
              <input
                v-model="ventaForm.cantidad"
                type="number"
                min="1"
                :max="ventaModal.cantidad"
                class="input"
                placeholder="1"
              />
              <p v-if="Number(ventaForm.cantidad) > ventaModal.cantidad" class="text-[10px] text-red-400 mt-1">
                ⚠️ No puedes vender más de {{ ventaModal.cantidad }} unidades
              </p>
              <div class="flex gap-1 mt-2">
                <button
                  type="button"
                  @click="ventaForm.cantidad = 1"
                  class="text-[10px] px-2 py-1 rounded-lg bg-ink-800 text-ink-300 border border-ink-700 hover:bg-ink-700 transition"
                >1</button>
                <button
                  v-if="ventaModal.cantidad > 1"
                  type="button"
                  @click="ventaForm.cantidad = ventaModal.cantidad"
                  class="text-[10px] px-2 py-1 rounded-lg bg-ink-800 text-ink-300 border border-ink-700 hover:bg-ink-700 transition"
                >Todo ({{ ventaModal.cantidad }})</button>
              </div>
            </div>

            <div>
                <label class="label">Cliente *</label>
                <ClienteAutocomplete
                  v-model="ventaForm.cliente"
                  placeholder="Nombre del comprador"
                />
            </div>

            <div>
              <label class="label">Fecha de venta</label>
              <input v-model="ventaForm.fecha" type="date" class="input" />
            </div>

            <div>
              <label class="label">Precio unitario de venta *</label>
              <input v-model="ventaForm.precio" type="number" class="input" placeholder="0" />
              <div v-if="ventaModal.precioVenta" class="flex gap-1 mt-2">
                <button
                  type="button"
                  @click="ventaForm.precio = ventaModal.precioVenta"
                  class="text-[10px] px-2 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition"
                >
                  Usar sugerido ({{ fmtMoney(ventaModal.precioVenta) }})
                </button>
              </div>
            </div>

            <!-- 🧮 Total -->
            <div class="rounded-xl p-3 bg-emerald-500/5 border border-emerald-500/25">
              <div class="flex justify-between items-center">
                <p class="text-[10px] uppercase tracking-wider text-emerald-400/80">Total venta</p>
                <p class="font-display text-xl font-bold text-emerald-300">
                  {{ fmtMoney(ventaTotal) }}
                </p>
              </div>
              <p class="text-[10px] text-ink-500 mt-1">
                {{ ventaForm.cantidad }} × {{ fmtMoney(ventaForm.precio) }}
              </p>
            </div>
          </div>

          <div class="px-5 py-4 border-t border-ink-800 flex gap-2 justify-end">
            <button @click="cerrarVenta" class="btn-secondary">Cancelar</button>
            <button
              @click="guardarVenta"
              :disabled="!ventaForm.cliente || !ventaForm.precio || Number(ventaForm.cantidad) > ventaModal.cantidad || Number(ventaForm.cantidad) < 1"
              class="btn-primary"
            >
              Guardar venta
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 🧾 Comprobante de venta -->
    <ComprobanteVenta
      :venta="ventaComprobante"
      :visible="comprobanteVisible"
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