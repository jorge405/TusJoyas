<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const configStore = useConfigStore()

const menuAbierto = ref(false)
const colapsado = ref(false)

const menu = [
  { to: '/', label: 'Dashboard', short: 'Inicio', icon: 'home' },
  { to: '/inventario', label: 'Inventario', short: 'Joyas', icon: 'gem' },
  { to: '/prestamos', label: 'Préstamos', short: 'Préstamos', icon: 'coins' },
  { to: '/fabricacion', label: 'Fabricación', short: 'Taller', icon: 'hammer' },
  { to: '/clientes', label: 'Clientes', short: 'Clientes', icon: 'users' },
  { to: '/configuracion', label: 'Configuración', short: 'Ajustes', icon: 'settings' },
  { to: '/precios', label: 'Precios Metales', short: 'Precios', icon: 'trending' },
]

const ICON_PATHS = {
  home: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10',
  gem: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  coins: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  hammer: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
}

const iconsPath = (name) => ICON_PATHS[name] || ''

const tituloActual = computed(() => {
  const item = menu.find(m => m.to === route.path)
  return item ? item.label : 'Aurum Joyas'
})

const userName = computed(() => auth.user?.nombre || 'Usuario')
const userRole = computed(() => auth.user?.rol || 'operador')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase() || 'U')

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}

watch(() => route.path, () => { menuAbierto.value = false })

onMounted(() => {
  console.log('[DefaultLayout] viewport:', window.innerWidth)
})
</script>

<template>
  <div class="min-h-screen bg-ink-950">
    <!-- ============================================ -->
    <!-- SIDEBAR DESKTOP -->
    <!-- ============================================ -->
    <aside
      class="joya-sidebar"
      :class="colapsado ? 'joya-sidebar--collapsed' : ''"
    >
      <div class="joya-sidebar__header">
        <div class="joya-sidebar__logo">
          <svg style="width:20px;height:20px;color:#08090d;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5L12 2z"/>
          </svg>
        </div>
        <div v-show="!colapsado" class="joya-sidebar__brand">
          <h1 class="joya-sidebar__brand-title">{{ configStore.config.nombreNegocio }}</h1>
          <p class="joya-sidebar__brand-sub">Sistema</p>
        </div>
      </div>

      <div class="joya-sidebar__nav">
        <RouterLink
          v-for="m in menu"
          :key="m.to"
          :to="m.to"
          :title="colapsado ? m.label : ''"
          class="joya-nav-item"
          :class="[
            route.path === m.to ? 'joya-nav-item--active' : '',
            colapsado ? 'joya-nav-item--collapsed' : ''
          ]"
        >
          <svg class="joya-nav-item__icon" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="iconsPath(m.icon)"/>
          </svg>
          <span v-show="!colapsado" class="joya-nav-item__label">{{ m.label }}</span>
        </RouterLink>
      </div>

      <div class="joya-sidebar__footer">
        <button @click="colapsado = !colapsado" class="joya-collapse-btn">
          <svg
            class="joya-collapse-btn__icon"
            :class="colapsado ? 'joya-collapse-btn__icon--rotated' : ''"
            fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          <span v-show="!colapsado" class="joya-collapse-btn__label">Colapsar</span>
        </button>
      </div>
    </aside>

    <!-- ============================================ -->
    <!-- CONTENIDO -->
    <!-- ============================================ -->
    <div class="joya-content" :class="colapsado ? 'joya-content--collapsed' : ''">
      <header class="joya-topbar">
        <button
          @click="menuAbierto = !menuAbierto"
          class="joya-hamburger"
          aria-label="Abrir menú"
        >
          <svg style="width:24px;height:24px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <h1 class="joya-topbar__title">{{ tituloActual }}</h1>

        <div class="joya-topbar__user">
          <div class="joya-user-chip">
            <div class="joya-avatar">{{ userInitial }}</div>
            <div class="joya-user-info">
              <p class="joya-user-name">{{ userName }}</p>
              <p class="joya-user-role">{{ userRole }} · {{ configStore.simbolo }}</p>
            </div>
          </div>
          <button @click="logout" class="joya-logout" title="Cerrar sesión">
            <svg style="width:20px;height:20px;" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="joya-main">
        <div class="joya-main__inner">
          <RouterView />
        </div>
      </main>
    </div>

    <!-- ============================================ -->
    <!-- BOTTOM NAV MÓVIL (5 items) -->
    <!-- ============================================ -->
    <nav class="joya-bottom-nav">
      <RouterLink
        v-for="m in menu.slice(0, 5)"
        :key="m.to"
        :to="m.to"
        class="joya-bottom-nav__item"
        :class="route.path === m.to ? 'joya-bottom-nav__item--active' : ''"
      >
        <svg style="width:20px;height:20px;" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" :d="iconsPath(m.icon)"/>
        </svg>
        <span>{{ m.short }}</span>
      </RouterLink>
    </nav>

    <!-- ============================================ -->
    <!-- DRAWER MÓVIL -->
    <!-- ============================================ -->
    <div
      v-if="menuAbierto"
      @click="menuAbierto = false"
      class="joya-drawer-backdrop"
    ></div>

    <aside v-if="menuAbierto" class="joya-drawer">
      <div class="joya-drawer__header">
        <div class="joya-sidebar__logo">
          <svg style="width:20px;height:20px;color:#08090d;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5L12 2z"/>
          </svg>
        </div>
        <h1 class="joya-drawer__title">{{ configStore.config.nombreNegocio }}</h1>
        <button @click="menuAbierto = false" class="joya-drawer__close">
          <svg style="width:20px;height:20px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <nav class="joya-sidebar__nav">
        <RouterLink
          v-for="m in menu"
          :key="m.to"
          :to="m.to"
          @click="menuAbierto = false"
          class="joya-nav-item"
          :class="route.path === m.to ? 'joya-nav-item--active' : ''"
        >
          <svg class="joya-nav-item__icon" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="iconsPath(m.icon)"/>
          </svg>
          <span class="joya-nav-item__label">{{ m.label }}</span>
        </RouterLink>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
