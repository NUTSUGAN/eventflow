import { useEffect, useMemo, useState } from 'react'
import { EventCard } from '../../components/EventCard/EventCard'
import {
  followOrganizer,
  getPublicEventById,
  getPublicEvents,
  unfollowOrganizer,
} from '../../api/events'
import type { EventDetail, EventSummary } from '../../types/event'
import {
  AuthPromptButton,
  DetailBody,
  DetailCaption,
  DetailEmptyText,
  DetailGrid,
  DetailHero,
  DetailHeroContent,
  DetailHeroCover,
  DetailHeroMeta,
  DetailHeroTop,
  DetailInfoGrid,
  DetailInfoItem,
  DetailInfoLabel,
  DetailInfoSelect,
  DetailInfoValue,
  DetailMapCard,
  DetailMapFrame,
  DetailMapLink,
  DetailMetaBadge,
  DetailMetaBadgeRow,
  DetailOrganizerActions,
  DetailOrganizerAvatar,
  DetailOrganizerCard,
  DetailOrganizerIdentity,
  DetailOrganizerName,
  DetailOrganizerNote,
  DetailPanel,
  DetailPanelHeader,
  DetailPanelTitle,
  DetailRelatedGrid,
  DetailSection,
  DetailStateBox,
  DetailText,
  DetailTitle,
  DetailTicketList,
  DetailTicketListItem,
  DetailTicketActions,
  DetailTicketDescription,
  DetailTicketMeta,
  DetailTicketPrice,
  TicketReserveButton,
  TicketReserveHint,
  DetailTicketText,
  FollowButton,
  FollowIcon,
} from './eventDetailPageElements'
import heroImage from '../../assets/hero.png'
import { useNavigate, useParams } from 'react-router-dom'

function formatEventDate(date: string | null): string {
  if (!date) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function formatEventTimeRange(start: string | null, end: string | null): string {
  if (!start) {
    return 'Horaire a confirmer'
  }

  const startTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(start))

  if (!end) {
    return startTime
  }

  const endTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(end))

  return `${startTime} - ${endTime}`
}

