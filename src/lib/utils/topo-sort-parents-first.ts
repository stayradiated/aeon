/**
 * Sort a list of items so that parents are listed before children.
 */

type TopoSortParentsFirstOptions<T, Id> = {
  items: readonly T[]
  getId: (item: T) => Id
  getParentIdList: (item: T) => readonly Id[]
}

const topoSortParentsFirst = <T, Id extends string>(
  options: TopoSortParentsFirstOptions<T, Id>,
): T[] | Error => {
  const { items, getId, getParentIdList } = options

  // 1) Index by ID and validate uniqueness
  const byId = {} as Record<Id, T>
  for (const item of items) {
    const id = getId(item)
    if (id in byId) {
      return new Error(`Duplicate ID: ${id}`)
    }
    byId[id] = item
  }

  // 2) Build graph: parent → children, plus indegree counts
  const childrenByParent = {} as Record<Id, Id[]>
  const inDegree = {} as Record<Id, number>
  for (const item of items) {
    const id = getId(item)
    childrenByParent[id] = []
    inDegree[id] = 0
  }
  for (const child of items) {
    const childId = getId(child)
    for (const parentId of getParentIdList(child)) {
      if (!(parentId in byId)) {
        return new Error(`Missing parent: ${parentId}`)
      }
      childrenByParent[parentId].push(childId)
      inDegree[childId] += 1
    }
  }

  // 3) Queue all nodes with 0 incoming edges
  const queue: Id[] = []
  for (const item of items) {
    const id = getId(item)
    if (inDegree[id] === 0) {
      queue.push(id)
    }
  }

  // 4) Pop from queue, emit item, "remove" it's outgoing edges
  const result: T[] = []
  let i = 0
  while (i < queue.length) {
    const id = queue[i]
    if (typeof id === 'undefined') {
      throw new Error('Internal error: queue item is undefined')
    }

    const item = byId[id]
    if (typeof item === 'undefined') {
      throw new Error('Internal error: item is undefined')
    }

    result.push(item)

    const childIdList = childrenByParent[id]
    if (typeof childIdList === 'undefined') {
      throw new Error('Internal error: childIdList is undefined')
    }

    for (const childId of childIdList) {
      let degree = inDegree[childId]
      if (typeof degree === 'undefined') {
        throw new Error('Internal error: degree is undefined')
      }

      degree -= 1
      inDegree[childId] = degree
      if (degree === 0) {
        queue.push(childId)
      }
    }

    i += 1
  }

  // 5) If not everything was popped, there was a cycle
  if (result.length !== items.length) {
    return new Error('Cycle detected')
  }

  return result
}

export { topoSortParentsFirst }
