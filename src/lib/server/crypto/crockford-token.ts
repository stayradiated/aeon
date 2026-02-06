import crypto from 'node:crypto'

import { base32 } from './base32.js'

const Entropy = {
  SMALL: 40,
  MEDIUM: 80,
} as const

type Entropy = (typeof Entropy)[keyof typeof Entropy]

type CrockfordToken = {
  value: string
  prettified: string
}

const genCrockfordToken = (
  entropy: Entropy = Entropy.SMALL,
): CrockfordToken => {
  const byteCount = Math.ceil(entropy / 8)
  const randomBytes = crypto.getRandomValues(Buffer.alloc(byteCount))
  const value = base32.encode(randomBytes)
  const chunks: string[] = []
  const chunkSize = 4
  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.slice(i, i + chunkSize))
  }
  const prettified = chunks.join('-')
  return { value, prettified }
}

const sanitizeCrockfordToken = (input: string): string => {
  const token = input
    .toUpperCase()
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/[\s-]/g, '')
  return token
}

export { genCrockfordToken, sanitizeCrockfordToken }
