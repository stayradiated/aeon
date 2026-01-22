import type { Attachment } from 'svelte/attachments'

const isNode = (node: unknown): node is Node => {
  return typeof node === 'object' && node !== null && 'nodeType' in node
}

const eventOutside = <EventType extends keyof DocumentEventMap>(
  eventType: EventType,
  onEventOutside: (event: DocumentEventMap[EventType]) => void,
): Attachment<HTMLElement> => {
  return (node: Node) => {
    const handleEvent = (event: DocumentEventMap[EventType]) => {
      if (
        node &&
        isNode(event.target) &&
        !node.contains(event.target) &&
        !event.defaultPrevented
      ) {
        onEventOutside(event)
      }
    }
    document.addEventListener(eventType, handleEvent, true)

    return () => {
      // cleanup when component is unmounted
      document.removeEventListener(eventType, handleEvent, true)
    }
  }
}

const clickOutside = (onEventOutside: (event: MouseEvent) => void) => {
  return eventOutside('click', onEventOutside)
}

export { clickOutside }
