import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  getOrganizerPromotions,
  startPromotionCheckout,
} from '../../api/promotions'
import { AdminPagination } from '../../components/AdminPagination/AdminPagination'
import type { PromotionCampaign } from '../../types/promotion'
import {
  PromotionActions,
  PromotionBadge,
  PromotionButton,
  PromotionCard,
  PromotionCardTitle,
  PromotionList,
  PromotionMessage,
  PromotionMeta,
  PromotionPage,
  PromotionPageHeader,
  PromotionPageText,
  PromotionPageTitle,
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

function apiMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
    if (message) return String(message)
  }
  return 'Impossible de charger les campagnes Booster.'
}

export function OrganizerPromotionsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<number | null>(null)
  const payment = searchParams.get('payment')
  const returnedCampaignId = Number(searchParams.get('campaignId'))

  useEffect(() => {
    let mounted = true

    getCurrentUser(true)
      .then(async (user) => {
        if (!user) {
          navigate('/auth?mode=login&intent=organizer', { replace: true })
          return null
        }

        if (user.role !== 'ROLE_ORGANIZER' && user.role !== 'ROLE_ADMIN') {
          navigate('/organizer-access', { replace: true })
          return null
        }

        return getOrganizerPromotions(page, 10)
      })
      .then((data) => {
        if (!mounted || !data) return
        setCampaigns(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      })
      .catch(() => {
        if (!mounted) return

        navigate('/auth?mode=login&intent=organizer', { replace: true })
      })

    return () => { mounted = false }
  }, [navigate, page])

  useEffect(() => {
    let mounted = true

    const refreshCampaigns = async () => {
      try {
        const data = await getOrganizerPromotions(page, 10)
        if (!mounted) return

        setCampaigns(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } catch {
        // The main loader already handles authentication and visible errors.
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshCampaigns()
      }
    }

    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    const intervalId = window.setInterval(refreshWhenVisible, 3000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [page])

  async function pay(campaignId: number) {
    setPayingId(campaignId)
    setError(null)

    try {
      window.location.assign(await startPromotionCheckout(campaignId))
    } catch (nextError) {
      setError(apiMessage(nextError))
      setPayingId(null)
    }
  }

  return (
    <PromotionPage>
      <PromotionPageHeader>
        <div>
          <PromotionPageTitle>Mes campagnes Booster</PromotionPageTitle>
          <PromotionPageText>Retrouve la validation, le paiement et les informations ajoutées par EventFlow.</PromotionPageText>
        </div>
      </PromotionPageHeader>

      {payment === 'cancelled' ? <PromotionMessage $error>Paiement annulé. La campagne reste disponible au paiement.</PromotionMessage> : null}
      {payment === 'success' && Number.isInteger(returnedCampaignId) && returnedCampaignId > 0 ? (
        <PromotionMessage>
          Paiement terminé côté Stripe. EventFlow attend maintenant le webhook signé pour confirmer la campagne.
        </PromotionMessage>
      ) : null}
      {error ? <PromotionMessage $error>{error}</PromotionMessage> : null}

      <PromotionList>
        {campaigns.map((campaign) => (
            <PromotionCard key={campaign.id}>
              <div>
                <PromotionCardTitle>{campaign.event.title}</PromotionCardTitle>
                <PromotionMeta>{campaign.channels.map((channel) => channelLabels[channel.channelCode]).join(' + ')}</PromotionMeta>
                <PromotionMeta>
                  {campaign.duration.replace('_days', ' jours')} - {' '}
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: campaign.currency }).format(Number(campaign.totalPrice))}
                </PromotionMeta>
              </div>

              <div>
                <PromotionBadge $status={campaign.status}>{statusLabels[campaign.status]}</PromotionBadge>
                <PromotionMeta>{campaign.stats.impressions} impressions - {campaign.stats.clicks} clics - CTR {campaign.stats.ctr}%</PromotionMeta>
              </div>

              <PromotionActions>
                {campaign.canPay ? (
                  <PromotionButton type="button" disabled={payingId === campaign.id} onClick={() => void pay(campaign.id)}>
                    {payingId === campaign.id ? 'REDIRECTION...' : 'PAYER'}
                  </PromotionButton>
                ) : null}
                {campaign.paidAt ? (
                  <PromotionButton type="button" onClick={() => navigate(`/organizer/promotions/${campaign.id}`)}>
                    SUIVRE
                  </PromotionButton>
                ) : null}
                {campaign.status === 'pending' ? (
                  <PromotionMeta>En attente de la validation EventFlow</PromotionMeta>
                ) : null}
                {campaign.status === 'rejected' ? (
                  <PromotionMeta>Demande refusée</PromotionMeta>
                ) : null}
              </PromotionActions>
            </PromotionCard>
        ))}

        {campaigns.length === 0 && !error ? <PromotionMessage>Aucune campagne pour le moment.</PromotionMessage> : null}
      </PromotionList>

      <AdminPagination
        page={page}
        pageSize={10}
        totalItems={total}
        totalPages={totalPages}
        itemLabel="campagnes"
        onPageChange={setPage}
      />
    </PromotionPage>
  )
}
