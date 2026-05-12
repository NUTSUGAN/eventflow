import styled from 'styled-components'

export const FooterContainer = styled.footer`
  margin-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: #1b1816;
`

export const FooterTop = styled.section`
  width: min(1480px, calc(100% - 96px));
  margin: 0 auto;
  padding: 28px 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 28px));
    padding: 22px 0;
  }
`

export const FooterTrustTitle = styled.h2`
  margin: 0 0 16px;
  text-align: center;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.3rem;
`

export const FooterTrustList = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

export const FooterTrustItem = styled.div`
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.72);
  font-weight: 700;
  text-align: center;
  padding: 0 12px;
`

export const FooterMain = styled.section`
  width: min(1480px, calc(100% - 96px));
  margin: 0 auto;
  padding: 36px 0 30px;

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 28px));
    padding: 28px 0 24px;
  }
`

export const FooterBrand = styled.div`
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 2.8rem);
  margin-bottom: 18px;
`

export const FooterTopAction = styled.button`
  min-height: 48px;
  padding: 0 20px;
  border-radius: 10px;
  border: 1px solid rgba(248, 143, 82, 0.28);
  background: rgba(255, 255, 255, 0.02);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 26px;
`

export const FooterColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 28px;
  padding: 22px 0 34px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const FooterColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 10px;
`

export const FooterColumnTitle = styled.h3`
  margin: 0 0 6px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.05rem;
`

export const FooterLink = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
`

export const SocialLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

export const FooterSocialLink = styled.button`
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  cursor: pointer;
`

export const FooterBottom = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding-top: 16px;
`

export const FooterLegal = styled.span`
  color: var(--color-text-soft);
  font-size: 0.92rem;
`
