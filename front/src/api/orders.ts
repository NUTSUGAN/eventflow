import { apiClient } from './client'
import type {
  OrderCheckoutSessionResponse,
  PendingOrdersResponse,
  OrderPreparationPayload,
  OrderPreparationResponse,
  OrderSummaryResponse,
  OrderHistoryResponse,
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

export async function getMyOrders(): Promise<OrderHistoryResponse> {
  const response = await apiClient.get<OrderHistoryResponse>('/api/me/orders')
  return response.data
}

export async function getOrder(orderId: number): Promise<OrderSummaryResponse> {
  const response = await apiClient.get<OrderSummaryResponse>(`/api/orders/${orderId}`)

  return response.data
}

export async function getPendingOrders(): Promise<PendingOrdersResponse> {
  const response = await apiClient.get<PendingOrdersResponse>('/api/orders/pending')

  return response.data
}

export async function createStripeCheckoutSession(
  orderId: number,
): Promise<OrderCheckoutSessionResponse> {
  const response = await apiClient.post<OrderCheckoutSessionResponse>(
    `/api/orders/${orderId}/checkout-session`,
  )

  return response.data
}
