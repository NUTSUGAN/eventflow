import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPendingOrders } from '../../api/orders'
import { getMyTickets } from '../../api/tickets'
import type { PreparedOrder } from '../../types/order'
import type { TicketRecord } from '../../types/ticket'
import {
  MyTicketsActions,
  MyTicketsCard,
  MyTicketsCardBody,
  MyTicketsCardText,
  MyTicketsCoverButton,
  MyTicketsDangerButton,
  MyTicketsEventTitle,
  MyTicketsGrid,
  MyTicketsHero,
  MyTicketsInfoCard,
  MyTicketsInfoText,
  MyTicketsInfoTitle,
  MyTicketsMetaRow,
  MyTicketsPendingCard,
  MyTicketsPendingHeader,
  MyTicketsPendingItem,
  MyTicketsPendingItems,
  MyTicketsPendingList,
  MyTicketsPendingText,
  MyTicketsPendingTitle,
  MyTicketsPendingTitleGroup,
  MyTicketsPrimaryButton,
  MyTicketsSecondaryButton,
  MyTicketsSection,
  MyTicketsStatusMessage,
  MyTicketsStateCard,
  MyTicketsStateText,
  MyTicketsStateTitle,
  MyTicketsSubtitle,
  MyTicketsSummaryGrid,
  MyTicketsSummaryItem,
  MyTicketsSummaryLabel,
  MyTicketsSummaryValue,
  MyTicketsTabButton,
  MyTicketsTabs,
  MyTicketsTag,
  MyTicketsTitleButton,
  MyTicketsTitle,
} from './myTicketsPageElements'

type TicketTab = 'upcoming' | 'pending' | 'past'

const HIDDEN_PENDING_ORDERS_STORAGE_KEY = 'eventflow:hiddenPendingOrders'

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(value: number, currency: string | null): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency ?? 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function resolveTicketTab(ticket: TicketRecord, now: number): TicketTab {
  const endsAt = ticket.event.endsAt ? new Date(ticket.event.endsAt).getTime() : null

  if (endsAt !== null && endsAt < now) {
    return 'past'
  }

  return 'upcoming'
}

function getPaymentLabel(ticket: TicketRecord): string {
  const provider = ticket.order.payment?.provider
  const status = ticket.order.payment?.status

  if (!provider && !status) {
    return 'Paiement confirme'
  }

  if (provider && status) {
    return `${provider} - ${status}`
  }

  return provider ?? status ?? 'Paiement confirme'
}

function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'En attente de paiement'
    case 'expired':
      return 'Paiement a relancer'
    case 'cancelled':
      return 'Annulee'
    case 'paid':
      return 'Payee'
    default:
      return status
  }
}

function readHiddenPendingOrderIds(): number[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(HIDDEN_PENDING_ORDERS_STORAGE_KEY) ?? '[]',
    )

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isFinite(value) && value > 0)
  } catch {
    return []
  }
}

function storeHiddenPendingOrderIds(orderIds: number[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    HIDDEN_PENDING_ORDERS_STORAGE_KEY,
    JSON.stringify(orderIds),
  )
}

function getPendingOrderTicketCount(order: PreparedOrder): number {
  return order.items.reduce((total, item) => total + item.quantity, 0)
}

