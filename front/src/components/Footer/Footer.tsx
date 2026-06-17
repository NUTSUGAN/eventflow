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
  FooterSocialLink,
  FooterTop,
  FooterTopAction,
  FooterTrustItem,
  FooterTrustList,
  FooterTrustTitle,
  SocialLinks,
} from './footerElements'

export function SiteFooter() {
  const navigate = useNavigate()

  return (
    <FooterContainer>
      <FooterTop>
        <FooterTrustTitle>Des organisateurs nous font confiance</FooterTrustTitle>
        <FooterTrustList>
          <FooterTrustItem>IPSSI PARIS</FooterTrustItem>
          <FooterTrustItem>IPSSI PARIS</FooterTrustItem>
          <FooterTrustItem>IPSSI PARIS</FooterTrustItem>
          <FooterTrustItem>IPSSI PARIS</FooterTrustItem>
          <FooterTrustItem>IPSSI PARIS</FooterTrustItem>
          <FooterTrustItem>IPSSI PARIS</FooterTrustItem>
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
            <FooterLink type="button" onClick={() => navigate('/aide')}>
              Aide
            </FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Villes</FooterColumnTitle>
            <FooterLink
              type="button"
              onClick={() => navigate(`/explorer?city=${encodeURIComponent('Melun')}`)}
            >
              Melun
            </FooterLink>
            <FooterLink
              type="button"
              onClick={() => navigate(`/explorer?city=${encodeURIComponent('Paris')}`)}
            >
              Paris
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/explorer')}>
              Voir toutes les villes
            </FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Organisateurs</FooterColumnTitle>
            <FooterLink type="button" onClick={() => navigate('/organizers/2')}>
              AdminModif EventFlowModif
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/organizers/8')}>
              ely Google
            </FooterLink>
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
            <FooterLink type="button" onClick={() => navigate('/aide')}>
              Aide
            </FooterLink>
            <FooterLink type="button" onClick={() => navigate('/contact')}>
              Contact EventFlow
            </FooterLink>
          </FooterColumn>

          <FooterColumn>
            <FooterColumnTitle>Réseaux</FooterColumnTitle>
            <SocialLinks>
              <FooterSocialLink
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram aria-hidden="true" />
              </FooterSocialLink>
              <FooterSocialLink
                href="https://www.tiktok.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                title="TikTok"
              >
                <FaTiktok aria-hidden="true" />
              </FooterSocialLink>
              <FooterSocialLink
                href="https://www.snapchat.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Snapchat"
                title="Snapchat"
              >
                <FaSnapchat aria-hidden="true" />
              </FooterSocialLink>
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
