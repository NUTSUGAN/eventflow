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
    return 'Date à confirmer'
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
    return 'Paiement confirmé'
  }

  if (provider && status) {
    return `${provider} - ${status}`
  }

  return provider ?? status ?? 'Paiement confirmé'
}

function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'En attente de paiement'
    case 'expired':
      return 'Paiement à relancer'
    case 'cancelled':
      return 'Annulée'
    case 'paid':
      return 'Payée'
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
          Retrouve tes billets confirmés, et reprends les commandes préparees
          qui attendent encore un paiement.
        </MyTicketsSubtitle>
      </MyTicketsHero>

      <MyTicketsTabs>
        <MyTicketsTabButton
          type="button"
          $active={activeTab === 'upcoming'}
          onClick={() => setActiveTab('upcoming')}
        >
          À venir
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
          Passé
        </MyTicketsTabButton>
      </MyTicketsTabs>

      {isLoading ? (
        <MyTicketsStateCard>
          <MyTicketsStateTitle>Chargement de tes billets...</MyTicketsStateTitle>
          <MyTicketsStateText>
            On récupère les commandes payées et les billets émis depuis Stripe.
          </MyTicketsStateText>
        </MyTicketsStateCard>
      ) : errorMessage ? (
        <MyTicketsStateCard>
          <MyTicketsStateTitle>Accès indisponible</MyTicketsStateTitle>
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
              Retour à Explorer
            </MyTicketsSecondaryButton>
          </MyTicketsActions>
        </MyTicketsStateCard>
      ) : activeTab === 'pending' ? (
        pendingOrdersToDisplay.length === 0 ? (
          <>
            <MyTicketsStateCard>
              <MyTicketsStateTitle>Aucune commande en’attente</MyTicketsStateTitle>
              <MyTicketsStateText>
                On affichera ici tes commandes préparees sans paiement confirmé,
                pour reprendre Stripe ou retirer la préparation de cette liste.
              </MyTicketsStateText>
              <MyTicketsActions>
                <MyTicketsPrimaryButton
                  type="button"
                  onClick={() => navigate('/explorer')}
                >
                  Voir les prochains évènements
                </MyTicketsPrimaryButton>
              </MyTicketsActions>
            </MyTicketsStateCard>

            <MyTicketsInfoCard>
              <MyTicketsInfoTitle>Préparations de commande</MyTicketsInfoTitle>
              <MyTicketsInfoText>
                Retirer une préparation ici la masque seulement dans ce navigateur.
                La commande reste disponible côté plateforme si elle doit être auditee.
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
                      {order.event.title ?? 'évènement EventFlow'}
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
                    <MyTicketsSummaryLabel>Billets prépares</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {getPendingOrderTicketCount(order)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Total À payer</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {formatCurrency(order.total, order.currency)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Préparée le</MyTicketsSummaryLabel>
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
                      Voir l&apos;évènement
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
                ? "Tu n’as pas de billets à venir"
                : 'Aucun billet passé pour le moment'}
            </MyTicketsStateTitle>
            <MyTicketsStateText>
              On affichera ici les billets liés à tes commandes Stripe confirmées.
            </MyTicketsStateText>
            <MyTicketsActions>
              <MyTicketsPrimaryButton
                type="button"
                onClick={() => navigate('/explorer')}
              >
                Voir les prochains évènements
              </MyTicketsPrimaryButton>
            </MyTicketsActions>
          </MyTicketsStateCard>

          <MyTicketsInfoCard>
            <MyTicketsInfoTitle>Conditions de revente</MyTicketsInfoTitle>
            <MyTicketsInfoText>
              La revente de billets n&apos;est pas encore gérée depuis cet espace.
              Chaque billet visible ici correspond uniquement à une commande Stripe payée.
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
                    <MyTicketsEventTitle>{ticket.event.title ?? 'évènement EventFlow'}</MyTicketsEventTitle>
                  </MyTicketsTitleButton>
                  <MyTicketsCardText>
                    {ticket.event.venue ?? 'Lieu à confirmer'}{ticket.event.city ? ` - ${ticket.event.city}` : ''}
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
                      {ticket.order.reference ?? 'Référence indisponible'}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Montant payé</MyTicketsSummaryLabel>
                    <MyTicketsSummaryValue>
                      {formatCurrency(ticket.amount, ticket.order.currency)}
                    </MyTicketsSummaryValue>
                  </MyTicketsSummaryItem>
                  <MyTicketsSummaryItem>
                    <MyTicketsSummaryLabel>Émission</MyTicketsSummaryLabel>
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
                      Voir l&apos;évènement
                    </MyTicketsSecondaryButton>
                  ) : null}
                </MyTicketsActions>

                <MyTicketsStatusMessage>
                  Ce billet est individuel et peut être
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
