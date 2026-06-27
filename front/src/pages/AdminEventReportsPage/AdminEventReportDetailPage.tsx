import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
  getAdminEventReport,
  updateAdminEventReportStatus,
} from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
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
  AdminDashboardLabel,
  AdminDashboardMessage,
  AdminDashboardMetric,
  AdminDashboardMetricLabel,
  AdminDashboardMetricValue,
  AdminDashboardPanel,
  AdminDashboardPanelHeader,
  AdminDashboardPanelTitle,
  AdminDashboardPrimaryButton,
  AdminDashboardRowText,
  AdminDashboardSecondaryButton,
  AdminDashboardSelect,
  AdminDashboardSection,
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

const statusOptions: Array<{ label: string; value: AdminEventReportStatus }> = [
  { label: 'En attente', value: 'pending' },
  { label: 'En cours', value: 'reviewed' },
  { label: 'Résolu', value: 'resolved' },
  { label: 'Rejeté', value: 'rejected' },
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

export function AdminEventReportDetailPage() {
  const navigate = useNavigate()
  const { reportId } = useParams()
  const numericReportId = Number(reportId)
  const [report, setReport] = useState<AdminEventReportSummary | null>(null)
  const [statusDraft, setStatusDraft] = useState<AdminEventReportStatus>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadReport() {
      setIsLoading(true)
      setStatusMessage(null)
      setErrorMessage(null)

      if (!Number.isFinite(numericReportId) || numericReportId <= 0) {
        setErrorMessage('Signalement introuvable.')
        setIsLoading(false)
        return
      }

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const response = await getAdminEventReport(numericReportId)

        if (!isMounted) {
          return
        }

        setReport(response.report)
        setStatusDraft(response.report.status)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login', { replace: true })
          return
        }

        setErrorMessage(readApiMessage(error, 'Impossible de charger ce signalement.'))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadReport()

    return () => {
      isMounted = false
    }
  }, [navigate, numericReportId])

  async function saveStatus() {
    if (!report || statusDraft === report.status || isSaving) {
      return
    }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateAdminEventReportStatus(report.id, statusDraft)
      setReport(response.report)
      setStatusDraft(response.report.status)
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, 'Impossible de mettre à jour le statut du signalement.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>
            {report ? `Signalement #${report.id}` : 'Signalement'}
          </AdminDashboardTitle>
          <AdminDashboardText>
            Consulte le détail du signalement et mets à jour son statut de traitement.
          </AdminDashboardText>
        </AdminDashboardHeaderText>
        <AdminDashboardActions>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/event-reports')}
          >
            Retour aux signalements
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin')}>
            Console admin
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      {statusMessage ? (
        <AdminDashboardMessage $tone="success">{statusMessage}</AdminDashboardMessage>
      ) : null}
      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}
      {isLoading ? (
        <AdminDashboardMessage $tone="neutral">
          Chargement du signalement...
        </AdminDashboardMessage>
      ) : null}

      {report ? (
        <>
          <AdminDashboardGrid>
            <AdminDashboardMetric>
              <AdminDashboardMetricLabel>Statut</AdminDashboardMetricLabel>
              <AdminDashboardMetricValue>
                {statusLabels[report.status] ?? report.status}
              </AdminDashboardMetricValue>
            </AdminDashboardMetric>
            <AdminDashboardMetric>
              <AdminDashboardMetricLabel>Évènement</AdminDashboardMetricLabel>
              <AdminDashboardMetricValue>
                {report.event.title ?? 'Inconnu'}
              </AdminDashboardMetricValue>
            </AdminDashboardMetric>
            <AdminDashboardMetric>
              <AdminDashboardMetricLabel>Reporter</AdminDashboardMetricLabel>
              <AdminDashboardMetricValue>{report.reporter.fullName}</AdminDashboardMetricValue>
            </AdminDashboardMetric>
            <AdminDashboardMetric>
              <AdminDashboardMetricLabel>Créé le</AdminDashboardMetricLabel>
              <AdminDashboardMetricValue>{formatDate(report.createdAt)}</AdminDashboardMetricValue>
            </AdminDashboardMetric>
          </AdminDashboardGrid>

          <AdminDashboardPanel>
            <AdminDashboardPanelHeader>
              <div>
                <AdminDashboardPanelTitle>
                  {report.event.title ?? 'Évènement inconnu'}
                </AdminDashboardPanelTitle>
                <AdminDashboardText>
                  {report.event.city ?? 'Ville inconnue'} -{' '}
                  {report.event.startDatetime ? formatDate(report.event.startDatetime) : 'Date inconnue'} -{' '}
                  statut évènement : {report.event.status ?? 'inconnu'}
                </AdminDashboardText>
              </div>
              <AdminDashboardBadge $tone={statusTone(report.status)}>
                {statusLabels[report.status] ?? report.status}
              </AdminDashboardBadge>
            </AdminDashboardPanelHeader>

            <ReportDetailGrid>
              <ReportBlock>
                <AdminDashboardLabel>Signalé par</AdminDashboardLabel>
                <strong>{report.reporter.fullName}</strong>
                <span>{report.reporter.email ?? 'Email inconnu'}</span>
              </ReportBlock>
              <ReportBlock>
                <AdminDashboardLabel>Organisateur</AdminDashboardLabel>
                <strong>{report.organizer.fullName ?? 'Organisateur inconnu'}</strong>
                <span>{report.organizer.email ?? 'Email inconnu'}</span>
              </ReportBlock>
            </ReportDetailGrid>

            <ReportContent>
              <AdminDashboardLabel>Motif</AdminDashboardLabel>
              <strong>{report.reason ?? 'Motif non renseigné'}</strong>
              <AdminDashboardRowText>
                {report.details ?? 'Aucun détail supplémentaire.'}
              </AdminDashboardRowText>
            </ReportContent>

            <ReportStatusForm>
              <label>
                <AdminDashboardLabel>Statut du signal</AdminDashboardLabel>
                <AdminDashboardSelect
                  value={statusDraft}
                  onChange={(event) =>
                    setStatusDraft(event.target.value as AdminEventReportStatus)
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </AdminDashboardSelect>
              </label>
              <AdminDashboardPrimaryButton
                type="button"
                disabled={statusDraft === report.status || isSaving}
                onClick={saveStatus}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer le statut'}
              </AdminDashboardPrimaryButton>
              <AdminDashboardSecondaryButton
                type="button"
                disabled={!report.event.id}
                onClick={() => navigate(`/events/${report.event.id}`)}
              >
                Voir l’évènement
              </AdminDashboardSecondaryButton>
            </ReportStatusForm>
          </AdminDashboardPanel>
        </>
      ) : null}
    </AdminDashboardSection>
  )
}

const ReportDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const ReportBlock = styled.div`
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);

  strong {
    color: #fff8f2;
  }

  span {
    color: rgba(255, 237, 222, 0.72);
  }
`

const ReportContent = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);

  strong {
    color: #fff8f2;
  }
`

const ReportStatusForm = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 320px) auto auto;
  align-items: end;
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`
