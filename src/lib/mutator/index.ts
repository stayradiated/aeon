import type { LocalMutatorDefsImportMap } from './types.js'

const mutators: LocalMutatorDefsImportMap = {
  stream_create: import('./stream-create.js'),
  stream_setParent: import('./stream-set-parent.js'),
  stream_rename: import('./stream-rename.js'),
  stream_sort: import('./stream-sort.js'),
  stream_delete: import('./stream-delete.js'),

  label_create: import('./label-create.js'),
  label_rename: import('./label-rename.js'),
  label_setParent: import('./label-set-parent.js'),
  label_setColor: import('./label-set-color.js'),
  label_setIcon: import('./label-set-icon.js'),

  point_create: import('./point-create.js'),
  point_slide: import('./point-slide.js'),

  migrate_fixupLabelParents: import('./migrate-fixup-label-parents.js'),

  danger_deleteAllData: import('./danger-delete-all-data.js'),
}

export { mutators }
