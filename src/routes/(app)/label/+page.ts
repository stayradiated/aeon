import { redirect } from '@sveltejs/kit'

import type { PageLoad } from './$types'

const load = (async (_event) => {
  throw redirect(302, '/label/stream')
}) satisfies PageLoad

export { load }