export function MyTicketsPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [pendingOrders, setPendingOrders] = useState<PreparedOrder[]>([])
  const [hiddenPendingOrderIds, setHiddenPendingOrderIds] = useState<number[]>(
    readHiddenPendingOrderIds,
  )
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(() => Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [activeTab, setActiveTab] = useState<TicketTab>('upcoming')
  const [reloadSeed, setReloadSeed] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadTickets() {
      setIsLoading(true)
      setErrorMessage(null)
      setRequiresAuth(false)

      try {
        const [ticketsResponse, pendingOrdersResponse] = await Promise.all([
          getMyTickets(),
          getPendingOrders(),
        ])

        if (isMounted) {
          setTickets(ticketsResponse.tickets)
          setPendingOrders(pendingOrdersResponse.orders)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const status =
          typeof error === 'object' &&
          error !== null &&
          'response' in error
            ? (error as { response?: { status?: unknown } }).response?.status
            : null

        if (status === 401) {
          setErrorMessage('Connecte-toi pour retrouver tes billets EventFlow.')
          setRequiresAuth(true)
          return
        }

        setErrorMessage('Impossible de charger tes billets pour le moment.')
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
  }, [reloadSeed])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now())
    }, 60_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const ticketsByTab = useMemo(() => {
    return {
      upcoming: tickets.filter(
        (ticket) => resolveTicketTab(ticket, currentTimestamp) === 'upcoming',
      ),
      past: tickets.filter(
        (ticket) => resolveTicketTab(ticket, currentTimestamp) === 'past',
      ),
    }
  }, [currentTimestamp, tickets])

  const pendingOrdersToDisplay = useMemo(
    () =>
      pendingOrders.filter(
        (order) => !hiddenPendingOrderIds.includes(order.id),
      ),
    [hiddenPendingOrderIds, pendingOrders],
  )

  const visibleTickets = activeTab === 'past'
    ? ticketsByTab.past
    : ticketsByTab.upcoming

  function handleHidePendingOrder(orderId: number) {
    setHiddenPendingOrderIds((currentOrderIds) => {
      const nextOrderIds = Array.from(new Set([...currentOrderIds, orderId]))
      storeHiddenPendingOrderIds(nextOrderIds)

      return nextOrderIds
    })
  }

  return (
    <MyTicketsSection>
      <MyTicketsHero>
        <MyTicketsTitle>Mes billets</MyTicketsTitle>
        <MyTicketsSubtitle>
          Retrouve tes billets confirmes, et reprends les commandes preparees
          qui attendent encore un paiement.
        </MyTicketsSubtitle>
      </MyTicketsHero>

      <MyTicketsTabs>
        <MyTicketsTabButton
          type="button"
          $active={activeTab === 'upcoming'}
          onClick={() => setActiveTab('upcoming')}
        >
          A venir
        </MyTicketsTabButton>
        <MyTicketsTabButton
          type="button"
          $active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
        >
          En attente
        </MyTicketsTabButton>
        <MyTicketsTabButton
          type="button"
          $active={activeTab === 'past'}
          onClick={() => setActiveTab('past')}
        >
          Passe
        </MyTicketsTabButton>
      </MyTicketsTabs>

      {isLoading ? (
        <MyTicketsStateCard>
          <MyTicketsStateTitle>Chargement de tes billets...</MyTicketsStateTitle>
          <MyTicketsStateText>
            On recupere les commandes payees et les billets emis depuis Stripe.
          </MyTicketsStateText>
        </MyTicketsStateCard>
      ) : errorMessage ? (
        <MyTicketsStateCard>
          <MyTicketsStateTitle>Acces indisponible</MyTicketsStateTitle>
          <MyTicketsStateText>{errorMessage}</MyTicketsStateText>
          <MyTicketsActions>
            {requiresAuth ? (
              <MyTicketsPrimaryButton
                type="button"
                onClick={() => navigate('/auth?mode=login')}
              >
                Se connecter
              </MyTicketsPrimaryButton>
            ) : (
              <MyTicketsPrimaryButton
                type="button"
                onClick={() => setReloadSeed((value) => value + 1)}
              >
                Recharger mes billets
              </MyTicketsPrimaryButton>
            )}
            <MyTicketsSecondaryButton
              type="button"
              onClick={() => navigate('/explorer')}
            >
              Retour a Explorer
            </MyTicketsSecondaryButton>
          </MyTicketsActions>
        </MyTicketsStateCard>
      ) : activeTab === 'pending' ? (
        pendingOrdersToDisplay.length === 0 ? (
          <>
            <MyTicketsStateCard>
              <MyTicketsStateTitle>Aucune commande en attente</MyTicketsStateTitle>
              <MyTicketsStateText>
                On affichera ici tes commandes preparees sans paiement confirme,
                pour reprendre Stripe ou retirer la preparation de cette liste.
              </MyTicketsStateText>
              <MyTicketsActions>
                <MyTicketsPrimaryButton
                  type="button"
                  onClick={() => navigate('/explorer')}
                >
                  Voir les prochains evenements
                </MyTicketsPrimaryButton>
              </MyTicketsActions>
            </MyTicketsStateCard>

            <MyTicketsInfoCard>
              <MyTicketsInfoTitle>Preparations de commande</MyTicketsInfoTitle>
              <MyTicketsInfoText>
                Retirer une preparation ici la masque seulement dans ce navigateur.
                La commande reste disponible cote plateforme si elle doit etre auditee.
              </MyTicketsInfoText>
            </MyTicketsInfoCard>
          </>
        ) : (
          <MyTicketsPendingList>
            {pendingOrdersToDisplay.map((order) => (
              <MyTicketsPendingCard key={order.id}>
                <MyTicketsPendingHeader>
                  <MyTicketsPendingTitleGroup>
                    <MyTicketsMetaRow>
                      <MyTicketsTag>{formatOrderStatusLabel(order.status)}</MyTicketsTag>
                      <MyTicketsTag>{order.reference}</MyTicketsTag>
                    </MyTicketsMetaRow>
                    <MyTicketsPendingTitle>
                      {order.event.title ?? 'Evenement EventFlow'}
                    </MyTicketsPendingTitle>
                    <MyTicketsPendingText>
                      {formatDateTime(order.event.startsAt ?? null)}
                      {order.event.city ? ` - ${order.event.city}` : ''}
                    </MyTicketsPendingText>
                  </MyTicketsPendingTitleGroup>
                  <MyTicketsTag>{formatCurrency(order.total, order.currency)}</MyTicketsTag>
                </MyTicketsPendingHeader>

                <MyTicketsPendingItems>
                  {order.items.map((item) => (
                    <MyTicketsPendingItem key={item.ticketTypeId}>
                      {item.quantity} x {item.ticketName ?? 'Billet EventFlow'} -{' '}
                      {formatCurrency(item.lineTotal, order.currency)}
                    </MyTicketsPendingItem>
                  ))}
                </MyTicketsPendingItems>

                <MyTicketsSummaryGrid>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Commande</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>{order.reference}</MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Billets prepares</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {getPendingOrderTicketCount(order)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Total a payer</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {formatCurrency(order.total, order.currency)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Preparee le</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {formatDateTime(order.createdAt)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                </MyTicketsSummaryGrid>

                {!order.canStartCheckout ? (
                  <MyTicketsStatusMessage>
                    Cette commande ne peut plus relancer Stripe depuis cet espace.
                  </MyTicketsStatusMessage>
                ) : null}

                <MyTicketsActions>
                  {order.canStartCheckout ? (
                    <MyTicketsPrimaryButton
                      type="button"
                      onClick={() => navigate(`/checkout?orderId=${order.id}`)}
                    >
                      Continuer le paiement
                    </MyTicketsPrimaryButton>
                  ) : null}
                  {order.event.id ? (
                    <MyTicketsSecondaryButton
                      type="button"
                      onClick={() => navigate(`/events/${order.event.id}`)}
                    >
                      Voir l&apos;evenement
                    </MyTicketsSecondaryButton>
                  ) : null}
                  <MyTicketsDangerButton
                    type="button"
                    onClick={() => handleHidePendingOrder(order.id)}
                  >
                    Retirer de la liste
                  </MyTicketsDangerButton>
                </MyTicketsActions>
              </MyTicketsPendingCard>
            ))}
          </MyTicketsPendingList>
        )
      ) : visibleTickets.length === 0 ? (
        <>
          <MyTicketsStateCard>
            <MyTicketsStateTitle>
              {activeTab === 'upcoming'
                ? "Tu n'as pas de billets a venir"
                : 'Aucun billet passe pour le moment'}
            </MyTicketsStateTitle>
            <MyTicketsStateText>
              On affichera ici les billets lies a tes commandes Stripe confirmees.
            </MyTicketsStateText>
            <MyTicketsActions>
              <MyTicketsPrimaryButton
                type="button"
                onClick={() => navigate('/explorer')}
              >
                Voir les prochains evenements
              </MyTicketsPrimaryButton>
            </MyTicketsActions>
          </MyTicketsStateCard>

          <MyTicketsInfoCard>
            <MyTicketsInfoTitle>Conditions de revente</MyTicketsInfoTitle>
            <MyTicketsInfoText>
              La revente de billets n&apos;est pas encore geree depuis cet espace.
              Chaque billet visible ici correspond uniquement a une commande Stripe payee.
            </MyTicketsInfoText>
          </MyTicketsInfoCard>
        </>
      ) : (
        <MyTicketsGrid>
          {visibleTickets.map((ticket) => (
            <MyTicketsCard key={ticket.id}>
              <MyTicketsCoverButton
                type="button"
                $imageUrl={ticket.event.coverImageUrl ?? undefined}
                onClick={() => navigate(`/mes-billets/${ticket.id}`)}
                aria-label={`Ouvrir le billet ${ticket.displayCode}`}
              />
              <MyTicketsCardBody>
                <MyTicketsMetaRow>
                  <MyTicketsTag>{ticket.ticketType.name ?? 'Billet EventFlow'}</MyTicketsTag>
                  <MyTicketsTag>{getPaymentLabel(ticket)}</MyTicketsTag>
                  <MyTicketsTag>{ticket.displayCode}</MyTicketsTag>
                </MyTicketsMetaRow>

                <div>
                  <MyTicketsTitleButton
                    type="button"
                    onClick={() => navigate(`/mes-billets/${ticket.id}`)}
                  >
                    <MyTicketsEventTitle>{ticket.event.title ?? 'Evenement EventFlow'}</MyTicketsEventTitle>
                  </MyTicketsTitleButton>
                  <MyTicketsCardText>
                    {ticket.event.venue ?? 'Lieu a confirmer'}{ticket.event.city ? ` - ${ticket.event.city}` : ''}
                  </MyTicketsCardText>
                </div>

                <MyTicketsSummaryGrid>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Date</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {formatDateTime(ticket.event.startsAt)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Commande</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {ticket.order.reference ?? 'Reference indisponible'}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Montant paye</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {formatCurrency(ticket.amount, ticket.order.currency)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Emission</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {formatDateTime(ticket.issuedAt)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                </MyTicketsSummaryGrid>

                <MyTicketsActions>
                  <MyTicketsPrimaryButton
                    type="button"
                    onClick={() => navigate(`/mes-billets/${ticket.id}`)}
                  >
                    Voir mon QR code
                  </MyTicketsPrimaryButton>
                  {ticket.event.id ? (
                    <MyTicketsSecondaryButton
                      type="button"
                      onClick={() => navigate(`/events/${ticket.event.id}`)}
                    >
                      Voir l&apos;evenement
                    </MyTicketsSecondaryButton>
                  ) : null}
                </MyTicketsActions>

                <MyTicketsStatusMessage>
                  Ce billet est individuel et peut etre
                  ouvert depuis cette carte.
                </MyTicketsStatusMessage>
              </MyTicketsCardBody>
            </MyTicketsCard>
          ))}
        </MyTicketsGrid>
      )}
    </MyTicketsSection>
  )
}
