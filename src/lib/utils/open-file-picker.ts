type OpenFilePickerOptions = {
  accept?: string
  multiple?: boolean

  // if set, on devices with a camera, the user will be prompted to allow
  // access to the camera instead of the file picker
  capture?: 'user' | 'environment' | undefined
}

const openFilePicker = async (
  options: OpenFilePickerOptions = {},
): Promise<readonly File[]> => {
  const { accept = '*/*', capture, multiple = true } = options

  const { resolve, promise } = Promise.withResolvers<readonly File[]>()

  let input: HTMLInputElement | undefined

  input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = multiple

  if (capture) {
    input.capture = capture
  }

  input.addEventListener(
    'change',
    () => {
      const fileList = Array.from(input?.files ?? [])
      input?.remove()
      input = undefined

      resolve(fileList)
    },
    {
      once: true,
    },
  )

  input.click()

  return promise
}

export type { OpenFilePickerOptions }

export { openFilePicker }
