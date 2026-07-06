import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getAdminAuditLogs } from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
import { canViewAdminLogs } from '../../auth/adminPermissions'
import type { AdminAuditLogSummary } from '../../types/admin'
import {
  AdminDashboardActions,
  AdminDashboardBadge,
  AdminDashboardEyebrow,
  AdminDashboardField,
  AdminDashboardForm,
  AdminDashboardHeader,
  AdminDashboardHeaderText,
  AdminDashboardLabel,
  AdminDashboardList,
  AdminDashboardMessage,
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
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

type SelectOption = {
  value: string
  label: string
}

const roleLabels: Record<string, string> = {
  ROLE_ADMIN: 'Super admin',
  ROLE_ADMIN_SUPPORT: 'Admin support',
  ROLE_ADMIN_FINANCE: 'Admin finance',
}

const roleFilterOptions: SelectOption[] = [
  { value: 'ROLE_ADMIN', label: roleLabels.ROLE_ADMIN },
  { value: 'ROLE_ADMIN_SUPPORT', label: roleLabels.ROLE_ADMIN_SUPPORT },
  { value: 'ROLE_ADMIN_FINANCE', label: roleLabels.ROLE_ADMIN_FINANCE },
]

const actionLabels: Record<string, string> = {
  api_admin_user_update_role: 'Modification du rôle utilisateur',
  api_admin_user_update_status: 'Changement de statut utilisateur',
  api_admin_organizer_application_approve: 'Validation organisateur',
  api_admin_organizer_application_reject: 'Refus organisateur',
  api_admin_event_update: 'Modification d’évènement',
  api_admin_event_delete: 'Suppression d’évènement',
  api_admin_category_create: 'Création de catégorie',
  api_admin_category_update: 'Modification de catégorie',
  api_admin_category_delete: 'Suppression de catégorie',
  api_admin_location_create: 'Création de lieu',
  api_admin_location_update: 'Modification de lieu',
  api_admin_location_delete: 'Suppression de lieu',
  api_admin_promotion_approve: 'Validation promotion',
  api_admin_promotion_reject: 'Refus promotion',
  api_admin_promotion_rate_update: 'Modification frais promotion',
  api_admin_withdrawal_update: 'Modification retrait',
  api_admin_withdrawal_settings_update: 'Modification retraits',
  api_admin_account_grant: 'Attribution admin',
  api_admin_account_revoke: 'Retrait admin',
  api_admin_account_change_role: 'Changement de rôle admin',
  api_organizer_event_create: 'Création d’évènement organisateur',
  api_organizer_event_update: 'Modification d’évènement organisateur',
  api_organizer_event_update_status: 'Modification du statut d’évènement',
  api_organizer_ticket_type_create: 'Création de billet',
  api_organizer_ticket_type_update: 'Modification de billet',
  api_organizer_ticket_type_delete: 'Suppression de billet',
  api_organizer_guest_tickets_create: 'Création d’invitation',
  api_organizer_promotion_create: 'Demande de promotion',
  api_organizer_promotion_checkout: 'Paiement de promotion',
  api_organizer_promotion_payment_confirm: 'Confirmation paiement promotion',
  api_organizer_staff_create: 'Ajout membre staff',
  api_organizer_staff_deactivate: 'Désactivation membre staff',
  api_staff_scan_ticket: 'Scan de billet',
}

const forbiddenActionLabels: Record<string, string> = {
  api_organizer_event_create: 'Tentative de création d’évènement',
  api_organizer_event_update: 'Tentative de modification d’évènement',
  api_organizer_event_update_status: 'Tentative de changement de statut d’évènement',
  api_organizer_ticket_type_create: 'Tentative de création de billet',
  api_organizer_ticket_type_update: 'Tentative de modification de billet',
  api_organizer_ticket_type_delete: 'Tentative de suppression de billet',
  api_organizer_guest_tickets_create: 'Tentative de création d’invitation',
  api_organizer_promotion_create: 'Tentative de demande de promotion',
  api_organizer_promotion_checkout: 'Tentative de paiement de promotion',
  api_organizer_promotion_payment_confirm: 'Tentative de confirmation paiement promotion',
  api_organizer_staff_create: 'Tentative d?ajout membre staff',
  api_organizer_staff_deactivate: 'Tentative de désactivation membre staff',
}

const resourceLabels: Record<string, string> = {
  users: 'Utilisateurs',
  events: 'Évènements',
  categories: 'Catégories',
  locations: 'Lieux',
  orders: 'Commandes',
  withdrawals: 'Retraits',
  promotions: 'Promotions',
  tickets: 'Billets',
  staff: 'Staff',
  'ticket-types': 'Types de billets',
  'guest-tickets': 'Invitations',
  'event-reports': 'Signalements',
  'organizer-applications': 'Demandes organisateur',
  'admin-users': 'Comptes admin',
  roles: 'Rôles admin',
  'admin-invitations': 'Invitations admin',
}

const AdminLogsFilterPanel = styled(AdminDashboardPanel)`
  gap: 12px;
  padding: 14px 16px;
`

const AdminLogsFilterForm = styled(AdminDashboardForm)`
  grid-template-columns: repeat(4, minmax(120px, 1fr)) auto;
  gap: 10px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const AdminLogsFilterField = styled(AdminDashboardField)`
  gap: 5px;

  ${AdminDashboardLabel} {
    font-size: 0.7rem;
  }

  ${AdminDashboardSelect} {
    min-height: 38px;
    border-radius: 10px;
    padding: 0 10px;
    font-size: 0.86rem;
  }
`

const AdminLogsFilterButton = styled(AdminDashboardPrimaryButton)`
  min-height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 0.86rem;
`

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'success':
      return 'success'
    case 'forbidden':
    case 'failed':
      return 'danger'
    default:
      return 'neutral'
  }
}

function getErrorStatus(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
  ) {
    return (error as { response?: { status?: number } }).response?.status ?? null
  }

  return null
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

function getActionLabel(log: Pick<AdminAuditLogSummary, 'action' | 'status'>): string {
  if (log.status === 'forbidden') {
    return forbiddenActionLabels[log.action] ?? `Tentative interdite : ${actionLabels[log.action] ?? log.action}`
  }

  return actionLabels[log.action] ?? log.action
}

function getResourceLabel(resourceType: string): string {
  return resourceLabels[resourceType] ?? resourceType
}

function getActorOptionValue(log: AdminAuditLogSummary): string {
  return log.actor.email ?? log.actor.fullName ?? ''
}

function getActorOptionLabel(log: AdminAuditLogSummary): string {
  const fallback = getActorOptionValue(log)

  if (log.actor.fullName && log.actor.email) {
    return `${log.actor.fullName} - ${log.actor.email}`
  }

  return fallback || 'Admin inconnu'
}

function buildOptions(
  logs: AdminAuditLogSummary[],
  getValue: (log: AdminAuditLogSummary) => string,
  getLabel: (log: AdminAuditLogSummary) => string,
): SelectOption[] {
  const options = new Map<string, string>()

  logs.forEach((log) => {
    const value = getValue(log)

    if (value !== '' && !options.has(value)) {
      options.set(value, getLabel(log))
    }
  })

  return Array.from(options, ([value, label]) => ({ value, label })).sort((first, second) =>
    first.label.localeCompare(second.label, 'fr'),
  )
}

export function AdminLogsPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AdminAuditLogSummary[]>([])
  const [availableLogs, setAvailableLogs] = useState<AdminAuditLogSummary[]>([])
  const [admin, setAdmin] = useState('')
  const [role, setRole] = useState('')
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function loadLogs() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await getAdminAuditLogs({ admin, role, action, resourceType })
      setLogs(response.items)
      setAvailableLogs((current) => (current.length > 0 ? current : response.items))
    } catch (error) {
      setLogs([])
      setErrorMessage(readApiMessage(error, 'Impossible de charger l’historique admin.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const user = await getCurrentUser(true)

        if (!canViewAdminLogs(user)) {
          navigate('/account', { replace: true })
          return
        }

        const response = await getAdminAuditLogs()

        if (isMounted) {
          setLogs(response.items)
          setAvailableLogs(response.items)
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
            navigate('/auth?mode=login', { replace: true })
            return
          }

          if (getErrorStatus(error) === 401) {
            navigate('/auth?mode=login', { replace: true })
            return
          }

          setLogs([])
          setErrorMessage(readApiMessage(error, 'Impossible de charger l’historique admin.'))
        }
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
  }, [navigate])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadLogs()
  }

  const adminOptions = useMemo(
    () => buildOptions(availableLogs, getActorOptionValue, getActorOptionLabel),
    [availableLogs],
  )
  const actionOptions = useMemo<SelectOption[]>(
    () =>
      buildOptions(
        availableLogs,
        (log) => log.action,
        (log) => getActionLabel(log),
      ),
    [availableLogs],
  )
  const resourceOptions = useMemo<SelectOption[]>(
    () =>
      buildOptions(
        availableLogs,
        (log) => log.resourceType,
        (log) => getResourceLabel(log.resourceType),
      ),
    [availableLogs],
  )

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Historique admin</AdminDashboardTitle>
          <AdminDashboardText>
            Actions sensibles, modifications et tentatives interdites dans le back-office.
          </AdminDashboardText>
        </AdminDashboardHeaderText>
        <AdminDashboardActions>
          <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin')}>
            Console admin
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      <AdminLogsFilterPanel>
        <AdminDashboardPanelHeader>
          <div>
            <AdminDashboardPanelTitle>Filtres</AdminDashboardPanelTitle>
            <AdminDashboardText>{logs.length} entrée(s) affichée(s)</AdminDashboardText>
          </div>
        </AdminDashboardPanelHeader>
        <AdminLogsFilterForm onSubmit={handleSubmit}>
          <AdminLogsFilterField>
            <AdminDashboardLabel>Admin</AdminDashboardLabel>
            <AdminDashboardSelect value={admin} onChange={(event) => setAdmin(event.target.value)}>
              <option value="">Tous les admins</option>
              {adminOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminDashboardSelect>
          </AdminLogsFilterField>
          <AdminLogsFilterField>
            <AdminDashboardLabel>Rôle</AdminDashboardLabel>
            <AdminDashboardSelect value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="">Tous les rôles</option>
              {roleFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminDashboardSelect>
          </AdminLogsFilterField>
          <AdminLogsFilterField>
            <AdminDashboardLabel>Action</AdminDashboardLabel>
            <AdminDashboardSelect value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="">Toutes les actions</option>
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminDashboardSelect>
          </AdminLogsFilterField>
          <AdminLogsFilterField>
            <AdminDashboardLabel>Ressource</AdminDashboardLabel>
            <AdminDashboardSelect value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
              <option value="">Toutes les ressources</option>
              {resourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminDashboardSelect>
          </AdminLogsFilterField>
          <AdminLogsFilterButton type="submit" disabled={isLoading}>
            Filtrer
          </AdminLogsFilterButton>
        </AdminLogsFilterForm>
      </AdminLogsFilterPanel>

      {errorMessage ? <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage> : null}
      {isLoading ? <AdminDashboardMessage $tone="neutral">Chargement de l’historique...</AdminDashboardMessage> : null}

      <AdminDashboardPanel>
        <AdminDashboardList>
          {logs.map((log) => (
            <AdminDashboardRow key={log.id}>
              <AdminDashboardRowMain>
                <AdminDashboardRowTitle>{getActionLabel(log)}</AdminDashboardRowTitle>
                <AdminDashboardRowText>
                  {log.actor.email ?? 'Admin inconnu'} - {log.actor.role} - {formatDate(log.createdAt)}
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  {getResourceLabel(log.resourceType)}{log.resourceId ? ` #${log.resourceId}` : ''}
                </AdminDashboardRowText>
              </AdminDashboardRowMain>
              <AdminDashboardBadge $tone={statusTone(log.status)}>{log.status}</AdminDashboardBadge>
            </AdminDashboardRow>
          ))}
          {!isLoading && logs.length === 0 ? (
            <AdminDashboardMessage $tone="neutral">Aucune action admin trouvée.</AdminDashboardMessage>
          ) : null}
        </AdminDashboardList>
      </AdminDashboardPanel>
    </AdminDashboardSection>
  )
}
