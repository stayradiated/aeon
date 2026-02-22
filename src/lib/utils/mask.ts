type MaskOptions = {
  showFirst?: number
  showLast?: number
  replace?: string
  maxLength?: number
}

const mask = (input: string, options: MaskOptions = {}): string => {
  const { showFirst = 0, showLast = 0, replace = '*', maxLength = 20 } = options

  const prefix = showFirst > 0 ? input.slice(0, showFirst) : ''
  const suffix = showLast > 0 ? input.slice(-showLast) : ''
  const stars = replace.repeat(input.length - showFirst - showLast)
  const fullOut = prefix + stars + suffix

  if (fullOut.length <= maxLength) {
    return fullOut
  }

  // if the full output is too long, cut and insert an ellipsis
  const halfWidth = Math.floor((maxLength - 1) / 2)
  const [left, right] = [fullOut.slice(0, halfWidth), fullOut.slice(-halfWidth)]
  return `${left}…${right}`
}

export { mask }
