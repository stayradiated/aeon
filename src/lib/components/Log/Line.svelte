<script lang="ts">
import { computed } from 'signia'

import type { Store } from '#lib/core/replicache/store.js'
import type { Line } from '#lib/core/shape/types.js'

import { formatDuration } from '#lib/utils/format-duration.js'
import { watch } from '#lib/utils/watch.svelte.js'

type Props = {
  store: Store
  line: Line
}

const { store, line }: Props = $props()

const { _: labelList } = $derived(
  watch(
    computed('labelList', () => {
      const labelList = line.labelIdList.flatMap((labelId) => {
        return store.label.get(labelId).value ?? []
      })
      return labelList
    }),
  ),
)
</script>

{labelList.map((label) =>
  (label.icon ? label.icon + ' ' : '') + label.name
).join(', ')}

<br />

<code>{formatDuration(line.durationMs)}</code>
