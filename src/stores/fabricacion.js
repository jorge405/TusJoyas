import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'joyeria_fabricacion'

export const useFabricacionStore = defineStore('fabricacion', () => {
  const ordenes = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  watch(ordenes, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function crear(orden) {
    ordenes.value.push({
      id: Date.now(),
      fecha: new Date().toISOString(),
      estado: 'pendiente',
      ...orden,
    })
  }

  function actualizar(id, datos) {
    const idx = ordenes.value.findIndex(o => o.id === id)
    if (idx === -1) return
    ordenes.value[idx] = { ...ordenes.value[idx], ...datos }
  }

  function actualizarEstado(id, nuevoEstado) {
    const o = ordenes.value.find(o => o.id === id)
    if (!o) return
    o.estado = nuevoEstado
    o.fechaCambioEstado = new Date().toISOString()
    if (nuevoEstado === 'entregado') o.fechaEntregaReal = new Date().toISOString()
  }

  function eliminar(id) {
    ordenes.value = ordenes.value.filter(o => o.id !== id)
  }

  return { ordenes, crear, actualizar, actualizarEstado, eliminar }
})