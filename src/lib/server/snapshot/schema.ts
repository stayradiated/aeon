import { z } from 'zod'

import { $Label, $Point, $Stream, $User } from '#lib/schema.js'

const $Snapshot = z.object({
  user: z.array($User.omit({ id: true, email: true })),
  stream: z.array($Stream.omit({ userId: true })),
  label: z.array($Label.omit({ userId: true })),
  point: z.array($Point.omit({ userId: true })),
})
type Snapshot = z.infer<typeof $Snapshot>

export { $Snapshot }
export type { Snapshot }
