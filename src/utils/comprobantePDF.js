import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generarPDFPrestamo(p, config) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const simbolo = config?.simbolo || 'Bs'
  const nombreNegocio = config?.config?.nombreNegocio || 'Aurum Joyas'

  const fmtMoney = (n) => {
    const num = Number(n) || 0
    return `${simbolo} ${num.toLocaleString('es-BO')}`
  }

  const fmtFecha = (iso) => {
    if (!iso) return '—'
    const s = String(iso).slice(0, 10)
    const [y, m, d] = s.split('-')
    if (!y || !m || !d) return iso
    return `${d}/${m}/${y}`
  }

  const fmtFechaHora = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = d.getFullYear()
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}/${mm}/${yy} ${h}:${min}`
  }

  const totalPagado = (p.pagos || []).reduce((s, x) => s + x.monto, 0)
  const restante = Math.max(0, Number(p.montoTotal || 0) - totalPagado)
  const numeroRecibo = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(p.id).slice(-4)}`

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 12
  let y = 0

  // ============ ENCABEZADO (banda oscura delgada) ============
  doc.setFillColor(15, 17, 22)
  doc.rect(0, 0, pageW, 24, 'F')
  // Acento dorado
  doc.setFillColor(212, 160, 23)
  doc.rect(0, 24, pageW, 1.5, 'F')

  doc.setTextColor(212, 160, 23)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(nombreNegocio.toUpperCase(), margin, 11)

  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.setFont('helvetica', 'normal')
  doc.text('SISTEMA DE PRÉSTAMOS SOBRE JOYAS', margin, 17)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE PRÉSTAMO', pageW - margin, 11, { align: 'right' })
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text(`Nº ${numeroRecibo}`, pageW - margin, 17, { align: 'right' })

  y = 34

  // ============ BLOQUE: INFO GENERAL (2 columnas) ============
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACIÓN DEL PRÉSTAMO', margin, y)
  y += 1.5
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 5

  const colW = (pageW - margin * 2) / 2 - 3
  const colLeft = margin
  const colRight = margin + colW + 6

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')

  const infoIzq = [
    ['Fecha de emisión:', fmtFechaHora(p.fechaInicio || new Date().toISOString())],
    ['Fecha de inicio:', fmtFecha(p.fechaInicio)],
    ['Fecha de vencimiento:', fmtFecha(p.fechaVencimiento)],
  ]
  const infoDer = [
    ['Estado:', (p.estado || '').toUpperCase()],
    ['Folio:', `P-${String(p.id).slice(-6)}`],
    ['Plazo:', `${p.plazoCantidad || p.plazoDias || 0} ${p.plazoUnidad === 'meses' ? 'mes(es)' : 'día(s)'}`],
  ]

  const drawInfo = (arr, x) => {
    arr.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(110, 110, 110)
      doc.text(label, x, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(20, 20, 20)
      doc.text(String(val), x + 40, y)
      y += 5
    })
  }

  const yStart = y
  drawInfo(infoIzq, colLeft)
  const yAfterIzq = y
  y = yStart
  drawInfo(infoDer, colRight)
  y = Math.max(y, yAfterIzq) + 4

  // ============ BLOQUE: CLIENTE Y JOYA (combinado) ============
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('CLIENTE Y JOYA EMPEÑADA', margin, y)
  y += 1.5
  doc.line(margin, y, pageW - margin, y)
  y += 5

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [110, 110, 110], cellWidth: 35 },
      1: { textColor: [20, 20, 20] },
      2: { fontStyle: 'bold', textColor: [110, 110, 110], cellWidth: 30 },
      3: { textColor: [20, 20, 20] },
    },
    body: [
      ['Cliente:', p.cliente || '—', 'Joya:', p.descripcionJoya || '—'],
      ['Peso:', p.peso ? `${p.peso} g` : '—', '', ''],
    ],
  })

  y = doc.lastAutoTable.finalY + 6

  // ============ BLOQUE: DETALLES ECONÓMICOS ============
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('DETALLES ECONÓMICOS', margin, y)
  y += 1.5
  doc.setDrawColor(212, 160, 23)
  doc.line(margin, y, pageW - margin, y)
  y += 5

  const interes = Number(p.montoTotal || 0) - Number(p.montoPrincipal || 0)

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [212, 160, 23], textColor: [15, 17, 22], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5, textColor: [20, 20, 20], lineColor: [230, 230, 230] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { halign: 'right' },
    },
    head: [['Concepto', 'Monto']],
    body: [
      ['Capital prestado', fmtMoney(p.montoPrincipal)],
      [`Interés (${p.tasaInteres || 0}%)`, fmtMoney(interes)],
      [
        { content: 'TOTAL A PAGAR', styles: { fontStyle: 'bold', fillColor: [250, 243, 221], fontSize: 10 } },
        { content: fmtMoney(p.montoTotal), styles: { fontStyle: 'bold', halign: 'right', fillColor: [250, 243, 221], fontSize: 10 } },
      ],
      ['Pagado hasta la fecha', fmtMoney(totalPagado)],
      [
        { content: 'SALDO PENDIENTE', styles: { fontStyle: 'bold', textColor: [180, 30, 30] } },
        { content: fmtMoney(restante), styles: { fontStyle: 'bold', halign: 'right', textColor: [180, 30, 30] } },
      ],
    ],
  })

  y = doc.lastAutoTable.finalY + 6

  // ============ HISTORIAL DE PAGOS (compacto, máx 5 filas visibles) ============
  if (p.pagos && p.pagos.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text(`HISTORIAL DE PAGOS (${p.pagos.length})`, margin, y)
    y += 1.5
    doc.setDrawColor(212, 160, 23)
    doc.line(margin, y, pageW - margin, y)
    y += 5

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8.5, cellPadding: 1.8, textColor: [20, 20, 20] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 55 },
        2: { halign: 'right' },
      },
      head: [['#', 'Fecha', 'Monto']],
      body: p.pagos.map((pg, i) => [
        i + 1,
        fmtFechaHora(pg.fecha),
        fmtMoney(pg.monto),
      ]),
    })

    y = doc.lastAutoTable.finalY + 6
  }

  // ============ CONDICIONES (compacto) ============
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('CONDICIONES', margin, y)
  y += 1.5
  doc.setDrawColor(212, 160, 23)
  doc.line(margin, y, pageW - margin, y)
  y += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(70, 70, 70)
  const condiciones = [
    '1. El cliente se compromete a pagar el monto total en la fecha de vencimiento.',
    '2. Pasada la fecha sin cancelar, la joya podrá ser retenida o vendida.',
    '3. Conserve este comprobante para cualquier reclamo o verificación.',
  ]
  condiciones.forEach(c => {
    doc.text(c, margin, y)
    y += 3.5
  })

  // ============ FIRMAS (posición adaptativa para que quepan) ============
  const firmaY = Math.min(pageH - 30, y + 12)
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.25)

  const firmaW = 55
  const center1 = pageW / 2 - 35
  const center2 = pageW / 2 + 35

  doc.line(center1 - firmaW / 2, firmaY, center1 + firmaW / 2, firmaY)
  doc.line(center2 - firmaW / 2, firmaY, center2 + firmaW / 2, firmaY)

  doc.setFontSize(7.5)
  doc.setTextColor(80, 80, 80)
  doc.text('Firma del cliente', center1, firmaY + 3.5, { align: 'center' })
  doc.text('Firma del negocio', center2, firmaY + 3.5, { align: 'center' })

  // ============ PIE DE PÁGINA ============
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Generado el ${new Date().toLocaleString('es-BO')} · ${nombreNegocio}`,
    pageW / 2,
    pageH - 6,
    { align: 'center' }
  )

  // ============ GUARDAR ============
  const nombreArchivo = `Comprobante_${(p.cliente || 'cliente').replace(/\s+/g, '_')}_${p.id}.pdf`
  doc.save(nombreArchivo)
}