import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTickets } from '../../api/tickets'
import type { TicketRecord } from '../../types/ticket'
import {
  MyTicketsActions,
  MyTicketsCard,
  MyTicketsCardBody,
  MyTicketsCardText,
  MyTicketsCoverButton,
  MyTicketsEventTitle,
  MyTicketsGrid,
  MyTicketsHero,
  MyTicketsInfoCard,
  MyTicketsInfoText,
  MyTicketsInfoTitle,
  MyTicketsMetaRow,
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

type TicketTab = 'upcoming' | 'active' | 'past'

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
  const startsAt = ticket.event.startsAt ? new Date(ticket.event.startsAt).getTime() : null
  const endsAt = ticket.event.endsAt ? new Date(ticket.event.endsAt).getTime() : null

  if (endsAt !== null && endsAt < now) {
    return 'past'
  }

  if (
    startsAt !== null &&
    endsAt !== null &&
    startsAt <= now &&
    endsAt >= now
  ) {
    return 'active'
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

export function MyTicketsPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<TicketRecord[]>([])
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
        const response = await getMyTickets()

        if (isMounted) {
          setTickets(response.tickets)
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

  const ticketsByTab = useMemo(() => {
    const now = Date.now()

    return {
      upcoming: tickets.filter((ticket) => resolveTicketTab(ticket, now) === 'upcoming'),
      active: tickets.filter((ticket) => resolveTicketTab(ticket, now) === 'active'),
      past: tickets.filter((ticket) => resolveTicketTab(ticket, now) === 'past'),
    }
  }, [tickets])

  const visibleTickets = ticketsByTab[activeTab]

  return (
    <MyTicketsSection>
      <MyTicketsHero>
        <MyTicketsTitle>Mes billets</MyTicketsTitle>
        <MyTicketsSubtitle>
          Retrouve ici tous les billets confirmes apres paiement, avec leur evenement,
          leur commande et leur acces au detail.
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
          $active={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
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
      ) : visibleTickets.length === 0 ? (
        <>
          <MyTicketsStateCard>
            <MyTicketsStateTitle>
              {activeTab === 'upcoming'
                ? "Tu n'as pas de billets a venir"
                : activeTab === 'active'
                  ? "Aucun billet en attente d'utilisation"
                  : "Aucun billet passe pour le moment"}
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
