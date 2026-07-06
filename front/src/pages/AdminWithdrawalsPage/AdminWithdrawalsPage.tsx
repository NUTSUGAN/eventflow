import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getCurrentUser } from '../../api/auth'
import { canManageAdminFinance } from '../../auth/adminPermissions'
import {
  getAdminWithdrawals,
  updateAdminWithdrawalSettings,
} from '../../api/withdrawals'
import type {
  AdminWithdrawalSettings,
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
  AdminDashboardRow,
  AdminDashboardRowMain,
  AdminDashboardRowText,
  AdminDashboardSecondaryButton,
  AdminDashboardSection,
  AdminDashboardTab,
  AdminDashboardTabs,
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

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

function payoutTitle(withdrawal: WithdrawalSummary): string {
  if (!withdrawal.payout) {
    return 'Moyen non copié'
  }

  return withdrawal.payout.label ?? (
    withdrawal.payout.type === 'bank' ? 'Compte bancaire' : 'Mobile Money'
  )
}

export function AdminWithdrawalsPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState<WithdrawalStatus | undefined>()
  const [items, setItems] = useState<WithdrawalSummary[]>([])
  const [settings, setSettings] = useState<AdminWithdrawalSettings | null>(null)
  const [defaultFeePercent, setDefaultFeePercent] = useState('0.00')
  const [isLoading, setIsLoading] = useState(true)
  const [savingSetting, setSavingSetting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (!canManageAdminFinance(user)) {
          navigate('/account', { replace: true })
          return
        }

        const response = await getAdminWithdrawals(activeStatus)

        if (!isMounted) {
          return
        }

        setItems(response.items)
        setSettings(response.settings)
        setDefaultFeePercent(response.settings.defaultFeePercent)
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
        accumulator.net += Number(withdrawal.netAmount)

        if (withdrawal.status === 'pending') {
          accumulator.pending += 1
        }

        return accumulator
      },
      { gross: 0, net: 0, pending: 0 },
    )
  }, [items])

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

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Retraits organisateur</AdminDashboardTitle>
          <AdminDashboardText>
            Suis les demandes et ouvre une fiche dédiée pour traiter le paiement.
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
              Ce taux sera copié sur les prochains événements créés.
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
              Clique sur l'id d'une demande pour ouvrir sa fiche de traitement.
            </AdminDashboardText>
          </div>
        </AdminDashboardPanelHeader>

        {!isLoading && items.length === 0 ? (
          <AdminDashboardMessage $tone="neutral">
            Aucune demande pour ce filtre.
          </AdminDashboardMessage>
        ) : null}

        <AdminDashboardList>
          {items.map((withdrawal) => (
            <AdminDashboardRow key={withdrawal.id}>
              <AdminDashboardRowMain>
                <WithdrawalIdButton
                  type="button"
                  onClick={() => navigate(`/admin/withdrawals/${withdrawal.id}`)}
                >
                  Demande #{withdrawal.id}
                </WithdrawalIdButton>
                <AdminDashboardRowText>
                  {withdrawal.event.title ?? 'Événement'} -{' '}
                  {withdrawal.organizer.fullName ?? 'Organisateur'}
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  {withdrawal.organizer.email ?? 'email inconnu'} - demandée le{' '}
                  {formatDate(withdrawal.requestedAt)}
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  Paiement : {payoutTitle(withdrawal)}
                </AdminDashboardRowText>
              </AdminDashboardRowMain>

              <WithdrawalRowStats>
                <WithdrawalMiniStat>
                  <span>CA</span>
                  <strong>{formatCurrency(withdrawal.grossAmount, withdrawal.currency)}</strong>
                </WithdrawalMiniStat>
                <WithdrawalMiniStat>
                  <span>Frais</span>
                  <strong>{formatCurrency(withdrawal.feeAmount, withdrawal.currency)}</strong>
                </WithdrawalMiniStat>
                <WithdrawalMiniStat>
                  <span>Net</span>
                  <strong>{formatCurrency(withdrawal.netAmount, withdrawal.currency)}</strong>
                </WithdrawalMiniStat>
              </WithdrawalRowStats>

              <WithdrawalRowActions>
                <AdminDashboardBadge $tone={statusTone(withdrawal.status)}>
                  {statusLabels[withdrawal.status]}
                </AdminDashboardBadge>
                <AdminDashboardSecondaryButton
                  type="button"
                  onClick={() => navigate(`/admin/withdrawals/${withdrawal.id}`)}
                >
                  Ouvrir
                </AdminDashboardSecondaryButton>
              </WithdrawalRowActions>
            </AdminDashboardRow>
          ))}
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

const WithdrawalIdButton = styled.button`
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  color: #fff8f2;
  font: inherit;
  font-size: 1rem;
  font-weight: 900;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: #ffb27a;
  }
`

const WithdrawalRowStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(92px, 1fr));
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const WithdrawalMiniStat = styled.div`
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);

  span {
    color: rgba(255, 237, 222, 0.58);
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  strong {
    color: #fff8f2;
    font-size: 0.95rem;
  }
`

const WithdrawalRowActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`
