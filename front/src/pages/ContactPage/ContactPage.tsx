import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicIdentity } from '../../config/publicIdentity'
import { sendContactMessage } from '../../api/contact'
import {
  ContactActions,
  ContactBackLink,
  ContactButton,
  ContactError,
  ContactField,
  ContactForm,
  ContactFormGrid,
  ContactInput,
  ContactLead,
  ContactPageShell,
  ContactSelect,
  ContactSuccess,
  ContactTextarea,
  ContactTitle,
} from './contactPageElements'

const categoryOptions = [
  'Question générale',
  'Billet ou commande',
  'Espace organisateur',
  'Booster / promotion',
  'Devenir partenaire',
  'Signalement',
]

const createInitialForm = (category: string) => ({
  name: '',
  email: '',
  phone: '',
  category,
  subject: '',
  message: '',
})

export function ContactFormBlock({ initialCategory = categoryOptions[0] }: { initialCategory?: string }) {
  const [form, setForm] = useState(() => createInitialForm(initialCategory))
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setStatusMessage(null)
    setErrorMessage(null)

    if (
      form.name.trim() === '' ||
      form.email.trim() === '' ||
      form.subject.trim() === '' ||
      form.message.trim() === ''
    ) {
      setErrorMessage('Renseigne ton nom, ton email, le sujet et ton message.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
      })

      setForm(createInitialForm(initialCategory))
      setStatusMessage(response.message)
    } catch {
      setErrorMessage('Impossible d’envoyer ton message pour le moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <ContactForm onSubmit={handleSubmit}>
        <ContactFormGrid>
          <ContactField>
            <label htmlFor="contact-name">Nom</label>
            <ContactInput
              id="contact-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              autoComplete="name"
            />
          </ContactField>

          <ContactField>
            <label htmlFor="contact-email">Email</label>
            <ContactInput
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              autoComplete="email"
            />
          </ContactField>
        </ContactFormGrid>

        <ContactField>
          <label htmlFor="contact-phone">Téléphone (facultatif)</label>
          <ContactInput
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            autoComplete="tel"
            placeholder="+228 ..."
          />
        </ContactField>

        <ContactFormGrid>
          <ContactField>
            <label htmlFor="contact-category">Type de demande</label>
            <ContactSelect
              id="contact-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </ContactSelect>
          </ContactField>

          <ContactField>
            <label htmlFor="contact-subject">Sujet</label>
            <ContactInput
              id="contact-subject"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
            />
          </ContactField>
        </ContactFormGrid>

        <ContactField>
          <label htmlFor="contact-message">Message</label>
          <ContactTextarea
            id="contact-message"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            rows={8}
          />
        </ContactField>

        {statusMessage ? <ContactSuccess>{statusMessage}</ContactSuccess> : null}
        {errorMessage ? <ContactError>{errorMessage}</ContactError> : null}

        <ContactActions>
          <ContactButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
          </ContactButton>
        </ContactActions>
      </ContactForm>
  )
}

export function ContactPage() {
  return (
    <ContactPageShell>
      <ContactBackLink as={Link} to="/">
        Retour à l’accueil
      </ContactBackLink>
      <ContactTitle>Contact EventFlow</ContactTitle>
      <ContactLead>
        Envoie une demande à l’équipe EventFlow. Ajoute une référence de commande,
        d’évènement ou de campagne Booster si tu en as une.
      </ContactLead>
      {publicIdentity.support && <p>Contact : <a href={`mailto:${publicIdentity.support}`}>{publicIdentity.support}</a></p>}
      <ContactFormBlock />
    </ContactPageShell>
  )
}
