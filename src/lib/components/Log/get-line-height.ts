const getLineHeight = (durationMs: number): number => {
  const durationMin = durationMs / 1000 / 60
  return Math.round(44 * (1 + Math.max(0, Math.log2(durationMin / 15))))
}

export { getLineHeight }
