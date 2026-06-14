export type PromotionDuration = '7_days' | '14_days' | '30_days'
export type PromotionChannelCode = 'LAUNCH_PACK' | 'SOCIAL_INFLUENCER' | 'NEWSLETTER'
export type PromotionStatus = 'pending' | 'approved' | 'active' | 'expired' | 'rejected' | 'cancelled'
export type PromotionDeliveryStatus = 'pending' | 'scheduled' | 'active' | 'delivered' | 'cancelled'

export type PromotionRate = {
  id: number
  channelCode: PromotionChannelCode
  duration: PromotionDuration
  priceAmount: string
  currency: string
  isActive: boolean
  updatedAt: string
}

export type PromotionCampaignChannel = {
  id: number
  channelCode: PromotionChannelCode
  priceAmount: string
  deliveryStatus: PromotionDeliveryStatus
  isFeatured: boolean
  adminBrief: string | null
  scheduledAt: string | null
  deliveredAt: string | null
  impressions: number
  clicks: number
  ctr: number
}

export type PromotionCampaign = {
  id: number
  event: { id: number; title: string; status: string }
  organizer: { id: number; firstName: string; lastName: string; email: string }
  status: PromotionStatus
  duration: PromotionDuration
  startsAt: string
  endsAt: string
  totalPrice: string
  currency: string
  adminComment: string | null
  approvedAt: string | null
  rejectedAt: string | null
  paidAt: string | null
  createdAt: string
  channels: PromotionCampaignChannel[]
  stats: {
    impressions: number
    clicks: number
    ctr: number
    breakdown: Array<{
      placement: 'homepage' | 'explorer' | 'detail' | 'newsletter' | 'social'
      impressions: number
      clicks: number
      ctr: number
    }>
  }
  canPay: boolean
}

export type PromotionOptions = {
  durations: PromotionDuration[]
  channels: PromotionChannelCode[]
  rates: PromotionRate[]
  launchPack: { capacity: number; available: boolean }
}

export type PromotionCampaignsResponse = {
  items: PromotionCampaign[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}
