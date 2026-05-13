import { apiClient } from './client'
import type {
  OrderPreparationPayload,
  OrderPreparationResponse,
} from '../types/order'

export async function prepareOrder(
  payload: OrderPreparationPayload,
): Promise<OrderPreparationResponse> {
  const response = await apiClient.post<OrderPreparationResponse>(
    '/api/orders/prepare',
    payload,
  )

  return response.data
}
