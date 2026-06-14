import { useNavigate } from 'react-router-dom'
import {
  FooterBrand,
  FooterBottom,
  FooterColumn,
  FooterColumnTitle,
  FooterColumns,
  FooterContainer,
  FooterLegal,
  FooterLink,
  FooterMain,
  FooterSocialLink,
  FooterTop,
  FooterTopAction,
  FooterTrustItem,
  FooterTrustList,
  FooterTrustTitle,
  SocialLinks,
} from './footerElements'

const aboutLinks = [
  'Je suis organisateur',
  'Billetterie EventFlow',
  'Kit presse',
  'Carrieres',
  'Aide',
]

const cityLinks = ['Paris', 'Lyon', 'Lille', 'Toulouse', 'Montpellier', 'Voir tout']

const organizerLinks = [
  'Grand Palais',
  'La Sucriere',
  'Studio Lumiere',
  'Maison des Arts',
  'Voir tout',
]

const supportLinks = [
  'Centre daide',
  'Nous contacter',
  'Signaler un contenu',
  'Politique de confidentialite',
  'Conditions dutilisation',
]

const trustedNames = [
  'IPSSI PARIS',
  'IPSSI PARIS',
  'IPSSI PARIS',
  'IPSSI PARIS',
  'IPSSI PARIS',
  'IPSSI PARIS',
]

export function SiteFooter() {
  const navigate = useNavigate()

  return (
    <FooterContainer>
      <FooterTop>
        <FooterTrustTitle>Des organisateurs nous font confiance</FooterTrustTitle>
        <FooterTrustList>
          {trustedNames.map((name, index) => (
            <FooterTrustItem key={`${name}-${index}`}>{name}</FooterTrustItem>
          ))}
        </FooterTrustList>
      </FooterTop>

      <FooterMain>
        <FooterBrand>EventFlow</FooterBrand>
        <FooterTopAction
          type="button"
          onClick={() => navigate('/auth?mode=register&intent=publish')}
        >
          Publie ton evenement
        </FooterTopAction>
        <FooterColumns>
          <FooterColumn>
            <FooterColumnTitle>A propos</FooterColumnTitle>
            {aboutLinks.map((link) => (
              <FooterLink
                key={link}
                type="button"
                onClick={
                  link === 'Je suis organisateur'
                    ? () => navigate('/auth?mode=register&intent=organizer')
                    : undefined
                }
              >
                {link}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Villes</FooterColumnTitle>
            {cityLinks.map((link) => (
              <FooterLink key={link} type="button">
                {link}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Organisateurs</FooterColumnTitle>
            {organizerLinks.map((link) => (
              <FooterLink key={link} type="button">
                {link}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Support</FooterColumnTitle>
            {supportLinks.map((link) => (
              <FooterLink key={link} type="button">
                {link}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Sur les reseaux</FooterColumnTitle>
            <SocialLinks>
              <FooterSocialLink type="button">Instagram</FooterSocialLink>
              <FooterSocialLink type="button">TikTok</FooterSocialLink>
              <FooterSocialLink type="button">Spotify</FooterSocialLink>
              <FooterSocialLink type="button">LinkedIn</FooterSocialLink>
            </SocialLinks>
          </FooterColumn>
        </FooterColumns>

        <FooterBottom>
          <FooterLegal>Conditions dutilisation</FooterLegal>
          <FooterLegal>Politique cookies</FooterLegal>
          <FooterLegal>Mentions legales</FooterLegal>
          <FooterLegal>Francais</FooterLegal>
        </FooterBottom>

        <FooterBottom>
          <FooterLegal>© 2026 EventFlow. Tous droits reserves.</FooterLegal>
        </FooterBottom>
      </FooterMain>
    </FooterContainer>
  )
}
