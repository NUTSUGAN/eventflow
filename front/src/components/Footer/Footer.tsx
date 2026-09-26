import { FaInstagram, FaSnapchat, FaTiktok } from 'react-icons/fa6'
import { useNavigate } from 'react-router-dom'
import {
  FooterBottom,
  FooterColumn,
  FooterColumnTitle,
  FooterColumns,
  FooterContainer,
  FooterCopyright,
  FooterExternalLink,
  FooterLink,
  FooterMain,
  FooterTop,
  FooterTrustTitle,
  FooterTrustList,
  FooterTrustItem,
  FooterSocialLink,
  SocialLinks,
  FooterTopAction,
} from './footerElements'

const sponsors = [
  { id: 'sponsor-1', name: 'Nuriseweb', logo: '/assets/nuriseweb-logo.png' },
  { id: 'sponsor-2', name: 'Sponsor à venir', logo: null },
  { id: 'sponsor-3', name: 'Sponsor à venir', logo: null },
  { id: 'sponsor-4', name: 'Sponsor à venir', logo: null },
]

const featuredCities = ['Adidogomé', 'Aného', 'Lomé']

export function SiteFooter() {
  const navigate = useNavigate()

  return (
    <FooterContainer>
      <FooterTop>
        <FooterTrustTitle>Nos partenaires</FooterTrustTitle>
        <FooterTrustList aria-label="Nos sponsors">
          {sponsors.map(sponsor => (
            <FooterTrustItem key={sponsor.id} aria-label={sponsor.name}>
              {sponsor.logo ? <img src={sponsor.logo} alt={sponsor.name} /> : <span>À venir</span>}
            </FooterTrustItem>
          ))}
        </FooterTrustList>
      </FooterTop>
      <FooterMain>
        <FooterTopAction
          type="button"
          onClick={() => navigate('/auth?mode=register&intent=publish')}
        >
          Publier ton évènement
        </FooterTopAction>

        <FooterColumns>
          <FooterColumn>
            <FooterColumnTitle>À propos</FooterColumnTitle>
            <FooterLink type="button" onClick={() => navigate('/qui-sommes-nous')}>
              Qui sommes-nous ?
            </FooterLink>
            <FooterLink
              type="button"
              onClick={() => navigate('/auth?mode=register&intent=organizer')}
            >
              Je suis organisateur
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/explorer')}>
              Billetterie EventFlow
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/tarifs')}>
              Tarifs
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/aide')}>
              Aide
            </FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Villes</FooterColumnTitle>
            {featuredCities.map(city => (
              <FooterLink key={city} type="button" onClick={() => navigate(`/explorer?city=${encodeURIComponent(city)}`)}>
                {city}
              </FooterLink>
            ))}
            <FooterLink type="button" onClick={() => navigate('/explorer')}>
              Voir toutes les villes
            </FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Organisateurs</FooterColumnTitle>
            <FooterLink type="button" onClick={() => navigate('/organizer-access')}>Créer un événement</FooterLink>
            <FooterLink type="button" onClick={() => navigate('/organizer/dashboard')}>Mon espace organisateur</FooterLink>
            <FooterLink type="button" onClick={() => navigate('/devenir-partenaire')}>Devenir partenaire</FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Aide / légal</FooterColumnTitle>
            <FooterLink type="button" onClick={() => navigate('/conditions-utilisation')}>
              Conditions d’utilisation
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/mentions-legales')}>
              Mentions légales
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/confidentialite')}>
              Politique de confidentialité
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/documents-legaux')}>
              Documents légaux
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/contact')}>
              Contact EventFlow
            </FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Réseaux</FooterColumnTitle>
            <SocialLinks>
              <FooterSocialLink href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram"><FaInstagram aria-hidden="true" /></FooterSocialLink>
              <FooterSocialLink href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok"><FaTiktok aria-hidden="true" /></FooterSocialLink>
              <FooterSocialLink href="https://www.snapchat.com/" target="_blank" rel="noreferrer" aria-label="Snapchat" title="Snapchat"><FaSnapchat aria-hidden="true" /></FooterSocialLink>
            </SocialLinks>
          </FooterColumn>
        </FooterColumns>

        <FooterBottom>
          <FooterCopyright>
            © 2026{' '}
            <FooterExternalLink
              href="https://nuriseweb.com/"
              target="_blank"
              rel="noreferrer"
            >
              NURISEWEB
            </FooterExternalLink>{' '}
            Création de sites web & solutions digitales.
          </FooterCopyright>
        </FooterBottom>
      </FooterMain>
    </FooterContainer>
  )
}
