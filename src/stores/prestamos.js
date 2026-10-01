import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

const STORAGE_KEY = 'joyeria_prestamos'

export const usePrestamosStore = defineStore('prestamos', () => {
  const prestamos = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  watch(prestamos, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function crear(prestamo) {
    prestamos.value.push({
      id: Date.now(),
      fechaInicio: new Date().toISOString(),
      estado: 'activo',
      pagos: [],
      ...prestamo,
    })
  }

  function actualizar(id, datos) {
    const idx = prestamos.value.findIndex(p => p.id === id)
    if (idx === -1) return
    prestamos.value[idx] = { ...prestamos.value[idx], ...datos }
  }

  // 🆕 Cambiar estado manualmente
  function actualizarEstado(id, nuevoEstado) {
    const p = prestamos.value.find(p => p.id === id)
    if (!p) return
    p.estado = nuevoEstado
    p.fechaCambioEstado = new Date().toISOString()
  }

  function registrarPago(id, monto) {
    const p = prestamos.value.find(p => p.id === id)
    if (p) {
      p.pagos.push({ fecha: new Date().toISOString(), monto: Number(monto) })
      const totalPagado = p.pagos.reduce((s, x) => s + x.monto, 0)
      if (totalPagado >= p.montoTotal) p.estado = 'pagado'
    }
  }

  function eliminar(id) {
    prestamos.value = prestamos.value.filter(p => p.id !== id)
  }

  const totalPrestado = computed(() =>
    prestamos.value
      .filter(p => p.estado === 'activo')
      .reduce((s, p) => s + Number(p.montoPrincipal || 0), 0)
  )

  const totalIntereses = computed(() =>
    prestamos.value.reduce((s, p) => {
      const pagado = p.pagos?.reduce((a, x) => a + x.monto, 0) || 0
      return s + Math.max(0, pagado - Number(p.montoPrincipal || 0))
    }, 0)
  )

  return {
    prestamos,
    crear,
    actualizar,
    actualizarEstado,
    registrarPago,
    eliminar,
    totalPrestado,
    totalIntereses,
  }
})