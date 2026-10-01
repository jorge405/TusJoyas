import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'joyeria_clientes'

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  watch(clientes, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function agregar(cliente) {
    clientes.value.push({ id: Date.now(), fechaRegistro: new Date().toISOString(), ...cliente })
  }

  function eliminar(id) {
    clientes.value = clientes.value.filter(c => c.id !== id)
  }

  return { clientes, agregar, eliminar }
})