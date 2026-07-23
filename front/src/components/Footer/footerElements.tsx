import styled from 'styled-components'

export const FooterContainer = styled.footer`
  margin-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #171412;
`

export const FooterTop = styled.section`
  width: min(1280px, calc(100% - 64px));
  min-width: 0;
  margin: 0 auto;
  padding: 26px 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 24px));
    padding: 22px 0;
  }
`

export const FooterTrustTitle = styled.h2`
  margin: 0 0 16px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.15rem;
  text-align: center;
`

export const FooterTrustList = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

export const FooterTrustItem = styled.div`
  min-width: 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-align: center;
`

export const FooterMain = styled.section`
  width: min(1280px, calc(100% - 64px));
  min-width: 0;
  margin: 0 auto;
  padding: 28px 0 22px;

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 24px));
  }
`

export const FooterBrand = styled.a`
  display: inline-flex;
  margin-bottom: 12px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.45rem;
  font-weight: 800;
  text-decoration: none;
`

export const FooterTopAction = styled.button`
  max-width: 100%;
  min-height: 42px;
  margin: 0 0 22px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid rgba(248, 143, 82, 0.4);
  background: rgba(248, 143, 82, 0.09);
  color: var(--color-text);
  font-weight: 800;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(248, 143, 82, 0.72);
    background: rgba(248, 143, 82, 0.16);
  }
`

export const FooterColumns = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 24px;
  padding: 18px 0 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 28px;
    row-gap: 44px;
    padding: 24px 0 30px;
  }
`

export const FooterColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 9px;
  min-width: 0;

  @media (max-width: 560px) {
    gap: 10px;
  }
`

export const FooterColumnTitle = styled.h3`
  margin: 0 0 4px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 0.98rem;

  @media (max-width: 560px) {
    font-size: 0.84rem;
    text-transform: uppercase;
  }
`

export const FooterLink = styled.button`
  width: fit-content;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  text-align: left;
  font: inherit;
  font-size: 0.94rem;
  line-height: 1.35;
  cursor: pointer;

  @media (max-width: 560px) {
    font-size: 0.88rem;
    line-height: 1.45;
  }

  &:hover,
  &:focus-visible {
    color: var(--color-secondary);
  }
`

export const SocialLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

export const FooterSocialLink = styled.a`
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  text-decoration: none;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(248, 143, 82, 0.52);
    color: var(--color-secondary);
    transform: translateY(-1px);
  }
`

export const FooterBottom = styled.div`
  padding-top: 16px;
`

export const FooterCopyright = styled.p`
  margin: 0;
  color: var(--color-text-soft);
  font-size: 0.9rem;
  line-height: 1.5;
`

export const FooterExternalLink = styled.a`
  color: var(--color-text);
  text-decoration: none;
  font-weight: 700;

  &:hover,
  &:focus-visible {
    color: var(--color-secondary);
  }
`
