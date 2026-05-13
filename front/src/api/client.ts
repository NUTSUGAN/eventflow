import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export function getBackendPublicUrl(): string {
  return import.meta.env.VITE_BACKEND_PUBLIC_URL ?? 'http://localhost:8080'
}
