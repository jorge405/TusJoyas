import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'joyeria_config'

const DEFAULTS = {
  moneda: 'BOB',
  simboloMoneda: 'Bs',
  nombreNegocio: 'Aurum Joyas',
  tasaInteresDefault: 10,
  plazoDiasDefault: 30,
}

export const useConfigStore = defineStore('config', () => {
  const config = ref({
    ...DEFAULTS,
    ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  })

  watch(config, (v) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  }, { deep: true })

  const simbolos = { BOB: 'Bs', USD: '$' }

  const monedaActual = computed(() => config.value.moneda)
  const simbolo = computed(() => simbolos[config.value.moneda] || 'Bs')
  const nombreMoneda = computed(() =>
    config.value.moneda === 'BOB' ? 'Bolivianos' : 'Dólares'
  )

  function formatMoney(valor, opciones = {}) {
    const num = Number(valor) || 0
    const { compact = false, decimals = 0 } = opciones

    if (compact && Math.abs(num) >= 1000000) {
      return `${simbolo.value} ${(num / 1000000).toFixed(1)}M`
    }
    if (compact && Math.abs(num) >= 1000) {
      return `${simbolo.value} ${(num / 1000).toFixed(1)}K`
    }

    const formatted = num.toLocaleString('es-BO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return `${simbolo.value} ${formatted}`
  }

  function setMoneda(codigo) {
    config.value.moneda = codigo
    config.value.simboloMoneda = simbolos[codigo] || 'Bs'
  }

  function reset() {
    config.value = { ...DEFAULTS }
  }

  return {
    config,
    monedaActual,
    simbolo,
    nombreMoneda,
    formatMoney,
    setMoneda,
    reset,
    simbolos,
  }
})