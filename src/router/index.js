import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import AuthLayout from '../layouts/AuthLayout.vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'

import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Inventario from '../views/Inventario.vue'
import Prestamos from '../views/Prestamos.vue'
import Fabricacion from '../views/Fabricacion.vue'
import Clientes from '../views/Clientes.vue'
import Configuracion from '../views/Configuracion.vue'
import PreciosMetales from '../views/PreciosMetales.vue'
const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      { path: '', name: 'login', component: Login, meta: { public: true } }
    ]
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'dashboard', component: Dashboard },
      { path: 'inventario', name: 'inventario', component: Inventario },
      { path: 'prestamos', name: 'prestamos', component: Prestamos },
      { path: 'fabricacion', name: 'fabricacion', component: Fabricacion },
      { path: 'clientes', name: 'clientes', component: Clientes },
      { path: 'configuracion', name: 'configuracion', component: Configuracion },
      { path: 'precios', name: 'precios', component: PreciosMetales },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

export default router