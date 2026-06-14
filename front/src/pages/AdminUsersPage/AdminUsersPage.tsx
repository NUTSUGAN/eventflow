import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminUsers,
  updateAdminUserAccountStatus,
  updateAdminUserRole,
} from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
import { AdminPagination } from '../../components/AdminPagination/AdminPagination'
import { usePagination } from '../../hooks/usePagination'
import type {
  AdminAccountStatus,
  AdminUserRole,
  AdminUserSummary,
} from '../../types/admin'
import {
  AdminDashboardActions,
  AdminDashboardBadge,
  AdminDashboardEyebrow,
  AdminDashboardField,
  AdminDashboardForm,
  AdminDashboardHeader,
  AdminDashboardHeaderText,
  AdminDashboardInput,
  AdminDashboardLabel,
  AdminDashboardList,
  AdminDashboardMessage,
  AdminDashboardMetric,
  AdminDashboardMetricLabel,
  AdminDashboardMetricValue,
  AdminDashboardGrid,
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
  AdminDashboardSelect,
  AdminDashboardTab,
  AdminDashboardTabs,
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

type RoleFilter = AdminUserRole | 'all'
type AdminUsersTabId = 'users' | 'subscribers'

function formatDate(value: string | null): string {
  if (!value) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Admin'
    case 'ROLE_ORGANIZER':
      return 'Organisateur'
    default:
      return 'Client'
  }
}

function getRoleTone(role: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'danger'
    case 'ROLE_ORGANIZER':
      return 'success'
    default:
      return 'neutral'
  }
}

function getAccountStatusLabel(accountStatus: string): string {
  switch (accountStatus) {
    case 'blocked':
      return 'Bloque'
    case 'disabled':
      return 'Desactive'
    default:
      return 'Actif'
  }
}

