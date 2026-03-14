import { createHmac, timingSafeEqual } from 'node:crypto'

type HashTokenOptions = {
  secret: string
  token: string
}
const hashToken = (options: HashTokenOptions): Uint8Array => {
  const { secret, token } = options
  return createHmac('sha256', secret).update(token).digest()
}

type VerifyTokenWithHashOptions = {
  secret: string
  token: string
  hash: Uint8Array
}
const verifyTokenWithHash = (options: VerifyTokenWithHashOptions): boolean => {
  const { secret, token, hash } = options
  return timingSafeEqual(hashToken({ secret, token }), hash)
}

export { hashToken, verifyTokenWithHash }
