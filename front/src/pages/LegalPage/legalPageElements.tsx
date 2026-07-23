import styled from 'styled-components'

export const LegalPageShell = styled.main`
  width: min(900px, calc(100% - 32px));
  min-width: 0;
  margin: 0 auto;
  padding: 72px 0 44px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    padding: 44px 0 40px;
  }
`

export const LegalBackLink = styled.a`
  display: inline-flex;
  margin-bottom: 24px;
  color: var(--color-secondary);
  text-decoration: none;
  font-weight: 700;
`

export const LegalTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2.1rem, 5vw, 3.4rem);
`

export const LegalLead = styled.p`
  margin: 14px 0 0;
  color: var(--color-text-muted);
  font-size: 1.08rem;
  line-height: 1.6;
`

export const LegalContent = styled.div`
  display: grid;
  gap: 14px;
  margin-top: 32px;
`

export const LegalSection = styled.section`
  min-width: 0;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);

  @media (max-width: 560px) {
    padding: 16px;
  }

  h2 {
    margin: 0 0 10px;
    color: var(--color-text);
    font-family: var(--font-heading);
    font-size: 1.15rem;
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
    line-height: 1.6;
  }
`