function getAccountStatusTone(
  accountStatus: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (accountStatus) {
    case 'blocked':
      return 'danger'
    case 'disabled':
      return 'warning'
    default:
      return 'success'
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

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function formatEventflowSubscriptionTargets(user: AdminUserSummary): string {
  const organizerNames = user.eventflowSubscriptions
    .map((subscription) => subscription.organizerName)
    .filter(Boolean)

  if (organizerNames.length > 0) {
    return organizerNames.join(', ')
  }

  return user.newsletterSubscribed ? 'EventFlow direct' : 'Aucun'
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminUsersTabId>('users')
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [updatingStatusUserId, setUpdatingStatusUserId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const eventflowSubscribers = useMemo(
    () =>
      users.filter(
        (user) => user.newsletterSubscribed || user.eventflowSubscriptionsCount > 0,
      ),
    [users],
  )
  const userPagination = usePagination(users, {
    pageSize: 20,
    resetKey: `users-${users.length}-${search}-${roleFilter}`,
  })
  const eventflowSubscriberPagination = usePagination(eventflowSubscribers, {
    pageSize: 20,
    resetKey: `eventflow-${eventflowSubscribers.length}-${search}-${roleFilter}`,
  })

  useEffect(() => {
    let isMounted = true

    async function loadInitialUsers() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const nextUsers = await getAdminUsers()

        if (isMounted) {
          setUsers(nextUsers)
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
            navigate('/auth?mode=login', { replace: true })
            return
          }

          setErrorMessage(
            readApiMessage(error, 'Impossible de charger les utilisateurs.'),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialUsers()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function loadUsers() {
    setIsLoading(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const nextUsers = await getAdminUsers({
        search,
        role: roleFilter,
      })
      setUsers(nextUsers)
    } catch (error) {
      setErrorMessage(readApiMessage(error, 'Impossible de filtrer les utilisateurs.'))
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadUsers()
  }

  async function handleRoleUpdate(user: AdminUserSummary, role: AdminUserRole) {
    if (updatingUserId !== null || user.role === role) {
      return
    }

    setUpdatingUserId(user.id)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateAdminUserRole(user.id, role)

      setUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === user.id ? response.user : currentUser,
        ),
      )
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(readApiMessage(error, 'Impossible de modifier ce role.'))
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function handleAccountStatusUpdate(
    user: AdminUserSummary,
    accountStatus: AdminAccountStatus,
  ) {
    if (updatingStatusUserId !== null || user.accountStatus === accountStatus) {
      return
    }

    setUpdatingStatusUserId(user.id)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await updateAdminUserAccountStatus(user.id, accountStatus)

      setUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === user.id ? response.user : currentUser,
        ),
      )
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(readApiMessage(error, 'Impossible de modifier ce statut.'))
    } finally {
      setUpdatingStatusUserId(null)
    }
  }

  function handleEventflowSubscribersExport() {
    const rows = eventflowSubscribers
      .filter((user) => user.email)
      .map((user) => [
        user.firstName ?? '',
        user.lastName ?? '',
        user.fullName,
        user.email ?? '',
        getRoleLabel(user.role),
        formatEventflowSubscriptionTargets(user),
        formatDate(user.createdAt),
      ])

    if (rows.length === 0) {
      setErrorMessage('Aucun abonne EventFlow a exporter.')
      return
    }

    const csv = [
      ['Prenom', 'Nom', 'Nom complet', 'Email', 'Role', 'Organisateurs suivis', 'Date inscription'],
      ...rows,
    ]
      .map((row) => row.map(escapeCsvValue).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'abonnes-eventflow.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatusMessage('Export abonnes EventFlow genere.')
  }

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Gestion utilisateurs</AdminDashboardTitle>
          <AdminDashboardText>
            Comptes, roles et historique utile pour suivre l activite plateforme.
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
            onClick={() => navigate('/admin/organizer-applications')}
          >
            Demandes organisateur
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      {statusMessage ? (
        <AdminDashboardMessage $tone="success">{statusMessage}</AdminDashboardMessage>
      ) : null}
      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}

      <AdminDashboardTabs>
        {[
          ['users', 'Utilisateurs'],
          ['subscribers', 'Abonnes'],
        ].map(([tabId, label]) => (
          <AdminDashboardTab
            key={tabId}
            type="button"
            $active={activeTab === tabId}
            onClick={() => setActiveTab(tabId as AdminUsersTabId)}
          >
            {label}
          </AdminDashboardTab>
        ))}
      </AdminDashboardTabs>

      <AdminDashboardGrid>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Total utilisateurs</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{users.length}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
        <AdminDashboardMetric>
          <AdminDashboardMetricLabel>Abonnes EventFlow</AdminDashboardMetricLabel>
          <AdminDashboardMetricValue>{eventflowSubscribers.length}</AdminDashboardMetricValue>
        </AdminDashboardMetric>
      </AdminDashboardGrid>

      {activeTab === 'users' ? (
      <AdminDashboardPanel>
        <AdminDashboardPanelHeader>
          <div>
            <AdminDashboardPanelTitle>Utilisateurs</AdminDashboardPanelTitle>
            <AdminDashboardText>{users.length} compte(s) trouve(s)</AdminDashboardText>
          </div>
        </AdminDashboardPanelHeader>

        <AdminDashboardForm onSubmit={handleFilterSubmit}>
          <AdminDashboardField>
            <AdminDashboardLabel>Recherche</AdminDashboardLabel>
            <AdminDashboardInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom ou email"
            />
          </AdminDashboardField>
          <AdminDashboardField>
            <AdminDashboardLabel>Role</AdminDashboardLabel>
            <AdminDashboardSelect
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            >
              <option value="all">Tous</option>
              <option value="ROLE_CLIENT">Clients</option>
              <option value="ROLE_ORGANIZER">Organisateurs</option>
              <option value="ROLE_ADMIN">Admins</option>
            </AdminDashboardSelect>
          </AdminDashboardField>
          <AdminDashboardPrimaryButton type="submit" disabled={isLoading}>
            {isLoading ? 'Chargement...' : 'Filtrer'}
          </AdminDashboardPrimaryButton>
        </AdminDashboardForm>

        {isLoading ? (
          <AdminDashboardMessage $tone="neutral">
            Chargement des utilisateurs...
          </AdminDashboardMessage>
        ) : null}

        {!isLoading && users.length === 0 ? (
          <AdminDashboardMessage $tone="neutral">
            Aucun utilisateur ne correspond aux filtres.
          </AdminDashboardMessage>
        ) : null}

        <AdminDashboardList>
          {userPagination.paginatedItems.map((user) => (
            <AdminDashboardRow key={user.id}>
              <AdminDashboardRowMain>
                <AdminDashboardRowTitle>{user.fullName}</AdminDashboardRowTitle>
                <AdminDashboardRowText>{user.email ?? 'Email inconnu'}</AdminDashboardRowText>
                <AdminDashboardRowText>
                  Cree le {formatDate(user.createdAt)} - {user.ordersCount} commande(s),
                  {' '}{user.ticketsCount} billet(s), {user.organizedEventsCount} evenement(s)
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  Newsletter: {user.newsletterSubscribed ? 'oui' : 'non'}
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  Demande organisateur:{' '}
                  {user.organizerApplication?.status ?? 'aucune'}
                  {user.organizerApplication?.organizationName
                    ? ` - ${user.organizerApplication.organizationName}`
                    : ''}
                </AdminDashboardRowText>
              </AdminDashboardRowMain>
              <AdminDashboardBadge $tone={getRoleTone(user.role)}>
                {getRoleLabel(user.role)}
              </AdminDashboardBadge>
              <AdminDashboardActions>
                <AdminDashboardBadge $tone={getAccountStatusTone(user.accountStatus)}>
                  {getAccountStatusLabel(user.accountStatus)}
                </AdminDashboardBadge>
                {user.role !== 'ROLE_CLIENT' ? (
                  <AdminDashboardSecondaryButton
                    type="button"
                    disabled={updatingUserId === user.id}
                    onClick={() => void handleRoleUpdate(user, 'ROLE_CLIENT')}
                  >
                    Repasser client
                  </AdminDashboardSecondaryButton>
                ) : null}
                {user.role !== 'ROLE_ORGANIZER' ? (
                  <AdminDashboardSecondaryButton
                    type="button"
                    disabled={updatingUserId === user.id}
                    onClick={() => void handleRoleUpdate(user, 'ROLE_ORGANIZER')}
                  >
                    Passer organisateur
                  </AdminDashboardSecondaryButton>
                ) : null}
                {user.role !== 'ROLE_ADMIN' ? (
                  <AdminDashboardSecondaryButton
                    type="button"
                    disabled={updatingUserId === user.id}
                    onClick={() => void handleRoleUpdate(user, 'ROLE_ADMIN')}
                  >
                    Passer admin
                  </AdminDashboardSecondaryButton>
                ) : null}
                {user.accountStatus !== 'active' ? (
                  <AdminDashboardSecondaryButton
                    type="button"
                    disabled={updatingStatusUserId === user.id}
                    onClick={() => void handleAccountStatusUpdate(user, 'active')}
                  >
                    Activer
                  </AdminDashboardSecondaryButton>
                ) : null}
                {user.accountStatus !== 'blocked' ? (
                  <AdminDashboardSecondaryButton
                    type="button"
                    disabled={updatingStatusUserId === user.id}
                    onClick={() => void handleAccountStatusUpdate(user, 'blocked')}
                  >
                    Bloquer
                  </AdminDashboardSecondaryButton>
                ) : null}
              </AdminDashboardActions>
            </AdminDashboardRow>
          ))}
        </AdminDashboardList>
        <AdminPagination
          page={userPagination.page}
          pageSize={userPagination.pageSize}
          totalItems={users.length}
          totalPages={userPagination.totalPages}
          itemLabel="utilisateurs"
          onPageChange={userPagination.setPage}
        />
      </AdminDashboardPanel>
      ) : null}

      {activeTab === 'subscribers' ? (
        <AdminDashboardPanel>
          <AdminDashboardPanelHeader>
            <div>
              <AdminDashboardPanelTitle>Abonnes EventFlow</AdminDashboardPanelTitle>
              <AdminDashboardText>
                {eventflowSubscribers.length} compte(s) suivent au moins un organisateur EventFlow.
              </AdminDashboardText>
            </div>
            <AdminDashboardSecondaryButton
              type="button"
              onClick={handleEventflowSubscribersExport}
              disabled={eventflowSubscribers.length === 0}
            >
              Exporter les mails
            </AdminDashboardSecondaryButton>
          </AdminDashboardPanelHeader>
          {eventflowSubscribers.length === 0 ? (
            <AdminDashboardMessage $tone="neutral">
              Aucun abonne EventFlow dans cette selection.
            </AdminDashboardMessage>
          ) : (
            <AdminDashboardList>
              {eventflowSubscriberPagination.paginatedItems.map((user) => (
                <AdminDashboardRow key={`eventflow-${user.id}`}>
                  <AdminDashboardRowMain>
                    <AdminDashboardRowTitle>{user.fullName}</AdminDashboardRowTitle>
                    <AdminDashboardRowText>{user.email ?? 'Email inconnu'}</AdminDashboardRowText>
                    <AdminDashboardRowText>
                      Suit: {formatEventflowSubscriptionTargets(user)}
                    </AdminDashboardRowText>
                  </AdminDashboardRowMain>
                  <AdminDashboardBadge $tone="success">
                    {user.eventflowSubscriptionsCount > 0
                      ? `${user.eventflowSubscriptionsCount} abonnement(s)`
                      : 'EventFlow direct'}
                  </AdminDashboardBadge>
                  <span />
                </AdminDashboardRow>
              ))}
            </AdminDashboardList>
          )}
          <AdminPagination
            page={eventflowSubscriberPagination.page}
            pageSize={eventflowSubscriberPagination.pageSize}
            totalItems={eventflowSubscribers.length}
            totalPages={eventflowSubscriberPagination.totalPages}
            itemLabel="abonnes"
            onPageChange={eventflowSubscriberPagination.setPage}
          />
        </AdminDashboardPanel>
      ) : null}
    </AdminDashboardSection>
  )
}
