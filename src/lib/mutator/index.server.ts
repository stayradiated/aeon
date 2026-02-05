import type { ServerMutatorDefsImportMap } from './types.js'

const mutators: ServerMutatorDefsImportMap = {
  stream_create: import('./stream-create.server.js'),
  stream_setParent: import('./stream-set-parent.server.js'),
  stream_rename: import('./stream-rename.server.js'),
  stream_sort: import('./stream-sort.server.js'),
  stream_delete: import('./stream-delete.server.js'),

  label_addParentLabel: import('./label-add-parent-label.server.js'),
  label_create: import('./label-create.server.js'),
  label_removeParentLabel: import('./label-remove-parent-label.server.js'),
  label_rename: import('./label-rename.server.js'),
  label_setColor: import('./label-set-color.server.js'),
  label_setIcon: import('./label-set-icon.server.js'),
  label_squash: import('./label-squash.server.js'),

  point_create: import('./point-create.server.js'),
  point_slide: import('./point-slide.server.js'),
  point_delete: import('./point-delete.server.js'),

  user_setTimeZone: import('./user-set-time-zone.server.js'),

  migrate_fixupLabelParents: import('./migrate-fixup-label-parents.server.js'),

  danger_deleteAllData: import('./danger-delete-all-data.server.js'),
}

export { mutators }
