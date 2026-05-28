import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  addOrganizerStaffMember,
  deactivateOrganizerStaffMember,
  getOrganizerStaffMembers,
} from '../../api/staff'
import type { OrganizerStaffMemberSummary } from '../../types/staff'
import {
  OrganizerStaffActions,
  OrganizerStaffCounter,
  OrganizerStaffEyebrow,
  OrganizerStaffForm,
  OrganizerStaffGrid,
  OrganizerStaffHero,
  OrganizerStaffInlineText,
  OrganizerStaffInput,
  OrganizerStaffList,
  OrganizerStaffMemberCard,
  OrganizerStaffMemberHeader,
  OrganizerStaffMemberMeta,
  OrganizerStaffMemberName,
  OrganizerStaffMemberStatus,
  OrganizerStaffMessage,
  OrganizerStaffPanel,
  OrganizerStaffPanelTitle,
  OrganizerStaffPrimaryButton,
  OrganizerStaffSecondaryButton,
  OrganizerStaffSection,
  OrganizerStaffText,
  OrganizerStaffTitle,
} from './organizerStaffPageElements'

function formatDateLabel(value: string | null): string {
  if (!value) {
    return 'Ajout recent'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function readApiMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
  ) {
    return String(
      (error as { response?: { data?: { message?: unknown } } }).response?.data?.message,
    )
  }

  return fallback
}

