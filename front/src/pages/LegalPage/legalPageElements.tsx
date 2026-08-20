import styled from 'styled-components'

export const LegalPageShell = styled.main`
  width: min(1040px, calc(100% - 40px));
  min-width: 0;
  margin: 0 auto;
  padding: 82px 0 56px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    padding: 46px 0 42px;
  }
`

export const LegalBackLink = styled.a`
  display: inline-flex;
  margin-bottom: 24px;
  color: var(--color-secondary);
  font-size: 1.02rem;
  text-decoration: none;
  font-weight: 700;
`

export const LegalTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2.7rem, 5vw, 4.2rem);
  line-height: 1.03;
`

export const LegalLead = styled.p`
  margin: 18px 0 0;
  color: var(--color-text-muted);
  font-size: 1.24rem;
  line-height: 1.72;
`

export const LegalContent = styled.div`
  display: grid;
  gap: 24px;
  margin-top: 38px;
`

export const LegalSection = styled.section`
  min-width: 0;
  scroll-margin-top: 104px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);

  @media (max-width: 560px) {
    padding: 20px;
  }

  h2 {
    margin: 0 0 16px;
    color: var(--color-text);
    font-family: var(--font-heading);
    font-size: clamp(1.45rem, 3vw, 1.95rem);
    line-height: 1.22;
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 1.08rem;
    line-height: 1.82;
  }

  p + p {
    margin-top: 14px;
  }

  @media (max-width: 560px) {
    p {
      font-size: 1rem;
      line-height: 1.72;
    }
  }
`
