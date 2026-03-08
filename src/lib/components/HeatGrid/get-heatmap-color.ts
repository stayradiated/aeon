const lowColor = '#ffffff'
const highColor = '#000000'

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '')
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const num = Number.parseInt(normalized, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

const toHex = (n: number): string => {
  return Math.round(n).toString(16).padStart(2, '0')
}

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }): string => {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const mixColors = (a: string, b: string, t: number): string => {
  const c1 = hexToRgb(a)
  const c2 = hexToRgb(b)
  return rgbToHex({
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  })
}

const normalize = (minutes: number): number => {
  const softMax = 16 * 60
  const k = 30
  return Math.min(1, Math.log1p(minutes / k) / Math.log1p(softMax / k))
}

const getHeatmapColor = (minutes: number): string => {
  return mixColors(lowColor, highColor, normalize(minutes))
}

export { getHeatmapColor }
