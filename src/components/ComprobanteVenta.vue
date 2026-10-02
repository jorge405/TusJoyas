<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useConfigStore } from '../stores/config'

const props = defineProps({
  venta: { type: Object, default: null },
  visible: { type: Boolean, default: false },
  autoPrint: { type: Boolean, default: false },
})

const emit = defineEmits(['cerrar'])

const configStore = useConfigStore()
const ancho = ref('58')
const imprimiendo = ref(false)

const v = computed(() => props.venta || {})
const ventaData = computed(() => v.value.venta || {})

function fmtFecha(iso) {
  if (!iso) return '—'
  const s = String(iso).slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function fmtFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${h}:${min}`
}

function fmtMoney(n) {
  const num = Number(n) || 0
  return `${configStore.simbolo} ${num.toLocaleString('es-BO')}`
}

const folio = computed(() => `V-${String(v.value.id || 0).slice(-6)}`)

const numeroRecibo = computed(() => {
  const id = v.value.id || 0
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${fecha}-${String(id).slice(-4)}`
})

const ganancia = computed(() => {
  const compra = Number(v.value.totalCompra || 0)
  const venta = Number(ventaData.value.precio || 0)
  return venta - compra
})

function imprimir() {
  imprimiendo.value = true
  setTimeout(() => {
    window.print()
    setTimeout(() => { imprimiendo.value = false }, 500)
  }, 100)
}

function cerrar() {
  emit('cerrar')
}

