import { Link } from 'react-router-dom'
import {
  LegalBackLink,
  LegalContent,
  LegalLead,
  LegalPageShell,
  LegalSection,
  LegalTitle,
} from './legalPageElements'

export type LegalPageProps = {
  title: string
  lead: string
  sections: Array<{
    title: string
    body: string
  }>
}

export function LegalPage({ title, lead, sections }: LegalPageProps) {
  return (
    <LegalPageShell>
      <LegalBackLink as={Link} to="/">
        Retour à l’accueil
      </LegalBackLink>
      <LegalTitle>{title}</LegalTitle>
      <LegalLead>{lead}</LegalLead>

      <LegalContent>
        {sections.map((section) => (
          <LegalSection key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </LegalSection>
        ))}
      </LegalContent>
    </LegalPageShell>
  )
}
