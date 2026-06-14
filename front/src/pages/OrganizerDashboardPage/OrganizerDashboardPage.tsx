import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getMyOrganizerApplication } from '../../api/organizerApplication'
import {
  getOrganizerDashboard,
  updateOrganizerEventStatus,
} from '../../api/organizerEvents'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerDashboardEventSummary,
  OrganizerDashboardResponse,
  OrganizerEventStatus,
} from '../../types/organizerEvent'
import {
  OrganizerDashboardActions,
  OrganizerDashboardBadge,
  OrganizerDashboardEyebrow,
  OrganizerDashboardEventSelect,
  OrganizerDashboardGrid,
  OrganizerDashboardHeader,
  OrganizerDashboardHeaderText,
  OrganizerDashboardList,
  OrganizerDashboardMessage,
  OrganizerDashboardMetric,
  OrganizerDashboardMetricHint,
  OrganizerDashboardMetricLabel,
  OrganizerDashboardMetricValue,
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
} from './organizerDashboardPageElements'

const emptyDashboardEvents: OrganizerDashboardEventSummary[] = []

function formatDashboardDate(date: string | null): string {
  if (!date) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatCurrency(amount: string | number | null, currency: string): string {
  const numericAmount = Number(amount ?? 0)

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0)
}

function formatStatusLabel(status: string | null): string {
  switch (status) {
    case 'published':
      return 'Public'
    case 'cancelled':
      return 'Annule'
    default:
      return 'Brouillon'
  }
}

