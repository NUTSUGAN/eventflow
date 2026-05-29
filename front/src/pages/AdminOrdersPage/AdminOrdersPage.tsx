import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminOrders } from '../../api/admin'
import { getCurrentUser } from '../../api/auth'
import type { AdminOrderSummary } from '../../types/admin'
import {
  AdminDashboardActions,
  AdminDashboardBadge,
  AdminDashboardEyebrow,
  AdminDashboardField,
  AdminDashboardHeader,
  AdminDashboardHeaderText,
  AdminDashboardInput,
  AdminDashboardLabel,
  AdminDashboardList,
  AdminDashboardMessage,
  AdminDashboardPanel,
  AdminDashboardPanelHeader,
  AdminDashboardPanelTitle,
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

function formatCurrency(amount: string | null, currency: string | null): string {
  const numericAmount = Number(amount ?? 0)

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0)
}

function getStatusTone(status: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending_payment':
      return 'warning'
    case 'cancelled':
    case 'expired':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const nextOrders = await getAdminOrders()

        if (isMounted) {
          setOrders(nextOrders)
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
            navigate('/auth?mode=login', { replace: true })
            return
          }

          setErrorMessage('Impossible de charger les commandes.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (query === '') {
      return orders
    }

    return orders.filter((order) => {
      const searchableText = [
        order.reference,
        order.status,
        order.totalAmount,
        order.currency,
        order.client.fullName,
        order.client.email,
        order.payment?.provider,
        order.payment?.providerPaymentId,
        order.payment?.status,
        ...order.items.flatMap((item) => [
          item.ticketType.name,
          item.event.title,
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [orders, searchQuery])

  return (
    <AdminDashboardSection>
      <AdminDashboardHeader>
        <AdminDashboardHeaderText>
          <AdminDashboardEyebrow>Administration</AdminDashboardEyebrow>
          <AdminDashboardTitle>Commandes & paiements</AdminDashboardTitle>
          <AdminDashboardText>
            Suivi des commandes, paiements Stripe et billets generes.
          </AdminDashboardText>
        </AdminDashboardHeaderText>
        <AdminDashboardActions>
          <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin')}>
            Console admin
          </AdminDashboardSecondaryButton>
          <AdminDashboardSecondaryButton type="button" onClick={() => navigate('/admin/tickets')}>
            Billets & scans
          </AdminDashboardSecondaryButton>
        </AdminDashboardActions>
      </AdminDashboardHeader>

      {errorMessage ? (
        <AdminDashboardMessage $tone="danger">{errorMessage}</AdminDashboardMessage>
      ) : null}

      <AdminDashboardPanel>
        <AdminDashboardPanelHeader>
          <div>
            <AdminDashboardPanelTitle>Commandes</AdminDashboardPanelTitle>
            <AdminDashboardText>
              {filteredOrders.length} commande(s) affichee(s) sur {orders.length}
            </AdminDashboardText>
          </div>
        </AdminDashboardPanelHeader>

        <AdminDashboardField>
          <AdminDashboardLabel>Recherche</AdminDashboardLabel>
          <AdminDashboardInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Reference, client, paiement, evenement..."
          />
        </AdminDashboardField>

        {isLoading ? (
          <AdminDashboardMessage $tone="neutral">
            Chargement des commandes...
          </AdminDashboardMessage>
        ) : null}

        {!isLoading && filteredOrders.length === 0 ? (
          <AdminDashboardMessage $tone="neutral">
            Aucune commande ne correspond a la recherche.
          </AdminDashboardMessage>
        ) : null}

        <AdminDashboardList>
          {filteredOrders.map((order) => (
            <AdminDashboardRow key={order.id}>
              <AdminDashboardRowMain>
                <AdminDashboardRowTitle>
                  {order.reference ?? `Commande #${order.id}`}
                </AdminDashboardRowTitle>
                <AdminDashboardRowText>
                  {order.client.fullName ?? 'Client inconnu'} - {order.client.email ?? 'Email inconnu'}
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  {formatCurrency(order.totalAmount, order.currency)} - {order.ticketsCount} billet(s)
                  {' '}genere(s) - creee le {formatDate(order.createdAt)}
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  Paiement: {order.payment?.provider ?? 'aucun'} / {order.payment?.status ?? 'non renseigne'}
                  {order.payment?.providerPaymentId ? ` - ${order.payment.providerPaymentId}` : ''}
                </AdminDashboardRowText>
                <AdminDashboardRowText>
                  Evenements: {order.items.map((item) => item.event.title).filter(Boolean).join(', ') || 'Non renseigne'}
                </AdminDashboardRowText>
              </AdminDashboardRowMain>
              <AdminDashboardBadge $tone={getStatusTone(order.status)}>
                {order.status ?? 'inconnu'}
              </AdminDashboardBadge>
              <span />
            </AdminDashboardRow>
          ))}
        </AdminDashboardList>
      </AdminDashboardPanel>
    </AdminDashboardSection>
  )
}