/* ============ SIDEBAR DESKTOP ============ */
.joya-sidebar {
  display: none;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 16rem;
  z-index: 40;
  background: rgba(16, 18, 24, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid #1a1d26;
  transition: width 0.3s ease;
}
.joya-sidebar--collapsed { width: 5rem; }

@media (min-width: 1024px) {
  .joya-sidebar { display: flex; }
}

.joya-sidebar__header {
  height: 4rem;
  padding: 0 1.25rem;
  border-bottom: 1px solid #1a1d26;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
  flex-shrink: 0;
}
.joya-sidebar__logo {
  width: 2.5rem; height: 2.5rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #ecd075 0%, #d4a017 50%, #0ea5e9 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(212, 160, 23, 0.3);
}
.joya-sidebar__brand { overflow: hidden; }
.joya-sidebar__brand-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(to right, #f4e4ae, #e3b83f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: nowrap;
}
.joya-sidebar__brand-sub {
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(58, 191, 255, 0.7);
}

.joya-sidebar__nav {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  /* ✅ Permitir scroll interno del sidebar */
  overflow-y: auto;
  overflow-x: hidden;
  /* ✅ Que sea flexible */
  min-height: 0;
}

.joya-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #b0b7c6;
  border: 1px solid transparent;
  transition: all 0.2s;
  text-decoration: none;
}
.joya-nav-item:hover {
  color: #ecd075;
  background: rgba(26, 29, 38, 0.6);
}
.joya-nav-item--active {
  color: #ecd075;
  background: linear-gradient(to right, rgba(212, 160, 23, 0.2), rgba(14, 165, 233, 0.05), transparent);
  border-color: rgba(212, 160, 23, 0.3);
}
.joya-nav-item--collapsed { justify-content: center; padding: 0.75rem 0; }
.joya-nav-item__icon { width: 1.25rem; height: 1.25rem; flex-shrink: 0; }
.joya-nav-item__label { white-space: nowrap; }

.joya-sidebar__footer {
  padding: 0.75rem;
  border-top: 1px solid #1a1d26;
  flex-shrink: 0;
}
.joya-collapse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem;
  border-radius: 0.75rem;
  background: transparent;
  border: none;
  color: #858fa5;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.joya-collapse-btn:hover {
  color: #ecd075;
  background: rgba(26, 29, 38, 0.6);
}
.joya-collapse-btn__icon {
  width: 1rem; height: 1rem;
  transition: transform 0.3s;
}
.joya-collapse-btn__icon--rotated { transform: rotate(180deg); }
.joya-collapse-btn__label { font-size: 0.75rem; }

