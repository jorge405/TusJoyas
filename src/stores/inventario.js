import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

const STORAGE_KEY = 'joyeria_inventario'

export const useInventarioStore = defineStore('inventario', () => {
  const items = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  watch(items, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function agregar(item) {
    const cantidad = Number(item.cantidad) || 1
    const precioCompra = Number(item.precioCompra) || 0
    const precioVenta = Number(item.precioVenta) || 0
    items.value.push({
      id: Date.now(),
      fecha: new Date().toISOString(),
      ...item,
      cantidad,
      precioCompra,
      precioVenta,
      totalCompra: cantidad * precioCompra,
      totalVenta: cantidad * precioVenta,
    })
  }

  function actualizar(id, datos) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      const cantidad = Number(datos.cantidad) || 1
      const precioCompra = Number(datos.precioCompra) || 0
      const precioVenta = Number(datos.precioVenta) || 0
      items.value[idx] = {
        ...items.value[idx],
        ...datos,
        cantidad,
        precioCompra,
        precioVenta,
        totalCompra: cantidad * precioCompra,
        totalVenta: cantidad * precioVenta,
      }
    }
  }

  function eliminar(id) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function vender(id, precioVenta, clienteId) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.estado = 'vendido'
      item.precioVenta = precioVenta
      item.clienteId = clienteId
      item.fechaVenta = new Date().toISOString()
    }
  }

  function toggleDisponible(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    if (item.estado === 'disponible') {
      item.estado = 'no_disponible'
    } else if (item.estado === 'no_disponible') {
      item.estado = 'disponible'
    }
  }

  const totales = computed(() => {
    const activos = items.value.filter(i => i.estado === 'disponible')
    return {
      unidades: activos.reduce((s, i) => s + (Number(i.cantidad) || 0), 0),
      inversion: activos.reduce((s, i) => s + (Number(i.totalCompra) || 0), 0),
      valorVenta: activos.reduce((s, i) => s + (Number(i.totalVenta) || 0), 0),
    }
  })

  return { items, agregar, actualizar, eliminar, vender, toggleDisponible, totales }
})