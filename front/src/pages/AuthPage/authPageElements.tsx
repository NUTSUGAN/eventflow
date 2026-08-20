import styled, { css } from 'styled-components'

export const AuthLayout = styled.main`
  width: min(1120px, calc(100% - 48px));
  min-width: 0;
  margin: 56px auto 96px;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
  gap: 32px;

  @media (max-width: 960px) {
    width: min(100%, calc(100% - 24px));
    grid-template-columns: 1fr;
    margin-top: 32px;
  }
`

export const AuthHero = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
`

export const AuthIntentBadge = styled.span`
  display: inline-flex;
  align-self: flex-start;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(208, 124, 65, 0.16);
  border: 1px solid rgba(208, 124, 65, 0.28);
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const AuthTitle = styled.h1`
  margin: 0;
  font-size: clamp(2.5rem, 4vw, 4.3rem);
  line-height: 0.96;
  font-family: 'Montserrat', sans-serif;
  color: #fffaf4;

  @media (max-width: 560px) {
    font-size: clamp(2rem, 11vw, 3rem);
  }
`

export const AuthSubtitle = styled.p`
  margin: 0;
  font-size: 1.12rem;
  line-height: 1.65;
  color: rgba(255, 245, 236, 0.88);
`

export const AuthDescription = styled.p`
  margin: 0;
  max-width: 58ch;
  font-size: 0.98rem;
  line-height: 1.7;
  color: rgba(255, 234, 219, 0.68);
`

export const AuthCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(42, 31, 25, 0.96), rgba(29, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.36);

  @media (max-width: 560px) {
    gap: 18px;
    padding: 18px;
    border-radius: 16px;
  }
`

export const AuthTabs = styled.div`
  min-width: 0;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const AuthTabButton = styled.button<{ $active: boolean }>`
  min-height: 46px;
  border: none;
  border-radius: 12px;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;

  ${({ $active }) =>
    $active
      ? css`
          background: linear-gradient(135deg, #df8a4d, #ba6739);
          color: #fffaf4;
        `
      : css`
          background: transparent;
          color: rgba(255, 239, 228, 0.72);
        `}
`

export const AuthStatusMessage = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(57, 138, 88, 0.16);
  border: 1px solid rgba(84, 185, 123, 0.28);
  color: #d4ffdf;
  font-size: 0.95rem;
`

export const AuthStateBox = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(147, 70, 57, 0.16);
  border: 1px solid rgba(219, 112, 92, 0.24);
  color: #ffd6cf;
  font-size: 0.95rem;
  line-height: 1.55;
`

export const AuthPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const AuthFieldset = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const AuthFieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const AuthField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const AuthFieldLabel = styled.label`
  color: rgba(255, 241, 230, 0.84);
  font-size: 0.9rem;
  font-weight: 600;
`

export const AuthTextInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 50px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff8f2;
  font-size: 0.98rem;

  &:focus-visible {
    outline: 2px solid rgba(239, 145, 79, 0.82);
    outline-offset: 1px;
  }
`

export const AuthCheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: rgba(255, 240, 226, 0.82);
  font-size: 0.93rem;
  line-height: 1.55;
  cursor: pointer;
`

export const AuthCheckbox = styled.input`
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #df8a4d;
  flex-shrink: 0;
`

export const AuthLegalLink = styled.a`
  color: #f3b183;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;

  &:hover,
  &:focus-visible {
    color: #ffd0ad;
  }
`

export const AuthHelperText = styled.span`
  color: rgba(255, 228, 206, 0.56);
  font-size: 0.84rem;
`

export const AuthSupportButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: #f3b183;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
`

export const AuthActionsRow = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const buttonBase = css`
  max-width: 100%;
  min-height: 50px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    background 0.18s ease;

  &:disabled {
    cursor: wait;
    opacity: 0.72;
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`

export const AuthPrimaryButton = styled.button`
  ${buttonBase};
  border: none;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
`

export const AuthSecondaryButton = styled.button`
  ${buttonBase};
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
`

export const AuthGoogleButton = styled.button`
  ${buttonBase};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: #fff8f2;
`

export const AuthGoogleIcon = styled.svg`
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
`

export const PendingAccountCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const PendingAccountIdentity = styled.strong`
  color: #fffaf4;
  font-size: 1.02rem;
`

export const PendingAccountText = styled.span`
  color: rgba(255, 237, 221, 0.74);
  line-height: 1.55;
`
