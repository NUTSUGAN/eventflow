import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getOrganizerWithdrawal } from '../../api/withdrawals'
import type { WithdrawalStatus, WithdrawalSummary } from '../../types/withdrawal'
import {
  OrganizerDashboardActions,
  OrganizerDashboardBadge,
  OrganizerDashboardEyebrow,
  OrganizerDashboardGrid,
  OrganizerDashboardHeader,
  OrganizerDashboardHeaderText,
  OrganizerDashboardMessage,
  OrganizerDashboardMetric,
  OrganizerDashboardMetricHint,
  OrganizerDashboardMetricLabel,
  OrganizerDashboardMetricValue,
  OrganizerDashboardPanel,
  OrganizerDashboardPanelHeader,
  OrganizerDashboardPanelTitle,
  OrganizerDashboardSecondaryButton,
  OrganizerDashboardSection,
  OrganizerDashboardText,
  OrganizerDashboardTitle,
} from '../OrganizerDashboardPage/organizerDashboardPageElements'
import styled from 'styled-components'

const statusLabels: Record<WithdrawalStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  paid: 'Payé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'À définir'
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
  status: WithdrawalStatus,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
    case 'approved':
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

function payoutTitle(withdrawal: WithdrawalSummary): string {
  if (!withdrawal.payout) {
    return 'Aucun moyen copié'
  }

  return withdrawal.payout.label ?? (
    withdrawal.payout.type === 'bank' ? 'Compte bancaire' : 'Mobile Money'
  )
}

