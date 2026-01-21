import type { LocalMutatorDefsImportMap } from './types.js'

const mutators: LocalMutatorDefsImportMap = {
  ping: import('./ping.js'),

  stream_create: import('./stream-create.js'),
  stream_setParent: import('./stream-set-parent.js'),
  stream_rename: import('./stream-rename.js'),
  stream_sort: import('./stream-sort.js'),
  stream_delete: import('./stream-delete.js'),

  label_create: import('./label-create.js'),

  point_create: import('./point-create.js'),
  point_slide: import('./point-slide.js'),

  danger_deleteAllData: import('./danger-delete-all-data.js'),
}

export { mutators }
