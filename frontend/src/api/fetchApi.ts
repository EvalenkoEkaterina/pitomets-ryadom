export async function fetchApi(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch (error) {
    if (!(error instanceof TypeError)) throw error

    throw new Error('Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте ещё раз.', {
      cause: error,
    })
  }
}
