import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  createOrganizerWithdrawal,
  getOrganizerWithdrawals,
} from '../../api/withdrawals'
import type {
  OrganizerWithdrawalCandidate,
  WithdrawalStatus,
} from '../../types/withdrawal'
import {
  OrganizerDashboardActions,
  OrganizerDashboardBadge,
  OrganizerDashboardEyebrow,
  OrganizerDashboardHeader,
  OrganizerDashboardHeaderText,
  OrganizerDashboardList,
  OrganizerDashboardMessage,
  OrganizerDashboardMiniMetric,
  OrganizerDashboardMiniMetricLabel,
  OrganizerDashboardMiniMetricValue,
  OrganizerDashboardPanel,
  OrganizerDashboardPanelHeader,
  OrganizerDashboardPanelTitle,
  OrganizerDashboardPrimaryButton,
  OrganizerDashboardRow,
  OrganizerDashboardRowActions,
  OrganizerDashboardRowMain,
  OrganizerDashboardRowStats,
  OrganizerDashboardRowText,
  OrganizerDashboardRowTitle,
  OrganizerDashboardSecondaryButton,
  OrganizerDashboardSection,
  OrganizerDashboardText,
  OrganizerDashboardTitle,
} from '../OrganizerDashboardPage/organizerDashboardPageElements'

const statusLabels: Record<WithdrawalStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  paid: 'Payé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Date à confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(amount: string | number | null, currency: string): string {
  const numericAmount = Number(amount ?? 0)

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0)
}

function statusTone(
  status: WithdrawalStatus | 'available',
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
    case 'approved':
    case 'available':
      return 'warning'
    case 'rejected':
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

function readApiMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
  ) {
    return String(
      (error as { response?: { data?: { message?: unknown } } }).response?.data?.message,
    )
  }

  return fallback
}

