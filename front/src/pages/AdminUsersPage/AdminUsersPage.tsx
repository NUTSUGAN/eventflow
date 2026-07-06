import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminUsers,
  updateAdminUserAccountStatus,
  updateAdminUserRole,
} from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
import { canManageAdminAccounts, canManageAdminContent } from '../../auth/adminPermissions'
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
type AdminRoleChoice = Extract<
  AdminUserRole,
  'ROLE_ADMIN' | 'ROLE_ADMIN_SUPPORT' | 'ROLE_ADMIN_FINANCE'
>

const adminRoleChoices: Array<{ role: AdminRoleChoice; label: string }> = [
  { role: 'ROLE_ADMIN', label: 'Super admin' },
  { role: 'ROLE_ADMIN_SUPPORT', label: 'Admin support' },
  { role: 'ROLE_ADMIN_FINANCE', label: 'Admin finance' },
]

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
      return 'Super admin'
    case 'ROLE_ADMIN_SUPPORT':
      return 'Admin support'
    case 'ROLE_ADMIN_FINANCE':
      return 'Admin finance'
    case 'ROLE_ORGANIZER':
      return 'Organisateur'
    default:
      return 'Client'
  }
}

function getRoleTone(role: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (role) {
    case 'ROLE_ADMIN':
    case 'ROLE_ADMIN_SUPPORT':
    case 'ROLE_ADMIN_FINANCE':
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
      return 'Bloqué'
    case 'disabled':
      return 'Désactivé'
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
  const [canEditAdmins, setCanEditAdmins] = useState(false)
  const [adminRoleChoiceUserId, setAdminRoleChoiceUserId] = useState<number | null>(null)
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

        if (!canManageAdminContent(user)) {
          navigate('/account', { replace: true })
          return
        }

        const nextUsers = await getAdminUsers()

        if (isMounted) {
          setCanEditAdmins(canManageAdminAccounts(user))
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
      setAdminRoleChoiceUserId(null)
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(readApiMessage(error, 'Impossible de modifier ce rôle.'))
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
      setErrorMessage('Aucun abonné EventFlow à exporter.')
      return
    }

    const csv = [
      ['Prénom', 'Nom', 'Nom complet', 'Email', 'Rôle', 'Organisateurs suivis', 'Date inscription'],
      ...rows,
    ]
      .map((row) => row.map(escapeCsvValue).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'abonnés-eventflow.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatusMessage('Export abonnés EventFlow généré.')
  }

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Gestion utilisateurs</AdminDashboardTitle>
          <AdminDashboardText>
            Comptes, rôles et historique utile pour suivre l’activité plateforme.
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
          ['subscribers', 'Abonnés'],
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
          <AdminDashboardMetricLabel>Abonnés EventFlow</AdminDashboardMetricLabel>
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
            <AdminDashboardLabel>Rôle</AdminDashboardLabel>
            <AdminDashboardSelect
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            >
              <option value="all">Tous</option>
              <option value="ROLE_CLIENT">Clients</option>
              <option value="ROLE_ORGANIZER">Organisateurs</option>
              {canEditAdmins ? <option value="ROLE_ADMIN">Super admins</option> : null}
              {canEditAdmins ? <option value="ROLE_ADMIN_SUPPORT">Admins support</option> : null}
              {canEditAdmins ? <option value="ROLE_ADMIN_FINANCE">Admins finance</option> : null}
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
                  Crée le {formatDate(user.createdAt)} - {user.ordersCount} commande(s),
                  {' '}{user.ticketsCount} billet(s), {user.organizedEventsCount} évènement(s)
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
                {canEditAdmins && user.role !== 'ROLE_ADMIN' && adminRoleChoiceUserId !== user.id ? (
                  <AdminDashboardSecondaryButton
                    type="button"
                    disabled={updatingUserId === user.id}
                    onClick={() =>
                      setAdminRoleChoiceUserId((current) =>
                        current === user.id ? null : user.id,
                      )
                    }
                  >
                    Passer admin
                  </AdminDashboardSecondaryButton>
                ) : null}
                {canEditAdmins && adminRoleChoiceUserId === user.id ? (
                  <>
                    {adminRoleChoices
                      .filter((choice) => choice.role !== user.role)
                      .map((choice) => (
                        <AdminDashboardSecondaryButton
                          key={choice.role}
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => void handleRoleUpdate(user, choice.role)}
                        >
                          {choice.label}
                        </AdminDashboardSecondaryButton>
                      ))}
                  </>
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
              <AdminDashboardPanelTitle>Abonnés EventFlow</AdminDashboardPanelTitle>
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
              Aucun abonné EventFlow dans cette sélection.
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
            itemLabel="abonnés"
            onPageChange={eventflowSubscriberPagination.setPage}
          />
        </AdminDashboardPanel>
      ) : null}
    </AdminDashboardSection>
  )
}
