import type { Chart, Plugin } from 'chart.js'

const crosshairPlugin: Plugin = {
  id: 'crosshair',

  afterDraw(chart: Chart) {
    const tooltip = chart.tooltip
    if (!tooltip || !tooltip.getActiveElements().length) return

    const ctx = chart.ctx
    const activePoint = tooltip.getActiveElements()[0]
    if (!activePoint) return

    const x = activePoint.element.x
    const y = activePoint.element.y
    const { top, bottom, left, right } = chart.chartArea
    const options = (chart.options.plugins as any)?.crosshair ?? {}
    const color = options.color ?? 'rgba(148, 163, 184, 0.3)'

    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.strokeStyle = color

    // Vertical line
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()

    // Horizontal line
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(right, y)
    ctx.stroke()

    ctx.restore()
  },
}

export default crosshairPlugin