export function OrganizerStaffPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [staffMembers, setStaffMembers] = useState<OrganizerStaffMemberSummary[]>([])
  const [activeStaffCount, setActiveStaffCount] = useState(0)
  const [staffLimit, setStaffLimit] = useState(10)
  const [staffEmail, setStaffEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingMemberId, setPendingMemberId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'neutral' | 'success' | 'danger'>('neutral')

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      setIsLoading(true)

      try {
        const currentUser = await getCurrentUser(true)

        if (!currentUser.canManageStaff) {
          navigate('/organizer-access', { replace: true })
          return
        }

        const response = await getOrganizerStaffMembers()

        if (!isMounted) {
          return
        }

        setStaffMembers(response.staffMembers)
        setActiveStaffCount(response.count)
        setStaffLimit(response.limit)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = readApiMessage(
          error,
          'Impossible de charger ton staff pour le moment.',
        )
        setStatusTone('danger')
        setStatusMessage(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = staffEmail.trim()

    if (normalizedEmail === '') {
      setStatusTone('danger')
      setStatusMessage("Renseigne l'email du membre a ajouter.")
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const response = await addOrganizerStaffMember({
        email: normalizedEmail,
      })

      setStaffMembers((current) => {
        const existingMemberIndex = current.findIndex(
          (member) => member.staffUser.id === response.staffMember.staffUser.id,
        )

        if (existingMemberIndex === -1) {
          return [response.staffMember, ...current]
        }

        return current.map((member, index) =>
          index === existingMemberIndex ? response.staffMember : member,
        )
      })
      setActiveStaffCount(response.count)
      setStaffLimit(response.limit)
      setStaffEmail('')
      setStatusTone('success')
      setStatusMessage(response.message)
    } catch (error) {
      setStatusTone('danger')
      setStatusMessage(
        readApiMessage(error, "Impossible d'ajouter ce membre au staff pour le moment."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeactivateMember(membershipId: number) {
    setPendingMemberId(membershipId)
    setStatusMessage(null)

    try {
      const response = await deactivateOrganizerStaffMember(membershipId)

      setStaffMembers((current) =>
        current.map((member) =>
          member.id === membershipId ? response.staffMember : member,
        ),
      )
      setActiveStaffCount(response.count)
      setStaffLimit(response.limit)
      setStatusTone('success')
      setStatusMessage(response.message)
    } catch (error) {
      setStatusTone('danger')
      setStatusMessage(
        readApiMessage(error, 'Impossible de mettre ce membre hors service.'),
      )
    } finally {
      setPendingMemberId(null)
    }
  }

  return (
    <OrganizerStaffSection>
      <OrganizerStaffHero>
        <OrganizerStaffEyebrow>Staff organisateur</OrganizerStaffEyebrow>
        <OrganizerStaffTitle>Mon staff EventFlow</OrganizerStaffTitle>
        <OrganizerStaffText>
          Ajoute jusqu a 10 personnes pour gerer les scans a l entree. Chaque ajout
          envoie un email a la personne concernee et une confirmation a
          l organisateur.
        </OrganizerStaffText>

        <OrganizerStaffGrid>
          <OrganizerStaffPanel>
            <OrganizerStaffPanelTitle>Ajouter un membre</OrganizerStaffPanelTitle>
            <OrganizerStaffCounter>
              {activeStaffCount} / {staffLimit} membres actifs
            </OrganizerStaffCounter>
            <OrganizerStaffInlineText>
              L utilisateur doit deja avoir un compte EventFlow. Une fois ajoute,
              il verra automatiquement l outil de scan dans son espace.
            </OrganizerStaffInlineText>
            <OrganizerStaffInlineText>
              Si tu retires quelqu un, il passe hors service. Son historique reste
              visible, il ne compte plus dans les 10 actifs, et tu peux ajouter
              une autre personne a sa place.
            </OrganizerStaffInlineText>
            <OrganizerStaffForm onSubmit={handleSubmit}>
              <OrganizerStaffInput
                type="email"
                placeholder="email@exemple.com"
                value={staffEmail}
                onChange={(changeEvent) => setStaffEmail(changeEvent.target.value)}
                autoComplete="email"
              />
              <OrganizerStaffActions>
                <OrganizerStaffPrimaryButton
                  type="submit"
                  disabled={isSubmitting || activeStaffCount >= staffLimit}
                >
                  {isSubmitting ? 'Ajout en cours...' : 'Ajouter au staff'}
                </OrganizerStaffPrimaryButton>
                <OrganizerStaffSecondaryButton
                  type="button"
                  onClick={() => navigate('/staff/scan')}
                >
                  Ouvrir le scan
                </OrganizerStaffSecondaryButton>
              </OrganizerStaffActions>
            </OrganizerStaffForm>
            {statusMessage ? (
              <OrganizerStaffMessage $tone={statusTone}>
                {statusMessage}
              </OrganizerStaffMessage>
            ) : null}
          </OrganizerStaffPanel>

          <OrganizerStaffPanel>
            <OrganizerStaffPanelTitle>Ce que l equipe obtient</OrganizerStaffPanelTitle>
            <OrganizerStaffInlineText>
              Chaque membre peut ouvrir la page staff de scan, choisir un evenement
              accessible, puis valider les billets en ligne avec le futur scanner
              Tera branche en mode clavier.
            </OrganizerStaffInlineText>
            <OrganizerStaffInlineText>
              Pour cette premiere version, tout passe par le web et par l API
              centrale, ce qui garde les validations de billets coherentes en temps
              reel.
            </OrganizerStaffInlineText>
          </OrganizerStaffPanel>
        </OrganizerStaffGrid>
      </OrganizerStaffHero>

      <OrganizerStaffPanel>
        <OrganizerStaffPanelTitle>Membres actuels</OrganizerStaffPanelTitle>
        {isLoading ? (
          <OrganizerStaffInlineText>Chargement du staff...</OrganizerStaffInlineText>
        ) : staffMembers.length > 0 ? (
          <OrganizerStaffList>
            {staffMembers.map((member) => (
              <OrganizerStaffMemberCard key={member.id}>
                <OrganizerStaffMemberHeader>
                  <OrganizerStaffMemberName>
                    {member.staffUser.displayName}
                  </OrganizerStaffMemberName>
                  <OrganizerStaffMemberStatus $active={member.isActive}>
                    {member.isActive ? 'Actif' : 'Hors service'}
                  </OrganizerStaffMemberStatus>
                </OrganizerStaffMemberHeader>
                <OrganizerStaffMemberMeta>
                  {member.staffUser.email ?? 'Email indisponible'}
                </OrganizerStaffMemberMeta>
                <OrganizerStaffMemberMeta>
                  Ajoute le {formatDateLabel(member.createdAt)}
                </OrganizerStaffMemberMeta>
                <OrganizerStaffMemberMeta>
                  {member.isActive
                    ? 'Pret pour le scan.'
                    : `Passe hors service le ${formatDateLabel(member.statusChangedAt)}`}
                </OrganizerStaffMemberMeta>
                {member.isActive ? (
                  <OrganizerStaffActions>
                    <OrganizerStaffSecondaryButton
                      type="button"
                      onClick={() => void handleDeactivateMember(member.id)}
                      disabled={pendingMemberId === member.id}
                    >
                      {pendingMemberId === member.id
                        ? 'Mise hors service...'
                        : 'Mettre hors service'}
                    </OrganizerStaffSecondaryButton>
                  </OrganizerStaffActions>
                ) : null}
              </OrganizerStaffMemberCard>
            ))}
          </OrganizerStaffList>
        ) : (
          <OrganizerStaffInlineText>
            Aucun membre pour le moment. Ajoute ton premier renfort pour preparer
            les controles d acces.
          </OrganizerStaffInlineText>
        )}
      </OrganizerStaffPanel>
    </OrganizerStaffSection>
  )
}