watch(() => props.visible, async (vv) => {
  if (vv && props.autoPrint) {
    await nextTick()
    setTimeout(() => window.print(), 400)
  }
})
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible && venta"
        class="comprobante-overlay fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        @click.self="cerrar"
      >
        <div class="comprobante-wrapper w-full max-w-2xl h-[92vh] max-h-[820px] flex flex-col bg-ink-900 border border-ink-800 rounded-2xl shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="no-print px-4 sm:px-5 py-3 border-b border-ink-800 flex items-center justify-between shrink-0">
            <div>
              <p class="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80 font-semibold">Comprobante</p>
              <h3 class="font-display text-lg font-semibold text-gold-200">Boleta de venta</h3>
            </div>
            <button @click="cerrar" class="p-2 rounded-lg text-ink-400 hover:text-red-400 hover:bg-red-500/10 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Ticket -->
          <div class="comprobante-scroll flex-1 overflow-y-auto bg-ink-950 px-3 sm:px-5 py-4">
            <div
              :class="[
                'comprobante-ticket bg-white text-black font-mono mx-auto shadow-xl',
                ancho === '58' ? 'ticket-58' : 'ticket-80'
              ]"
            >
              <!-- Encabezado -->
              <div class="text-center mb-2">
                <div class="text-lg font-bold tracking-wider">{{ configStore.config.nombreNegocio.toUpperCase() }}</div>
                <div class="text-[10px]">JOYERÍA · VENTAS</div>
                <div class="text-[10px]">Tel: ____________</div>
              </div>

              <div class="separator"></div>

              <div class="text-center mb-2">
                <div class="text-sm font-bold">BOLETA DE VENTA</div>
                <div class="text-[10px]">Nº {{ numeroRecibo }}</div>
                <div class="text-[10px]">Folio: {{ folio }}</div>
              </div>

              <div class="separator"></div>

              <div class="row">
                <span>Fecha emisión:</span>
                <span>{{ fmtFechaHora(new Date().toISOString()) }}</span>
              </div>
              <div class="row">
                <span>Fecha de venta:</span>
                <span class="font-bold">{{ fmtFecha(ventaData.fecha) }}</span>
              </div>

              <div class="separator"></div>

              <div class="text-center text-[10px] mb-1">— DATOS DEL CLIENTE —</div>
              <div class="row">
                <span>Cliente:</span>
                <span class="text-right font-bold break-words ml-2">{{ ventaData.cliente || '—' }}</span>
              </div>

              <div class="separator"></div>

              <div class="text-center text-[10px] mb-1">— DETALLES DE LA JOYA —</div>
              <div class="row">
                <span>Producto:</span>
                <span class="text-right ml-2">{{ venta.nombre }}</span>
              </div>
              <div class="row">
                <span>Tipo:</span>
                <span class="text-right ml-2 capitalize">{{ venta.tipo }}</span>
              </div>
              <div class="row">
                <span>Material:</span>
                <span class="text-right ml-2 capitalize">{{ venta.material }}</span>
              </div>
              <div v-if="venta.peso" class="row">
                <span>Peso:</span>
                <span>{{ venta.peso }} g</span>
              </div>
              <div class="row">
                <span>Cantidad:</span>
                <span>{{ venta.cantidad || 1 }}</span>
              </div>

              <div class="separator"></div>

              <div class="text-center text-[10px] mb-1">— DETALLES DE LA VENTA —</div>
              <div class="row">
                <span>Precio unitario:</span>
                <span>{{ fmtMoney(ventaData.precioUnitario || ventaData.precio) }}</span>
              </div>
              <div class="row">
                <span>Cantidad:</span>
                <span>x {{ ventaData.cantidad || venta.cantidad || 1 }}</span>
              </div>

              <div class="separator-dashed"></div>

              <div class="row text-base font-bold">
                <span>TOTAL A PAGAR:</span>
                <span>{{ fmtMoney(ventaData.precio) }}</span>
              </div>

              <div class="separator"></div>

              <div class="text-[9px] leading-tight mb-2">
                <div class="text-center font-bold mb-1">CONDICIONES</div>
                <p>1. Esta boleta es comprobante de su compra.</p>
                <p>2. Las joyas vendidas tienen garantía por defecto de fábrica.</p>
                <p>3. Conserve este documento para cualquier reclamo.</p>
              </div>

              <div class="separator"></div>

              <div class="mt-4 mb-2">
                <div class="firma-line"></div>
                <div class="text-center text-[10px] mt-1">Firma del vendedor</div>
              </div>

              <div class="mt-4 mb-2">
                <div class="firma-line"></div>
                <div class="text-center text-[10px] mt-1">Firma del cliente</div>
              </div>

              <div class="separator"></div>

              <div class="text-center text-[9px] mt-2">
                <div>*** GRACIAS POR SU COMPRA ***</div>
                <div class="mt-1">Conserve este recibo</div>
                <div class="mt-1">{{ new Date().toLocaleString('es-BO') }}</div>
              </div>

              <div style="height: 8mm;"></div>
            </div>
          </div>

          <!-- Footer -->
          <div class="no-print px-4 sm:px-5 py-3 border-t border-ink-800 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-ink-900/95 backdrop-blur">
            <div class="flex items-center gap-2">
              <span class="text-[11px] uppercase tracking-wider text-ink-400">Tamaño:</span>
              <div class="flex gap-1">
                <button
                  @click="ancho = '58'"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                    ancho === '58'
                      ? 'bg-gold-500 text-ink-950 shadow-lg shadow-gold-500/20'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700 border border-ink-700'
                  ]"
                >58 mm</button>
                <button
                  @click="ancho = '80'"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                    ancho === '80'
                      ? 'bg-gold-500 text-ink-950 shadow-lg shadow-gold-500/20'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700 border border-ink-700'
                  ]"
                >80 mm</button>
              </div>
            </div>

            <div class="flex gap-2">
              <button @click="cerrar" class="btn-secondary text-sm">Cerrar</button>
              <button
                @click="imprimir"
                class="btn-primary text-sm"
                :disabled="imprimiendo"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                {{ imprimiendo ? 'Imprimiendo...' : 'Imprimir' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.comprobante-ticket {
  padding: 5mm 3.5mm;
  line-height: 1.3;
  font-size: 11px;
  letter-spacing: 0.02em;
  border: 1px solid #d0d0d0;
  background: #ffffff;
  color: #000000;
}

.ticket-58 { width: 58mm; min-height: 90mm; }
.ticket-80 { width: 80mm; min-height: 90mm; }

.text-center { text-align: center; }
.text-right { text-align: right; }
.font-bold { font-weight: 700; }
.font-mono { font-family: 'Courier New', 'Consolas', monospace; }
.break-words { word-break: break-word; }

.row {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin: 1px 0;
  align-items: baseline;
}
.row > span:first-child { flex-shrink: 0; }
.row > span:last-child { text-align: right; }

.separator { border-top: 1px dashed #000; margin: 3px 0; }
.separator-dashed { border-top: 2px solid #000; margin: 3px 0; }
.firma-line { border-top: 1px solid #000; width: 80%; margin: 0 auto; }

@media print {
  :global(body > *:not(.comprobante-overlay)) {
    display: none !important;
  }

  :global(html),
  :global(body) {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  :global(.comprobante-overlay) {
    position: static !important;
    inset: auto !important;
    display: block !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
    backdrop-filter: none !important;
    z-index: auto !important;
  }

  :global(.comprobante-wrapper) {
    position: static !important;
    display: block !important;
    width: auto !important;
    max-width: none !important;
    height: auto !important;
    max-height: none !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  :global(.comprobante-scroll) {
    position: static !important;
    display: block !important;
    height: auto !important;
    max-height: none !important;
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
  }

  .comprobante-ticket {
    display: block !important;
    width: auto !important;
    max-width: none !important;
    min-height: 0 !important;
    height: auto !important;
    margin: 0 auto !important;
    padding: 2mm 2mm !important;
    background: #fff !important;
    color: #000 !important;
    border: none !important;
    box-shadow: none !important;
    font-size: 10pt !important;
    line-height: 1.25 !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-before: avoid !important;
  }

  .ticket-58 { width: 58mm !important; max-width: 58mm !important; }
  .ticket-80 { width: 80mm !important; max-width: 80mm !important; }

  .comprobante-ticket > * {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  :global(.no-print) {
    display: none !important;
  }

  @page {
    margin: 0;
    size: auto;
  }
}
</style>