import { apiClient } from './client'

export type ContactPayload = {
  name: string
  email: string
  category: string
  subject: string
  message: string
}

export type ContactResponse = {
  message: string
}

export async function sendContactMessage(
  payload: ContactPayload,
): Promise<ContactResponse> {
  const response = await apiClient.post<ContactResponse>('/api/contact', payload)
  return response.data
}
