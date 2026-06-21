import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getAdminPromotion, updatePromotionChannel } from '../../api/promotions'
import type {
  PromotionCampaign,
  PromotionDeliveryStatus,
} from '../../types/promotion'
import {
  AdminPromotionActions,
  AdminPromotionButton,
  AdminPromotionCard,
  AdminPromotionCardHeader,
  AdminPromotionCardTitle,
  AdminPromotionChannel,
  AdminPromotionChannelGrid,
  AdminPromotionCheckbox,
  AdminPromotionField,
  AdminPromotionHeader,
  AdminPromotionMessage,
  AdminPromotionMeta,
  AdminPromotionPage,
  AdminPromotionSelect,
  AdminPromotionStat,
  AdminPromotionStats,
  AdminPromotionText,
  AdminPromotionTextarea,
  AdminPromotionTitle,
} from './adminPromotionsPageElements'

const channelLabels: Record<string, string> = {
  LAUNCH_PACK: 'Pack Lancement',
  SOCIAL_INFLUENCER: 'Social / influenceurs',
  NEWSLETTER: 'Newsletter',
}

type ChannelDraft = {
  adminBrief: string
  deliveryStatus: PromotionDeliveryStatus
  isFeatured: boolean
}

function apiMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
    if (message) return String(message)
  }
  return 'Impossible de charger ce suivi Booster.'
}

function draftsFrom(campaign: PromotionCampaign): Record<number, ChannelDraft> {
  return Object.fromEntries(campaign.channels.map((channel) => [
    channel.id,
    {
      adminBrief: channel.adminBrief ?? '',
      deliveryStatus: channel.deliveryStatus,
      isFeatured: channel.isFeatured,
    },
  ]))
}

export function AdminPromotionDetailPage() {
  const navigate = useNavigate()
  const { promotionId } = useParams()
  const campaignId = Number(promotionId)
  const [campaign, setCampaign] = useState<PromotionCampaign | null>(null)
  const [drafts, setDrafts] = useState<Record<number, ChannelDraft>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    if (!Number.isInteger(campaignId) || campaignId < 1) {
      navigate('/admin/promotions', { replace: true })
      return () => { mounted = false }
    }

    void (async () => {
      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }
      } catch {
        navigate('/auth?mode=login', { replace: true })
        return
      }

      try {
        const data = await getAdminPromotion(campaignId)
        if (!mounted) return
        setCampaign(data)
        setDrafts(draftsFrom(data))
      } catch (nextError) {
        if (mounted) setError(apiMessage(nextError))
      }
    })()

    return () => { mounted = false }
  }, [campaignId, navigate])

  async function saveChannel(channelId: number) {
    const draft = drafts[channelId]
    if (!draft || !campaign) return

    setBusyId(channelId)
    setError(null)
    setMessage(null)

    try {
      const updated = await updatePromotionChannel(campaign.id, channelId, draft)
      setCampaign(updated)
      setDrafts(draftsFrom(updated))
      setMessage('Suivi enregistré. L’organisateur voit maintenant ces informations.')
    } catch (nextError) {
      setError(apiMessage(nextError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminPromotionPage>
      <AdminPromotionActions>
        <AdminPromotionButton type="button" onClick={() => navigate('/admin/promotions')}>
          Retour cux campagnes
        </AdminPromotionButton>
      </AdminPromotionActions>

      <AdminPromotionHeader>
        <div>
          <AdminPromotionTitle>Suivi de la campagne</AdminPromotionTitle>
          <AdminPromotionText>Le contenu enregistré ici est visible par l’organisateur.</AdminPromotionText>
        </div>
      </AdminPromotionHeader>

      {message ? <AdminPromotionMessage>{message}</AdminPromotionMessage> : null}
      {error ? <AdminPromotionMessage $error>{error}</AdminPromotionMessage> : null}
      {!campaign && !error ? <AdminPromotionMessage>Chargement du suivi...</AdminPromotionMessage> : null}

      {campaign ? (
        <AdminPromotionCard>
          <AdminPromotionCardHeader>
            <div>
              <AdminPromotionCardTitle>{campaign.event.title}</AdminPromotionCardTitle>
              <AdminPromotionMeta>
                {campaign.organizer.firstName} {campaign.organizer.lastName} - {campaign.organizer.email}
              </AdminPromotionMeta>
              <AdminPromotionMeta>
                Campagne #{campaign.id} - {campaign.duration.replace('_days', ' jours')} - {campaign.totalPrice} {campaign.currency}
              </AdminPromotionMeta>
            </div>
            <strong>{campaign.status}</strong>
          </AdminPromotionCardHeader>

          <AdminPromotionStats>
            <AdminPromotionStat>{campaign.stats.impressions} impressions</AdminPromotionStat>
            <AdminPromotionStat>{campaign.stats.clicks} clics</AdminPromotionStat>
            <AdminPromotionStat>CTR {campaign.stats.ctr}%</AdminPromotionStat>
          </AdminPromotionStats>

          {campaign.status !== 'active' ? (
            <AdminPromotionMessage>Le suivi devient modifiable après confirmation du paiement.</AdminPromotionMessage>
          ) : null}

          <AdminPromotionChannelGrid>
            {campaign.channels.map((channel) => {
              const draft = drafts[channel.id]
              if (!draft) return null

              return (
                <AdminPromotionChannel key={channel.id}>
                  <AdminPromotionCardTitle>{channelLabels[channel.channelCode]}</AdminPromotionCardTitle>
                  <AdminPromotionField>
                    <span>Information visible par l’organisateur</span>
                    <AdminPromotionTextarea
                      value={draft.adminBrief}
                      disabled={campaign.status !== 'active'}
                      onChange={(event) => setDrafts((current) => ({
                        ...current,
                        [channel.id]: { ...draft, adminBrief: event.target.value },
                      }))}
                      placeholder="Planning, lien https://..., audience, consignes..."
                    />
                  </AdminPromotionField>
                  <AdminPromotionField>
                    <span>État de diffusion</span>
                    <AdminPromotionSelect
                      value={draft.deliveryStatus}
                      disabled={campaign.status !== 'active'}
                      onChange={(event) => setDrafts((current) => ({
                        ...current,
                        [channel.id]: {
                          ...draft,
                          deliveryStatus: event.target.value as PromotionDeliveryStatus,
                        },
                      }))}
                    >
                      <option value="pending">En attente</option>
                      <option value="scheduled">Planifié</option>
                      <option value="active">En diffusion</option>
                      <option value="delivered">Livré</option>
                      <option value="cancelled">Annulé</option>
                    </AdminPromotionSelect>
                  </AdminPromotionField>
                  {channel.channelCode === 'LAUNCH_PACK' ? (
                    <AdminPromotionCheckbox>
                      <input
                        type="checkbox"
                        checked={draft.isFeatured}
                        disabled={campaign.status !== 'active'}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [channel.id]: { ...draft, isFeatured: event.target.checked },
                        }))}
                      />
                      Mettre cet évènement en avant sur l’accueil et Explorer
                    </AdminPromotionCheckbox>
                  ) : null}
                  <AdminPromotionButton
                    type="button"
                    disabled={campaign.status !== 'active' || busyId === channel.id}
                    onClick={() => void saveChannel(channel.id)}
                  >
                    {busyId === channel.id ? 'Enregistrement...' : 'Enregistrer le suivi'}
                  </AdminPromotionButton>
                </AdminPromotionChannel>
              )
            })}
          </AdminPromotionChannelGrid>
        </AdminPromotionCard>
      ) : null}
    </AdminPromotionPage>
  )
}
