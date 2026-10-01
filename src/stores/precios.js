import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

const STORAGE_KEY = 'joyeria_precios_metales'

const METALES_BASE = [
  { id: 'oro24',    nombre: 'Oro 24k',        unidad: 'g', color: 'gold',     precio: 0 },
  { id: 'oro18',    nombre: 'Oro 18k',        unidad: 'g', color: 'gold',     precio: 0 },
  { id: 'oro14',    nombre: 'Oro 14k',        unidad: 'g', color: 'gold',     precio: 0 },
  { id: 'oro10',    nombre: 'Oro 10k',        unidad: 'g', color: 'gold',     precio: 0 },
  { id: 'plata925', nombre: 'Plata 925',      unidad: 'g', color: 'silver',   precio: 0 },
  { id: 'platino',  nombre: 'Platino',        unidad: 'g', color: 'sky',      precio: 0 },
  { id: 'paladio',  nombre: 'Paladio',        unidad: 'g', color: 'sky',      precio: 0 },
  { id: 'cobre',    nombre: 'Cobre',          unidad: 'g', color: 'orange',   precio: 0 },
]

const HISTORIAL_KEY = 'joyeria_precios_historial'

export const usePreciosStore = defineStore('precios', () => {
  // Metales con su precio actual
  const metales = ref(
    JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || METALES_BASE
  )

  // Historial de cambios (para gráficos)
  const historial = ref(
    JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]')
  )

  watch(metales, (v) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  }, { deep: true })

  watch(historial, (v) => {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(v))
  }, { deep: true })

  // 💾 Actualizar precio de un metal
  function actualizarPrecio(id, nuevoPrecio) {
    const idx = metales.value.findIndex(m => m.id === id)
    if (idx === -1) return
    const anterior = metales.value[idx].precio
    metales.value[idx].precio = Number(nuevoPrecio) || 0
    metales.value[idx].fechaActualizacion = new Date().toISOString()

    // Registrar en historial
    historial.value.push({
      metalId: id,
      precioAnterior: anterior,
      precioNuevo: metales.value[idx].precio,
      fecha: new Date().toISOString(),
    })

    // Limitar historial a 500 entradas
    if (historial.value.length > 500) {
      historial.value = historial.value.slice(-500)
    }
  }

  // 💾 Actualización masiva
  function actualizarTodos(precios) {
    Object.entries(precios).forEach(([id, precio]) => {
      const idx = metales.value.findIndex(m => m.id === id)
      if (idx !== -1) {
        const anterior = metales.value[idx].precio
        metales.value[idx].precio = Number(precio) || 0
        metales.value[idx].fechaActualizacion = new Date().toISOString()

        if (anterior !== metales.value[idx].precio) {
          historial.value.push({
            metalId: id,
            precioAnterior: anterior,
            precioNuevo: metales.value[idx].precio,
            fecha: new Date().toISOString(),
          })
        }
      }
    })
  }

  // 🔄 Resetear precios a 0
  function resetear() {
    metales.value = metales.value.map(m => ({ ...m, precio: 0, fechaActualizacion: null }))
  }

  // 📊 Historial por metal
  function historialDe(id) {
    return historial.value
      .filter(h => h.metalId === id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }

  // 🕒 Última actualización global
  const ultimaActualizacion = computed(() => {
    const fechas = metales.value
      .map(m => m.fechaActualizacion)
      .filter(Boolean)
      .map(f => new Date(f).getTime())
    if (fechas.length === 0) return null
    return new Date(Math.max(...fechas)).toISOString()
  })

  // 🎯 Metal destacado (oro 18k por defecto)
  const oro18 = computed(() => metales.value.find(m => m.id === 'oro18'))

  return {
    metales,
    historial,
    actualizarPrecio,
    actualizarTodos,
    resetear,
    historialDe,
    ultimaActualizacion,
    oro18,
  }
})