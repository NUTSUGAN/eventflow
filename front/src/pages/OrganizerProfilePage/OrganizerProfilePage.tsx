import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  followOrganizer,
  getOrganizerProfile,
  unfollowOrganizer,
} from '../../api/events'
import { EventCard } from '../../components/EventCard/EventCard'
import type { OrganizerProfile } from '../../types/event'
import {
  ProfileActionButton,
  ProfileActionGroup,
  ProfileActionNote,
  ProfileAvatar,
  ProfileBlock,
  ProfileBlockCaption,
  ProfileBlockHeader,
  ProfileBlockTitle,
  ProfileCardsGrid,
  ProfileEyebrow,
  ProfileHero,
  ProfileHeroTop,
  ProfileIdentity,
  ProfileLead,
  ProfileMetaBadge,
  ProfileMetaRow,
  ProfileSection,
  ProfileStateBox,
  ProfileTitle,
  ProfileTitleGroup,
} from './organizerProfilePageElements'

function getOrganizerInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatJoinDate(date: string | null): string {
  if (!date) {
    return 'Date d arrivee a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function OrganizerProfilePage() {
  const { organizerId } = useParams()
  const [profile, setProfile] = useState<OrganizerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      if (!organizerId) {
        if (isMounted) {
          setErrorMessage("Impossible de retrouver l'organisateur demande.")
          setIsLoading(false)
        }

        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await getOrganizerProfile(organizerId)

        if (isMounted) {
          setProfile(data)
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Impossible de charger le profil organisateur pour le moment.",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [organizerId])

  async function handleFollowToggle() {
    if (
      !profile?.organizer ||
      !profile.subscription.canFollow ||
      isFollowLoading
    ) {
      return
    }

    setIsFollowLoading(true)

    try {
      const response = profile.subscription.isFollowing
        ? await unfollowOrganizer(profile.organizer.id)
        : await followOrganizer(profile.organizer.id)

      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              subscription: response.subscription,
            }
          : currentProfile,
      )
    } catch {
      setErrorMessage(
        "Impossible de mettre a jour l'abonnement EventFlow pour le moment.",
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

  if (isLoading) {
    return (
      <ProfileSection>
        <ProfileStateBox>Chargement du profil organisateur...</ProfileStateBox>
      </ProfileSection>
    )
  }

  if (errorMessage || !profile) {
    return (
      <ProfileSection>
        <ProfileStateBox>
          {errorMessage ?? "Le profil organisateur n'est pas disponible."}
        </ProfileStateBox>
      </ProfileSection>
    )
  }

  const organizerInitials = getOrganizerInitials(profile.organizer.fullName)

  return (
    <ProfileSection>
      <ProfileHero>
        <ProfileHeroTop>
          <ProfileIdentity>
            <ProfileAvatar $imageUrl={profile.organizer.profilePhoto ?? undefined}>
              {!profile.organizer.profilePhoto ? organizerInitials : null}
            </ProfileAvatar>

            <ProfileTitleGroup>
              <ProfileEyebrow>Profil organisateur</ProfileEyebrow>
              <ProfileTitle>{profile.organizer.fullName}</ProfileTitle>
              <ProfileLead>
                Retrouvez ses evenements publies et suivez ses prochaines annonces.
              </ProfileLead>
            </ProfileTitleGroup>
          </ProfileIdentity>

          <ProfileActionGroup>
            {profile.subscription.canFollow ? (
              <ProfileActionButton
                type="button"
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                $active={profile.subscription.isFollowing}
              >
                {profile.subscription.isFollowing
                  ? "Abonné à l'organisateur"
                  : "S'abonner à l'organisateur"}
              </ProfileActionButton>
            ) : null}

            {profile.subscription.requiresAuth ? (
              <ProfileActionButton type="button" onClick={handleAuthPrompt}>
                Se connecter / S&apos;inscrire pour suivre
              </ProfileActionButton>
            ) : null}
          </ProfileActionGroup>
        </ProfileHeroTop>

        <ProfileMetaRow>
          <ProfileMetaBadge>
            {profile.organizer.publishedEventCount} evenement(s) publie(s)
          </ProfileMetaBadge>
          <ProfileMetaBadge>
            Present sur EventFlow depuis {formatJoinDate(profile.organizer.createdAt)}
          </ProfileMetaBadge>
        </ProfileMetaRow>

        {profile.subscription.requiresAuth ? (
          <ProfileActionNote>
            Connecte-toi ou crée un compte pour t'abonner EventFlow depuis son profil.
          </ProfileActionNote>
        ) : null}
      </ProfileHero>

      <ProfileBlock>
        <ProfileBlockHeader>
          <ProfileBlockTitle>Ses evenements publies</ProfileBlockTitle>
          <ProfileBlockCaption>
            Clique sur un evenement pour ouvrir sa fiche detail.
          </ProfileBlockCaption>
        </ProfileBlockHeader>

        {profile.events.length > 0 ? (
          <ProfileCardsGrid>
            {profile.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </ProfileCardsGrid>
        ) : (
          <ProfileStateBox>
            Aucun evenement publie n&apos;est disponible pour cet organisateur.
          </ProfileStateBox>
        )}
      </ProfileBlock>
    </ProfileSection>
  )
}
