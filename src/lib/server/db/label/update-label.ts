import { errorBoundary } from '@stayradiated/error-boundary'

import type { LabelId, UserId } from '#lib/ids.js'
import type { KyselyDb } from '#lib/server/db/types.js'
import type { Label } from '#lib/server/types.js'

type UpdateLabelOptions = {
  db: KyselyDb
  where: {
    userId: UserId
    labelId: LabelId
  }
  set: Partial<Pick<Label, 'name' | 'parentId' | 'color' | 'icon'>>
  now?: number
}

const updateLabel = async (
  options: UpdateLabelOptions,
): Promise<Label | Error> => {
  const { db, set, now = Date.now() } = options

  return errorBoundary(() =>
    db
      .updateTable('label')
      .set({
        name: set.name,
        parentId: set.parentId,
        color: set.color,
        icon: set.icon,
        updatedAt: now,
      })
      .where('id', '=', options.where.labelId)
      .where('userId', '=', options.where.userId)
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { updateLabel }
