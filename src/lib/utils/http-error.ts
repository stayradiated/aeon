const errorResponse = (status: number, error: Error | string): Response => {
  return new Response(
    JSON.stringify({
      error: typeof error === 'string' ? error : error.message,
    }),
    { status },
  )
}

export { errorResponse }
