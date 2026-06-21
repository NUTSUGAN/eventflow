import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { getCurrentUser } from '../../api/auth'
import { getAdminWithdrawal, updateAdminWithdrawal } from '../../api/withdrawals'
import type {
  AdminWithdrawalUpdatePayload,
  WithdrawalStatus,
  WithdrawalSummary,
} from '../../types/withdrawal'
import {
  AdminDashboardActions,
  AdminDashboardBadge,
  AdminDashboardEyebrow,
  AdminDashboardField,
  AdminDashboardGrid,
  AdminDashboardHeader,
  AdminDashboardHeaderText,
  AdminDashboardInput,
  AdminDashboardLabel,
  AdminDashboardMessage,
  AdminDashboardMetric,
  AdminDashboardMetricLabel,
  AdminDashboardMetricValue,
  AdminDashboardPanel,
  AdminDashboardPanelHeader,
  AdminDashboardPanelTitle,
  AdminDashboardPrimaryButton,
  AdminDashboardSecondaryButton,
  AdminDashboardSection,
  AdminDashboardSelect,
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

type Draft = {
  status: WithdrawalStatus
  feePercent: string
  adminNote: string
  paymentReference: string
}

const statusLabels: Record<WithdrawalStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  paid: 'Payé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
}

function buildDraft(withdrawal: WithdrawalSummary): Draft {
  return {
    status: withdrawal.status,
    feePercent: withdrawal.feePercent,
    adminNote: withdrawal.adminNote ?? '',
    paymentReference: withdrawal.paymentReference ?? '',
  }
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
    return 'Non renseigne'
  }

  return withdrawal.payout.label ?? (
    withdrawal.payout.type === 'bank' ? 'Compte bancaire' : 'Mobile Money'
  )
}

