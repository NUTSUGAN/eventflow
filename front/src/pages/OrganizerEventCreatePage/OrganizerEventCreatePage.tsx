import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  createOrganizerEvent,
  getOrganizerEventFormOptions,
} from '../../api/organizerEvents'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerEventFormOptions,
  OrganizerEventSummary,
} from '../../types/organizerEvent'
import {
  OrganizerEventCreateActions,
  OrganizerEventCreateError,
  OrganizerEventCreateEyebrow,
  OrganizerEventCreateField,
  OrganizerEventCreateForm,
  OrganizerEventCreateGrid,
  OrganizerEventCreateHero,
  OrganizerEventCreateHint,
  OrganizerEventCreateInput,
  OrganizerEventCreateLabel,
  OrganizerEventCreatePrimaryButton,
  OrganizerEventCreateSecondaryButton,
  OrganizerEventCreateSection,
  OrganizerEventCreateSelect,
  OrganizerEventCreateState,
  OrganizerEventCreateSuccess,
  OrganizerEventCreateSummary,
  OrganizerEventCreateSummaryText,
  OrganizerEventCreateSummaryTitle,
  OrganizerEventCreateText,
  OrganizerEventCreateTextarea,
  OrganizerEventCreateTitle,
} from './organizerEventCreatePageElements'

const emptyOptions: OrganizerEventFormOptions = {
  categories: [],
  locations: [],
}

type OrganizerEventFormState = {
  title: string
  description: string
  categoryId: string
  locationId: string
  startDatetime: string
  endDatetime: string
  capacity: string
  status: string
  thumbnailPhoto: File | null
  coverPhoto: File | null
}

const initialFormState: OrganizerEventFormState = {
  title: '',
  description: '',
  categoryId: '',
  locationId: '',
  startDatetime: '',
  endDatetime: '',
  capacity: '',
  status: 'draft',
  thumbnailPhoto: null,
  coverPhoto: null,
}

