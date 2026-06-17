import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
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
  'Signalement',
]

const initialForm = {
  name: '',
  email: '',
  category: categoryOptions[0],
  subject: '',
  message: '',
}

export function ContactPage() {
  const [form, setForm] = useState(initialForm)
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
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
      })

      setForm(initialForm)
      setStatusMessage(response.message)
    } catch {
      setErrorMessage('Impossible d’envoyer ton message pour le moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
    </ContactPageShell>
  )
}
