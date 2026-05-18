import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  createOrganizerEvent,
  getOrganizerEventFormOptions,
} from '../../api/organizerEvents'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerEventFormOptions,
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
  OrganizerEventCreateSummary,
  OrganizerEventCreateSummaryText,
  OrganizerEventCreateSummaryTitle,
  OrganizerEventCreateText,
  OrganizerEventCreateTextarea,
  OrganizerEventCreateTitle,
} from './organizerEventCreatePageElements'

const emptyOptions: OrganizerEventFormOptions = {
  categories: [],
}

type OrganizerEventFormState = {
  title: string
  description: string
  categoryId: string
  locationAddress: string
  locationCity: string
  locationPostalCode: string
  locationCountry: string
  locationLatitude: string
  locationLongitude: string
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
  locationAddress: '',
  locationCity: '',
  locationPostalCode: '',
  locationCountry: 'France',
  locationLatitude: '',
  locationLongitude: '',
  startDatetime: '',
  endDatetime: '',
  capacity: '',
  status: 'draft',
  thumbnailPhoto: null,
  coverPhoto: null,
}

function formatDateTimeLocal(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return localDate.toISOString().slice(0, 16)
}

function addMinutesToDateTimeLocal(value: string, minutes: number): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  date.setMinutes(date.getMinutes() + minutes)

  return formatDateTimeLocal(date)
}

