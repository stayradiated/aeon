<script lang="ts">
import type { Store } from '#lib/core/replicache/store.js'
import type { Line } from '#lib/core/shape/types.js'

import { formatDuration } from '#lib/utils/format-duration.js'
import { query } from '#lib/utils/query.js'

type Props = {
  store: Store
  line: Line
}

const { store, line }: Props = $props()

const { labelList } = $derived(
  query(() => {
    const labelList = line.labelIdList.flatMap((labelId) => {
      return store.label.get(labelId).value ?? []
    })
    return { labelList }
  }),
)
</script>

{labelList.map((label) =>
  (label.icon ? label.icon + ' ' : '') + label.name
).join(', ')}

<br />

<code>{formatDuration(line.durationMs)}</code>
