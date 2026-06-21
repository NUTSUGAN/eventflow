import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getOrganizerPromotion } from '../../api/promotions'
import type { PromotionCampaign } from '../../types/promotion'
import {
  PromotionActions,
  PromotionBadge,
  PromotionButton,
  PromotionChannel,
  PromotionChannelHead,
  PromotionBrief,
  PromotionDetailCard,
  PromotionDetailGrid,
  PromotionMessage,
  PromotionMeta,
  PromotionMetric,
  PromotionMetrics,
  PromotionPage,
  PromotionPageHeader,
  PromotionPageText,
  PromotionPageTitle,
  PromotionSummary,
} from './organizerPromotionsPageElements'

const statusLabels: Record<string, string> = {
  pending: 'En attente de validation',
  approved: 'À payer',
  active: 'Paiement confirmé',
  expired: 'Terminée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
}

const channelLabels: Record<string, string> = {
  LAUNCH_PACK: 'Pack Lancement',
  SOCIAL_INFLUENCER: 'Réseaux / influenceurs',
  NEWSLETTER: 'Newsletter',
}

const deliveryLabels: Record<string, string> = {
  pending: 'En attente',
  scheduled: 'Planifié',
  active: 'En diffusion',
  delivered: 'Livré',
  cancelled: 'Annulé',
}

function apiMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
    if (message) return String(message)
  }
  return 'Impossible de charger ce suivi Booster.'
}

function formatDate(value: string | null): string {
  if (!value) return 'À définir'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function linkedBrief(value: string | null) {
  const text = value ?? 'L’équipe EventFlow ajoutera ici les informations de diffusion.'
  const parts = text.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi)

  return parts.map((part, index) => {
    if (!/^(https?:\/\/|www\.)/i.test(part)) return part

    const href = part.startsWith('www.') ? `https://${part}` : part
    return <a key={`${href}-${index}`} href={href} target="_blank" rel="noreferrer">{part}</a>
  })
}

export function OrganizerPromotionDetailPage() {
  const navigate = useNavigate()
  const { promotionId } = useParams()
  const [searchParams] = useSearchParams()
  const campaignId = Number(promotionId)
  const [campaign, setCampaign] = useState<PromotionCampaign | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    if (!Number.isInteger(campaignId) || campaignId < 1) {
      navigate('/organizer/promotions', { replace: true })
      return () => { mounted = false }
    }

    void (async () => {
      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ORGANIZER' && user.role !== 'ROLE_ADMIN') {
          navigate('/organizer-access', { replace: true })
          return
        }
      } catch {
        navigate('/auth?mode=login&intent=organizer', { replace: true })
        return
      }

      try {
        const data = await getOrganizerPromotion(campaignId)
        if (mounted) setCampaign(data)
      } catch (nextError) {
        if (mounted) setError(apiMessage(nextError))
      }
    })()

    return () => { mounted = false }
  }, [campaignId, navigate])

  return (
    <PromotionPage>
      <PromotionActions>
        <PromotionButton type="button" onClick={() => navigate('/organizer/promotions')}>
          Retour cux campagnes
        </PromotionButton>
      </PromotionActions>

      <PromotionPageHeader>
        <div>
          <PromotionPageTitle>Suivi de ma campagne</PromotionPageTitle>
          <PromotionPageText>Consulte les informations de diffusion’ajoutées par l’équipe EventFlow.</PromotionPageText>
        </div>
      </PromotionPageHeader>

      {searchParams.get('payment') === 'success' ? (
        <PromotionMessage>Paiement confirmé. Ta campagne est maintenant prise en charge par EventFlow.</PromotionMessage>
      ) : null}
      {error ? <PromotionMessage $error>{error}</PromotionMessage> : null}
      {!campaign && !error ? <PromotionMessage>Chargement du suivi...</PromotionMessage> : null}

      {campaign ? (
        <PromotionDetailCard>
          <PromotionSummary>
            <div>
              <PromotionPageTitle>{campaign.event.title}</PromotionPageTitle>
              <PromotionMeta>
                Campagne #{campaign.id} - {campaign.channels.map((channel) => channelLabels[channel.channelCode]).join(' + ')}
              </PromotionMeta>
              <PromotionMeta>
                {campaign.duration.replace('_days', ' jours')} - {' '}
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: campaign.currency }).format(Number(campaign.totalPrice))}
              </PromotionMeta>
            </div>
            <PromotionBadge $status={campaign.status}>{statusLabels[campaign.status]}</PromotionBadge>
          </PromotionSummary>

          {campaign.adminComment ? <PromotionMessage>{campaign.adminComment}</PromotionMessage> : null}

          <PromotionDetailGrid>
            {campaign.channels.map((channel) => (
              <PromotionChannel key={channel.id}>
                <PromotionChannelHead>
                  <strong>{channelLabels[channel.channelCode]}</strong>
                  <PromotionBadge $status={channel.deliveryStatus}>{deliveryLabels[channel.deliveryStatus]}</PromotionBadge>
                </PromotionChannelHead>
                <PromotionBrief>{linkedBrief(channel.adminBrief)}</PromotionBrief>
                <PromotionMeta>Planification : {formatDate(channel.scheduledAt)}</PromotionMeta>
                <PromotionMeta>Livraison : {formatDate(channel.deliveredAt)}</PromotionMeta>
                {channel.channelCode === 'LAUNCH_PACK' ? (
                  <PromotionMeta>{channel.isFeatured ? 'Mise en avant publique activée.' : 'Mise en avant publique pas encore activée.'}</PromotionMeta>
                ) : null}
              </PromotionChannel>
            ))}
          </PromotionDetailGrid>

          <PromotionMetrics>
            <PromotionMetric><strong>{campaign.stats.impressions}</strong><span>Impressions</span></PromotionMetric>
            <PromotionMetric><strong>{campaign.stats.clicks}</strong><span>Clics</span></PromotionMetric>
            <PromotionMetric><strong>{campaign.stats.ctr}%</strong><span>CTR global</span></PromotionMetric>
          </PromotionMetrics>
        </PromotionDetailCard>
      ) : null}
    </PromotionPage>
  )
}