function getStatusTone(
  status: string | null,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'published':
      return 'success'
    case 'cancelled':
      return 'danger'
    case 'draft':
      return 'warning'
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

export function OrganizerDashboardPage() {
  const navigate = useNavigate()
  const [nowTimestamp] = useState(() => Date.now())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [dashboard, setDashboard] = useState<OrganizerDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingEventId, setUpdatingEventId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const currentUser = await getCurrentUser(true)

        if (
          currentUser.role !== 'ROLE_ORGANIZER' &&
          currentUser.role !== 'ROLE_ADMIN'
        ) {
          const organizerState = await getMyOrganizerApplication()

          if (isMounted) {
            if (organizerState.application?.status === 'PENDING') {
              navigate('/organizer-access', { replace: true })
              return
            }

            navigate('/organizer-access', { replace: true })
          }

          return
        }

        const organizerDashboard = await getOrganizerDashboard()

        if (!isMounted) {
          return
        }

        setUser(currentUser)
        setDashboard(organizerDashboard)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login&intent=organizer', { replace: true })
          return
        }

        setErrorMessage(
          readApiMessage(error, 'Impossible de charger le tableau de bord organisateur.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const events = dashboard?.events ?? emptyDashboardEvents
  const publishedEvents = useMemo(
    () => events.filter((event) => event.status === 'published'),
    [events],
  )
  const draftEvents = useMemo(
    () => events.filter((event) => event.status === 'draft'),
    [events],
  )
  const upcomingEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status !== 'cancelled' &&
          event.startDatetime !== null &&
          new Date(event.startDatetime).getTime() >= nowTimestamp,
      ),
    [events, nowTimestamp],
  )
  const latestEvents = useMemo(() => events.slice(0, 3), [events])

  async function handleStatusChange(
    event: OrganizerDashboardEventSummary,
    nextStatus: OrganizerEventStatus,
  ) {
    if (updatingEventId !== null || event.status === nextStatus) {
      return
    }

    setUpdatingEventId(event.id)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateOrganizerEventStatus(event.id, nextStatus)

      setDashboard((current) =>
        current
          ? {
              ...current,
              events: current.events.map((currentEvent) =>
                currentEvent.id === event.id
                  ? {
                      ...currentEvent,
                      ...response.event,
                      sales: currentEvent.sales,
                      scans: currentEvent.scans,
                    }
                  : currentEvent,
              ),
            }
          : current,
      )
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, "Impossible de mettre a jour le statut de l'evenement."),
      )
    } finally {
      setUpdatingEventId(null)
    }
  }

  return (
    <OrganizerDashboardSection>
      <OrganizerDashboardHeader>
        <OrganizerDashboardHeaderText>
          <OrganizerDashboardEyebrow>Espace organisateur</OrganizerDashboardEyebrow>
          <OrganizerDashboardTitle>Tableau de bord organisateur</OrganizerDashboardTitle>
          <OrganizerDashboardText>
            {user
              ? `${user.firstName}, suis tes evenements, tes ventes, tes billets et les controles d acces depuis un seul espace.`
              : 'Suis tes evenements, tes ventes, tes billets et les controles d acces depuis un seul espace.'}
          </OrganizerDashboardText>
        </OrganizerDashboardHeaderText>
        <OrganizerDashboardActions>
          <OrganizerDashboardPrimaryButton
            type="button"
            onClick={() => navigate('/organizer/events/new')}
          >
            Creer un evenement
          </OrganizerDashboardPrimaryButton>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/events')}
          >
            Mes evenements
          </OrganizerDashboardSecondaryButton>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/promotions')}
          >
            Mes campagnes Booster
          </OrganizerDashboardSecondaryButton>
          {user?.canAccessStaffTools ? (
            <OrganizerDashboardSecondaryButton
              type="button"
              onClick={() => navigate('/staff/scan')}
            >
              Scanner les billets
            </OrganizerDashboardSecondaryButton>
          ) : null}
          {user?.canManageStaff ? (
            <OrganizerDashboardSecondaryButton
              type="button"
              onClick={() => navigate('/organizer/staff')}
            >
              Gerer mon staff
            </OrganizerDashboardSecondaryButton>
          ) : null}
          {user?.role === 'ROLE_ADMIN' ? (
            <OrganizerDashboardSecondaryButton
              type="button"
              onClick={() => navigate('/admin/organizer-applications')}
            >
              Demandes organisateur
            </OrganizerDashboardSecondaryButton>
          ) : null}
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
          Chargement du tableau de bord organisateur...
        </OrganizerDashboardMessage>
      ) : null}

      <OrganizerDashboardGrid>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>CA total</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>
            {formatCurrency(
              dashboard?.stats.revenue.total ?? 0,
              dashboard?.stats.revenue.currency ?? 'EUR',
            )}
          </OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>Commandes payees uniquement</OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>Abonnes</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>
            {dashboard?.stats.subscribers.total ?? 0}
          </OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>Suivent ton profil organisateur</OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>Billets vendus</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>
            {dashboard?.stats.tickets.sold ?? 0}
          </OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>Tous evenements confondus</OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>Scans realises</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>
            {dashboard?.stats.scans.total ?? 0}
          </OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>
            {dashboard?.stats.scans.valid ?? 0} valide(s)
          </OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
      </OrganizerDashboardGrid>

      <OrganizerDashboardGrid>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>Evenements publics</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>{publishedEvents.length}</OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>Actuellement visibles</OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>Brouillons</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>{draftEvents.length}</OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>A finaliser avant publication</OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>A venir</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>{upcomingEvents.length}</OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>Dans le calendrier</OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
        <OrganizerDashboardMetric>
          <OrganizerDashboardMetricLabel>Staff actif</OrganizerDashboardMetricLabel>
          <OrganizerDashboardMetricValue>
            {dashboard?.stats.staff.active ?? user?.managedStaffCount ?? 0}
          </OrganizerDashboardMetricValue>
          <OrganizerDashboardMetricHint>Membres pouvant scanner</OrganizerDashboardMetricHint>
        </OrganizerDashboardMetric>
      </OrganizerDashboardGrid>

      <OrganizerDashboardPanel>
        <OrganizerDashboardPanelHeader>
          <div>
            <OrganizerDashboardPanelTitle>Ventes par evenement</OrganizerDashboardPanelTitle>
            <OrganizerDashboardText>
              Compare rapidement le chiffre d affaires, les commandes, les billets
              vendus et les scans par fiche evenement.
            </OrganizerDashboardText>
          </div>
        </OrganizerDashboardPanelHeader>
        {renderSalesList(latestEvents)}
      </OrganizerDashboardPanel>

      <OrganizerDashboardPanel>
        <OrganizerDashboardPanelHeader>
          <div>
            <OrganizerDashboardPanelTitle>Mes evenements</OrganizerDashboardPanelTitle>
            <OrganizerDashboardText>
              Change un statut, ouvre une fiche, puis complete les billets et le
              suivi operationnel.
            </OrganizerDashboardText>
          </div>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/events')}
          >
            Ouvrir la gestion complete
          </OrganizerDashboardSecondaryButton>
        </OrganizerDashboardPanelHeader>
        {renderEventList(latestEvents)}
      </OrganizerDashboardPanel>
    </OrganizerDashboardSection>
  )

  function renderSalesList(renderedEvents: OrganizerDashboardEventSummary[]) {
    if (renderedEvents.length === 0) {
      return (
        <OrganizerDashboardMessage $tone="neutral">
          Aucun evenement avec vente pour le moment.
        </OrganizerDashboardMessage>
      )
    }

    return (
      <OrganizerDashboardList>
        {renderedEvents.map((event) => (
          <OrganizerDashboardRow key={`sales-${event.id}`}>
            <OrganizerDashboardRowMain>
              <OrganizerDashboardRowTitle>{event.title}</OrganizerDashboardRowTitle>
              <OrganizerDashboardRowText>
                {formatDashboardDate(event.startDatetime)} - {event.location.city ?? 'Ville a confirmer'}
              </OrganizerDashboardRowText>
            </OrganizerDashboardRowMain>
            <OrganizerDashboardRowStats>
              <OrganizerDashboardMiniMetric>
                <OrganizerDashboardMiniMetricLabel>CA</OrganizerDashboardMiniMetricLabel>
                <OrganizerDashboardMiniMetricValue>
                  {formatCurrency(event.sales.revenueTotal, event.sales.currency)}
                </OrganizerDashboardMiniMetricValue>
              </OrganizerDashboardMiniMetric>
              <OrganizerDashboardMiniMetric>
                <OrganizerDashboardMiniMetricLabel>Commandes</OrganizerDashboardMiniMetricLabel>
                <OrganizerDashboardMiniMetricValue>
                  {event.sales.paidOrders}
                </OrganizerDashboardMiniMetricValue>
              </OrganizerDashboardMiniMetric>
              <OrganizerDashboardMiniMetric>
                <OrganizerDashboardMiniMetricLabel>Billets</OrganizerDashboardMiniMetricLabel>
                <OrganizerDashboardMiniMetricValue>
                  {event.sales.ticketsSold}
                </OrganizerDashboardMiniMetricValue>
              </OrganizerDashboardMiniMetric>
              <OrganizerDashboardMiniMetric>
                <OrganizerDashboardMiniMetricLabel>Scans</OrganizerDashboardMiniMetricLabel>
                <OrganizerDashboardMiniMetricValue>
                  {event.scans.total}
                </OrganizerDashboardMiniMetricValue>
              </OrganizerDashboardMiniMetric>
            </OrganizerDashboardRowStats>
            <OrganizerDashboardRowActions>
              <OrganizerDashboardSecondaryButton
                type="button"
                onClick={() => navigate(`/organizer/events/${event.id}`)}
              >
                Ouvrir
              </OrganizerDashboardSecondaryButton>
            </OrganizerDashboardRowActions>
          </OrganizerDashboardRow>
        ))}
      </OrganizerDashboardList>
    )
  }

  function renderEventList(renderedEvents: OrganizerDashboardEventSummary[]) {
    if (renderedEvents.length === 0) {
      return (
        <OrganizerDashboardMessage $tone="neutral">
          Tu n as pas encore d evenement. Cree le premier pour commencer a
          vendre des billets.
        </OrganizerDashboardMessage>
      )
    }

    return (
      <OrganizerDashboardList>
        {renderedEvents.map((event) => (
          <OrganizerDashboardRow key={event.id}>
            <OrganizerDashboardRowMain>
              <OrganizerDashboardBadge $tone={getStatusTone(event.status)}>
                {formatStatusLabel(event.status)}
              </OrganizerDashboardBadge>
              <OrganizerDashboardRowTitle>{event.title}</OrganizerDashboardRowTitle>
              <OrganizerDashboardRowText>
                {event.category.name ?? 'Categorie'} - {event.location.city ?? 'Ville a confirmer'}
              </OrganizerDashboardRowText>
              <OrganizerDashboardRowText>
                {formatDashboardDate(event.startDatetime)}
              </OrganizerDashboardRowText>
            </OrganizerDashboardRowMain>
            <OrganizerDashboardRowStats>
              <OrganizerDashboardMiniMetric>
                <OrganizerDashboardMiniMetricLabel>Billets</OrganizerDashboardMiniMetricLabel>
                <OrganizerDashboardMiniMetricValue>
                  {event.sales.ticketsSold}
                </OrganizerDashboardMiniMetricValue>
              </OrganizerDashboardMiniMetric>
              <OrganizerDashboardMiniMetric>
                <OrganizerDashboardMiniMetricLabel>Scans valides</OrganizerDashboardMiniMetricLabel>
                <OrganizerDashboardMiniMetricValue>
                  {event.scans.valid}
                </OrganizerDashboardMiniMetricValue>
              </OrganizerDashboardMiniMetric>
              <OrganizerDashboardMiniMetric>
                <OrganizerDashboardMiniMetricLabel>Types</OrganizerDashboardMiniMetricLabel>
                <OrganizerDashboardMiniMetricValue>
                  {event.ticketTypesCount}
                </OrganizerDashboardMiniMetricValue>
              </OrganizerDashboardMiniMetric>
            </OrganizerDashboardRowStats>
            <OrganizerDashboardRowActions>
              <OrganizerDashboardEventSelect
                value={event.status}
                disabled={updatingEventId === event.id || event.status === 'cancelled'}
                onChange={(changeEvent) =>
                  void handleStatusChange(
                    event,
                    changeEvent.target.value as OrganizerEventStatus,
                  )
                }
              >
                <option value="draft">Brouillon</option>
                <option value="published">Public</option>
                {event.status === 'cancelled' ? (
                  <option value="cancelled">Annule</option>
                ) : null}
              </OrganizerDashboardEventSelect>
              <OrganizerDashboardSecondaryButton
                type="button"
                onClick={() => navigate(`/organizer/events/${event.id}`)}
              >
                Ouvrir
              </OrganizerDashboardSecondaryButton>
            </OrganizerDashboardRowActions>
          </OrganizerDashboardRow>
        ))}
      </OrganizerDashboardList>
    )
  }
}
