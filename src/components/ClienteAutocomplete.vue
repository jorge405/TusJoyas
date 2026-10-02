<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useClientesStore } from '../stores/clientes'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Nombre del cliente' },
  autofocus: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const store = useClientesStore()
const inputRef = ref(null)
const wrapperRef = ref(null)
const abierto = ref(false)
const highlightIndex = ref(-1)

const texto = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// Filtrar clientes por nombre o teléfono
const sugerencias = computed(() => {
  const q = (texto.value || '').trim().toLowerCase()
  if (!q) return store.clientes.slice(0, 8)
  return store.clientes
    .filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
    .slice(0, 8)
})

// ¿Es un cliente ya registrado exactamente?
const esRegistrado = computed(() => {
  const q = (texto.value || '').trim().toLowerCase()
  if (!q) return false
  return store.clientes.some(c => c.nombre.toLowerCase() === q)
})

function abrir() {
  abierto.value = true
  highlightIndex.value = -1
}

function cerrar() {
  abierto.value = false
  highlightIndex.value = -1
}

function seleccionar(cliente) {
  texto.value = cliente.nombre
  emit('select', cliente)
  cerrar()
}

function onInput() {
  abrir()
}

function onFocus() {
  abrir()
}

function onKeyDown(e) {
  if (!abierto.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') abrir()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = Math.min(highlightIndex.value + 1, sugerencias.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(highlightIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightIndex.value >= 0 && sugerencias.value[highlightIndex.value]) {
      seleccionar(sugerencias.value[highlightIndex.value])
    } else {
      cerrar()
    }
  } else if (e.key === 'Escape') {
    cerrar()
  }
}

// Cerrar al hacer click fuera
function onClickFuera(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    cerrar()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickFuera)
  if (props.autofocus) {
    nextTick(() => inputRef.value?.focus())
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickFuera)
})

watch(() => props.modelValue, () => {
  highlightIndex.value = -1
})
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="texto"
        type="text"
        class="input pr-10"
        :class="esRegistrado ? 'border-emerald-500/50' : ''"
        :placeholder="placeholder"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeyDown"
      />

      <!-- Icono de check si ya está registrado -->
      <div v-if="esRegistrado" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div v-else-if="texto && sugerencias.length > 0" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg class="w-4 h-4 text-ink-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <transition
      enter-active-class="transition-all duration-150"
      leave-active-class="transition-all duration-100"
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="abierto && sugerencias.length > 0"
        class="absolute z-40 left-0 right-0 top-full mt-1 bg-ink-900 border border-ink-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
      >
        <div class="px-3 py-1.5 border-b border-ink-800 flex items-center justify-between">
          <p class="text-[10px] uppercase tracking-wider text-ink-500">
            {{ texto ? 'Coincidencias' : 'Clientes registrados' }}
          </p>
          <p class="text-[10px] text-ink-600">{{ sugerencias.length }}</p>
        </div>

        <button
          v-for="(c, i) in sugerencias"
          :key="c.id"
          type="button"
          @click="seleccionar(c)"
          @mouseenter="highlightIndex = i"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 text-left transition text-sm',
            highlightIndex === i ? 'bg-ink-800' : 'hover:bg-ink-800/60'
          ]"
        >
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-600 text-ink-950 flex items-center justify-center font-bold text-xs shrink-0">
            {{ c.nombre.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-ink-100 font-medium truncate">{{ c.nombre }}</p>
            <p v-if="c.telefono" class="text-[10px] text-ink-500 truncate">📞 {{ c.telefono }}</p>
          </div>
          <svg class="w-4 h-4 text-ink-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </transition>

    <!-- Badge cliente nuevo -->
    <p v-if="texto && !esRegistrado && texto.length > 2" class="text-[10px] text-sky-400 mt-1">
      ✨ Cliente nuevo — se guardará como texto libre
    </p>
  </div>
</template>