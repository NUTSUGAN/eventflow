import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getMyOrganizerApplication } from '../../api/organizerApplication'
import { getMyOrganizerEvents } from '../../api/organizerEvents'
import type { AuthUser } from '../../types/auth'
import type { OrganizerEventSummary } from '../../types/organizerEvent'
import {
  OrganizerDashboardActions,
  OrganizerDashboardCard,
  OrganizerDashboardCardText,
  OrganizerDashboardCardTitle,
  OrganizerDashboardEyebrow,
  OrganizerDashboardEventBadge,
  OrganizerDashboardEventMeta,
  OrganizerDashboardEventTitle,
  OrganizerDashboardGrid,
  OrganizerDashboardHero,
  OrganizerDashboardPrimaryButton,
  OrganizerDashboardSecondaryButton,
  OrganizerDashboardSection,
  OrganizerDashboardState,
  OrganizerDashboardText,
  OrganizerDashboardTitle,
} from './organizerDashboardPageElements'

function formatDashboardDate(date: string | null): string {
  if (!date) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function OrganizerDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [events, setEvents] = useState<OrganizerEventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)

      try {
        const currentUser = await getCurrentUser()

        if (
          currentUser.role !== 'ROLE_ORGANIZER' &&
          currentUser.role !== 'ROLE_ADMIN'
        ) {
          const organizerState = await getMyOrganizerApplication()

          if (isMounted) {
            if (organizerState.application?.status === 'PENDING') {
              navigate('/organizer-access', { replace: true })
              return
            }

            navigate('/organizer-access', { replace: true })
          }

          return
        }

        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          navigate('/auth?mode=login&intent=organizer', { replace: true })
        }

        return
      }

      try {
        const organizerEvents = await getMyOrganizerEvents()

        if (isMounted) {
          setEvents(organizerEvents)
        }
      } catch {
        if (isMounted) {
          setEvents([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <OrganizerDashboardSection>
      <OrganizerDashboardHero>
        <OrganizerDashboardEyebrow>Espace organisateur</OrganizerDashboardEyebrow>
        <OrganizerDashboardTitle>Ton acces organisateur est actif</OrganizerDashboardTitle>
        {isLoading ? (
          <OrganizerDashboardState>Chargement de ton espace organisateur...</OrganizerDashboardState>
        ) : (
          <>
            <OrganizerDashboardText>
              {user
                ? `Bienvenue ${user.firstName}. Cet espace devient maintenant ton point d entree organisateur EventFlow. On y branchera ensuite la creation d evenements, la gestion des billets et le suivi des performances.`
                : 'Chargement de ton espace organisateur.'}
            </OrganizerDashboardText>

            <OrganizerDashboardActions>
              <OrganizerDashboardPrimaryButton
                type="button"
                onClick={() => navigate('/organizer/events/new')}
              >
                Creer un evenement
              </OrganizerDashboardPrimaryButton>
              <OrganizerDashboardSecondaryButton
                type="button"
                onClick={() => navigate('/explorer')}
              >
                Voir les evenements publics
              </OrganizerDashboardSecondaryButton>
              <OrganizerDashboardSecondaryButton
                type="button"
                onClick={() => navigate('/account')}
              >
                Revenir a mon profil
              </OrganizerDashboardSecondaryButton>
              {user?.role === 'ROLE_ADMIN' ? (
                <OrganizerDashboardSecondaryButton
                  type="button"
                  onClick={() => navigate('/admin/organizer-applications')}
                >
                  Relire les demandes organisateur
                </OrganizerDashboardSecondaryButton>
              ) : null}
            </OrganizerDashboardActions>

            <OrganizerDashboardGrid>
              <OrganizerDashboardCard>
                <OrganizerDashboardCardTitle>Acces valide</OrganizerDashboardCardTitle>
                <OrganizerDashboardCardText>
                  Ton compte peut maintenant basculer vers les futures fonctions de publication et de gestion d evenements.
                </OrganizerDashboardCardText>
              </OrganizerDashboardCard>
              <OrganizerDashboardCard>
                <OrganizerDashboardCardTitle>Creation d evenement</OrganizerDashboardCardTitle>
                <OrganizerDashboardCardText>
                  La prochaine etape sera de brancher ici le vrai parcours de creation, les medias, les dates et les billets.
                </OrganizerDashboardCardText>
              </OrganizerDashboardCard>
              <OrganizerDashboardCard>
                <OrganizerDashboardCardTitle>Billetterie et suivi</OrganizerDashboardCardTitle>
                <OrganizerDashboardCardText>
                  On fera ensuite vivre cet espace avec les ventes, les demandes de mise en avant et les outils de suivi.
                </OrganizerDashboardCardText>
              </OrganizerDashboardCard>
              {events.length > 0 ? (
                events.slice(0, 3).map((event) => (
                  <OrganizerDashboardCard key={event.id}>
                    <OrganizerDashboardEventBadge>{event.status}</OrganizerDashboardEventBadge>
                    <OrganizerDashboardEventTitle>{event.title}</OrganizerDashboardEventTitle>
                    <OrganizerDashboardEventMeta>
                      {event.category.name ?? 'Categorie'} - {event.location.city ?? 'Ville'}
                    </OrganizerDashboardEventMeta>
                    <OrganizerDashboardEventMeta>
                      {formatDashboardDate(event.startDatetime)}
                    </OrganizerDashboardEventMeta>
                    <OrganizerDashboardEventMeta>
                      {event.ticketTypesCount} billet(s) pour le moment
                    </OrganizerDashboardEventMeta>
                  </OrganizerDashboardCard>
                ))
              ) : (
                <OrganizerDashboardCard>
                  <OrganizerDashboardCardTitle>Premiere publication</OrganizerDashboardCardTitle>
                  <OrganizerDashboardCardText>
                    Tu n as pas encore d evenement sur ton espace organisateur. Cree
                    le premier pour enchainer ensuite avec les billets et la
                    preparation de commande.
                  </OrganizerDashboardCardText>
                </OrganizerDashboardCard>
              )}
            </OrganizerDashboardGrid>
          </>
        )}
      </OrganizerDashboardHero>
    </OrganizerDashboardSection>
  )
}