/* ============ CONTENIDO ============ */
.joya-content {
  display: flex;
  flex-direction: column;
  /* ✅ min-height, NO height: 100vh */
  min-height: 100vh;
  min-width: 0;
  width: 100%;
  transition: margin-left 0.3s ease;
}
@media (min-width: 1024px) {
  .joya-content {
    width: auto;
    margin-left: 16rem;
  }
  .joya-content--collapsed {
    margin-left: 5rem;
  }
}

/* ============ TOPBAR ============ */
.joya-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 4rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  background: rgba(8, 9, 13, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(26, 29, 38, 0.6);
  flex-shrink: 0;
  min-width: 0;
  overflow: hidden;
}
@media (min-width: 1024px) {
  .joya-topbar { padding: 0 2rem; }
}

.joya-hamburger {
  padding: 0.5rem;
  margin-left: -0.5rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  color: #e3b83f;
  cursor: pointer;
  display: flex;
}
.joya-hamburger:hover { background: rgba(26, 29, 38, 0.6); }
@media (min-width: 1024px) {
  .joya-hamburger { display: none; }
}

.joya-topbar__title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ecd075;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}
@media (min-width: 1024px) {
  .joya-topbar__title { font-size: 1.25rem; }
}

.joya-topbar__user { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.joya-user-chip {
  display: none;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.75rem;
  background: rgba(16, 18, 24, 0.7);
  border: 1px solid #1a1d26;
}
@media (min-width: 640px) {
  .joya-user-chip { display: flex; }
}
.joya-avatar {
  width: 2rem; height: 2rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, #7dd4ff, #0284c7);
  color: #08090d;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}
.joya-user-info { line-height: 1.2; min-width: 0; }
.joya-user-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #eceef2;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.joya-user-role {
  font-size: 10px;
  color: #858fa5;
  text-transform: capitalize;
  margin: 0;
}

.joya-logout {
  padding: 0.625rem;
  border-radius: 0.75rem;
  background: transparent;
  border: none;
  color: #b0b7c6;
  cursor: pointer;
  display: flex;
  transition: all 0.2s;
  flex-shrink: 0;
}
.joya-logout:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
}

/* ============ MAIN ============ */
.joya-main {
  flex: 1;
  min-width: 0;
  padding: 1rem;
  padding-bottom: 6rem;
  /* ✅ Permitir scroll vertical natural */
  overflow-y: visible;
  /* ✅ Evitar scroll horizontal */
  overflow-x: hidden;
}
@media (min-width: 640px) {
  .joya-main { padding: 1.5rem; padding-bottom: 6rem; }
}
@media (min-width: 1024px) {
  .joya-main { padding: 2rem; padding-bottom: 2rem; }
}

.joya-main__inner {
  max-width: 1600px;
  margin: 0 auto;
  min-width: 0;
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============ BOTTOM NAV ============ */
.joya-bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 40;
  display: flex;
  justify-content: space-around;
  padding: 0.375rem 0.25rem;
  padding-bottom: calc(0.375rem + env(safe-area-inset-bottom, 0));
  background: rgba(8, 9, 13, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(26, 29, 38, 0.6);
}
@media (min-width: 1024px) {
  .joya-bottom-nav { display: none; }
}
.joya-bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.5rem 0.25rem;
  border-radius: 0.75rem;
  color: #858fa5;
  text-decoration: none;
  font-size: 10px;
  font-weight: 500;
  transition: color 0.2s;
}
.joya-bottom-nav__item--active { color: #ecd075; }
.joya-bottom-nav__item span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ============ DRAWER MÓVIL ============ */
.joya-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 40;
}
@media (min-width: 1024px) {
  .joya-drawer-backdrop { display: none; }
}
.joya-drawer {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 18rem;
  max-width: 85vw;
  background: #101218;
  border-right: 1px solid #1a1d26;
  z-index: 50;
  display: flex;
  flex-direction: column;
  animation: slideInLeft 0.3s ease-out;
}
@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.joya-drawer__header {
  height: 4rem;
  padding: 0 1.25rem;
  border-bottom: 1px solid #1a1d26;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}
.joya-drawer__title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(to right, #f4e4ae, #e3b83f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  flex: 1;
  margin: 0;
}
.joya-drawer__close {
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: #858fa5;
  cursor: pointer;
  display: flex;
}
.joya-drawer__close:hover { color: #ecd075; }
</style>