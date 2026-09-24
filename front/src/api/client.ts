import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

let csrfRequest: Promise<string> | null = null

apiClient.interceptors.request.use(async (config) => {
  if (['get', 'head', 'options'].includes((config.method ?? 'get').toLowerCase())) {
    return config
  }

  // Share concurrent token requests, but refresh after session changes such as logout.
  csrfRequest ??= apiClient.get<{ token: string }>('/api/csrf-token')
    .then(({ data }) => data.token)
    .finally(() => { csrfRequest = null })
  config.headers.set('X-CSRF-Token', await csrfRequest)
  return config
})

export function getBackendPublicUrl(): string {
  return import.meta.env.VITE_BACKEND_PUBLIC_URL ?? 'http://localhost:8080'
}