export function AdminWithdrawalDetailPage() {
  const navigate = useNavigate()
  const { withdrawalId } = useParams()
  const [withdrawal, setWithdrawal] = useState<WithdrawalSummary | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const parsedWithdrawalId = Number(withdrawalId)

      if (!Number.isInteger(parsedWithdrawalId) || parsedWithdrawalId <= 0) {
        navigate('/admin/withdrawals', { replace: true })
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const response = await getAdminWithdrawal(parsedWithdrawalId)

        if (!isMounted) {
          return
        }

        setWithdrawal(response.withdrawal)
        setDraft(buildDraft(response.withdrawal))
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login', { replace: true })
          return
        }

        setErrorMessage(
          readApiMessage(error, 'Impossible de charger cette demande de retrait.'),
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

  async function saveWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!withdrawal || !draft || isSaving) {
      return
    }

    const payload: AdminWithdrawalUpdatePayload = {
      status: draft.status,
      feePercent: draft.feePercent,
      adminNote: draft.adminNote,
      paymentReference: draft.paymentReference,
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateAdminWithdrawal(withdrawal.id, payload)
      setWithdrawal(response.withdrawal)
      setDraft(buildDraft(response.withdrawal))
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, 'Impossible de mettre à jour cette demande.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  const currency = withdrawal?.currency ?? 'EUR'

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Demande de retrait</AdminDashboardTitle>
          <AdminDashboardText>
            Traite une seule demande, avec les coordonnées de paiement figées au
            moment de la demande.
          </AdminDashboardText>
        </AdminDashboardHeaderText>
        <AdminDashboardActions>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/withdrawals')}
          >
            Retour aux retraits
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin')}>
            Console admin
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      {isLoading ? (
        <AdminDashboardMessage $tone="neutral">
          Chargement de la demande...
        </AdminDashboardMessage>
      ) : null}
      {statusMessage ? (
        <AdminDashboardMessage $tone="success">{statusMessage}</AdminDashboardMessage>
      ) : null}
      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}

      {withdrawal && draft ? (
        <>
          <AdminDashboardPanel>
            <AdminDashboardPanelHeader>
              <div>
                <AdminDashboardPanelTitle>
                  Demande #{withdrawal.id} - {withdrawal.event.title ?? 'Événement'}
                </AdminDashboardPanelTitle>
                <AdminDashboardText>
                  {withdrawal.organizer.fullName ?? 'Organisateur'} -{' '}
                  {withdrawal.organizer.email ?? 'email inconnu'}
                </AdminDashboardText>
                <AdminDashboardText>
                  Envoyée le {formatDate(withdrawal.requestedAt)}
                </AdminDashboardText>
              </div>
              <AdminDashboardBadge $tone={statusTone(withdrawal.status)}>
                {statusLabels[withdrawal.status]}
              </AdminDashboardBadge>
            </AdminDashboardPanelHeader>

            <AdminDashboardGrid>
              <AdminDashboardMetric>
                <AdminDashboardMetricLabel>CA brut</AdminDashboardMetricLabel>
                <AdminDashboardMetricValue>
                  {formatCurrency(withdrawal.grossAmount, currency)}
                </AdminDashboardMetricValue>
              </AdminDashboardMetric>
              <AdminDashboardMetric>
                <AdminDashboardMetricLabel>Frais</AdminDashboardMetricLabel>
                <AdminDashboardMetricValue>
                  {formatCurrency(withdrawal.feeAmount, currency)}
                </AdminDashboardMetricValue>
              </AdminDashboardMetric>
              <AdminDashboardMetric>
                <AdminDashboardMetricLabel>Taux</AdminDashboardMetricLabel>
                <AdminDashboardMetricValue>
                  {Number(withdrawal.feePercent).toLocaleString('fr-FR')} %
                </AdminDashboardMetricValue>
              </AdminDashboardMetric>
              <AdminDashboardMetric>
                <AdminDashboardMetricLabel>Net à verser</AdminDashboardMetricLabel>
                <AdminDashboardMetricValue>
                  {formatCurrency(withdrawal.netAmount, currency)}
                </AdminDashboardMetricValue>
              </AdminDashboardMetric>
            </AdminDashboardGrid>
          </AdminDashboardPanel>

          <AdminDashboardPanel>
            <AdminDashboardPanelHeader>
              <div>
                <AdminDashboardPanelTitle>Moyen de paiement à utiliser</AdminDashboardPanelTitle>
                <AdminDashboardText>
                  Ces données sont celles copiées dans la demande. Elles ne changent pas
                  si l'organisateur modifie ensuite sa banque.
                </AdminDashboardText>
              </div>
            </AdminDashboardPanelHeader>

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
              <AdminDashboardMessage $tone="neutral">
                Cette demande ne contient pas encore de moyen de retrait copié.
              </AdminDashboardMessage>
            )}
          </AdminDashboardPanel>

          <AdminDashboardPanel>
            <AdminDashboardPanelHeader>
              <div>
                <AdminDashboardPanelTitle>Traitement EventFlow</AdminDashboardPanelTitle>
                <AdminDashboardText>
                  Mets à jour le statut, les frais, la référence et la note visible par
                  l'organisateur.
                </AdminDashboardText>
              </div>
            </AdminDashboardPanelHeader>

            <WithdrawalForm onSubmit={saveWithdrawal}>
              <WithdrawalFormGrid>
                <AdminDashboardField>
                  <AdminDashboardLabel>Statut</AdminDashboardLabel>
                  <AdminDashboardSelect
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft({ status: event.target.value as WithdrawalStatus })
                    }
                  >
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="paid">Payé</option>
                    <option value="rejected">Refusé</option>
                    <option value="cancelled">Annulé</option>
                  </AdminDashboardSelect>
                </AdminDashboardField>

                <AdminDashboardField>
                  <AdminDashboardLabel>Frais %</AdminDashboardLabel>
                  <AdminDashboardInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={draft.feePercent}
                    onChange={(event) => updateDraft({ feePercent: event.target.value })}
                  />
                </AdminDashboardField>

                <AdminDashboardField>
                  <AdminDashboardLabel>Référence paiement</AdminDashboardLabel>
                  <AdminDashboardInput
                    value={draft.paymentReference}
                    onChange={(event) =>
                      updateDraft({ paymentReference: event.target.value })
                    }
                    placeholder="Virement, Stripe, banque..."
                  />
                </AdminDashboardField>
              </WithdrawalFormGrid>

              <AdminDashboardField>
                <AdminDashboardLabel>Note visible par l'organisateur</AdminDashboardLabel>
                <WithdrawalTextarea
                  value={draft.adminNote}
                  onChange={(event) => updateDraft({ adminNote: event.target.value })}
                  placeholder="Montant verifie, date prevue, remarque de traitement..."
                />
              </AdminDashboardField>

              <WithdrawalActions>
                <AdminDashboardPrimaryButton type="submit" disabled={isSaving}>
                  {isSaving ? 'Enregistrement...' : 'Enregistrer la demande'}
                </AdminDashboardPrimaryButton>
              </WithdrawalActions>
            </WithdrawalForm>
          </AdminDashboardPanel>

          <AdminDashboardPanel>
            <AdminDashboardPanelHeader>
              <div>
                <AdminDashboardPanelTitle>Suivi</AdminDashboardPanelTitle>
                <AdminDashboardText>
                  Repère les dates importantes sans ouvrir la fiche événement.
                </AdminDashboardText>
              </div>
            </AdminDashboardPanelHeader>

            <WithdrawalInfoGrid>
              <WithdrawalInfo>
                <span>Demande envoyée</span>
                <strong>{formatDate(withdrawal.requestedAt)}</strong>
              </WithdrawalInfo>
              <WithdrawalInfo>
                <span>Derniere revue</span>
                <strong>{formatDate(withdrawal.reviewedAt)}</strong>
              </WithdrawalInfo>
              <WithdrawalInfo>
                <span>Paiement</span>
                <strong>{formatDate(withdrawal.paidAt)}</strong>
              </WithdrawalInfo>
              <WithdrawalInfo>
                <span>Fin de l'événement</span>
                <strong>{formatDate(withdrawal.event.endDatetime)}</strong>
              </WithdrawalInfo>
              <WithdrawalInfo>
                <span>Référence paiement</span>
                <strong>{withdrawal.paymentReference ?? 'À définir'}</strong>
              </WithdrawalInfo>
            </WithdrawalInfoGrid>
          </AdminDashboardPanel>
        </>
      ) : null}
    </AdminDashboardSection>
  )
}

const WithdrawalForm = styled.form`
  display: grid;
  gap: 14px;
`

const WithdrawalFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalTextarea = styled.textarea`
  width: 100%;
  min-height: 118px;
  resize: vertical;
  padding: 13px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fffaf4;
  font: inherit;
  line-height: 1.5;
  outline: none;

  &:focus {
    border-color: rgba(235, 148, 81, 0.68);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.12);
  }
`

const WithdrawalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`

const WithdrawalInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalPayoutGrid = styled(WithdrawalInfoGrid)`
  grid-template-columns: repeat(5, minmax(0, 1fr));

  @media (max-width: 1100px) {
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
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);

  span {
    color: rgba(255, 237, 222, 0.62);
    font-size: 0.74rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  strong {
    color: #fff8f2;
    overflow-wrap: anywhere;
  }
`
