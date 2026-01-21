import type { ServerMutatorDefsImportMap } from './types.js'

const mutators: ServerMutatorDefsImportMap = {
  ping: import('./ping.server.js'),

  stream_create: import('./stream-create.server.js'),
  stream_setParent: import('./stream-set-parent.server.js'),
  stream_rename: import('./stream-rename.server.js'),
  stream_sort: import('./stream-sort.server.js'),
  stream_delete: import('./stream-delete.server.js'),

  label_create: import('./label-create.server.js'),

  point_create: import('./point-create.server.js'),
  point_slide: import('./point-slide.server.js'),

  danger_deleteAllData: import('./danger-delete-all-data.server.js'),
}

export { mutators }
