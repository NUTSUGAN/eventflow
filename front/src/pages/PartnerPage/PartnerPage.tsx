import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ContactFormBlock } from '../ContactPage/ContactPage'
import {
  ContactBackLink,
  ContactLead,
  ContactPageShell,
  ContactTitle,
} from '../ContactPage/contactPageElements'

const PartnerSection = styled.section`
  margin-top: 36px;

  h2 {
    margin: 0 0 12px;
    color: var(--color-text);
    font-family: var(--font-heading);
    font-size: 1.45rem;
  }

  p {
    margin: 0 0 14px;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  ul {
    margin: 0;
    padding-left: 22px;
    color: var(--color-text-muted);
    line-height: 1.7;
  }

  li + li {
    margin-top: 6px;
  }
`

export function PartnerPage() {
  return (
    <ContactPageShell>
      <ContactBackLink as={Link} to="/">Retour à l’accueil</ContactBackLink>
      <ContactTitle>Devenir partenaire</ContactTitle>
      <ContactLead>
        Tu accompagnes des organisateurs, des lieux ou des marques au Togo ?
        Construisons ensemble une collaboration autour de leurs événements.
      </ContactLead>

      <PartnerSection>
        <h2>Comment collaborer avec EventFlow ?</h2>
        <ul>
          <li>Présenter EventFlow aux organisateurs qui cherchent une billetterie et un contrôle des accès.</li>
          <li>Associer ton activité à des événements pertinents par une visibilité ou une promotion convenue ensemble.</li>
          <li>Proposer une collaboration commerciale ou un apport d’affaires adapté à ton réseau.</li>
        </ul>
      </PartnerSection>

      <PartnerSection>
        <h2>Et le pourcentage ?</h2>
        <p>
          Il n’y a pas de taux de commission public unique. Si le partenariat prévoit
          une rémunération, son pourcentage, les ventes concernées, la durée et les
          modalités de suivi seront définis ensemble et confirmés par écrit avant
          toute collaboration.
        </p>
      </PartnerSection>

      <PartnerSection>
        <h2>Parlons de ton projet</h2>
        <p>
          Décris ton activité, les organisateurs ou événements que tu accompagnes,
          et le type de partenariat envisagé. L’équipe pourra te répondre avec une
          proposition adaptée.
        </p>
      </PartnerSection>
      <ContactFormBlock initialCategory="Devenir partenaire" />
    </ContactPageShell>
  )
}
