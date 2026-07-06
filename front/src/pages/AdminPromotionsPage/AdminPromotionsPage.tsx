import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { canManageAdminContent, canManageAdminFinance } from '../../auth/adminPermissions'
import {
  approvePromotion,
  getAdminPromotions,
  getPromotionRates,
  rejectPromotion,
  updatePromotionRate,
} from '../../api/promotions'
import { AdminPagination } from '../../components/AdminPagination/AdminPagination'
import type {
  PromotionCampaign,
  PromotionRate,
  PromotionStatus,
} from '../../types/promotion'
import {
  AdminPromotionActions,
  AdminPromotionButton,
  AdminPromotionCard,
  AdminPromotionCardHeader,
  AdminPromotionCardTitle,
  AdminPromotionFilter,
  AdminPromotionFilters,
  AdminPromotionHeader,
  AdminPromotionInput,
  AdminPromotionLayout,
  AdminPromotionList,
  AdminPromotionMessage,
  AdminPromotionMeta,
  AdminPromotionPage,
  AdminPromotionRate,
  AdminPromotionSide,
  AdminPromotionStat,
  AdminPromotionStats,
  AdminPromotionText,
  AdminPromotionTitle,
} from './adminPromotionsPageElements'

const filters: Array<{ value?: PromotionStatus; label: string }> = [
  { label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'À payer' },
  { value: 'active', label: 'Payées / en suivi' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'expired', label: 'Terminées' },
]

const channelLabels: Record<string, string> = {
  LAUNCH_PACK: 'Pack Lancement',
  SOCIAL_INFLUENCER: 'Social / influenceurs',
  NEWSLETTER: 'Newsletter',
}

function apiMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
    if (message) return String(message)
  }
  return 'Une opération Booster a échoué.'
}

