import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { FaChevronDown } from 'react-icons/fa6'
import { useNavigate } from 'react-router-dom'
import {
  createAdminCategory,
  getAdminCategories,
  getAdminEvents,
  getAdminStats,
  getAdminUsers,
  updateAdminEventStatus,
} from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
import {
  canManageAdminContent,
  canManageAdminFinance,
  canViewAdminLogs,
  canViewAdminOrders,
  isAdminRoleName,
  isAdminUser,
} from '../../auth/adminPermissions'
import { AdminPagination } from '../../components/AdminPagination/AdminPagination'
import { usePagination } from '../../hooks/usePagination'
import { getAdminOrganizerApplications } from '../../api/organizerApplication'
import type { AuthUser } from '../../types/auth'
import type {
  AdminCategory,
  AdminEventStatus,
  AdminEventSummary,
  AdminPlatformStats,
  AdminUserSummary,
} from '../../types/admin'
import type { AdminOrganizerApplication } from '../../types/organizerApplication'
import {
  AdminDashboardActions,
  AdminDashboardBadge,
  AdminDashboardEyebrow,
  AdminDashboardField,
  AdminDashboardForm,
  AdminDashboardGrid,
  AdminDashboardHeader,
  AdminDashboardHeaderActions,
  AdminDashboardHeaderText,
  AdminDashboardInput,
  AdminDashboardLabel,
  AdminDashboardList,
  AdminDashboardMessage,
  AdminDashboardMetric,
  AdminDashboardMetricLabel,
  AdminDashboardMetricValue,
  AdminDashboardMobileActionList,
  AdminDashboardMobileActionMenu,
  AdminDashboardMobileActions,
  AdminDashboardMobileActionSummary,
  AdminDashboardPanel,
  AdminDashboardPanelHeader,
  AdminDashboardPanelTitle,
  AdminDashboardPrimaryButton,
  AdminDashboardRow,
  AdminDashboardRowMain,
  AdminDashboardRowText,
  AdminDashboardRowTitle,
  AdminDashboardSecondaryButton,
  AdminDashboardSection,
  AdminDashboardTab,
  AdminDashboardTabs,
  AdminDashboardText,
  AdminDashboardTitle,
} from './adminDashboardPageElements'

type AdminDashboardTabId = 'overview' | 'events' | 'categories'

type CategoryFormState = {
  name: string
  description: string
}

type DashboardAction = {
  label: string
  path: string
}

const emptyCategoryForm: CategoryFormState = {
  name: '',
  description: '',
}

const adminSecondaryActions: DashboardAction[] = [
  { label: 'Utilisateurs', path: '/admin/users' },
  { label: 'Commandes', path: '/admin/orders' },
  { label: 'Billets & scans', path: '/admin/tickets' },
  { label: 'Events Booster', path: '/admin/promotions' },
  { label: 'Retraits', path: '/admin/withdrawals' },
  { label: 'Créer un évènement', path: '/organizer/events/new' },
  { label: 'Signalements', path: '/admin/event-reports' },
]

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

function getEventStatusLabel(status: string | null): string {
  switch (status) {
    case 'published':
      return 'Public'
    case 'cancelled':
      return 'Annulé'
    default:
      return 'Brouillon'
  }
}

