import type { EventSummary } from '../../types/event'
import {
  Card,
  CardCategory,
  CardContent,
  CardCover,
  CardDescription,
  CardLocation,
  CardMetaRow,
  CardTitle,
  CardWhen,
  EventLink,
  PriceTag,
} from './eventCardElements'

type EventCardProps = {
  event: EventSummary
  variant?: 'default' | 'explorer'
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

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const isExplorerVariant = variant === 'explorer'

  return (
    <EventLink to={`/events/${event.id}`}>
      <Card $variant={variant}>
        <CardCover
          $imageUrl={event.coverImageUrl ?? undefined}
          $variant={variant}
        />
        <CardContent $variant={variant}>
          {isExplorerVariant ? <CardCategory>{event.category}</CardCategory> : null}
          <CardTitle>{event.title}</CardTitle>
          <CardLocation>{event.city}, France</CardLocation>
          {isExplorerVariant ? <CardDescription>{event.shortDescription}</CardDescription> : null}
          <CardMetaRow>
            <CardWhen>{formatDate(event.startsAt)}</CardWhen>
            <PriceTag>{formatPrice(event.minPrice, event.currency)}</PriceTag>
          </CardMetaRow>
        </CardContent>
      </Card>
    </EventLink>
  )
}