function scrollToFlowTop(node: HTMLElement | null) {
  window.requestAnimationFrame(() => {
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

export function OrganizerEventCreatePage() {
  const navigate = useNavigate()
  const flowRef = useRef<HTMLElement | null>(null)
  const [minimumStartDatetime] = useState(() => formatDateTimeLocal(new Date()))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [options, setOptions] = useState<OrganizerEventFormOptions>(emptyOptions)
  const [form, setForm] = useState<OrganizerEventFormState>(initialFormState)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      setIsLoading(true)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ORGANIZER' && user.role !== 'ROLE_ADMIN') {
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

  const minimumEndDatetime = useMemo(() => {
    if (form.startDatetime.trim() !== '') {
      return addMinutesToDateTimeLocal(form.startDatetime, 1)
    }

    return minimumStartDatetime
  }, [form.startDatetime, minimumStartDatetime])

  function goToStep(step: 1 | 2) {
    setCurrentStep(step)
    scrollToFlowTop(flowRef.current)
  }

  function handleContinueToLocationStep() {
    if (
      form.title.trim() === '' ||
      form.description.trim() === '' ||
      form.categoryId.trim() === '' ||
      form.capacity.trim() === ''
    ) {
      setErrorMessage(
        "Renseigne d'abord le titre, la capacite, la description et la categorie avant de passer a l'etape suivante.",
      )
      return
    }

    if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) <= 0) {
      setErrorMessage('La capacite doit etre un entier positif.')
      return
    }

    setErrorMessage(null)
    goToStep(2)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (currentStep === 1) {
      handleContinueToLocationStep()
      return
    }

    if (isSubmitting) {
      return
    }

    if (!form.thumbnailPhoto || !form.coverPhoto) {
      setErrorMessage('Ajoute la miniature et la cover avant de publier l evenement.')
      return
    }

    const now = new Date()
    const startDateTime = new Date(form.startDatetime)
    const endDateTime = new Date(form.endDatetime)

    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
      setErrorMessage('Renseigne des dates valides pour le debut et la fin.')
      return
    }

    if (startDateTime < now) {
      setErrorMessage('La date de debut ne peut pas etre dans le passe.')
      return
    }

    if (endDateTime <= startDateTime) {
      setErrorMessage('La date de fin doit etre posterieure a la date de debut.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('description', form.description)
      payload.append('categoryId', form.categoryId)
      payload.append('locationAddress', form.locationAddress)
      payload.append('locationCity', form.locationCity)
      payload.append('locationPostalCode', form.locationPostalCode)
      payload.append('locationCountry', form.locationCountry)
      payload.append('locationLatitude', form.locationLatitude)
      payload.append('locationLongitude', form.locationLongitude)
      payload.append('startDatetime', form.startDatetime)
      payload.append('endDatetime', form.endDatetime)
      payload.append('capacity', form.capacity)
      payload.append('status', form.status)
      payload.append('thumbnailPhoto', form.thumbnailPhoto)
      payload.append('coverPhoto', form.coverPhoto)

      const response = await createOrganizerEvent(payload)

      navigate(`/organizer/events/${response.event.id}?focus=tickets&created=1`, {
        replace: true,
      })
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
            On charge les categories et ton espace organisateur.
          </OrganizerEventCreateState>
        </OrganizerEventCreateHero>
      </OrganizerEventCreateSection>
    )
  }

  return (
    <OrganizerEventCreateSection>
      <OrganizerEventCreateHero ref={flowRef}>
        <OrganizerEventCreateEyebrow>Espace organisateur</OrganizerEventCreateEyebrow>
        <OrganizerEventCreateTitle>Creer un evenement</OrganizerEventCreateTitle>
        <OrganizerEventCreateText>
          {currentUser
            ? `${currentUser.firstName}, on construit ici la fiche evenement avant les billets et la commande client.`
            : 'Prepare la fiche publique de ton evenement.'}
        </OrganizerEventCreateText>

        {errorMessage ? (
          <OrganizerEventCreateError>{errorMessage}</OrganizerEventCreateError>
        ) : null}

        <OrganizerEventCreateState>
          {currentStep === 1
            ? 'Etape 1 sur 2 - informations principales de l evenement.'
            : 'Etape 2 sur 2 - lieu, dates, statut et medias.'}
        </OrganizerEventCreateState>

        <OrganizerEventCreateForm onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            <>
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
                  placeholder="Decris l ambiance, le programme et ce qui rend cet evenement special."
                  required
                />
              </OrganizerEventCreateField>

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
                  <OrganizerEventCreateHint>{selectedCategory.description}</OrganizerEventCreateHint>
                ) : (
                  <OrganizerEventCreateHint>
                    Tu as maintenant plusieurs categories prêtes a l emploi pour le tri public.
                  </OrganizerEventCreateHint>
                )}
              </OrganizerEventCreateField>

              <OrganizerEventCreateActions>
                <OrganizerEventCreatePrimaryButton
                  type="button"
                  onClick={handleContinueToLocationStep}
                >
                  Continuer vers le lieu
                </OrganizerEventCreatePrimaryButton>
                <OrganizerEventCreateSecondaryButton
                  type="button"
                  onClick={() => navigate('/organizer/events')}
                >
                  Revenir a mes evenements
                </OrganizerEventCreateSecondaryButton>
              </OrganizerEventCreateActions>
            </>
          ) : (
            <>
              <OrganizerEventCreateSummary>
                <OrganizerEventCreateSummaryTitle>
                  {form.title || 'Nouvel evenement'}
                </OrganizerEventCreateSummaryTitle>
                <OrganizerEventCreateSummaryText>
                  {selectedCategory?.name ?? 'Categorie a confirmer'} - capacite {form.capacity || '0'} personnes
                </OrganizerEventCreateSummaryText>
                <OrganizerEventCreateSummaryText>
                  {form.description || 'Ajoute ensuite le lieu, les dates et le statut de publication.'}
                </OrganizerEventCreateSummaryText>
              </OrganizerEventCreateSummary>

              <OrganizerEventCreateGrid>
                <OrganizerEventCreateField>
                  <OrganizerEventCreateLabel>Adresse</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    value={form.locationAddress}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        locationAddress: event.target.value,
                      }))
                    }
                    placeholder="10 Rue de l Example"
                    required
                  />
                </OrganizerEventCreateField>

                <OrganizerEventCreateField>
                  <OrganizerEventCreateLabel>Ville</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    value={form.locationCity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        locationCity: event.target.value,
                      }))
                    }
                    placeholder="Paris"
                    required
                  />
                </OrganizerEventCreateField>
              </OrganizerEventCreateGrid>

              <OrganizerEventCreateGrid>
                <OrganizerEventCreateField>
                  <OrganizerEventCreateLabel>Code postal</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    value={form.locationPostalCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        locationPostalCode: event.target.value,
                      }))
                    }
                    placeholder="75010"
                    required
                  />
                </OrganizerEventCreateField>

                <OrganizerEventCreateField>
                <OrganizerEventCreateLabel>Pays</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    value={form.locationCountry}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        locationCountry: event.target.value,
                      }))
                    }
                    placeholder="France"
                    required
                  />
                </OrganizerEventCreateField>
              </OrganizerEventCreateGrid>

              <OrganizerEventCreateGrid>
                <OrganizerEventCreateField>
                  <OrganizerEventCreateLabel>Latitude</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    type="number"
                    step="0.0000001"
                    value={form.locationLatitude}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        locationLatitude: event.target.value,
                      }))
                    }
                    placeholder="48.8566000"
                  />
                  <OrganizerEventCreateHint>
                    Facultatif. Utile si tu veux positionner precisement le lieu plus tard.
                  </OrganizerEventCreateHint>
                </OrganizerEventCreateField>

                <OrganizerEventCreateField>
                  <OrganizerEventCreateLabel>Longitude</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    type="number"
                    step="0.0000001"
                    value={form.locationLongitude}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        locationLongitude: event.target.value,
                      }))
                    }
                    placeholder="2.3522000"
                  />
                  <OrganizerEventCreateHint>
                    Facultatif. Laisse vide si tu n as pas encore les coordonnees.
                  </OrganizerEventCreateHint>
                </OrganizerEventCreateField>
              </OrganizerEventCreateGrid>

              <OrganizerEventCreateGrid>
                <OrganizerEventCreateField>
                  <OrganizerEventCreateLabel>Debut</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    type="datetime-local"
                    min={minimumStartDatetime}
                    value={form.startDatetime}
                    onChange={(event) =>
                      setForm((current) => {
                        const nextStartDatetime = event.target.value
                        let nextEndDatetime = current.endDatetime

                        if (
                          nextStartDatetime.trim() !== '' &&
                          (
                            nextEndDatetime.trim() === '' ||
                            new Date(nextEndDatetime) <= new Date(nextStartDatetime)
                          )
                        ) {
                          nextEndDatetime = addMinutesToDateTimeLocal(
                            nextStartDatetime,
                            60,
                          )
                        }

                        return {
                          ...current,
                          startDatetime: nextStartDatetime,
                          endDatetime: nextEndDatetime,
                        }
                      })
                    }
                    required
                  />
                  <OrganizerEventCreateHint>
                    La date de debut doit etre a venir.
                  </OrganizerEventCreateHint>
                </OrganizerEventCreateField>

                <OrganizerEventCreateField>
                  <OrganizerEventCreateLabel>Fin</OrganizerEventCreateLabel>
                  <OrganizerEventCreateInput
                    type="datetime-local"
                    min={minimumEndDatetime}
                    value={form.endDatetime}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, endDatetime: event.target.value }))
                    }
                    required
                  />
                  <OrganizerEventCreateHint>
                    La fin doit toujours etre apres le debut.
                  </OrganizerEventCreateHint>
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
                  <option value="published">Public</option>
                </OrganizerEventCreateSelect>
                <OrganizerEventCreateHint>
                  Pas de statut annule ici. On garde un parcours simple: brouillon ou public.
                </OrganizerEventCreateHint>
              </OrganizerEventCreateField>

              <OrganizerEventCreateActions>
                <OrganizerEventCreateSecondaryButton
                  type="button"
                  onClick={() => goToStep(1)}
                >
                  Revenir aux infos principales
                </OrganizerEventCreateSecondaryButton>
                <OrganizerEventCreatePrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creation en cours...' : "Creer l'evenement"}
                </OrganizerEventCreatePrimaryButton>
              </OrganizerEventCreateActions>
            </>
          )}
        </OrganizerEventCreateForm>

      </OrganizerEventCreateHero>
    </OrganizerEventCreateSection>
  )
}
