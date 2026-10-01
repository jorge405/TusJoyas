import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'joyeria_auth'
const USERS_KEY = 'joyeria_users'

// Usuario por defecto si no existe ninguno
const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', nombre: 'Administrador', rol: 'admin' }
]

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'))
  const users = ref(JSON.parse(localStorage.getItem(USERS_KEY) || JSON.stringify(DEFAULT_USERS)))

  watch(users, v => localStorage.setItem(USERS_KEY, JSON.stringify(v)), { deep: true })
  watch(user, v => {
    if (v) localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    else localStorage.removeItem(STORAGE_KEY)
  }, { deep: true })

  const isAuthenticated = computed(() => !!user.value)

  function login(username, password) {
    const found = users.value.find(
      u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password
    )
    if (!found) return { ok: false, error: 'Usuario o contraseña incorrectos' }
    user.value = { username: found.username, nombre: found.nombre, rol: found.rol, loginAt: new Date().toISOString() }
    return { ok: true }
  }

  function logout() {
    user.value = null
  }

  return { user, users, isAuthenticated, login, logout }
})