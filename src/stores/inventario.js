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
      precioCompraOriginal: precioCompra,
      precioVentaOriginal: precioVenta,
      cantidadOriginal: cantidad,
      totalCompraOriginal: cantidad * precioCompra,
      totalVentaOriginal: cantidad * precioVenta,
    })
  }

  function actualizar(id, datos) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    const cantidad = Number(datos.cantidad) || 1
    const precioCompra = Number(datos.precioCompra) || 0
    const precioVenta = Number(datos.precioVenta) || 0

    const itemActual = items.value[idx]
    const esEdicionBase = !datos.estado || datos.estado === 'disponible' || itemActual.estado === 'disponible'

    items.value[idx] = {
      ...itemActual,
      ...datos,
      cantidad,
      precioCompra,
      precioVenta,
      totalCompra: cantidad * precioCompra,
      totalVenta: cantidad * precioVenta,
    }

    if (esEdicionBase) {
      items.value[idx].precioCompraOriginal = precioCompra
      items.value[idx].precioVentaOriginal = precioVenta
      items.value[idx].cantidadOriginal = cantidad
      items.value[idx].totalCompraOriginal = cantidad * precioCompra
      items.value[idx].totalVentaOriginal = cantidad * precioVenta
    }
  }

  function eliminar(id) {
    items.value = items.value.filter(i => i.id !== id)
  }

  // 🔑 Clave para detectar items "fusionables" (mismo producto base)
  function claveFusion(i) {
    return [
      (i.nombre || '').trim().toLowerCase(),
      (i.tipo || '').trim().toLowerCase(),
      (i.material || '').trim().toLowerCase(),
      Number(i.precioCompra) || 0,
      Number(i.precioVenta) || 0,
      (i.proveedor || '').trim().toLowerCase(),
      i.peso || '',
    ].join('|')
  }

  // 🔀 Intenta fusionar el item liberado con otro item disponible/no_disponible con la misma clave
  function fusionarSiPosible(itemLiberado) {
    const clave = claveFusion(itemLiberado)
    const candidato = items.value.find(i =>
      i.id !== itemLiberado.id &&
      (i.estado === 'disponible' || i.estado === 'no_disponible') &&
      claveFusion(i) === clave
    )

    if (!candidato) return false

    // Sumar cantidades
    const nuevaCantidad = (Number(candidato.cantidad) || 0) + (Number(itemLiberado.cantidad) || 0)
    candidato.cantidad = nuevaCantidad
    candidato.cantidadOriginal = nuevaCantidad
    candidato.totalCompra = nuevaCantidad * candidato.precioCompra
    candidato.totalVenta = nuevaCantidad * candidato.precioVenta
    candidato.totalCompraOriginal = candidato.totalCompra
    candidato.totalVentaOriginal = candidato.totalVenta

    // Eliminar el item liberado (ya está fusionado)
    items.value = items.value.filter(i => i.id !== itemLiberado.id)
    return true
  }

  // 💰 Empeñar N unidades
  function empeñar(id, { cliente, fecha, precio, cantidad }) {
    const item = items.value.find(i => i.id === id)
    if (!item) return null

    const cantTotal = Number(item.cantidad) || 1
    const cantEmpeñar = Math.min(Math.max(1, Number(cantidad) || 1), cantTotal)
    const precioUnit = Number(precio) || 0

    if (cantEmpeñar < cantTotal) {
      const cantRestante = cantTotal - cantEmpeñar
      item.cantidad = cantRestante
      item.totalCompra = cantRestante * item.precioCompra
      item.totalVenta = cantRestante * item.precioVenta
      item.cantidadOriginal = cantRestante
      item.totalCompraOriginal = cantRestante * item.precioCompra
      item.totalVentaOriginal = cantRestante * item.precioVenta

      const nuevo = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        nombre: item.nombre,
        tipo: item.tipo,
        material: item.material,
        peso: item.peso,
        proveedor: item.proveedor,
        descripcion: item.descripcion,
        origen: item.origen,
        estado: 'empeñado',
        cantidad: cantEmpeñar,
        precioCompra: item.precioCompra,
        precioVenta: item.precioVenta,
        totalCompra: cantEmpeñar * item.precioCompra,
        totalVenta: cantEmpeñar * item.precioVenta,
        precioCompraOriginal: item.precioCompra,
        precioVentaOriginal: item.precioVenta,
        cantidadOriginal: cantEmpeñar,
        totalCompraOriginal: cantEmpeñar * item.precioCompra,
        totalVentaOriginal: cantEmpeñar * item.precioVenta,
        empeno: {
          cliente: cliente || '',
          fecha: fecha || new Date().toISOString().slice(0, 10),
          precio: precioUnit * cantEmpeñar,
          precioUnitario: precioUnit,
          cantidad: cantEmpeñar,
          fechaRegistro: new Date().toISOString(),
        },
      }
      items.value.push(nuevo)
      return { tipo: 'parcial', item: nuevo }
    }

    item.estado = 'empeñado'
    item.empeno = {
      cliente: cliente || '',
      fecha: fecha || new Date().toISOString().slice(0, 10),
      precio: precioUnit * cantEmpeñar,
      precioUnitario: precioUnit,
      cantidad: cantEmpeñar,
      fechaRegistro: new Date().toISOString(),
    }
    return { tipo: 'total', item }
  }

  // 🛒 Vender N unidades
  function vender(id, { cliente, fecha, precio, cantidad }) {
    const item = items.value.find(i => i.id === id)
    if (!item) return null

    const cantTotal = Number(item.cantidad) || 1
    const cantVender = Math.min(Math.max(1, Number(cantidad) || 1), cantTotal)
    const precioUnit = Number(precio) || 0

    if (cantVender < cantTotal) {
      const cantRestante = cantTotal - cantVender
      item.cantidad = cantRestante
      item.totalCompra = cantRestante * item.precioCompra
      item.totalVenta = cantRestante * item.precioVenta
      item.cantidadOriginal = cantRestante
      item.totalCompraOriginal = cantRestante * item.precioCompra
      item.totalVentaOriginal = cantRestante * item.precioVenta

      const nuevo = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        nombre: item.nombre,
        tipo: item.tipo,
        material: item.material,
        peso: item.peso,
        proveedor: item.proveedor,
        descripcion: item.descripcion,
        origen: item.origen,
        estado: 'vendido',
        cantidad: cantVender,
        precioCompra: item.precioCompra,
        precioVenta: item.precioVenta,
        totalCompra: cantVender * item.precioCompra,
        totalVenta: cantVender * item.precioVenta,
        precioCompraOriginal: item.precioCompra,
        precioVentaOriginal: item.precioVenta,
        cantidadOriginal: cantVender,
        totalCompraOriginal: cantVender * item.precioCompra,
        totalVentaOriginal: cantVender * item.precioVenta,
        venta: {
          cliente: cliente || '',
          fecha: fecha || new Date().toISOString().slice(0, 10),
          precio: precioUnit * cantVender,
          precioUnitario: precioUnit,
          cantidad: cantVender,
          fechaRegistro: new Date().toISOString(),
        },
      }
      items.value.push(nuevo)
      return { tipo: 'parcial', item: nuevo }
    }

    item.estado = 'vendido'
    item.venta = {
      cliente: cliente || '',
      fecha: fecha || new Date().toISOString().slice(0, 10),
      precio: precioUnit * cantVender,
      precioUnitario: precioUnit,
      cantidad: cantVender,
      fechaRegistro: new Date().toISOString(),
    }
    return { tipo: 'total', item }
  }

  // 🔄 Liberar: vuelve a disponible y FUSIONA si hay item equivalente
  function liberar(id) {
    const item = items.value.find(i => i.id === id)
    if (!item) return

    // Restaurar cantidades y precios originales
    item.cantidad = item.cantidadOriginal ?? item.cantidad ?? 1
    item.precioCompra = item.precioCompraOriginal ?? item.precioCompra ?? 0
    item.precioVenta = item.precioVentaOriginal ?? item.precioVenta ?? 0
    item.totalCompra = item.totalCompraOriginal ?? (item.cantidad * item.precioCompra)
    item.totalVenta = item.totalVentaOriginal ?? (item.cantidad * item.precioVenta)

    // Limpiar datos de empeño/venta
    delete item.empeno
    delete item.venta

    item.estado = 'disponible'

    // 🔀 Intentar fusionar con un item equivalente
    fusionarSiPosible(item)
  }

  const totales = computed(() => {
    const activos = items.value.filter(i =>
      i.estado === 'disponible' || i.estado === 'no_disponible'
    )
    return {
      unidades: activos.reduce((s, i) => s + (Number(i.cantidad) || 0), 0),
      inversion: activos.reduce((s, i) => s + (Number(i.totalCompra) || 0), 0),
      valorVenta: activos.reduce((s, i) => s + (Number(i.totalVenta) || 0), 0),
    }
  })

  const empeñados = computed(() =>
    items.value.filter(i => i.estado === 'empeñado')
  )

  const vendidos = computed(() =>
    items.value.filter(i => i.estado === 'vendido')
  )

  const unidadesEmpeñadas = computed(() =>
    empeñados.value.reduce((s, i) => s + (Number(i.empeno?.cantidad) || Number(i.cantidad) || 0), 0)
  )

  const unidadesVendidas = computed(() =>
    vendidos.value.reduce((s, i) => s + (Number(i.venta?.cantidad) || Number(i.cantidad) || 0), 0)
  )

  const totalVendidoReal = computed(() =>
    vendidos.value.reduce((s, i) => s + (Number(i.venta?.precio) || 0), 0)
  )

  const totalEmpeñado = computed(() =>
    empeñados.value.reduce((s, i) => s + (Number(i.empeno?.precio) || 0), 0)
  )

  return {
    items,
    agregar,
    actualizar,
    eliminar,
    empeñar,
    vender,
    liberar,
    totales,
    empeñados,
    vendidos,
    unidadesEmpeñadas,
    unidadesVendidas,
    totalVendidoReal,
    totalEmpeñado,
  }
})