import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getAdminEventReports } from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
import { AdminPagination } from '../../components/AdminPagination/AdminPagination'
import { usePagination } from '../../hooks/usePagination'
import type {
  AdminEventReportStatus,
  AdminEventReportSummary,
} from '../../types/admin'
import {
  AdminDashboardActions,
  AdminDashboardBadge,
  AdminDashboardEyebrow,
  AdminDashboardGrid,
  AdminDashboardHeader,
  AdminDashboardHeaderText,
  AdminDashboardList,
  AdminDashboardMessage,
  AdminDashboardMetric,
  AdminDashboardMetricLabel,
  AdminDashboardMetricValue,
  AdminDashboardPanel,
  AdminDashboardPanelHeader,
  AdminDashboardPanelTitle,
  AdminDashboardRow,
  AdminDashboardSecondaryButton,
  AdminDashboardSection,
  AdminDashboardTab,
  AdminDashboardTabs,
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

const reportFilters: Array<{ label: string; status?: AdminEventReportStatus }> = [
  { label: 'Tous' },
  { label: 'En attente', status: 'pending' },
  { label: 'En cours', status: 'reviewed' },
  { label: 'Résolus', status: 'resolved' },
  { label: 'Rejetés', status: 'rejected' },
]

const statusLabels: Record<AdminEventReportStatus, string> = {
  pending: 'En attente',
  reviewed: 'En cours',
  resolved: 'Résolu',
  rejected: 'Rejeté',
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusTone(
  status: AdminEventReportStatus,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'resolved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
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

function reportDetailPath(report: AdminEventReportSummary): string {
  return `/admin/event-reports/${report.id}`
}

export function AdminEventReportsPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState<AdminEventReportStatus | undefined>()
  const [reports, setReports] = useState<AdminEventReportSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const response = await getAdminEventReports(activeStatus)

        if (isMounted) {
          setReports(response.items)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login', { replace: true })
          return
        }

        setErrorMessage(readApiMessage(error, 'Impossible de charger les signalements.'))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadReports()

    return () => {
      isMounted = false
    }
  }, [activeStatus, navigate])

  const totals = useMemo(() => {
    return reports.reduce(
      (accumulator, report) => {
        accumulator.total += 1
        accumulator[report.status] += 1
        return accumulator
      },
      {
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
        rejected: 0,
      } satisfies Record<AdminEventReportStatus | 'total', number>,
    )
  }, [reports])

  const reportPagination = usePagination(reports, {
    pageSize: 20,
    resetKey: activeStatus ?? 'all',
  })

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Signalements d’évènements</AdminDashboardTitle>
          <AdminDashboardText>
            Consulte les signalements reçus, puis ouvre une fiche dédiée pour modifier son statut.
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
            onClick={() => navigate('/organizer/events/new')}
          >
            Créer un évènement
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      <AdminDashboardTabs>
        {reportFilters.map((filter) => (
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

      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}
      {isLoading ? (
        <AdminDashboardMessage $tone="neutral">
          Chargement des signalements...
        </AdminDashboardMessage>
      ) : null}

      <AdminDashboardGrid>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Signalements</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{totals.total}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>En attente</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{totals.pending}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>En cours</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{totals.reviewed}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Résolus</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{totals.resolved}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
      </AdminDashboardGrid>

      <AdminDashboardPanel>
        <AdminDashboardPanelHeader>
          <div>
            <AdminDashboardPanelTitle>Signalements reçus</AdminDashboardPanelTitle>
            <AdminDashboardText>
              Clique sur un signalement pour ouvrir sa page de traitement.
            </AdminDashboardText>
          </div>
        </AdminDashboardPanelHeader>

        {!isLoading && reports.length === 0 ? (
          <AdminDashboardMessage $tone="neutral">
            Aucun signalement pour ce filtre.
          </AdminDashboardMessage>
        ) : null}

        <AdminDashboardList>
          {reportPagination.paginatedItems.map((report) => (
            <ReportRow key={report.id}>
              <ReportSummaryButton
                type="button"
                onClick={() => navigate(reportDetailPath(report))}
              >
                <ReportSummaryHeader>
                  <ReportTitle>{report.event.title ?? 'Évènement inconnu'}</ReportTitle>
                  <ReportReason>{report.reason ?? 'Motif non renseigné'}</ReportReason>
                </ReportSummaryHeader>
                <ReportSummaryText>
                  Signalé par {report.reporter.fullName}
                  {report.reporter.email ? ` - ${report.reporter.email}` : ''}
                </ReportSummaryText>
                <ReportSummaryText>Créé le {formatDate(report.createdAt)}</ReportSummaryText>
              </ReportSummaryButton>

              <ReportCompactActions>
                <AdminDashboardBadge $tone={statusTone(report.status)}>
                  {statusLabels[report.status] ?? report.status}
                </AdminDashboardBadge>
                <AdminDashboardSecondaryButton
                  type="button"
                  onClick={() => navigate(reportDetailPath(report))}
                >
                  Détails
                </AdminDashboardSecondaryButton>
              </ReportCompactActions>
            </ReportRow>
          ))}
        </AdminDashboardList>

        <AdminPagination
          page={reportPagination.page}
          pageSize={reportPagination.pageSize}
          totalItems={reports.length}
          totalPages={reportPagination.totalPages}
          itemLabel="signalements"
          onPageChange={reportPagination.setPage}
        />
      </AdminDashboardPanel>
    </AdminDashboardSection>
  )
}

const ReportRow = styled(AdminDashboardRow)`
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 10px 12px;
`

const ReportTitle = styled.span`
  color: #fff8f2;
  font-size: 0.98rem;
  font-weight: 900;
`

const ReportSummaryButton = styled.button`
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover ${ReportTitle} {
    color: #ffb27a;
  }
`

const ReportSummaryHeader = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
`

const ReportReason = styled.span`
  max-width: 360px;
  overflow: hidden;
  color: rgba(255, 237, 222, 0.76);
  font-size: 0.82rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ReportSummaryText = styled.span`
  overflow: hidden;
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.84rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ReportCompactActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;

  ${AdminDashboardSecondaryButton} {
    min-height: 36px;
    padding: 0 12px;
  }
`
