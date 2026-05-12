import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getMyOrganizerApplication } from '../../api/organizerApplication'
import type { AuthUser } from '../../types/auth'
import {
  OrganizerDashboardActions,
  OrganizerDashboardCard,
  OrganizerDashboardCardText,
  OrganizerDashboardCardTitle,
  OrganizerDashboardEyebrow,
  OrganizerDashboardGrid,
  OrganizerDashboardHero,
  OrganizerDashboardPrimaryButton,
  OrganizerDashboardSecondaryButton,
  OrganizerDashboardSection,
  OrganizerDashboardState,
  OrganizerDashboardText,
  OrganizerDashboardTitle,
} from './organizerDashboardPageElements'

export function OrganizerDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
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
                onClick={() => navigate('/explorer')}
              >
                Voir les evenements publics
              </OrganizerDashboardPrimaryButton>
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
            </OrganizerDashboardGrid>
          </>
        )}
      </OrganizerDashboardHero>
    </OrganizerDashboardSection>
  )
}