function formatOrganizerDate(value: string | null): string {
  if (!value) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OrganizerEventCreatePage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [options, setOptions] = useState<OrganizerEventFormOptions>(emptyOptions)
  const [form, setForm] = useState<OrganizerEventFormState>(initialFormState)
  const [createdEvent, setCreatedEvent] = useState<OrganizerEventSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      setIsLoading(true)

      try {
        const user = await getCurrentUser()

        if (
          user.role !== 'ROLE_ORGANIZER' &&
          user.role !== 'ROLE_ADMIN'
        ) {
          navigate('/organizer-access', { replace: true })
          return
        }

        const organizerOptions = await getOrganizerEventFormOptions()

        if (isMounted) {
          setCurrentUser(user)
          setOptions(organizerOptions)
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

    void loadPage()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const selectedCategory = useMemo(
    () => options.categories.find((category) => String(category.id) === form.categoryId),
    [options.categories, form.categoryId],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (!form.thumbnailPhoto || !form.coverPhoto) {
      setErrorMessage('Ajoute la miniature et la cover avant de publier l evenement.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('description', form.description)
      payload.append('categoryId', form.categoryId)
      payload.append('locationId', form.locationId)
      payload.append('startDatetime', form.startDatetime)
      payload.append('endDatetime', form.endDatetime)
      payload.append('capacity', form.capacity)
      payload.append('status', form.status)
      payload.append('thumbnailPhoto', form.thumbnailPhoto)
      payload.append('coverPhoto', form.coverPhoto)

      const response = await createOrganizerEvent(payload)

      setCreatedEvent(response.event)
      setSuccessMessage(response.message)
      setForm(initialFormState)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
      ) {
        setErrorMessage(
          String(
            (error as { response?: { data?: { message?: unknown } } }).response?.data?.message,
          ),
        )
      } else {
        setErrorMessage("Impossible de creer l'evenement pour le moment.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <OrganizerEventCreateSection>
        <OrganizerEventCreateHero>
          <OrganizerEventCreateEyebrow>Espace organisateur</OrganizerEventCreateEyebrow>
          <OrganizerEventCreateTitle>Creation de l evenement...</OrganizerEventCreateTitle>
          <OrganizerEventCreateState>
            On charge les categories, les lieux et ton espace organisateur.
          </OrganizerEventCreateState>
        </OrganizerEventCreateHero>
      </OrganizerEventCreateSection>
    )
  }

  return (
    <OrganizerEventCreateSection>
      <OrganizerEventCreateHero>
        <OrganizerEventCreateEyebrow>Espace organisateur</OrganizerEventCreateEyebrow>
        <OrganizerEventCreateTitle>Creer un evenement</OrganizerEventCreateTitle>
        <OrganizerEventCreateText>
          {currentUser
            ? `${currentUser.firstName}, on prepare ici la fiche organisateur avant les billets et la commande client.`
            : 'Prepare la fiche publique de ton evenement.'}
        </OrganizerEventCreateText>

        {errorMessage ? (
          <OrganizerEventCreateError>{errorMessage}</OrganizerEventCreateError>
        ) : null}

        {successMessage ? (
          <OrganizerEventCreateSuccess>{successMessage}</OrganizerEventCreateSuccess>
        ) : null}

        <OrganizerEventCreateForm onSubmit={handleSubmit}>
          <OrganizerEventCreateGrid>
            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Titre</OrganizerEventCreateLabel>
              <OrganizerEventCreateInput
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Soiree Tech EventFlow"
                required
              />
            </OrganizerEventCreateField>

            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Capacite</OrganizerEventCreateLabel>
              <OrganizerEventCreateInput
                type="number"
                min="1"
                value={form.capacity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, capacity: event.target.value }))
                }
                placeholder="150"
                required
              />
            </OrganizerEventCreateField>
          </OrganizerEventCreateGrid>

          <OrganizerEventCreateField>
            <OrganizerEventCreateLabel>Description</OrganizerEventCreateLabel>
            <OrganizerEventCreateTextarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Decris l ambience, le programme et ce qui rend cet evenement special."
              required
            />
          </OrganizerEventCreateField>

          <OrganizerEventCreateGrid>
            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Categorie</OrganizerEventCreateLabel>
              <OrganizerEventCreateSelect
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                required
              >
                <option value="">Choisir une categorie</option>
                {options.categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </OrganizerEventCreateSelect>
              {selectedCategory?.description ? (
                <OrganizerEventCreateHint>
                  {selectedCategory.description}
                </OrganizerEventCreateHint>
              ) : null}
            </OrganizerEventCreateField>

            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Lieu</OrganizerEventCreateLabel>
              <OrganizerEventCreateSelect
                value={form.locationId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, locationId: event.target.value }))
                }
                required
              >
                <option value="">Choisir un lieu</option>
                {options.locations.map((location) => (
                  <option key={location.id} value={String(location.id)}>
                    {location.city} - {location.address}
                  </option>
                ))}
              </OrganizerEventCreateSelect>
            </OrganizerEventCreateField>
          </OrganizerEventCreateGrid>

          <OrganizerEventCreateGrid>
            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Debut</OrganizerEventCreateLabel>
              <OrganizerEventCreateInput
                type="datetime-local"
                value={form.startDatetime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDatetime: event.target.value,
                  }))
                }
                required
              />
            </OrganizerEventCreateField>

            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Fin</OrganizerEventCreateLabel>
              <OrganizerEventCreateInput
                type="datetime-local"
                value={form.endDatetime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDatetime: event.target.value }))
                }
                required
              />
            </OrganizerEventCreateField>
          </OrganizerEventCreateGrid>

          <OrganizerEventCreateGrid>
            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Miniature</OrganizerEventCreateLabel>
              <OrganizerEventCreateInput
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    thumbnailPhoto: event.target.files?.[0] ?? null,
                  }))
                }
                required
              />
              <OrganizerEventCreateHint>
                Utilisee dans les cartes et la liste publique.
              </OrganizerEventCreateHint>
            </OrganizerEventCreateField>

            <OrganizerEventCreateField>
              <OrganizerEventCreateLabel>Cover</OrganizerEventCreateLabel>
              <OrganizerEventCreateInput
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    coverPhoto: event.target.files?.[0] ?? null,
                  }))
                }
                required
              />
              <OrganizerEventCreateHint>
                Affichee en grand sur la page detail.
              </OrganizerEventCreateHint>
            </OrganizerEventCreateField>
          </OrganizerEventCreateGrid>

          <OrganizerEventCreateField>
            <OrganizerEventCreateLabel>Statut</OrganizerEventCreateLabel>
            <OrganizerEventCreateSelect
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publie</option>
              <option value="cancelled">Annule</option>
            </OrganizerEventCreateSelect>
            <OrganizerEventCreateHint>
              Commence en brouillon si tu veux regler les billets juste apres.
            </OrganizerEventCreateHint>
          </OrganizerEventCreateField>

          <OrganizerEventCreateActions>
            <OrganizerEventCreatePrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creation en cours...' : "Creer l'evenement"}
            </OrganizerEventCreatePrimaryButton>
            <OrganizerEventCreateSecondaryButton
              type="button"
              onClick={() => navigate('/organizer/dashboard')}
            >
              Revenir au dashboard
            </OrganizerEventCreateSecondaryButton>
          </OrganizerEventCreateActions>
        </OrganizerEventCreateForm>

        {createdEvent ? (
          <OrganizerEventCreateSummary>
            <OrganizerEventCreateSummaryTitle>
              {createdEvent.title}
            </OrganizerEventCreateSummaryTitle>
            <OrganizerEventCreateSummaryText>
              {createdEvent.category.name} - {createdEvent.location.city} -{' '}
              {formatOrganizerDate(createdEvent.startDatetime)}
            </OrganizerEventCreateSummaryText>
            <OrganizerEventCreateSummaryText>
              Statut actuel: {createdEvent.status} - {createdEvent.ticketTypesCount} billet(s)
            </OrganizerEventCreateSummaryText>
          </OrganizerEventCreateSummary>
        ) : null}
      </OrganizerEventCreateHero>
    </OrganizerEventCreateSection>
  )
}
