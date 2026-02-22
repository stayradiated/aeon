import type { LocalMutatorDefsImportMap } from './types.js'

const mutators: LocalMutatorDefsImportMap = {
  stream_create: import('./stream-create.js'),
  stream_delete: import('./stream-delete.js'),
  stream_rename: import('./stream-rename.js'),
  stream_setParent: import('./stream-set-parent.js'),
  stream_sort: import('./stream-sort.js'),
  stream_squash: import('./stream-squash.js'),

  label_addParentLabel: import('./label-add-parent-label.js'),
  label_create: import('./label-create.js'),
  label_removeParentLabel: import('./label-remove-parent-label.js'),
  label_rename: import('./label-rename.js'),
  label_setColor: import('./label-set-color.js'),
  label_setIcon: import('./label-set-icon.js'),
  label_squash: import('./label-squash.js'),

  point_create: import('./point-create.js'),
  point_delete: import('./point-delete.js'),
  point_setDescription: import('./point-set-description.js'),
  point_setLabelIdList: import('./point-set-label-id-list.js'),
  point_setStartedAt: import('./point-set-started-at.js'),

  status_toggleEnabled: import('./status-toggle-enabled.js'),
  status_setPrompt: import('./status-set-prompt.js'),
  status_toggleStream: import('./status-toggle-stream.js'),

  user_setSlackToken: import('./user-set-slack-token.js'),

  migrate_fixupLabelParents: import('./migrate-fixup-label-parents.js'),

  danger_deleteAllData: import('./danger-delete-all-data.js'),
}

export { mutators }