export function AdminPromotionsPage() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([])
  const [rates, setRates] = useState<PromotionRate[]>([])
  const [rateValues, setRateValues] = useState<Record<number, string>>({})
  const [comments, setComments] = useState<Record<number, string>>({})
  const [status, setStatus] = useState<PromotionStatus | undefined>()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canEditRates, setCanEditRates] = useState(false)

  function applyData(campaignData: Awaited<ReturnType<typeof getAdminPromotions>>, rateData: PromotionRate[]) {
    setCampaigns(campaignData.items)
    setTotal(campaignData.total)
    setTotalPages(campaignData.totalPages)
    setRates(rateData)
    setRateValues(Object.fromEntries(rateData.map((rate) => [rate.id, rate.priceAmount])))
  }

  async function load(includeRates = canEditRates) {
    const [campaignData, rateData] = await Promise.all([
      getAdminPromotions(page, 20, status),
      includeRates ? getPromotionRates() : Promise.resolve([]),
    ])
    applyData(campaignData, rateData)
  }

  useEffect(() => {
    let mounted = true

    getCurrentUser(true)
      .then((user) => {
        if (!canManageAdminContent(user)) {
          navigate('/account', { replace: true })
          return null
        }
        const nextCanEditRates = canManageAdminFinance(user)
        setCanEditRates(nextCanEditRates)
        return Promise.all([
          getAdminPromotions(page, 20, status),
          nextCanEditRates ? getPromotionRates() : Promise.resolve([]),
        ])
      })
      .then((data) => {
        if (!mounted || !data) return
        applyData(data[0], data[1])
      })
      .catch(() => { if (mounted) navigate('/auth?mode=login', { replace: true }) })

    return () => { mounted = false }
  }, [navigate, page, status])

  async function review(campaign: PromotionCampaign, decision: 'approve' | 'reject') {
    setBusyId(campaign.id)
    setError(null)
    setMessage(null)

    try {
      if (decision === 'approve') await approvePromotion(campaign.id, comments[campaign.id] ?? '')
      else await rejectPromotion(campaign.id, comments[campaign.id] ?? '')
      setMessage(decision === 'approve' ? 'Campagne approuvée. Un email a été envoyé.' : 'Campagne refusée. Un email a été envoyé.')
      await load()
    } catch (nextError) {
      setError(apiMessage(nextError))
    } finally {
      setBusyId(null)
    }
  }

  async function saveRate(rateId: number) {
    if (!canEditRates) {
      return
    }

    setBusyId(rateId)
    setError(null)

    try {
      await updatePromotionRate(rateId, rateValues[rateId] ?? '')
      setMessage('Tarif mis à jour.')
      await load()
    } catch (nextError) {
      setError(apiMessage(nextError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminPromotionPage>
      <AdminPromotionHeader>
        <div>
          <AdminPromotionTitle>Campagnes Booster</AdminPromotionTitle>
          <AdminPromotionText>Valide les demandes, pilote chaque canal et partagé les informations de suivi.</AdminPromotionText>
        </div>
      </AdminPromotionHeader>

      <AdminPromotionFilters>
        {filters.map((filter) => (
          <AdminPromotionFilter
            key={filter.label}
            type="button"
            $active={status === filter.value}
            onClick={() => { setStatus(filter.value); setPage(1) }}
          >
            {filter.label}
          </AdminPromotionFilter>
        ))}
      </AdminPromotionFilters>

      {message ? <AdminPromotionMessage>{message}</AdminPromotionMessage> : null}
      {error ? <AdminPromotionMessage $error>{error}</AdminPromotionMessage> : null}

      <AdminPromotionLayout>
        <div>
          <AdminPromotionList>
            {campaigns.map((campaign) => (
                <AdminPromotionCard key={campaign.id}>
                  <AdminPromotionCardHeader>
                    <div>
                      <AdminPromotionCardTitle>{campaign.event.title}</AdminPromotionCardTitle>
                      <AdminPromotionMeta>{campaign.organizer.firstName} {campaign.organizer.lastName} - {campaign.organizer.email}</AdminPromotionMeta>
                      <AdminPromotionMeta>
                        {campaign.channels.map((channel) => channelLabels[channel.channelCode]).join(' + ')} - {' '}
                        {campaign.duration.replace('_days', ' j')} - {campaign.totalPrice} {campaign.currency}
                      </AdminPromotionMeta>
                    </div>
                    <strong>{campaign.status}</strong>
                  </AdminPromotionCardHeader>

                  <AdminPromotionStats>
                    <AdminPromotionStat>{campaign.stats.impressions} impressions</AdminPromotionStat>
                    <AdminPromotionStat>{campaign.stats.clicks} clics</AdminPromotionStat>
                    <AdminPromotionStat>CTR {campaign.stats.ctr}%</AdminPromotionStat>
                  </AdminPromotionStats>

                  {campaign.status === 'pending' ? (
                    <>
                      <AdminPromotionInput
                        value={comments[campaign.id] ?? ''}
                        onChange={(event) => setComments((current) => ({ ...current, [campaign.id]: event.target.value }))}
                        placeholder="Commentaire admin ou motif de refus"
                      />
                      <AdminPromotionActions>
                        <AdminPromotionButton type="button" disabled={busyId === campaign.id} onClick={() => void review(campaign, 'approve')}>Approuver</AdminPromotionButton>
                        <AdminPromotionButton $danger type="button" disabled={busyId === campaign.id} onClick={() => void review(campaign, 'reject')}>Refuser</AdminPromotionButton>
                      </AdminPromotionActions>
                    </>
                  ) : null}

                  {campaign.paidAt ? (
                    <AdminPromotionActions>
                      <AdminPromotionButton type="button" onClick={() => navigate(`/admin/promotions/${campaign.id}`)}>
                        Ouvrir le suivi
                      </AdminPromotionButton>
                    </AdminPromotionActions>
                  ) : null}

                  {campaign.status === 'approved' ? (
                    <AdminPromotionMeta>En attente du paiement de l’organisateur.</AdminPromotionMeta>
                  ) : null}
                </AdminPromotionCard>
            ))}

            {campaigns.length === 0 ? <AdminPromotionMessage>Aucune campagne pour ce filtre.</AdminPromotionMessage> : null}
          </AdminPromotionList>

          <AdminPagination page={page} pageSize={20} totalItems={total} totalPages={totalPages} itemLabel="campagnes" onPageChange={setPage} />
        </div>

        {canEditRates ? (
        <AdminPromotionSide>
          <AdminPromotionCardTitle>Grille tarifaire</AdminPromotionCardTitle>
          <AdminPromotionText>Ces prix servent aux nouvelles campagnes. Les campagnes existantes gardent leur tarif.</AdminPromotionText>
          {rates.map((rate) => (
            <AdminPromotionRate key={rate.id}>
              <span>{channelLabels[rate.channelCode]} - {rate.duration.replace('_days', ' j')}</span>
              <AdminPromotionInput
                value={rateValues[rate.id] ?? ''}
                onChange={(event) => setRateValues((current) => ({ ...current, [rate.id]: event.target.value }))}
                onBlur={() => void saveRate(rate.id)}
                aria-label={`Tarif ${channelLabels[rate.channelCode]} ${rate.duration}`}
              />
            </AdminPromotionRate>
          ))}
        </AdminPromotionSide>
        ) : null}
      </AdminPromotionLayout>
    </AdminPromotionPage>
  )
}
