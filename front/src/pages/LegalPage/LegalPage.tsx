import { Link } from 'react-router-dom'
import {
  LegalBackLink,
  LegalContent,
  LegalLead,
  LegalPageShell,
  LegalSection,
  LegalTitle,
} from './legalPageElements'

type LegalPageProps = {
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

export const legalPages = {
  conditions: {
    title: 'Conditions d’utilisation',
    lead: 'Ces conditions encadrent l’utilisation de la plateforme EventFlow.',
    sections: [
      {
        title: 'Utilisation du service',
        body: 'EventFlow permet de découvrir des événements, de réserver des billets et de gérer des services organisateur selon les droits associés au compte.',
      },
      {
        title: 'Comptes et sécurité',
        body: 'Chaque utilisateur est responsable de l’exactitude des informations renseignées et de la confidentialité de ses accès.',
      },
      {
        title: 'Réservations et paiements',
        body: 'Les commandes, billets et opérations de paiement sont traités selon les informations affichées au moment de la validation.',
      },
    ],
  },
  mentions: {
    title: 'Mentions légales',
    lead: 'Retrouve ici les informations légales liées à EventFlow.',
    sections: [
      {
        title: 'Éditeur',
        body: 'EventFlow est une plateforme de billetterie et de gestion événementielle développée dans le cadre du projet.',
      },
      {
        title: 'Création digitale',
        body: 'La création de sites web et les solutions digitales sont assurées par NURISEWEB.',
      },
      {
        title: 'Contact',
        body: 'Pour toute demande, utilise la page Contact EventFlow disponible depuis le footer.',
      },
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    lead: 'Cette page présente les grands principes de gestion des données sur EventFlow.',
    sections: [
      {
        title: 'Données collectées',
        body: 'EventFlow traite les informations nécessaires à la création de compte, aux commandes, aux billets et aux espaces organisateur.',
      },
      {
        title: 'Finalités',
        body: 'Les données servent à fournir le service, sécuriser les accès, gérer les paiements et améliorer le suivi des événements.',
      },
      {
        title: 'Demandes utilisateur',
        body: 'Un utilisateur peut demander des informations ou une correction via la page Contact EventFlow.',
      },
    ],
  },
  about: {
    title: 'Qui sommes-nous ?',
    lead: 'EventFlow simplifie la découverte, la réservation et la gestion des évènements.',
    sections: [
      {
        title: 'Notre mission',
        body: 'EventFlow aide les participants à trouver des évènements facilement et donne aux organisateurs des outils simples pour publier, vendre et suivre leurs évènements.',
      },
      {
        title: 'Pour les participants',
        body: 'La plateforme centralise la recherche, la réservation, les billets et le suivi des commandes dans une expérience claire.',
      },
      {
        title: 'Pour les organisateurs',
        body: 'EventFlow accompagne les organisateurs avec un espace dédié, la gestion des billets, le suivi des ventes et les services Booster pour donner plus de visibilité aux évènements.',
      },
    ],
  },
  help: {
    title: 'Aide',
    lead: 'Les réponses rapides pour utiliser EventFlow plus sereinement.',
    sections: [
      {
        title: 'Billets',
        body: 'Après une commande validée, les billets sont disponibles dans l’espace Mes billets ou depuis le lien reçu par email.',
      },
      {
        title: 'Organisateurs',
        body: 'Les organisateurs peuvent créer des événements, suivre leurs ventes et utiliser les services Booster depuis leur espace dédié.',
      },
      {
        title: 'Support',
        body: 'Si une information manque, contacte EventFlow depuis la page Contact.',
      },
    ],
  },
  contact: {
    title: 'Contact EventFlow',
    lead: 'Une question, un signalement ou une demande liée à ton compte ? Contacte EventFlow.',
    sections: [
      {
        title: 'Support',
        body: 'Écris à l’équipe EventFlow avec le contexte de ta demande, le nom de l’événement concerné et l’adresse email utilisée sur ton compte.',
      },
      {
        title: 'Organisateurs',
        body: 'Pour une demande liée à un événement, au Booster ou à un paiement, ajoute la référence concernée afin de faciliter le traitement.',
      },
      {
        title: 'Réponse',
        body: 'EventFlow revient vers toi dès que les informations nécessaires ont été vérifiées.',
      },
    ],
  },
} satisfies Record<string, Omit<LegalPageProps, never>>