export function OrganizerWithdrawalsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<OrganizerWithdrawalCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [requestingEventId, setRequestingEventId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ORGANIZER' && user.role !== 'ROLE_ADMIN') {
          navigate('/organizer-access', { replace: true })
          return
        }

        const response = await getOrganizerWithdrawals()

        if (!isMounted) {
          return
        }

        setItems(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login&intent=organizer', { replace: true })
          return
        }

        setErrorMessage(
          readApiMessage(error, 'Impossible de charger les retraits.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function requestWithdrawal(item: OrganizerWithdrawalCandidate) {
    const eventId = item.event.id

    if (!eventId || requestingEventId !== null) {
      return
    }

    setRequestingEventId(eventId)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await createOrganizerWithdrawal(eventId)
      const refreshed = await getOrganizerWithdrawals()

      setItems(refreshed.items)
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, 'Impossible de créer cette demande de retrait.'),
      )
    } finally {
      setRequestingEventId(null)
    }
  }

  return (
    <OrganizerDashboardSection>
      <OrganizerDashboardHeader>
        <OrganizerDashboardHeaderText>
          <OrganizerDashboardEyebrow>Espace organisateur</OrganizerDashboardEyebrow>
          <OrganizerDashboardTitle>Retraits</OrganizerDashboardTitle>
          <OrganizerDashboardText>
            Demande un retrait après la fin d’un événement et suis le traitement
            réalisé par EventFlow.
          </OrganizerDashboardText>
        </OrganizerDashboardHeaderText>
        <OrganizerDashboardActions>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
          >
            Tableau de bord
          </OrganizerDashboardSecondaryButton>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/events')}
          >
            Mes événements
          </OrganizerDashboardSecondaryButton>
        </OrganizerDashboardActions>
      </OrganizerDashboardHeader>

      {statusMessage ? (
        <OrganizerDashboardMessage $tone="success">{statusMessage}</OrganizerDashboardMessage>
      ) : null}
      {errorMessage ? (
        <OrganizerDashboardMessage $tone="danger">{errorMessage}</OrganizerDashboardMessage>
      ) : null}
      {isLoading ? (
        <OrganizerDashboardMessage $tone="neutral">
          Chargement des retraits...
        </OrganizerDashboardMessage>
      ) : null}

      <OrganizerDashboardPanel>
        <OrganizerDashboardPanelHeader>
          <div>
            <OrganizerDashboardPanelTitle>Événements éligibles</OrganizerDashboardPanelTitle>
            <OrganizerDashboardText>
              Seuls les événements terminés avec des commandes payées peuvent
              générer une demande.
            </OrganizerDashboardText>
          </div>
        </OrganizerDashboardPanelHeader>

        {!isLoading && items.length === 0 ? (
          <OrganizerDashboardMessage $tone="neutral">
            Aucun événement terminé avec ventes payées n’est disponible pour un retrait.
          </OrganizerDashboardMessage>
        ) : null}

        <OrganizerDashboardList>
          {items.map((item) => {
            const withdrawal = item.withdrawal
            const status = withdrawal?.status ?? 'available'
            const currency = item.amounts.currency

            return (
              <OrganizerDashboardRow key={item.event.id ?? withdrawal?.id}>
                <OrganizerDashboardRowMain>
                  <OrganizerDashboardBadge $tone={statusTone(status)}>
                    {withdrawal ? statusLabels[withdrawal.status] : 'Disponible'}
                  </OrganizerDashboardBadge>
                  <OrganizerDashboardRowTitle>
                    {item.event.title ?? 'Événement'}
                  </OrganizerDashboardRowTitle>
                  <OrganizerDashboardRowText>
                    Fin : {formatDate(item.event.endDatetime ?? item.event.startDatetime)}
                  </OrganizerDashboardRowText>
                  <OrganizerDashboardRowText>
                    {item.amounts.paidOrders} commande(s) payée(s) -{' '}
                    {item.amounts.ticketsSold} billet(s) vendu(s)
                  </OrganizerDashboardRowText>
                  {withdrawal?.adminNote ? (
                    <OrganizerDashboardRowText>
                      Note EventFlow : {withdrawal.adminNote}
                    </OrganizerDashboardRowText>
                  ) : null}
                  {withdrawal?.paymentReference ? (
                    <OrganizerDashboardRowText>
                      Référence de paiement : {withdrawal.paymentReference}
                    </OrganizerDashboardRowText>
                  ) : null}
                  {withdrawal?.paidAt ? (
                    <OrganizerDashboardRowText>
                      Payé le {formatDate(withdrawal.paidAt)}
                    </OrganizerDashboardRowText>
                  ) : null}
                </OrganizerDashboardRowMain>

                <OrganizerDashboardRowStats>
                  <OrganizerDashboardMiniMetric>
                    <OrganizerDashboardMiniMetricLabel>CA brut</OrganizerDashboardMiniMetricLabel>
                    <OrganizerDashboardMiniMetricValue>
                      {formatCurrency(item.amounts.grossAmount, currency)}
                    </OrganizerDashboardMiniMetricValue>
                  </OrganizerDashboardMiniMetric>
                  <OrganizerDashboardMiniMetric>
                    <OrganizerDashboardMiniMetricLabel>Frais</OrganizerDashboardMiniMetricLabel>
                    <OrganizerDashboardMiniMetricValue>
                      {formatCurrency(item.amounts.feeAmount, currency)}
                    </OrganizerDashboardMiniMetricValue>
                  </OrganizerDashboardMiniMetric>
                  <OrganizerDashboardMiniMetric>
                    <OrganizerDashboardMiniMetricLabel>Taux</OrganizerDashboardMiniMetricLabel>
                    <OrganizerDashboardMiniMetricValue>
                      {Number(item.amounts.feePercent).toLocaleString('fr-FR')} %
                    </OrganizerDashboardMiniMetricValue>
                  </OrganizerDashboardMiniMetric>
                  <OrganizerDashboardMiniMetric>
                    <OrganizerDashboardMiniMetricLabel>Net</OrganizerDashboardMiniMetricLabel>
                    <OrganizerDashboardMiniMetricValue>
                      {formatCurrency(item.amounts.netAmount, currency)}
                    </OrganizerDashboardMiniMetricValue>
                  </OrganizerDashboardMiniMetric>
                </OrganizerDashboardRowStats>

                <OrganizerDashboardRowActions>
                  {withdrawal ? (
                    <OrganizerDashboardSecondaryButton
                      type="button"
                      onClick={() => navigate(`/organizer/withdrawals/${withdrawal.id}`)}
                    >
                      Suivre
                    </OrganizerDashboardSecondaryButton>
                  ) : null}
                  {item.canRequest ? (
                    <OrganizerDashboardPrimaryButton
                      type="button"
                      disabled={requestingEventId === item.event.id}
                      onClick={() => void requestWithdrawal(item)}
                    >
                      {requestingEventId === item.event.id
                        ? 'Envoi...'
                        : withdrawal
                          ? 'Nouvelle demande'
                          : 'Demander un retrait'}
                    </OrganizerDashboardPrimaryButton>
                  ) : !withdrawal ? (
                    <OrganizerDashboardSecondaryButton type="button" disabled>
                      Indisponible
                    </OrganizerDashboardSecondaryButton>
                  ) : null}
                </OrganizerDashboardRowActions>
              </OrganizerDashboardRow>
            )
          })}
        </OrganizerDashboardList>
      </OrganizerDashboardPanel>
    </OrganizerDashboardSection>
  )
}
