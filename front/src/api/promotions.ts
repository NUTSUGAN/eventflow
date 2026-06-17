import { apiClient } from './client'
import type {
  PromotionCampaign,
  PromotionCampaignsResponse,
  PromotionChannelCode,
  PromotionDeliveryStatus,
  PromotionDuration,
  PromotionOptions,
  PromotionRate,
  PromotionStatus,
} from '../types/promotion'

export async function getPromotionOptions(eventId: number, duration: PromotionDuration): Promise<PromotionOptions> {
  const response = await apiClient.get<PromotionOptions>(
    `/api/organizer/events/${eventId}/promotions/options`,
    { params: { duration } },
  )
  return response.data
}

export async function createPromotionCampaign(
  eventId: number,
  payload: { duration: PromotionDuration; channels: PromotionChannelCode[] },
): Promise<PromotionCampaign> {
  const response = await apiClient.post<{ campaign: PromotionCampaign }>(
    `/api/organizer/events/${eventId}/promotions`,
    payload,
  )
  return response.data.campaign
}

export async function getOrganizerPromotions(
  page = 1,
  pageSize = 10,
): Promise<PromotionCampaignsResponse> {
  const response = await apiClient.get<PromotionCampaignsResponse>('/api/organizer/promotions', {
    params: { page, pageSize, _: Date.now() },
  })
  return response.data
}

export async function getOrganizerPromotion(campaignId: number): Promise<PromotionCampaign> {
  const response = await apiClient.get<PromotionCampaign>(`/api/organizer/promotions/${campaignId}`, {
    params: { _: Date.now() },
  })
  return response.data
}

export async function startPromotionCheckout(campaignId: number): Promise<string> {
  const response = await apiClient.post<{ checkoutUrl: string }>(
    `/api/organizer/promotions/${campaignId}/checkout`,
  )
  return response.data.checkoutUrl
}

export async function getAdminPromotions(
  page = 1,
  pageSize = 20,
  status?: PromotionStatus,
): Promise<PromotionCampaignsResponse> {
  const response = await apiClient.get<PromotionCampaignsResponse>('/api/admin/promotions', {
    params: { page, pageSize, status },
  })
  return response.data
}

export async function getAdminPromotion(campaignId: number): Promise<PromotionCampaign> {
  const response = await apiClient.get<PromotionCampaign>(`/api/admin/promotions/${campaignId}`)
  return response.data
}

export async function approvePromotion(campaignId: number, adminComment: string): Promise<PromotionCampaign> {
  const response = await apiClient.patch<{ campaign: PromotionCampaign }>(
    `/api/admin/promotions/${campaignId}/approve`,
    { adminComment },
  )
  return response.data.campaign
}

export async function rejectPromotion(campaignId: number, adminComment: string): Promise<PromotionCampaign> {
  const response = await apiClient.patch<{ campaign: PromotionCampaign }>(
    `/api/admin/promotions/${campaignId}/reject`,
    { adminComment },
  )
  return response.data.campaign
}

export async function updatePromotionChannel(
  campaignId: number,
  channelId: number,
  payload: { deliveryStatus: PromotionDeliveryStatus; adminBrief?: string; isFeatured?: boolean },
): Promise<PromotionCampaign> {
  const response = await apiClient.patch<{ campaign: PromotionCampaign }>(
    `/api/admin/promotions/${campaignId}/channels/${channelId}`,
    payload,
  )
  return response.data.campaign
}

export async function getPromotionRates(): Promise<PromotionRate[]> {
  const response = await apiClient.get<{ items: PromotionRate[] }>('/api/admin/promotions/rates')
  return response.data.items
}

export async function updatePromotionRate(rateId: number, priceAmount: string): Promise<void> {
  await apiClient.patch(`/api/admin/promotions/rates/${rateId}`, { priceAmount })
}

export async function trackPromotionMetric(
  campaignId: number,
  metric: 'impression' | 'click',
  placement: 'homepage' | 'explorer' | 'detail',
): Promise<void> {
  await apiClient.post(`/api/promotions/${campaignId}/metrics`, { metric, placement })
}
