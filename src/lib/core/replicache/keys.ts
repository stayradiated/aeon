import type { LabelId, PointId, StreamId, UserId } from '#lib/ids.js'

import { createKey } from '#lib/utils/create-key.js'

/*
 * Replicache is built on key value store.
 *
 * Each database table we sync to the client needs to have a unique prefix.
 * Here we have a centralized collection of key encoders/decoders, which helps
 * ensure we use the same key format in client and in server.
 */

export const label = createKey('label')<LabelId>()
export const point = createKey('point')<PointId>()
export const stream = createKey('stream')<StreamId>()
export const user = createKey('user')<UserId>()
export const meta = createKey('meta')<string>()
