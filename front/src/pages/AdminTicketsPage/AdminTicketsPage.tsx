import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminTickets } from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
import type { AdminTicketSummary } from '../../types/admin'
import {
  AdminDashboardActions,
  AdminDashboardBadge,
  AdminDashboardEyebrow,
  AdminDashboardField,
  AdminDashboardFilterBar,
  AdminDashboardGroup,
  AdminDashboardGroupHeader,
  AdminDashboardHeader,
  AdminDashboardHeaderText,
  AdminDashboardInput,
  AdminDashboardLabel,
  AdminDashboardList,
  AdminDashboardMessage,
  AdminDashboardPanel,
  AdminDashboardPanelHeader,
  AdminDashboardPanelTitle,
  AdminDashboardPickerButton,
  AdminDashboardPickerList,
  AdminDashboardPickerMain,
  AdminDashboardPickerMeta,
  AdminDashboardPickerSelection,
  AdminDashboardPickerTitle,
  AdminDashboardRow,
  AdminDashboardRowMain,
  AdminDashboardRowText,
  AdminDashboardRowTitle,
  AdminDashboardSecondaryButton,
  AdminDashboardSection,
  AdminDashboardText,
  AdminDashboardTitle,
} from '../AdminDashboardPage/adminDashboardPageElements'

