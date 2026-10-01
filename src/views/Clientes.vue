<script setup>
import { ref } from 'vue'
import { useClientesStore } from '../stores/clientes'
import { usePrestamosStore } from '../stores/prestamos'

const store = useClientesStore()
const prestamosStore = usePrestamosStore()
const mostrarForm = ref(false)

const form = ref({ nombre: '', telefono: '', email: '', direccion: '', notas: '' })

function guardar() {
  if (!form.value.nombre) return
  store.agregar({ ...form.value })
  form.value = { nombre: '', telefono: '', email: '', direccion: '', notas: '' }
  mostrarForm.value = false
}

const prestamosDe = nombre => prestamosStore.prestamos.filter(p => p.cliente === nombre).length
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-gold-500/80 mb-1">Cartera</p>
        <h2 class="section-title">Clientes</h2>
      </div>
      <button @click="mostrarForm = !mostrarForm" class="btn-primary">
        <svg v-if="!mostrarForm" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        {{ mostrarForm ? 'Cancelar' : 'Nuevo Cliente' }}
      </button>
    </div>

    <transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mostrarForm" class="card border-l-2 border-cyan-500">
        <h3 class="font-display text-xl font-semibold text-cyan-200 mb-5">Nuevo cliente</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre *</label>
            <input v-model="form.nombre" class="input" />
          </div>
          <div>
            <label class="label">Teléfono</label>
            <input v-model="form.telefono" class="input" />
          </div>
          <div>
            <label class="label">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div>
            <label class="label">Dirección</label>
            <input v-model="form.direccion" class="input" />
          </div>
          <div class="md:col-span-2">
            <label class="label">Notas</label>
            <textarea v-model="form.notas" class="input" rows="2"></textarea>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="mostrarForm = false" class="btn-secondary">Cancelar</button>
          <button @click="guardar" class="btn-primary">Guardar Cliente</button>
        </div>
      </div>
    </transition>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="c in store.clientes.slice().reverse()" :key="c.id" class="card-hover relative overflow-hidden">
        <div class="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl bg-cyan-400/15"></div>

        <div class="relative">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-300 to-cyan-600 text-dark-950 flex items-center justify-center font-display text-2xl font-bold shrink-0 shadow-lg shadow-cyan-500/20">
              {{ c.nombre.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0 pt-1">
              <h4 class="font-display text-lg font-semibold text-dark-50 truncate">{{ c.nombre }}</h4>
              <div class="mt-1.5 space-y-0.5 text-xs text-dark-400">
                <p v-if="c.telefono" class="truncate">📞 {{ c.telefono }}</p>
                <p v-if="c.email" class="truncate">✉️ {{ c.email }}</p>
                <p v-if="c.direccion" class="truncate">📍 {{ c.direccion }}</p>
              </div>
            </div>
          </div>

          <p v-if="c.notas" class="mt-4 text-xs text-dark-300 bg-dark-800/60 p-3 rounded-xl border border-dark-700 leading-relaxed">
            {{ c.notas }}
          </p>

          <div class="mt-4 flex items-center justify-between">
            <span class="badge-gold">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ prestamosDe(c.nombre) }} préstamo(s)
            </span>
            <button
              @click="store.eliminar(c.id)"
              class="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="store.clientes.length === 0" class="col-span-full card text-center py-16 text-dark-500">
        <svg class="w-14 h-14 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <p>No hay clientes registrados</p>
      </div>
    </div>
  </div>
</template>