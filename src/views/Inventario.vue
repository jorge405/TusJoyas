<script setup>
import { ref, computed, watch } from 'vue'
import * as XLSX from 'xlsx'
import { useInventarioStore } from '../stores/inventario'
import { useConfigStore } from '../stores/config'
import { icons } from '../components/icons'

const store = useInventarioStore()
const configStore = useConfigStore()

const mostrarForm = ref(false)
const editandoId = ref(null)
const filtro = ref('todos')
const busqueda = ref('')

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

  const payload = {
    ...form.value,
    cantidad: Number(form.value.cantidad) || 1,
    precioCompra: Number(form.value.precioCompra) || 0,
    precioVenta: Number(form.value.precioVenta) || 0,
    peso: form.value.peso === '' ? '' : Number(form.value.peso),
  }

  if (editandoId.value) {
    store.actualizar(editandoId.value, payload)
  } else {
    store.agregar({ ...payload, origen: 'compra' })
  }
  cerrarForm()
}

function exportarExcel() {
  // 🎯 Pre-calcular el símbolo (evita template literals en nombres de propiedades)
  const s = configStore.simbolo

  const data = store.items.map(i => {
    // Construimos el objeto con computed property names válidos
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

    // Añadimos las columnas de dinero por separado
    row[`Precio Compra (${s})`] = i.precioCompra || 0
    row[`Total Compra (${s})`] = i.totalCompra || (i.cantidad || 1) * (i.precioCompra || 0)
    row[`Precio Venta (${s})`] = i.precioVenta || 0
    row[`Total Venta (${s})`] = i.totalVenta || (i.cantidad || 1) * (i.precioVenta || 0)

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
  ]

  const totales = store.totales
  const resumen = [
    { Métrica: 'Total de registros', Valor: store.items.length },
    { Métrica: 'Unidades en stock', Valor: totales.unidades },
  ]
  resumen.push({ Métrica: `Inversión total (${s})`, Valor: totales.inversion })
  resumen.push({ Métrica: `Valor estimado de venta (${s})`, Valor: totales.valorVenta })
  resumen.push({ Métrica: `Ganancia potencial (${s})`, Valor: totales.valorVenta - totales.inversion })
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

watch(mostrarForm, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <div class="space-y-6">
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

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Registros</p>
        <p class="font-display text-2xl font-semibold text-ink-50 mt-1">{{ store.items.length }}</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Unidades en stock</p>
        <p class="font-display text-2xl font-semibold text-sky-300 mt-1">{{ store.totales.unidades }}</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Inversión</p>
        <p class="font-display text-2xl font-semibold text-gold-300 mt-1">{{ fmtMoney(store.totales.inversion) }}</p>
      </div>
      <div class="card-hover">
        <p class="text-[10px] uppercase tracking-wider text-ink-400">Valor venta</p>
        <p class="font-display text-2xl font-semibold text-emerald-300 mt-1">{{ fmtMoney(store.totales.valorVenta) }}</p>
      </div>
    </div>

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
                <button
                  @click="store.toggleDisponible(i.id)"
                  :class="[
                    'badge cursor-pointer transition-all hover:scale-105',
                    estadoClass(i.estado),
                    (i.estado === 'vendido' || i.estado === 'empeñado') ? 'cursor-not-allowed opacity-80 hover:scale-100' : ''
                  ]"
                  :title="i.estado === 'disponible' ? 'Clic para marcar no disponible' : i.estado === 'no_disponible' ? 'Clic para marcar disponible' : i.estado"
                  :disabled="i.estado === 'vendido' || i.estado === 'empeñado'"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', estadoDot(i.estado)]"></span>
                  {{ i.estado?.replace('_', ' ') }}
                </button>
              </td>
              <td class="px-4 py-3 text-center sticky right-0 bg-ink-900/95 backdrop-blur">
                <div class="inline-flex gap-1">
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

    <!-- Modal -->
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
            </div>

            <div class="md:col-span-2 lg:col-span-2">
              <label class="label">Descripción (opcional)</label>
              <input v-model="form.descripcion" class="input" placeholder="Detalles adicionales" />
            </div>

            <div class="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div class="rounded-xl p-4 bg-gold-500/5 border border-gold-500/25">
                <p class="text-[10px] uppercase tracking-wider text-gold-400/80 mb-1">Total Compra</p>
                <p class="font-display text-2xl font-semibold text-gold-300">{{ fmtMoney(totalCompraForm) }}</p>
                <p class="text-[10px] text-ink-500 mt-0.5">
                  {{ form.cantidad || 0 }} × {{ fmtMoney(form.precioCompra) }}
                </p>
              </div>
              <div class="rounded-xl p-4 bg-sky-500/5 border border-sky-500/25">
                <p class="text-[10px] uppercase tracking-wider text-sky-400/80 mb-1">Total Venta</p>
                <p class="font-display text-2xl font-semibold text-sky-300">{{ fmtMoney(totalVentaForm) }}</p>
                <p class="text-[10px] text-ink-500 mt-0.5">
                  {{ form.cantidad || 0 }} × {{ fmtMoney(form.precioVenta) }}
                </p>
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