import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generarPDFFabricacion(o, config) {
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

  const saldo = Math.max(0, Number(o.precio || 0) - Number(o.anticipo || 0))
  const numeroRecibo = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(o.id).slice(-4)}`

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 12
  let y = 0

  // ============ ENCABEZADO ============
  doc.setFillColor(15, 17, 22)
  doc.rect(0, 0, pageW, 24, 'F')
  doc.setFillColor(212, 160, 23)
  doc.rect(0, 24, pageW, 1.5, 'F')

  doc.setTextColor(212, 160, 23)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(nombreNegocio.toUpperCase(), margin, 11)

  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.setFont('helvetica', 'normal')
  doc.text('TALLER DE JOYERÍA · ORDEN DE FABRICACIÓN', margin, 17)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDEN DE FABRICACIÓN', pageW - margin, 11, { align: 'right' })
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text(`Nº ${numeroRecibo}`, pageW - margin, 17, { align: 'right' })

  y = 34

  // ============ INFO GENERAL ============
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACIÓN DE LA ORDEN', margin, y)
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
    ['Fecha emisión:', fmtFechaHora(new Date().toISOString())],
    ['Fecha de inicio:', fmtFecha(o.fechaInicio)],
    ['Fecha de entrega:', o.fechaEntrega ? fmtFecha(o.fechaEntrega) : 'Sin fecha'],
  ]
  const infoDer = [
    ['Estado:', (o.estado || '').replace('_', ' ').toUpperCase()],
    ['Folio:', `F-${String(o.id).slice(-6)}`],
    ['Tipo:', o.tipoTrabajo || '—'],
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

  // ============ CLIENTE + TRABAJO ============
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('CLIENTE Y DETALLES DEL TRABAJO', margin, y)
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
      ['Cliente:', o.cliente || '—', 'Material:', o.material || '—'],
      ['Peso estimado:', o.pesoEstimado ? `${o.pesoEstimado} g` : '—', '', ''],
      ['Descripción:', o.descripcion || '—', '', ''],
    ],
  })

  y = doc.lastAutoTable.finalY + 6

  // ============ ECONÓMICO ============
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text('DETALLES ECONÓMICOS', margin, y)
  y += 1.5
  doc.setDrawColor(212, 160, 23)
  doc.line(margin, y, pageW - margin, y)
  y += 5

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
      ['Precio total del trabajo', fmtMoney(o.precio)],
      ['Anticipo pagado', fmtMoney(o.anticipo)],
      [
        { content: 'SALDO A PAGAR', styles: { fontStyle: 'bold', fillColor: [250, 243, 221], fontSize: 10, textColor: [180, 30, 30] } },
        { content: fmtMoney(saldo), styles: { fontStyle: 'bold', halign: 'right', fillColor: [250, 243, 221], fontSize: 10, textColor: [180, 30, 30] } },
      ],
    ],
  })

  y = doc.lastAutoTable.finalY + 6

  // ============ CONDICIONES ============
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
    '1. El cliente se compromete a pagar el saldo al recibir la pieza terminada.',
    '2. El plazo de entrega puede variar según la complejidad del trabajo.',
    '3. Conserve este comprobante para retirar su joya.',
  ]
  condiciones.forEach(c => {
    doc.text(c, margin, y)
    y += 3.5
  })

  // ============ FIRMAS ============
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
  doc.text('Firma del taller', center2, firmaY + 3.5, { align: 'center' })

  // ============ PIE ============
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Generado el ${new Date().toLocaleString('es-BO')} · ${nombreNegocio}`,
    pageW / 2,
    pageH - 6,
    { align: 'center' }
  )

  // ============ GUARDAR ============
  const nombreArchivo = `Orden_${(o.cliente || 'cliente').replace(/\s+/g, '_')}_${o.id}.pdf`
  doc.save(nombreArchivo)
}