export function OrganizerWithdrawalDetailPage() {
  const navigate = useNavigate()
  const { withdrawalId } = useParams()
  const [withdrawal, setWithdrawal] = useState<WithdrawalSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const parsedWithdrawalId = Number(withdrawalId)

      if (!Number.isInteger(parsedWithdrawalId) || parsedWithdrawalId <= 0) {
        navigate('/organizer/withdrawals', { replace: true })
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ORGANIZER' && user.role !== 'ROLE_ADMIN') {
          navigate('/organizer-access', { replace: true })
          return
        }

        const response = await getOrganizerWithdrawal(parsedWithdrawalId)

        if (!isMounted) {
          return
        }

        setWithdrawal(response.withdrawal)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login&intent=organizer', { replace: true })
          return
        }

        setErrorMessage(
          readApiMessage(error, 'Impossible de charger ce suivi de retrait.'),
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
  }, [navigate, withdrawalId])

  const currency = withdrawal?.currency ?? 'EUR'

  return (
    <OrganizerDashboardSection>
      <OrganizerDashboardHeader>
        <OrganizerDashboardHeaderText>
          <OrganizerDashboardEyebrow>Espace organisateur</OrganizerDashboardEyebrow>
          <OrganizerDashboardTitle>Suivi du retrait</OrganizerDashboardTitle>
          <OrganizerDashboardText>
            Consulte la réponse EventFlow, les montants validés et les informations
            de paiement de ta demande.
          </OrganizerDashboardText>
        </OrganizerDashboardHeaderText>
        <OrganizerDashboardActions>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/withdrawals')}
          >
            Retour aux retraits
          </OrganizerDashboardSecondaryButton>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
          >
            Tableau de bord
          </OrganizerDashboardSecondaryButton>
        </OrganizerDashboardActions>
      </OrganizerDashboardHeader>

      {isLoading ? (
        <OrganizerDashboardMessage $tone="neutral">
          Chargement du suivi...
        </OrganizerDashboardMessage>
      ) : null}

      {errorMessage ? (
        <OrganizerDashboardMessage $tone="danger">{errorMessage}</OrganizerDashboardMessage>
      ) : null}

      {withdrawal ? (
        <>
          <OrganizerDashboardPanel>
            <OrganizerDashboardPanelHeader>
              <div>
                <OrganizerDashboardPanelTitle>
                  {withdrawal.event.title ?? 'Événement'}
                </OrganizerDashboardPanelTitle>
                <OrganizerDashboardText>
                  Demande #{withdrawal.id} - envoyée le {formatDate(withdrawal.requestedAt)}
                </OrganizerDashboardText>
              </div>
              <OrganizerDashboardBadge $tone={statusTone(withdrawal.status)}>
                {statusLabels[withdrawal.status]}
              </OrganizerDashboardBadge>
            </OrganizerDashboardPanelHeader>

            <OrganizerDashboardGrid>
              <OrganizerDashboardMetric>
                <OrganizerDashboardMetricLabel>CA brut</OrganizerDashboardMetricLabel>
                <OrganizerDashboardMetricValue>
                  {formatCurrency(withdrawal.grossAmount, currency)}
                </OrganizerDashboardMetricValue>
                <OrganizerDashboardMetricHint>Commandes payées</OrganizerDashboardMetricHint>
              </OrganizerDashboardMetric>
              <OrganizerDashboardMetric>
                <OrganizerDashboardMetricLabel>Frais EventFlow</OrganizerDashboardMetricLabel>
                <OrganizerDashboardMetricValue>
                  {formatCurrency(withdrawal.feeAmount, currency)}
                </OrganizerDashboardMetricValue>
                <OrganizerDashboardMetricHint>
                  {Number(withdrawal.feePercent).toLocaleString('fr-FR')} %
                </OrganizerDashboardMetricHint>
              </OrganizerDashboardMetric>
              <OrganizerDashboardMetric>
                <OrganizerDashboardMetricLabel>Net à verser</OrganizerDashboardMetricLabel>
                <OrganizerDashboardMetricValue>
                  {formatCurrency(withdrawal.netAmount, currency)}
                </OrganizerDashboardMetricValue>
                <OrganizerDashboardMetricHint>Après frais</OrganizerDashboardMetricHint>
              </OrganizerDashboardMetric>
              <OrganizerDashboardMetric>
                <OrganizerDashboardMetricLabel>Dernière mise à jour</OrganizerDashboardMetricLabel>
                <OrganizerDashboardMetricValue>
                  {formatDate(withdrawal.updatedAt)}
                </OrganizerDashboardMetricValue>
                <OrganizerDashboardMetricHint>Suivi EventFlow</OrganizerDashboardMetricHint>
              </OrganizerDashboardMetric>
            </OrganizerDashboardGrid>
          </OrganizerDashboardPanel>

          <OrganizerDashboardPanel>
            <OrganizerDashboardPanelHeader>
              <div>
                <OrganizerDashboardPanelTitle>Message EventFlow</OrganizerDashboardPanelTitle>
                <OrganizerDashboardText>
                  Les informations ajoutées par l’admin apparaissent ici.
                </OrganizerDashboardText>
              </div>
            </OrganizerDashboardPanelHeader>

            {withdrawal.adminNote ? (
              <WithdrawalNote>{withdrawal.adminNote}</WithdrawalNote>
            ) : (
              <OrganizerDashboardMessage $tone="neutral">
                Aucun message admin pour le moment.
              </OrganizerDashboardMessage>
            )}
          </OrganizerDashboardPanel>

          <OrganizerDashboardPanel>
            <OrganizerDashboardPanelHeader>
              <div>
                <OrganizerDashboardPanelTitle>Moyen de retrait utilisé</OrganizerDashboardPanelTitle>
                <OrganizerDashboardText>
                  Coordonnées copiées au moment de la demande.
                </OrganizerDashboardText>
              </div>
            </OrganizerDashboardPanelHeader>

            {withdrawal.payout ? (
              <WithdrawalPayoutGrid>
                <WithdrawalInfo>
                  <span>Type</span>
                  <strong>{payoutTitle(withdrawal)}</strong>
                </WithdrawalInfo>
                {withdrawal.payout.type === 'bank' ? (
                  <>
                    <WithdrawalInfo>
                      <span>Titulaire</span>
                      <strong>{withdrawal.payout.bank.holderName ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                    <WithdrawalInfo>
                      <span>IBAN</span>
                      <strong>{withdrawal.payout.bank.iban ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                    <WithdrawalInfo>
                      <span>BIC</span>
                      <strong>{withdrawal.payout.bank.bic ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                    <WithdrawalInfo>
                      <span>Banque</span>
                      <strong>{withdrawal.payout.bank.bankName ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                  </>
                ) : (
                  <>
                    <WithdrawalInfo>
                      <span>Titulaire</span>
                      <strong>{withdrawal.payout.mobileMoney.name ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                    <WithdrawalInfo>
                      <span>Numero</span>
                      <strong>{withdrawal.payout.mobileMoney.phone ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                    <WithdrawalInfo>
                      <span>Operateur</span>
                      <strong>{withdrawal.payout.mobileMoney.provider ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                    <WithdrawalInfo>
                      <span>Pays</span>
                      <strong>{withdrawal.payout.mobileMoney.country ?? 'À définir'}</strong>
                    </WithdrawalInfo>
                  </>
                )}
              </WithdrawalPayoutGrid>
            ) : (
              <OrganizerDashboardMessage $tone="neutral">
                Cette ancienne demande ne contient pas encore de moyen de retrait copié.
              </OrganizerDashboardMessage>
            )}
          </OrganizerDashboardPanel>

          <OrganizerDashboardPanel>
            <OrganizerDashboardPanelHeader>
              <div>
                <OrganizerDashboardPanelTitle>Traitement</OrganizerDashboardPanelTitle>
                <OrganizerDashboardText>
                  Suis les étapes principales de la demande jusqu’au paiement.
                </OrganizerDashboardText>
              </div>
            </OrganizerDashboardPanelHeader>

            <WithdrawalTimeline>
              <WithdrawalStep>
                <strong>Demande envoyée</strong>
                <span>{formatDate(withdrawal.requestedAt)}</span>
              </WithdrawalStep>
              <WithdrawalStep>
                <strong>Réponse EventFlow</strong>
                <span>{withdrawal.reviewedAt ? formatDate(withdrawal.reviewedAt) : 'En attente'}</span>
              </WithdrawalStep>
              <WithdrawalStep>
                <strong>Paiement</strong>
                <span>{withdrawal.paidAt ? formatDate(withdrawal.paidAt) : 'À définir'}</span>
              </WithdrawalStep>
            </WithdrawalTimeline>

            <WithdrawalInfoGrid>
              <WithdrawalInfo>
                <span>Référence de paiement</span>
                <strong>{withdrawal.paymentReference ?? 'À définir'}</strong>
              </WithdrawalInfo>
              <WithdrawalInfo>
                <span>Fin de l’événement</span>
                <strong>{formatDate(withdrawal.event.endDatetime)}</strong>
              </WithdrawalInfo>
            </WithdrawalInfoGrid>

            {withdrawal.status === 'paid' ? (
              <OrganizerDashboardMessage $tone="success">
                Le retrait est marqué comme payé par EventFlow.
              </OrganizerDashboardMessage>
            ) : null}
            {withdrawal.status === 'rejected' ? (
              <OrganizerDashboardMessage $tone="danger">
                La demande a été refusée. Consulte le message EventFlow ci-dessus.
              </OrganizerDashboardMessage>
            ) : null}
          </OrganizerDashboardPanel>
        </>
      ) : null}
    </OrganizerDashboardSection>
  )
}

const WithdrawalNote = styled.div`
  padding: 18px;
  border-radius: 14px;
  background: rgba(235, 148, 81, 0.1);
  border: 1px solid rgba(235, 148, 81, 0.24);
  color: #fff4ea;
  line-height: 1.65;
  white-space: pre-wrap;
`

const WithdrawalTimeline = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalStep = styled.div`
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);

  strong {
    color: #fff8f2;
  }

  span {
    color: rgba(255, 237, 222, 0.68);
  }
`

const WithdrawalInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalPayoutGrid = styled(WithdrawalInfoGrid)`
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalInfo = styled.div`
  display: grid;
  gap: 5px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);

  span {
    color: rgba(255, 237, 222, 0.58);
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  strong {
    color: #fff8f2;
    overflow-wrap: anywhere;
  }
`
