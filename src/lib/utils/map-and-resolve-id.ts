type Identifiable<Id> = { id: Id }

const NAME: unique symbol = Symbol('name')

type IdMap<Id> = Map<Id, Id> & {
  [NAME]: string
}

const newIdMap = <Id extends string>(
  name: string,
  values: [Id, Id][] = [],
): IdMap<Id> =>
  Object.assign(new Map(values), {
    [NAME]: name,
  })

const createIdMap = <Id extends string>(
  name: string,
  listA: Identifiable<Id>[] = [],
  listB: Array<Identifiable<Id> | undefined> = [],
): IdMap<Id> => {
  if (listA.length !== listB.length) {
    throw new Error('Lists must be the same length')
  }
  const map = newIdMap<Id>(name)
  for (let i = 0; i < listA.length; i++) {
    const listAItem = listA[i]
    if (!listAItem) {
      throw new Error(`List A item at index ${i} is undefined`)
    }
    const idA = listAItem.id
    const idB = listB[i]
    if (typeof idB === 'undefined') {
      continue
    }
    map.set(idA, idB.id)
  }
  return map
}

const resolveId = <Id extends string>(map: IdMap<Id>, id: Id): Id | Error => {
  const mappedId = map.get(id)
  if (!mappedId) {
    const mapName = map[NAME]
    return new Error(`Could not find ${mapName} with ID "${id}"`)
  }
  return mappedId
}

const maybeResolveId = <Id extends string>(
  map: IdMap<Id>,
  id: Id | null,
): Id | null | Error => {
  if (typeof id === 'string') {
    return resolveId(map, id)
  }
  return null
}

export { createIdMap, resolveId, maybeResolveId }
export type { IdMap }
