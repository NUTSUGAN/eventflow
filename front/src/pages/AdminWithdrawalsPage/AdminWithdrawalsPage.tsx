import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getCurrentUser } from '../../api/auth'
import {
  getAdminWithdrawals,
  updateAdminWithdrawal,
  updateAdminWithdrawalSettings,
} from '../../api/withdrawals'
import type {
  AdminWithdrawalSettings,
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
  AdminDashboardList,
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
  AdminDashboardTab,
  AdminDashboardTabs,
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

type Draft = {
  status: WithdrawalStatus
  feePercent: string
  adminNote: string
  paymentReference: string
}

const filters: Array<{ status?: WithdrawalStatus; label: string }> = [
  { label: 'Toutes' },
  { status: 'pending', label: 'En attente' },
  { status: 'approved', label: 'Approuvées' },
  { status: 'paid', label: 'Payées' },
  { status: 'rejected', label: 'Refusées' },
]

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
    return 'Date à définir'
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

export function AdminWithdrawalsPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState<WithdrawalStatus | undefined>()
  const [items, setItems] = useState<WithdrawalSummary[]>([])
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [settings, setSettings] = useState<AdminWithdrawalSettings | null>(null)
  const [defaultFeePercent, setDefaultFeePercent] = useState('0.00')
  const [isLoading, setIsLoading] = useState(true)
  const [savingSetting, setSavingSetting] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const response = await getAdminWithdrawals(activeStatus)

        if (!isMounted) {
          return
        }

        applyResponse(response.items, response.settings)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login', { replace: true })
          return
        }

        setErrorMessage(readApiMessage(error, 'Impossible de charger les retraits.'))
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
  }, [activeStatus, navigate])

  const totals = useMemo(() => {
    return items.reduce(
      (accumulator, withdrawal) => {
        accumulator.gross += Number(withdrawal.grossAmount)
        accumulator.fees += Number(withdrawal.feeAmount)
        accumulator.net += Number(withdrawal.netAmount)

        if (withdrawal.status === 'pending') {
          accumulator.pending += 1
        }

        return accumulator
      },
      { gross: 0, fees: 0, net: 0, pending: 0 },
    )
  }, [items])

  function applyResponse(
    nextItems: WithdrawalSummary[],
    nextSettings: AdminWithdrawalSettings,
  ) {
    setItems(nextItems)
    setSettings(nextSettings)
    setDefaultFeePercent(nextSettings.defaultFeePercent)
    setDrafts(Object.fromEntries(nextItems.map((item) => [item.id, buildDraft(item)])))
  }

  async function reload() {
    const response = await getAdminWithdrawals(activeStatus)
    applyResponse(response.items, response.settings)
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (savingSetting) {
      return
    }

    setSavingSetting(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateAdminWithdrawalSettings(defaultFeePercent)
      setSettings(response.settings)
      setDefaultFeePercent(response.settings.defaultFeePercent)
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, 'Impossible de mettre à jour les frais par défaut.'),
      )
    } finally {
      setSavingSetting(false)
    }
  }

  async function saveWithdrawal(withdrawal: WithdrawalSummary) {
    const draft = drafts[withdrawal.id]

    if (!draft || updatingId !== null) {
      return
    }

    const payload: AdminWithdrawalUpdatePayload = {
      status: draft.status,
      feePercent: draft.feePercent,
      adminNote: draft.adminNote,
      paymentReference: draft.paymentReference,
    }

    setUpdatingId(withdrawal.id)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateAdminWithdrawal(withdrawal.id, payload)
      setStatusMessage(response.message)
      await reload()
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, 'Impossible de mettre à jour ce retrait.'),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  function updateDraft(withdrawalId: number, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [withdrawalId]: {
        ...current[withdrawalId],
        ...patch,
      },
    }))
  }

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Retraits organisateur</AdminDashboardTitle>
          <AdminDashboardText>
            Vérifie les demandes, ajuste les frais si besoin, puis renseigne la
            transaction effectuée hors application.
          </AdminDashboardText>
        </AdminDashboardHeaderText>
        <AdminDashboardActions>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin')}
          >
            Console admin
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/orders')}
          >
            Commandes
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      <AdminDashboardTabs>
        {filters.map((filter) => (
          <AdminDashboardTab
            key={filter.label}
            type="button"
            $active={activeStatus === filter.status}
            onClick={() => setActiveStatus(filter.status)}
          >
            {filter.label}
          </AdminDashboardTab>
        ))}
      </AdminDashboardTabs>

      {statusMessage ? (
        <AdminDashboardMessage $tone="success">{statusMessage}</AdminDashboardMessage>
      ) : null}
      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}
      {isLoading ? (
        <AdminDashboardMessage $tone="neutral">
          Chargement des retraits...
        </AdminDashboardMessage>
      ) : null}

      <AdminDashboardGrid>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Demandes</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{items.length}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>En attente</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{totals.pending}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>CA brut</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>
            {formatCurrency(totals.gross, 'EUR')}
          </AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Net à verser</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>
            {formatCurrency(totals.net, 'EUR')}
          </AdminDashboardMetricValue>
        </AdminDashboardMetric>
      </AdminDashboardGrid>

      <AdminDashboardPanel>
        <AdminDashboardPanelHeader>
          <div>
            <AdminDashboardPanelTitle>Frais EventFlow par défaut</AdminDashboardPanelTitle>
            <AdminDashboardText>
              Ce taux sera copié sur les prochains événements créés. Les événements
              déjà créés gardent leur taux figé.
            </AdminDashboardText>
            {settings?.updatedAt ? (
              <AdminDashboardText>
                Dernière mise à jour : {formatDate(settings.updatedAt)}
              </AdminDashboardText>
            ) : null}
          </div>
        </AdminDashboardPanelHeader>
        <WithdrawalSettingForm onSubmit={saveSettings}>
          <AdminDashboardField>
            <AdminDashboardLabel>Pourcentage</AdminDashboardLabel>
            <AdminDashboardInput
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={defaultFeePercent}
              onChange={(event) => setDefaultFeePercent(event.target.value)}
            />
          </AdminDashboardField>
          <AdminDashboardPrimaryButton type="submit" disabled={savingSetting}>
            {savingSetting ? 'Enregistrement...' : 'Enregistrer'}
          </AdminDashboardPrimaryButton>
        </WithdrawalSettingForm>
      </AdminDashboardPanel>

      <AdminDashboardPanel>
        <AdminDashboardPanelHeader>
          <div>
            <AdminDashboardPanelTitle>Demandes de retrait</AdminDashboardPanelTitle>
            <AdminDashboardText>
              La note et la référence sont visibles par l’organisateur dans son suivi.
            </AdminDashboardText>
          </div>
        </AdminDashboardPanelHeader>

        {!isLoading && items.length === 0 ? (
          <AdminDashboardMessage $tone="neutral">
            Aucune demande pour ce filtre.
          </AdminDashboardMessage>
        ) : null}

        <AdminDashboardList>
          {items.map((withdrawal) => {
            const draft = drafts[withdrawal.id] ?? buildDraft(withdrawal)

            return (
              <WithdrawalCard key={withdrawal.id}>
                <WithdrawalCardHeader>
                  <div>
                    <WithdrawalTitle>{withdrawal.event.title ?? 'Événement'}</WithdrawalTitle>
                    <WithdrawalMeta>
                      {withdrawal.organizer.fullName ?? 'Organisateur'} -{' '}
                      {withdrawal.organizer.email ?? 'email inconnu'}
                    </WithdrawalMeta>
                    <WithdrawalMeta>
                      Demandé le {formatDate(withdrawal.requestedAt)}
                    </WithdrawalMeta>
                  </div>
                  <AdminDashboardBadge $tone={statusTone(withdrawal.status)}>
                    {statusLabels[withdrawal.status]}
                  </AdminDashboardBadge>
                </WithdrawalCardHeader>

                <WithdrawalStats>
                  <WithdrawalStat>
                    <strong>{formatCurrency(withdrawal.grossAmount, withdrawal.currency)}</strong>
                    <span>CA brut</span>
                  </WithdrawalStat>
                  <WithdrawalStat>
                    <strong>{Number(withdrawal.feePercent).toLocaleString('fr-FR')} %</strong>
                    <span>Taux EventFlow</span>
                  </WithdrawalStat>
                  <WithdrawalStat>
                    <strong>{formatCurrency(withdrawal.feeAmount, withdrawal.currency)}</strong>
                    <span>Frais</span>
                  </WithdrawalStat>
                  <WithdrawalStat>
                    <strong>{formatCurrency(withdrawal.netAmount, withdrawal.currency)}</strong>
                    <span>Net à verser</span>
                  </WithdrawalStat>
                </WithdrawalStats>

                <WithdrawalFormGrid>
                  <AdminDashboardField>
                    <AdminDashboardLabel>Statut</AdminDashboardLabel>
                    <AdminDashboardSelect
                      value={draft.status}
                      onChange={(event) =>
                        updateDraft(withdrawal.id, {
                          status: event.target.value as WithdrawalStatus,
                        })
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
                      onChange={(event) =>
                        updateDraft(withdrawal.id, { feePercent: event.target.value })
                      }
                    />
                  </AdminDashboardField>

                  <AdminDashboardField>
                    <AdminDashboardLabel>Référence de paiement</AdminDashboardLabel>
                    <AdminDashboardInput
                      value={draft.paymentReference}
                      onChange={(event) =>
                        updateDraft(withdrawal.id, {
                          paymentReference: event.target.value,
                        })
                      }
                      placeholder="Virement, Stripe, banque..."
                    />
                  </AdminDashboardField>
                </WithdrawalFormGrid>

                <AdminDashboardField>
                  <AdminDashboardLabel>Note visible par l’organisateur</AdminDashboardLabel>
                  <WithdrawalTextarea
                    value={draft.adminNote}
                    onChange={(event) =>
                      updateDraft(withdrawal.id, { adminNote: event.target.value })
                    }
                    placeholder="Montant vérifié, date prévue, remarque de traitement..."
                  />
                </AdminDashboardField>

                <WithdrawalActions>
                  <AdminDashboardSecondaryButton
                    type="button"
                    onClick={() => navigate(`/organizer/events/${withdrawal.event.id}`)}
                  >
                    Ouvrir l’événement
                  </AdminDashboardSecondaryButton>
                  <AdminDashboardPrimaryButton
                    type="button"
                    disabled={updatingId === withdrawal.id}
                    onClick={() => void saveWithdrawal(withdrawal)}
                  >
                    {updatingId === withdrawal.id ? 'Enregistrement...' : 'Enregistrer'}
                  </AdminDashboardPrimaryButton>
                </WithdrawalActions>
              </WithdrawalCard>
            )
          })}
        </AdminDashboardList>
      </AdminDashboardPanel>
    </AdminDashboardSection>
  )
}

const WithdrawalSettingForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 260px) auto;
  align-items: end;
  gap: 12px;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalCard = styled.article`
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

const WithdrawalCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
`

const WithdrawalTitle = styled.h3`
  margin: 0 0 6px;
  color: #fff8f2;
  font-size: 1.08rem;
`

const WithdrawalMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.68);
  line-height: 1.5;
`

const WithdrawalStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalStat = styled.div`
  display: grid;
  gap: 4px;
  min-height: 70px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);

  strong {
    color: #fff8f2;
    font-size: 1rem;
  }

  span {
    color: rgba(255, 237, 222, 0.62);
    font-size: 0.82rem;
  }
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
  min-height: 96px;
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
