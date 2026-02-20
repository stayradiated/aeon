import type { ServerMutatorDefsImportMap } from './types.js'

const mutators: ServerMutatorDefsImportMap = {
  stream_create: import('./stream-create.server.js'),
  stream_delete: import('./stream-delete.server.js'),
  stream_rename: import('./stream-rename.server.js'),
  stream_setParent: import('./stream-set-parent.server.js'),
  stream_sort: import('./stream-sort.server.js'),
  stream_squash: import('./stream-squash.server.js'),

  label_addParentLabel: import('./label-add-parent-label.server.js'),
  label_create: import('./label-create.server.js'),
  label_removeParentLabel: import('./label-remove-parent-label.server.js'),
  label_rename: import('./label-rename.server.js'),
  label_setColor: import('./label-set-color.server.js'),
  label_setIcon: import('./label-set-icon.server.js'),
  label_squash: import('./label-squash.server.js'),

  point_create: import('./point-create.server.js'),
  point_delete: import('./point-delete.server.js'),
  point_setDescription: import('./point-set-description.server.js'),
  point_setLabelIdList: import('./point-set-label-id-list.server.js'),
  point_setStartedAt: import('./point-set-started-at.server.js'),

  migrate_fixupLabelParents: import('./migrate-fixup-label-parents.server.js'),

  danger_deleteAllData: import('./danger-delete-all-data.server.js'),
}

export { mutators }