function getEventStatusTone(
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

function getOrganizerName(event: AdminEventSummary): string {
  const fullName = `${event.organizer.firstName ?? ''} ${event.organizer.lastName ?? ''}`.trim()
  return fullName || event.organizer.email || 'Organisateur inconnu'
}

function isAdminOrOrganizerRole(role: string | null): boolean {
  return role === 'ROLE_ORGANIZER' || isAdminRoleName(role)
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

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [nowTimestamp] = useState(() => Date.now())
  const [activeTab, setActiveTab] = useState<AdminDashboardTabId>('overview')
  const [applications, setApplications] = useState<AdminOrganizerApplication[]>([])
  const [events, setEvents] = useState<AdminEventSummary[]>([])
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [stats, setStats] = useState<AdminPlatformStats | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(emptyCategoryForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [updatingEventId, setUpdatingEventId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadAdminDashboard() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (!isAdminUser(user)) {
          navigate('/account', { replace: true })
          return
        }

        const canAccessContent = canManageAdminContent(user)
        const [
          nextApplications,
          nextEvents,
          nextCategories,
          nextUsers,
          nextStats,
        ] = await Promise.all([
          canAccessContent ? getAdminOrganizerApplications() : Promise.resolve([]),
          canAccessContent ? getAdminEvents() : Promise.resolve([]),
          canAccessContent ? getAdminCategories() : Promise.resolve([]),
          canAccessContent ? getAdminUsers() : Promise.resolve([]),
          getAdminStats(),
        ])

        if (!isMounted) {
          return
        }

        setCurrentUser(user)
        setApplications(nextApplications)
        setEvents(nextEvents)
        setCategories(nextCategories)
        setUsers(nextUsers)
        setStats(nextStats)
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
            navigate('/auth?mode=login', { replace: true })
            return
          }

          setErrorMessage(
            readApiMessage(error, "Impossible de charger l’espace admin."),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAdminDashboard()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const canAccessContent = canManageAdminContent(currentUser)
  const canAccessFinance = canManageAdminFinance(currentUser)
  const canAccessOrders = canViewAdminOrders(currentUser)
  const canAccessLogs = canViewAdminLogs(currentUser)
  const primaryAction: DashboardAction | null = canAccessContent
    ? { label: 'Demandes organisateur', path: '/admin/organizer-applications' }
    : canAccessOrders
      ? { label: 'Commandes', path: '/admin/orders' }
      : null
  const secondaryActions = useMemo<DashboardAction[]>(() => {
    const actions: DashboardAction[] = []
    const contentPaths = new Set([
      '/admin/users',
      '/admin/tickets',
      '/admin/promotions',
      '/organizer/events/new',
      '/admin/event-reports',
    ])
    const orderPaths = new Set(['/admin/orders'])
    const financePaths = new Set(['/admin/withdrawals'])

    if (canAccessContent) {
      actions.push(...adminSecondaryActions.filter((action) => contentPaths.has(action.path)))
    }

    if (canAccessOrders) {
      actions.push(...adminSecondaryActions.filter((action) => orderPaths.has(action.path)))
    }

    if (canAccessFinance) {
      actions.push(...adminSecondaryActions.filter((action) => financePaths.has(action.path)))
    }

    if (canAccessLogs) {
      actions.push({ label: 'Logs', path: '/admin/logs' })
    }

    return actions
  }, [canAccessContent, canAccessFinance, canAccessLogs, canAccessOrders])
  const visibleTabs = useMemo<Array<[AdminDashboardTabId, string]>>(() => {
    const tabs: Array<[AdminDashboardTabId, string]> = [['overview', 'Vue globale']]

    if (canAccessContent) {
      tabs.push(['events', 'Évènements'], ['categories', 'Catégories'])
    }

    return tabs
  }, [canAccessContent])

  const pendingApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === 'PENDING' &&
          !isAdminOrOrganizerRole(application.applicant.role),
      ),
    [applications],
  )

  const publishedEvents = useMemo(
    () => events.filter((event) => event.status === 'published'),
    [events],
  )

  const draftEvents = useMemo(
    () => events.filter((event) => event.status === 'draft'),
    [events],
  )

  const organizerUsers = useMemo(
    () => users.filter((user) => user.role === 'ROLE_ORGANIZER'),
    [users],
  )

  const filteredEvents = useMemo(() => {
    const query = eventSearchQuery.trim().toLowerCase()

    if (query === '') {
      return events
    }

    return events.filter((event) => {
      const searchableText = [
        event.title,
        event.description,
        event.location.city,
        event.location.country,
        event.category.name,
        getOrganizerName(event),
        getEventStatusLabel(event.status),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [events, eventSearchQuery])

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => {
          if (!event.startDatetime || event.status === 'cancelled') {
            return false
          }

          return new Date(event.startDatetime).getTime() >= nowTimestamp
        })
        .slice(0, 6),
    [events, nowTimestamp],
  )
  const eventPagination = usePagination(filteredEvents, {
    pageSize: 20,
    resetKey: eventSearchQuery,
  })
  const categoryPagination = usePagination(categories, {
    pageSize: 20,
    resetKey: String(categories.length),
  })

  async function handleEventStatusUpdate(
    event: AdminEventSummary,
    status: AdminEventStatus,
  ) {
    if (updatingEventId !== null || event.status === status) {
      return
    }

    setUpdatingEventId(event.id)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateAdminEventStatus(event.id, status)

      setEvents((current) =>
        current.map((currentEvent) =>
          currentEvent.id === event.id ? response.event : currentEvent,
        ),
      )
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, "Impossible de mettre à jour le statut de l’évènement."),
      )
    } finally {
      setUpdatingEventId(null)
    }
  }

  async function handleCategoryCreate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (isSavingCategory) {
      return
    }

    if (categoryForm.name.trim() === '' || categoryForm.description.trim() === '') {
      setErrorMessage('Renseigne le nom et la description de la catégorie.')
      return
    }

    setIsSavingCategory(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await createAdminCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      })

      setCategories((current) => [response.category, ...current])
      setCategoryForm(emptyCategoryForm)
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, 'Impossible de créer cette catégorie.'),
      )
    } finally {
      setIsSavingCategory(false)
    }
  }

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Console EventFlow</AdminDashboardTitle>
          <AdminDashboardText>
            Pilote les demandes organisateur, les évènements publiés, les catégories
            et les indicateurs de la plateforme depuis un point d’entrée unique.
          </AdminDashboardText>
        </AdminDashboardHeaderText>
        <AdminDashboardHeaderActions>
          <AdminDashboardPrimaryButton
            type="button"
            onClick={() => primaryAction && navigate(primaryAction.path)}
            style={{ display: primaryAction ? undefined : 'none' }}
          >
            {primaryAction?.label ?? 'Admin'}
          </AdminDashboardPrimaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/users')}
            style={{ display: secondaryActions.some((action) => action.path === '/admin/users') ? undefined : 'none' }}
          >
            Utilisateurs
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/orders')}
            style={{ display: secondaryActions.some((action) => action.path === '/admin/orders') ? undefined : 'none' }}
          >
            Commandes
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/tickets')}
            style={{ display: secondaryActions.some((action) => action.path === '/admin/tickets') ? undefined : 'none' }}
          >
            Billets & scans
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/promotions')}
            style={{ display: secondaryActions.some((action) => action.path === '/admin/promotions') ? undefined : 'none' }}
          >
            Events Booster
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/withdrawals')}
            style={{ display: secondaryActions.some((action) => action.path === '/admin/withdrawals') ? undefined : 'none' }}
          >
            Retraits
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/events/new')}
            style={{ display: secondaryActions.some((action) => action.path === '/organizer/events/new') ? undefined : 'none' }}
          >
            Créer un évènement
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/admin/event-reports')}
            style={{ display: secondaryActions.some((action) => action.path === '/admin/event-reports') ? undefined : 'none' }}
          >
            Signalements
          </AdminDashboardSecondaryButton>
          {secondaryActions
            .filter((action) => !adminSecondaryActions.some((staticAction) => staticAction.path === action.path))
            .map((action) => (
              <AdminDashboardSecondaryButton
                key={action.path}
                type="button"
                onClick={() => navigate(action.path)}
              >
                {action.label}
              </AdminDashboardSecondaryButton>
            ))}
        </AdminDashboardHeaderActions>
        <AdminDashboardMobileActions>
          <AdminDashboardPrimaryButton
            type="button"
            onClick={() => primaryAction && navigate(primaryAction.path)}
            style={{ display: primaryAction ? undefined : 'none' }}
          >
            {primaryAction?.label ?? 'Admin'}
          </AdminDashboardPrimaryButton>
          <AdminDashboardMobileActionMenu>
            <AdminDashboardMobileActionSummary
              aria-label="Afficher les autres actions"
              title="Autres actions"
            >
              <FaChevronDown aria-hidden="true" focusable="false" />
            </AdminDashboardMobileActionSummary>
            <AdminDashboardMobileActionList>
              {secondaryActions.map((action) => (
                <AdminDashboardSecondaryButton
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                >
                  {action.label}
                </AdminDashboardSecondaryButton>
              ))}
            </AdminDashboardMobileActionList>
          </AdminDashboardMobileActionMenu>
        </AdminDashboardMobileActions>
      </AdminDashboardHeader>

      <AdminDashboardTabs>
        {visibleTabs.map(([tabId, label]) => (
          <AdminDashboardTab
            key={tabId}
            type="button"
            $active={activeTab === tabId}
            onClick={() => setActiveTab(tabId as AdminDashboardTabId)}
          >
            {label}
          </AdminDashboardTab>
        ))}
      </AdminDashboardTabs>

      {statusMessage ? (
        <AdminDashboardMessage $tone="success">{statusMessage}</AdminDashboardMessage>
      ) : null}
      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}

      <AdminDashboardGrid>
        {renderMetrics()}
      </AdminDashboardGrid>

      {isLoading ? (
        <AdminDashboardMessage $tone="neutral">
          Chargement de la console admin...
        </AdminDashboardMessage>
      ) : null}

      {activeTab === 'overview' ? (
        <>
          {canAccessContent ? (
            <>
          <AdminDashboardPanel>
            <AdminDashboardPanelHeader>
              <div>
                <AdminDashboardPanelTitle>Demandes à traiter</AdminDashboardPanelTitle>
                <AdminDashboardText>
                  Les demandes encore en attente de validation par l’admin.
                </AdminDashboardText>
              </div>
              <AdminDashboardSecondaryButton
                type="button"
                onClick={() => navigate('/admin/organizer-applications')}
              >
                Ouvrir la file
              </AdminDashboardSecondaryButton>
            </AdminDashboardPanelHeader>
            <AdminDashboardList>
              {pendingApplications.slice(0, 4).map((application) => (
                <AdminDashboardRow key={application.id}>
                  <AdminDashboardRowMain>
                    <AdminDashboardRowTitle>
                      {application.organizationName}
                    </AdminDashboardRowTitle>
                    <AdminDashboardRowText>
                      {application.applicant.fullName} - {application.city}
                    </AdminDashboardRowText>
                  </AdminDashboardRowMain>
                  <AdminDashboardBadge $tone="warning">En attente</AdminDashboardBadge>
                  <AdminDashboardSecondaryButton
                    type="button"
                    onClick={() => navigate('/admin/organizer-applications')}
                  >
                    Relire
                  </AdminDashboardSecondaryButton>
                </AdminDashboardRow>
              ))}
              {pendingApplications.length === 0 ? (
                <AdminDashboardMessage $tone="neutral">
                  Aucune demande organisateur en attente.
                </AdminDashboardMessage>
              ) : null}
            </AdminDashboardList>
          </AdminDashboardPanel>

          <AdminDashboardPanel>
            <AdminDashboardPanelHeader>
              <div>
                <AdminDashboardPanelTitle>Prochains évènements</AdminDashboardPanelTitle>
                <AdminDashboardText>
                  Les évènements actifs les plus proches dans le calendrier.
                </AdminDashboardText>
              </div>
            </AdminDashboardPanelHeader>
            {renderEventList(upcomingEvents)}
          </AdminDashboardPanel>
            </>
          ) : null}

          {!canAccessContent && canAccessFinance ? (
            <AdminDashboardPanel>
              <AdminDashboardPanelHeader>
                <div>
                  <AdminDashboardPanelTitle>Dashboard finance</AdminDashboardPanelTitle>
                  <AdminDashboardText>
                    Suivi des commandes, paiements, retraits et frais plateforme.
                  </AdminDashboardText>
                </div>
                <AdminDashboardActions>
                  <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin/orders')}>
                    Commandes
                  </AdminDashboardSecondaryButton>
                  <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin/withdrawals')}>
                    Retraits
                  </AdminDashboardSecondaryButton>
                </AdminDashboardActions>
              </AdminDashboardPanelHeader>
            </AdminDashboardPanel>
          ) : null}
        </>
      ) : null}

      {activeTab === 'events' ? (
        <AdminDashboardPanel>
          <AdminDashboardPanelHeader>
            <div>
              <AdminDashboardPanelTitle>Évènements</AdminDashboardPanelTitle>
              <AdminDashboardText>
                Change rapidement le statut d'un évènement ou ouvre sa fiche
                organisateur.
              </AdminDashboardText>
              <AdminDashboardText>
                {filteredEvents.length} évènement(s) affiché(s) sur {events.length}.
              </AdminDashboardText>
            </div>
          </AdminDashboardPanelHeader>
          <AdminDashboardField>
            <AdminDashboardLabel>Recherche évènement</AdminDashboardLabel>
            <AdminDashboardInput
              value={eventSearchQuery}
              onChange={(event) => setEventSearchQuery(event.target.value)}
              placeholder="Nom, organisateur, ville, catégorie, statut..."
            />
          </AdminDashboardField>
          {renderEventList(
            eventPagination.paginatedItems,
            eventSearchQuery.trim() !== ''
              ? 'Aucun évènement ne correspond à cette recherche.'
              : undefined,
          )}
          <AdminPagination
            page={eventPagination.page}
            pageSize={eventPagination.pageSize}
            totalItems={filteredEvents.length}
            totalPages={eventPagination.totalPages}
            itemLabel="évènements"
            onPageChange={eventPagination.setPage}
          />
        </AdminDashboardPanel>
      ) : null}

      {activeTab === 'categories' ? (
        <AdminDashboardPanel>
          <AdminDashboardPanelHeader>
            <div>
              <AdminDashboardPanelTitle>Catégories</AdminDashboardPanelTitle>
              <AdminDashboardText>
                Ajoute une catégorie disponible pour les futurs évènements.
              </AdminDashboardText>
            </div>
          </AdminDashboardPanelHeader>
          <AdminDashboardForm onSubmit={handleCategoryCreate}>
            <AdminDashboardField>
              <AdminDashboardLabel>Nom</AdminDashboardLabel>
              <AdminDashboardInput
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Conference"
              />
            </AdminDashboardField>
            <AdminDashboardField>
              <AdminDashboardLabel>Description</AdminDashboardLabel>
              <AdminDashboardInput
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="évènements professionnels et talks"
              />
            </AdminDashboardField>
            <AdminDashboardPrimaryButton type="submit" disabled={isSavingCategory}>
              {isSavingCategory ? 'Création...' : 'Ajouter'}
            </AdminDashboardPrimaryButton>
          </AdminDashboardForm>
          <AdminDashboardList>
            {categoryPagination.paginatedItems.map((category) => (
              <AdminDashboardRow key={category.id}>
                <AdminDashboardRowMain>
                  <AdminDashboardRowTitle>{category.name}</AdminDashboardRowTitle>
                  <AdminDashboardRowText>
                    {category.description ?? 'Aucune description.'}
                  </AdminDashboardRowText>
                </AdminDashboardRowMain>
                <AdminDashboardBadge>#{category.id}</AdminDashboardBadge>
                <span />
              </AdminDashboardRow>
            ))}
          </AdminDashboardList>
          <AdminPagination
            page={categoryPagination.page}
            pageSize={categoryPagination.pageSize}
            totalItems={categories.length}
            totalPages={categoryPagination.totalPages}
            itemLabel="catégories"
            onPageChange={categoryPagination.setPage}
          />
        </AdminDashboardPanel>
      ) : null}
    </AdminDashboardSection>
  )

  function renderEventList(
    renderedEvents: AdminEventSummary[],
    emptyMessage = 'Aucun évènement à afficher pour le moment.',
  ) {
    if (renderedEvents.length === 0) {
      return (
        <AdminDashboardMessage $tone="neutral">
          {emptyMessage}
        </AdminDashboardMessage>
      )
    }

    return (
      <AdminDashboardList>
        {renderedEvents.map((event) => (
          <AdminDashboardRow key={event.id}>
            <AdminDashboardRowMain>
              <AdminDashboardRowTitle>{event.title}</AdminDashboardRowTitle>
              <AdminDashboardRowText>
                {formatDate(event.startDatetime)} - {event.location.city ?? 'Ville à confirmer'}
              </AdminDashboardRowText>
              <AdminDashboardRowText>
                {getOrganizerName(event)}
              </AdminDashboardRowText>
            </AdminDashboardRowMain>
            <AdminDashboardBadge $tone={getEventStatusTone(event.status)}>
              {getEventStatusLabel(event.status)}
            </AdminDashboardBadge>
            <AdminDashboardActions>
              <AdminDashboardSecondaryButton
                type="button"
                onClick={() => navigate(`/organizer/events/${event.id}`)}
              >
                Ouvrir
              </AdminDashboardSecondaryButton>
              {event.status !== 'published' ? (
                <AdminDashboardSecondaryButton
                  type="button"
                  disabled={updatingEventId === event.id}
                  onClick={() => void handleEventStatusUpdate(event, 'published')}
                >
                  Publier
                </AdminDashboardSecondaryButton>
              ) : null}
              {event.status !== 'cancelled' ? (
                <AdminDashboardSecondaryButton
                  type="button"
                  disabled={updatingEventId === event.id}
                  onClick={() => void handleEventStatusUpdate(event, 'cancelled')}
                >
                  Annuler
                </AdminDashboardSecondaryButton>
              ) : null}
            </AdminDashboardActions>
          </AdminDashboardRow>
        ))}
      </AdminDashboardList>
    )
  }

  function renderMetrics() {
    if (activeTab === 'events') {
      return (
        <>
          <AdminDashboardMetric>
            <AdminDashboardMetricLabel>Organisateurs</AdminDashboardMetricLabel>
            <AdminDashboardMetricValue>{organizerUsers.length}</AdminDashboardMetricValue>
          </AdminDashboardMetric>
          <AdminDashboardMetric>
            <AdminDashboardMetricLabel>Évènements publics</AdminDashboardMetricLabel>
            <AdminDashboardMetricValue>{publishedEvents.length}</AdminDashboardMetricValue>
          </AdminDashboardMetric>
          <AdminDashboardMetric>
            <AdminDashboardMetricLabel>Brouillons</AdminDashboardMetricLabel>
            <AdminDashboardMetricValue>{draftEvents.length}</AdminDashboardMetricValue>
          </AdminDashboardMetric>
          <AdminDashboardMetric>
            <AdminDashboardMetricLabel>Scans réalisés</AdminDashboardMetricLabel>
            <AdminDashboardMetricValue>{stats?.scans.total ?? 0}</AdminDashboardMetricValue>
          </AdminDashboardMetric>
        </>
      )
    }

    if (activeTab === 'categories') {
      return (
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Catégories</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{categories.length}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
      )
    }

    return (
      <>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>CA total</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>
            {formatCurrency(stats?.revenue.total ?? 0, stats?.revenue.currency ?? 'EUR')}
          </AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Demandes en attente</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{pendingApplications.length}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Commandes</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{stats?.orders.total ?? 0}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Billets vendus</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{stats?.tickets.sold ?? 0}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
      </>
    )
  }
}