function formatDate(value: string | null): string {
  if (!value) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getTicketStatusTone(status: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'used':
      return 'success'
    case 'issued':
      return 'warning'
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

function getCheckinTone(result: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (result) {
    case 'valid':
      return 'success'
    case 'already_used':
      return 'warning'
    case 'invalid':
      return 'danger'
    default:
      return 'neutral'
  }
}

function getEventKey(ticket: AdminTicketSummary): string {
  return String(ticket.event.id ?? ticket.event.title ?? `ticket-${ticket.id}`)
}

function getEventTitle(ticket: AdminTicketSummary): string {
  return ticket.event.title ?? 'Evenement inconnu'
}

function getEventMeta(ticket: AdminTicketSummary): string {
  const eventMeta = [
    ticket.event.location.city,
    ticket.event.startDatetime ? formatDate(ticket.event.startDatetime) : null,
  ]
    .filter(Boolean)
    .join(' - ')

  return eventMeta || 'Date et lieu inconnus'
}

export function AdminTicketsPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<AdminTicketSummary[]>([])
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [selectedEventKey, setSelectedEventKey] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadTickets() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const nextTickets = await getAdminTickets()

        if (isMounted) {
          setTickets(nextTickets)
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
            navigate('/auth?mode=login', { replace: true })
            return
          }

          setErrorMessage('Impossible de charger les billets.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadTickets()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const eventOptions = useMemo(() => {
    const groups = new Map<
      string,
      {
        eventKey: string
        eventTitle: string
        eventMeta: string
        ticketsCount: number
      }
    >()

    tickets.forEach((ticket) => {
      const eventKey = getEventKey(ticket)
      const existingGroup = groups.get(eventKey)

      if (existingGroup) {
        existingGroup.ticketsCount += 1
        return
      }

      groups.set(eventKey, {
        eventKey,
        eventTitle: getEventTitle(ticket),
        eventMeta: getEventMeta(ticket),
        ticketsCount: 1,
      })
    })

    return Array.from(groups.values()).sort((left, right) =>
      left.eventTitle.localeCompare(right.eventTitle, 'fr'),
    )
  }, [tickets])

  const selectedEvent = useMemo(
    () => eventOptions.find((eventOption) => eventOption.eventKey === selectedEventKey) ?? null,
    [eventOptions, selectedEventKey],
  )

  const filteredEventOptions = useMemo(() => {
    const query = eventSearchQuery.trim().toLowerCase()

    if (query === '') {
      return []
    }

    return eventOptions.filter((eventOption) =>
      [eventOption.eventTitle, eventOption.eventMeta]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [eventOptions, eventSearchQuery])

  const visibleEventOptions = useMemo(
    () => filteredEventOptions.slice(0, 6),
    [filteredEventOptions],
  )

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return tickets.filter((ticket) => {
      if (selectedEventKey !== 'all' && getEventKey(ticket) !== selectedEventKey) {
        return false
      }

      if (query === '') {
        return true
      }

      const searchableText = [
        ticket.id,
        ticket.status,
        ticket.qrTokenMasked,
        ticket.order.reference,
        ticket.order.status,
        ticket.client.fullName,
        ticket.client.email,
        ticket.ticketType.name,
        ticket.event.title,
        ticket.event.location.city,
        ticket.latestCheckin?.result,
        ticket.latestCheckin?.staff.fullName,
        ticket.latestCheckin?.staff.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [tickets, searchQuery, selectedEventKey])

  const ticketsByEvent = useMemo(() => {
    const groups = new Map<
      string,
      {
        eventKey: string
        eventTitle: string
        eventMeta: string
        tickets: AdminTicketSummary[]
      }
    >()

    filteredTickets.forEach((ticket) => {
      const eventTitle = getEventTitle(ticket)
      const eventKey = getEventKey(ticket)
      const existingGroup = groups.get(eventKey)
      const eventMeta = getEventMeta(ticket)

      if (existingGroup) {
        existingGroup.tickets.push(ticket)
        return
      }

      groups.set(eventKey, {
        eventKey,
        eventTitle,
        eventMeta,
        tickets: [ticket],
      })
    })

    return Array.from(groups.values()).sort((left, right) =>
      left.eventTitle.localeCompare(right.eventTitle, 'fr'),
    )
  }, [filteredTickets])

  function handleEventSelection(eventKey: string) {
    setSelectedEventKey(eventKey)
    setEventSearchQuery('')
  }

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Billets & check-ins</AdminDashboardTitle>
          <AdminDashboardText>
            Audit des billets generes, QR masques et derniers scans.
          </AdminDashboardText>
        </AdminDashboardHeaderText>
        <AdminDashboardActions>
          <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin')}>
            Console admin
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin/orders')}>
            Commandes
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}

      <AdminDashboardPanel>
        <AdminDashboardPanelHeader>
          <div>
            <AdminDashboardPanelTitle>Audit des billets par evenement</AdminDashboardPanelTitle>
            <AdminDashboardText>
              {selectedEvent
                ? `${filteredTickets.length} billet(s) affiche(s) pour ${selectedEvent.eventTitle}`
                : `${filteredTickets.length} billet(s) affiche(s) sur ${tickets.length}`}
            </AdminDashboardText>
          </div>
        </AdminDashboardPanelHeader>

        <AdminDashboardField>
          <AdminDashboardLabel>Rechercher un evenement</AdminDashboardLabel>
          <AdminDashboardFilterBar>
            <AdminDashboardInput
              value={eventSearchQuery}
              onChange={(event) => setEventSearchQuery(event.target.value)}
              placeholder="Nom, ville ou date..."
            />
            <AdminDashboardSecondaryButton
              type="button"
              onClick={() => handleEventSelection('all')}
            >
              Tous les evenements
            </AdminDashboardSecondaryButton>
          </AdminDashboardFilterBar>
        </AdminDashboardField>

        {selectedEvent ? (
          <AdminDashboardPickerSelection>
            <AdminDashboardPickerMain>
              <AdminDashboardPickerTitle>{selectedEvent.eventTitle}</AdminDashboardPickerTitle>
              <AdminDashboardPickerMeta>{selectedEvent.eventMeta}</AdminDashboardPickerMeta>
            </AdminDashboardPickerMain>
            <AdminDashboardBadge>{selectedEvent.ticketsCount} billet(s)</AdminDashboardBadge>
          </AdminDashboardPickerSelection>
        ) : (
          <AdminDashboardMessage $tone="neutral">
            Vue globale active. Recherche un evenement pour filtrer cet audit.
          </AdminDashboardMessage>
        )}

        {eventSearchQuery.trim() !== '' ? (
          visibleEventOptions.length > 0 ? (
            <AdminDashboardPickerList>
              {visibleEventOptions.map((eventOption) => (
                <AdminDashboardPickerButton
                  key={eventOption.eventKey}
                  type="button"
                  onClick={() => handleEventSelection(eventOption.eventKey)}
                >
                  <AdminDashboardPickerMain>
                    <AdminDashboardPickerTitle>{eventOption.eventTitle}</AdminDashboardPickerTitle>
                    <AdminDashboardPickerMeta>
                      {eventOption.eventMeta}
                    </AdminDashboardPickerMeta>
                  </AdminDashboardPickerMain>
                  <AdminDashboardBadge>{eventOption.ticketsCount} billet(s)</AdminDashboardBadge>
                </AdminDashboardPickerButton>
              ))}
              {filteredEventOptions.length > visibleEventOptions.length ? (
                <AdminDashboardText>
                  {visibleEventOptions.length} resultat(s) affiches sur {filteredEventOptions.length}.
                </AdminDashboardText>
              ) : null}
            </AdminDashboardPickerList>
          ) : !isLoading ? (
            <AdminDashboardMessage $tone="neutral">
              Aucun evenement ne correspond a cette recherche.
            </AdminDashboardMessage>
          ) : null
        ) : null}

        <AdminDashboardField>
          <AdminDashboardLabel>Recherche billets</AdminDashboardLabel>
          <AdminDashboardInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Evenement, client, commande, QR masque, scan..."
          />
        </AdminDashboardField>

        {isLoading ? (
          <AdminDashboardMessage $tone="neutral">
            Chargement des billets...
          </AdminDashboardMessage>
        ) : null}

        {!isLoading && filteredTickets.length === 0 ? (
          <AdminDashboardMessage $tone="neutral">
            {selectedEvent
              ? `Aucun billet ne correspond pour ${selectedEvent.eventTitle}.`
              : 'Aucun billet ne correspond a la recherche.'}
          </AdminDashboardMessage>
        ) : null}

        <AdminDashboardList>
          {ticketsByEvent.map((group) => (
            <AdminDashboardGroup key={group.eventKey}>
              <AdminDashboardGroupHeader>
                <div>
                  <AdminDashboardRowTitle>{group.eventTitle}</AdminDashboardRowTitle>
                  <AdminDashboardRowText>{group.eventMeta}</AdminDashboardRowText>
                </div>
                <AdminDashboardBadge>{group.tickets.length} billet(s)</AdminDashboardBadge>
              </AdminDashboardGroupHeader>
              {group.tickets.map((ticket) => (
                <AdminDashboardRow key={ticket.id}>
                  <AdminDashboardRowMain>
                    <AdminDashboardRowTitle>
                      Billet #{ticket.id}
                    </AdminDashboardRowTitle>
                    <AdminDashboardRowText>
                      {ticket.client.fullName ?? 'Client inconnu'} - {ticket.client.email ?? 'Email inconnu'}
                    </AdminDashboardRowText>
                    <AdminDashboardRowText>
                      QR: {ticket.qrTokenMasked} - commande {ticket.order.reference ?? 'inconnue'}
                    </AdminDashboardRowText>
                    <AdminDashboardRowText>
                      Type: {ticket.ticketType.name ?? 'Non renseigne'} - emis le {formatDate(ticket.issuedAt)}
                    </AdminDashboardRowText>
                    <AdminDashboardRowText>
                      Dernier scan:{' '}
                      {ticket.latestCheckin
                        ? `${ticket.latestCheckin.result} par ${ticket.latestCheckin.staff.fullName ?? 'staff inconnu'} le ${formatDate(ticket.latestCheckin.scannedAt)}`
                        : 'aucun'}
                    </AdminDashboardRowText>
                  </AdminDashboardRowMain>
                  <AdminDashboardActions>
                    <AdminDashboardBadge $tone={getTicketStatusTone(ticket.status)}>
                      {ticket.status ?? 'inconnu'}
                    </AdminDashboardBadge>
                    <AdminDashboardBadge $tone={getCheckinTone(ticket.latestCheckin?.result ?? null)}>
                      {ticket.latestCheckin?.result ?? 'non scanne'}
                    </AdminDashboardBadge>
                  </AdminDashboardActions>
                  <span />
                </AdminDashboardRow>
              ))}
            </AdminDashboardGroup>
          ))}
        </AdminDashboardList>
      </AdminDashboardPanel>
    </AdminDashboardSection>
  )
}
