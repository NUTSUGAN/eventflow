import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyOrders } from '../../api/orders'
import type { OrderHistoryItem } from '../../types/order'
import {
  MyTicketsActions,
  MyTicketsPendingCard,
  MyTicketsPendingHeader,
  MyTicketsPendingList,
  MyTicketsPendingText,
  MyTicketsPendingTitle,
  MyTicketsPendingTitleGroup,
  MyTicketsPrimaryButton,
  MyTicketsSection,
  MyTicketsSecondaryButton,
  MyTicketsStateCard,
  MyTicketsStateText,
  MyTicketsStateTitle,
  MyTicketsSubtitle,
  MyTicketsSummaryGrid,
  MyTicketsSummaryItem,
  MyTicketsSummaryLabel,
  MyTicketsSummaryValue,
  MyTicketsTag,
  MyTicketsTitle,
  MyTicketsHero,
  MyTicketsMetaRow,
} from '../MyTicketsPage/myTicketsPageElements'

function formatDateTime(value: string | null): string {
  if (!value) return 'Date indisponible'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(value)
}

function orderTypeLabel(order: OrderHistoryItem): string {
  return order.orderType === 'promotion' ? 'Booster / promotion' : 'Billetterie'
}

export function MyOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    getMyOrders()
      .then((data) => {
        if (mounted) setOrders(data.orders)
      })
      .catch((nextError) => {
        if (!mounted) return
        const status = typeof nextError === 'object' && nextError !== null && 'response' in nextError
          ? (nextError as { response?: { status?: number } }).response?.status
          : null

        if (status === 401) {
          navigate('/auth?mode=login', { replace: true })
          return
        }

        setError('Impossible de charger tes commandes pour le moment.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => { mounted = false }
  }, [navigate])

  return (
    <MyTicketsSection>
      <MyTicketsHero>
        <MyTicketsTitle>Mes commandes</MyTicketsTitle>
        <MyTicketsSubtitle>
          Retrouve tous tes paiements confirmés pour la billetterie et les campagnes Booster.
        </MyTicketsSubtitle>
      </MyTicketsHero>

      {isLoading ? (
        <MyTicketsStateCard>
          <MyTicketsStateTitle>Chargement de tes commandes...</MyTicketsStateTitle>
          <MyTicketsStateText>On rassemble tes achats EventFlow confirmés.</MyTicketsStateText>
        </MyTicketsStateCard>
      ) : error ? (
        <MyTicketsStateCard>
          <MyTicketsStateTitle>Commandes indisponibles</MyTicketsStateTitle>
          <MyTicketsStateText>{error}</MyTicketsStateText>
        </MyTicketsStateCard>
      ) : orders.length === 0 ? (
        <MyTicketsStateCard>
          <MyTicketsStateTitle>Aucune commande effectuee</MyTicketsStateTitle>
          <MyTicketsStateText>Les paiements confirmés apparaîtront ici.</MyTicketsStateText>
        </MyTicketsStateCard>
      ) : (
        <MyTicketsPendingList>
          {orders.map((order) => (
            <MyTicketsPendingCard key={order.id}>
              <MyTicketsPendingHeader>
                <MyTicketsPendingTitleGroup>
                  <MyTicketsMetaRow>
                    <MyTicketsTag>{orderTypeLabel(order)}</MyTicketsTag>
                    <MyTicketsTag>Payee</MyTicketsTag>
                    <MyTicketsTag>{order.reference}</MyTicketsTag>
                  </MyTicketsMetaRow>
                  <MyTicketsPendingTitle>{order.event.title ?? 'Commande EventFlow'}</MyTicketsPendingTitle>
                  <MyTicketsPendingText>
                    Paiement confirmé le {formatDateTime(order.paidAt ?? order.createdAt)}
                  </MyTicketsPendingText>
                </MyTicketsPendingTitleGroup>
                <MyTicketsTag>{formatCurrency(order.total, order.currency)}</MyTicketsTag>
              </MyTicketsPendingHeader>

              <MyTicketsSummaryGrid>
                <MyTicketsSummaryItem>
                  <MyTicketsSummaryLabel>Commande</MyTicketsSummaryLabel>
                  <MyTicketsSummaryValue>{order.reference}</MyTicketsSummaryValue>
                </MyTicketsSummaryItem>
                <MyTicketsSummaryItem>
                  <MyTicketsSummaryLabel>Type</MyTicketsSummaryLabel>
                  <MyTicketsSummaryValue>{orderTypeLabel(order)}</MyTicketsSummaryValue>
                </MyTicketsSummaryItem>
                <MyTicketsSummaryItem>
                  <MyTicketsSummaryLabel>Montant payé</MyTicketsSummaryLabel>
                  <MyTicketsSummaryValue>{formatCurrency(order.total, order.currency)}</MyTicketsSummaryValue>
                </MyTicketsSummaryItem>
                <MyTicketsSummaryItem>
                  <MyTicketsSummaryLabel>{order.orderType === 'ticket' ? 'Billets' : 'Campagne'}</MyTicketsSummaryLabel>
                  <MyTicketsSummaryValue>
                    {order.orderType === 'ticket' ? order.ticketCount : `#${order.promotionCampaignId}`}
                  </MyTicketsSummaryValue>
                </MyTicketsSummaryItem>
              </MyTicketsSummaryGrid>

              <MyTicketsActions>
                {order.orderType === 'promotion' && order.promotionCampaignId ? (
                  <MyTicketsPrimaryButton
                    type="button"
                    onClick={() => navigate(`/organizer/promotions/${order.promotionCampaignId}`)}
                  >
                    Suivre la campagne
                  </MyTicketsPrimaryButton>
                ) : (
                  <MyTicketsPrimaryButton type="button" onClick={() => navigate('/mes-billets')}>
                    Voir mes billets
                  </MyTicketsPrimaryButton>
                )}
                {order.event.id ? (
                  <MyTicketsSecondaryButton type="button" onClick={() => navigate(`/events/${order.event.id}`)}>
                    Voir l’évènement
                  </MyTicketsSecondaryButton>
                ) : null}
              </MyTicketsActions>
            </MyTicketsPendingCard>
          ))}
        </MyTicketsPendingList>
      )}
    </MyTicketsSection>
  )
}
