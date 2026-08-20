import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
    id?: string
    title: string
    body: string | string[]
  }>
}

export function LegalPage({ title, lead, sections }: LegalPageProps) {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash.trim() === '') {
      return
    }

    const sectionId = decodeURIComponent(hash.slice(1))

    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [hash])

  return (
    <LegalPageShell>
      <LegalBackLink as={Link} to="/">
        Retour à l’accueil
      </LegalBackLink>
      <LegalTitle>{title}</LegalTitle>
      <LegalLead>{lead}</LegalLead>

      <LegalContent>
        {sections.map((section) => {
          const paragraphs = Array.isArray(section.body) ? section.body : [section.body]

          return (
            <LegalSection key={section.title} id={section.id}>
              <h2>{section.title}</h2>
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </LegalSection>
          )
        })}
      </LegalContent>
    </LegalPageShell>
  )
}
