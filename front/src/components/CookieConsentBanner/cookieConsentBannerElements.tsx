import styled from 'styled-components'

export const CookieConsentWrapper = styled.aside`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  width: min(420px, calc(100vw - 32px));
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(42, 31, 25, 0.98), rgba(29, 24, 21, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.42);

  @media (max-width: 640px) {
    right: 16px;
    bottom: 16px;
  }
`

export const CookieConsentTitle = styled.h2`
  margin: 0;
  color: #fffaf4;
  font-size: 1.15rem;
  font-family: 'Montserrat', sans-serif;
`

export const CookieConsentText = styled.p`
  margin: 0;
  color: rgba(255, 236, 222, 0.8);
  font-size: 0.94rem;
  line-height: 1.65;
`

export const CookieConsentActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const buttonBase = `
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
`

export const CookieConsentPrimaryButton = styled.button`
  ${buttonBase}
  border: none;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
`

export const CookieConsentSecondaryButton = styled.button`
  ${buttonBase}
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff4e8;
`

