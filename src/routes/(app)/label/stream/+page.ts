import { redirect } from '@sveltejs/kit'

import type { PageLoad } from './$types'

import { getStreamList } from '#lib/core/select/get-stream-list.js'

const load = (async (event) => {
  const { parent } = event
  const { store } = await parent()

  const streamList = getStreamList(store).value
  const streamId = streamList.at(0)?.id

  if (streamId) {
    redirect(302, `/label/stream/${streamId}`)
  }
}) satisfies PageLoad

export { load }
