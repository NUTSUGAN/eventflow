import type { EventSummary } from '../../types/event'
import {
  Card,
  CardCover,
  CardLocation,
  CardMetaRow,
  CardTitle,
  CardWhen,
  EventLink,
  PriceTag,
} from './eventCardElements'

type EventCardProps = {
  event: EventSummary
}

const monthLabels = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC']

function formatDate(date: string): string {
  const eventDate = new Date(date)
  const day = String(eventDate.getDate()).padStart(2, '0')
  const month = monthLabels[eventDate.getMonth()] ?? ''
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(eventDate)

  return `${day} ${month} | ${time}`
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) {
    return 'Tarif a venir'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export function EventCard({ event }: EventCardProps) {
  return (
    <EventLink to={`/events/${event.id}`}>
      <Card>
        <CardCover $imageUrl={event.coverImageUrl ?? undefined} />
        <CardTitle>{event.title}</CardTitle>
        <CardLocation>
          {event.city}, France
        </CardLocation>
        <CardMetaRow>
          <CardWhen>{formatDate(event.startsAt)}</CardWhen>
          <PriceTag>{formatPrice(event.minPrice, event.currency)}</PriceTag>
        </CardMetaRow>
      </Card>
    </EventLink>
  )
}