function formatTicketPrice(price: number | null): string {
  if (price === null) {
    return 'Tarif a venir'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function resolveAvailableStock(ticketType: EventDetail['ticketTypes'][number]): number {
  if (ticketType.availableStock !== null) {
    return ticketType.availableStock
  }

  return ticketType.stock ?? 0
}

function isTicketSaleOpen(ticketType: EventDetail['ticketTypes'][number]): boolean {
  const now = Date.now()
  const saleStartAt = ticketType.saleStartAt ? new Date(ticketType.saleStartAt).getTime() : null
  const saleEndAt = ticketType.saleEndAt ? new Date(ticketType.saleEndAt).getTime() : null

  if (saleStartAt !== null && !Number.isNaN(saleStartAt) && now < saleStartAt) {
    return false
  }

  if (saleEndAt !== null && !Number.isNaN(saleEndAt) && now > saleEndAt) {
    return false
  }

  return true
}

function getTicketAvailabilityState(ticketType: EventDetail['ticketTypes'][number]):
  | 'available'
  | 'sold_out'
  | 'upcoming'
  | 'ended' {
  const availableStock = resolveAvailableStock(ticketType)

  if (availableStock <= 0) {
    return 'sold_out'
  }

  const now = Date.now()
  const saleStartAt = ticketType.saleStartAt ? new Date(ticketType.saleStartAt).getTime() : null
  const saleEndAt = ticketType.saleEndAt ? new Date(ticketType.saleEndAt).getTime() : null

  if (saleStartAt !== null && !Number.isNaN(saleStartAt) && now < saleStartAt) {
    return 'upcoming'
  }

  if (saleEndAt !== null && !Number.isNaN(saleEndAt) && now > saleEndAt) {
    return 'ended'
  }

  return 'available'
}

function getTicketButtonLabel(ticketType: EventDetail['ticketTypes'][number]): string {
  const state = getTicketAvailabilityState(ticketType)

  if (state === 'sold_out') {
    return 'Complet'
  }

  if (state === 'upcoming' || state === 'ended') {
    return 'Indisponible'
  }

  return 'Reserver'
}

function getTicketReserveHintText(ticketType: EventDetail['ticketTypes'][number]): string {
  const state = getTicketAvailabilityState(ticketType)

  if (state === 'sold_out') {
    return 'Ce billet est complet pour le moment.'
  }

  if (state === 'upcoming') {
    return 'La vente de ce billet n a pas encore commence.'
  }

  if (state === 'ended') {
    return 'La vente de ce billet est terminee.'
  }

  return 'Tu choisiras la quantite juste apres.'
}

function getOrganizerInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const eventStatusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente' },
  { value: 'published', label: 'Public' },
  { value: 'cancelled', label: 'Annule' },
  { value: 'completed', label: 'Termine' },
]

function normalizeStatusValue(status: string): string {
  const normalizedStatus = status.trim().toLowerCase()

  return eventStatusOptions.some((option) => option.value === normalizedStatus)
    ? normalizedStatus
    : 'draft'
}

export function EventDetailPage() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [relatedEvents, setRelatedEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEventDetail() {
      if (!eventId) {
        if (isMounted) {
          setErrorMessage("Impossible de retrouver l'evenement demande.")
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await getPublicEventById(eventId)

        if (isMounted) {
          setEvent(data)
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Impossible de charger la fiche evenement pour le moment.",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadEventDetail()

    return () => {
      isMounted = false
    }
  }, [eventId])

  useEffect(() => {
    let isMounted = true

    async function loadRelatedEvents() {
      if (!event?.category?.name) {
        if (isMounted) {
          setRelatedEvents([])
        }
        return
      }

      try {
        const data = await getPublicEvents({
          type: event.category.name,
          limit: 4,
        })

        if (isMounted) {
          setRelatedEvents(
            data.filter((candidate) => candidate.id !== event.id).slice(0, 3),
          )
        }
      } catch {
        if (isMounted) {
          setRelatedEvents([])
        }
      }
    }

    void loadRelatedEvents()

    return () => {
      isMounted = false
    }
  }, [event?.category?.name, event?.id])

  const mapEmbedUrl = useMemo(() => {
    if (!event?.location) {
      return null
    }

    const query =
      event.location.latitude !== null && event.location.longitude !== null
        ? `${event.location.latitude},${event.location.longitude}`
        : [
            event.location.address,
            event.location.postalCode,
            event.location.city,
            event.location.country,
          ]
            .filter(Boolean)
            .join(', ')

    if (!query) {
      return null
    }

    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`
  }, [event])

  const mapLink = useMemo(() => {
    if (!event?.location) {
      return null
    }

    const query = [
      event.location.address,
      event.location.postalCode,
      event.location.city,
      event.location.country,
    ]
      .filter(Boolean)
      .join(', ')

    if (!query) {
      return null
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }, [event])

  const availableTicketTypeCount = useMemo(() => {
    if (!event) {
      return 0
    }

    return event.ticketTypes.filter(
      (ticketType) => resolveAvailableStock(ticketType) > 0 && isTicketSaleOpen(ticketType),
    ).length
  }, [event])

  async function handleFollowToggle() {
    if (!event?.organizer || !event.subscription.canFollow || isFollowLoading) {
      return
    }

    setIsFollowLoading(true)

    try {
      const response = event.subscription.isFollowing
        ? await unfollowOrganizer(event.organizer.id)
        : await followOrganizer(event.organizer.id)

      setEvent((currentEvent) =>
        currentEvent
          ? {
              ...currentEvent,
              subscription: response.subscription,
            }
          : currentEvent,
      )
    } catch {
      setErrorMessage(
        "Impossible de mettre a jour l'abonnement a cet organisateur pour le moment.",
      )
    } finally {
      setIsFollowLoading(false)
    }
  }

  function handleAuthPrompt() {
    document.getElementById('site-auth-cta')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  function handleReserveTicket(selectedTicketTypeId: number) {
    if (!event) {
      return
    }

    navigate(
      `/orders/prepare?eventId=${event.id}&ticketTypeId=${selectedTicketTypeId}`,
    )
  }

  if (isLoading) {
    return (
      <DetailSection>
        <DetailStateBox>
          <DetailPanelTitle>Chargement de la fiche evenement...</DetailPanelTitle>
          <DetailText>
            On recupere les informations de l&apos;evenement et de l&apos;organisateur.
          </DetailText>
        </DetailStateBox>
      </DetailSection>
    )
  }

  if (errorMessage || !event) {
    return (
      <DetailSection>
        <DetailStateBox>
          <DetailPanelTitle>La fiche evenement n&apos;est pas disponible.</DetailPanelTitle>
          <DetailText>{errorMessage ?? "Une erreur inconnue s'est produite."}</DetailText>
        </DetailStateBox>
      </DetailSection>
    )
  }

  const coverImageUrl = event.media.coverUrl ?? event.media.thumbnailUrl ?? heroImage
  const organizerInitials = event.organizer
    ? getOrganizerInitials(event.organizer.fullName)
    : 'EV'
  const statusValue = normalizeStatusValue(event.status)

  return (
    <DetailSection>
      <DetailHero>
        <DetailHeroCover $imageUrl={coverImageUrl} />

        <DetailHeroContent>
          <DetailHeroTop>
            <DetailMetaBadgeRow>
              <DetailMetaBadge>{event.category?.name ?? 'Evenement'}</DetailMetaBadge>
              <DetailMetaBadge>{formatEventDate(event.startsAt)}</DetailMetaBadge>
              <DetailMetaBadge>{formatEventTimeRange(event.startsAt, event.endsAt)}</DetailMetaBadge>
            </DetailMetaBadgeRow>

            <DetailTitle>{event.title}</DetailTitle>
          </DetailHeroTop>

          <DetailHeroMeta>
            <DetailInfoGrid>
              <DetailInfoItem>
                <DetailInfoLabel>Ville</DetailInfoLabel>
                <DetailInfoValue>{event.location?.city ?? 'A confirmer'}</DetailInfoValue>
              </DetailInfoItem>

              <DetailInfoItem>
                <DetailInfoLabel>Adresse</DetailInfoLabel>
                <DetailInfoValue>
                  {event.location?.address ?? 'Adresse a confirmer'}
                </DetailInfoValue>
              </DetailInfoItem>

              <DetailInfoItem>
                <DetailInfoLabel>Capacite</DetailInfoLabel>
                <DetailInfoValue>
                  {event.capacity !== null ? `${event.capacity} places` : 'Non renseignee'}
                </DetailInfoValue>
              </DetailInfoItem>

              <DetailInfoItem>
                <DetailInfoLabel>Statut</DetailInfoLabel>
                <DetailInfoSelect defaultValue={statusValue} disabled aria-label="Statut de l'evenement">
                  {eventStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </DetailInfoSelect>
              </DetailInfoItem>
            </DetailInfoGrid>
          </DetailHeroMeta>
        </DetailHeroContent>
      </DetailHero>

      <DetailGrid>
        <DetailBody>
          <DetailPanel>
            <DetailPanelHeader>
              <DetailPanelTitle>A propos de cet evenement</DetailPanelTitle>
            </DetailPanelHeader>
            <DetailText>{event.description}</DetailText>
          </DetailPanel>

          <DetailPanel>
            <DetailPanelHeader>
              <DetailPanelTitle>Billets disponibles</DetailPanelTitle>
              <DetailCaption>
                {availableTicketTypeCount} type(s) de billet encore disponible(s)
              </DetailCaption>
            </DetailPanelHeader>

            {event.ticketTypes.length > 0 ? (
              <DetailTicketList>
                {event.ticketTypes.map((ticketType) => (
                  <DetailTicketListItem key={ticketType.id}>
                    <div>
                      <DetailTicketText>{ticketType.name}</DetailTicketText>
                      {ticketType.description ? (
                        <DetailTicketDescription>
                          {ticketType.description}
                        </DetailTicketDescription>
                      ) : null}
                      <DetailTicketMeta>
                        Stock restant {resolveAvailableStock(ticketType)}
                        {` / ${ticketType.stock ?? 0}`}
                        {ticketType.maxPerOrder
                          ? ` - Max ${ticketType.maxPerOrder} / commande`
                          : ''}
                      </DetailTicketMeta>
                    </div>

                    <DetailTicketActions>
                      <div>
                      <DetailTicketPrice>
                        {formatTicketPrice(ticketType.basePrice)}
                      </DetailTicketPrice>
                      <DetailTicketMeta>
                        Vente {formatEventDate(ticketType.saleStartAt)}
                      </DetailTicketMeta>
                      </div>

                      <TicketReserveButton
                        type="button"
                        onClick={() => handleReserveTicket(ticketType.id)}
                        disabled={getTicketAvailabilityState(ticketType) !== 'available'}
                      >
                        {getTicketButtonLabel(ticketType)}
                      </TicketReserveButton>
                      <TicketReserveHint>
                        {getTicketReserveHintText(ticketType)}
                      </TicketReserveHint>
                    </DetailTicketActions>
                  </DetailTicketListItem>
                ))}
              </DetailTicketList>
            ) : (
              <DetailEmptyText>
                Les billets ne sont pas encore affiches pour cet evenement.
              </DetailEmptyText>
            )}
          </DetailPanel>

          <DetailPanel>
            <DetailPanelHeader>
              <DetailPanelTitle>Lieu et acces</DetailPanelTitle>
              {mapLink ? (
                <DetailMapLink href={mapLink} target="_blank" rel="noreferrer">
                  Ouvrir dans Maps
                </DetailMapLink>
              ) : null}
            </DetailPanelHeader>

            <DetailText>
              {[event.location?.address, event.location?.postalCode, event.location?.city, event.location?.country]
                .filter(Boolean)
                .join(', ')}
            </DetailText>

            <DetailMapCard>
              {mapEmbedUrl ? (
                <DetailMapFrame
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Carte de ${event.title}`}
                />
              ) : (
                <DetailEmptyText>
                  La carte sera disponible des que les informations de localisation seront completes.
                </DetailEmptyText>
              )}
            </DetailMapCard>
          </DetailPanel>
        </DetailBody>

        <aside>
          <DetailPanel>
            <DetailPanelHeader>
              <DetailPanelTitle>Organisateur</DetailPanelTitle>
            </DetailPanelHeader>

            {event.organizer ? (
              <DetailOrganizerCard>
                <DetailOrganizerIdentity>
                  <DetailOrganizerAvatar
                    $imageUrl={event.organizer.profilePhoto ?? undefined}
                  >
                    {!event.organizer.profilePhoto ? organizerInitials : null}
                  </DetailOrganizerAvatar>

                  <div>
                    <DetailOrganizerName>{event.organizer.fullName}</DetailOrganizerName>
                    <DetailOrganizerNote>
                      Retrouvez ses prochains evenements et suivez ses nouvelles publications.
                    </DetailOrganizerNote>
                  </div>
                </DetailOrganizerIdentity>

                <DetailOrganizerActions>
                  {event.subscription.canFollow ? (
                    <FollowButton
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      $active={event.subscription.isFollowing}
                    >
                      <FollowIcon viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 2.75l2.84 5.76 6.36.92-4.6 4.48 1.08 6.34L12 17.27 6.32 20.25l1.08-6.34-4.6-4.48 6.36-.92L12 2.75Z"
                          fill="currentColor"
                        />
                      </FollowIcon>
                      {event.subscription.isFollowing
                        ? 'Organisateur suivi'
                        : "Suivre l'organisateur"}
                    </FollowButton>
                  ) : null}

                  {event.subscription.requiresAuth ? (
                    <AuthPromptButton type="button" onClick={handleAuthPrompt}>
                      Se connecter / S'inscrire pour suivre
                    </AuthPromptButton>
                  ) : null}
                </DetailOrganizerActions>

                {event.subscription.requiresAuth ? (
                  <DetailOrganizerNote>
                    Connecte-toi ou cree un compte pour suivre cet organisateur.
                  </DetailOrganizerNote>
                ) : null}
              </DetailOrganizerCard>
            ) : (
              <DetailEmptyText>
                Les informations organisateur ne sont pas encore disponibles.
              </DetailEmptyText>
            )}
          </DetailPanel>
        </aside>
      </DetailGrid>

      <DetailPanel>
        <DetailPanelHeader>
          <DetailPanelTitle>Dans la meme categorie</DetailPanelTitle>
          <DetailCaption>3 evenements publies a afficher ensuite</DetailCaption>
        </DetailPanelHeader>

        {relatedEvents.length > 0 ? (
          <DetailRelatedGrid>
            {relatedEvents.map((relatedEvent) => (
              <EventCard key={relatedEvent.id} event={relatedEvent} />
            ))}
          </DetailRelatedGrid>
        ) : (
          <DetailEmptyText>
            D'autres evenements de cette categorie seront proposes ici au fur et a mesure des publications.
          </DetailEmptyText>
        )}
      </DetailPanel>
    </DetailSection>
  )
}
