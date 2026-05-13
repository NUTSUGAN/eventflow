import styled from 'styled-components'

export const AccountSection = styled.section`
  width: min(980px, calc(100% - 48px));
  margin: 48px auto 96px;
`

export const AccountCard = styled.div`
  display: grid;
  gap: 24px;
  padding: 32px;
  border-radius: 28px;
  background: rgba(43, 31, 25, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 26px 44px rgba(0, 0, 0, 0.22);
`

export const AccountHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
`

export const AccountAvatar = styled.div<{ $imageUrl?: string }>`
  width: 68px;
  height: 68px;
  border-radius: 50%;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.18)), url(${$imageUrl})`
        : 'linear-gradient(135deg, rgba(191, 106, 65, 0.95), rgba(248, 143, 82, 0.82))'};
  background-size: cover;
  background-position: center;
  color: #fff7f2;
  font-weight: 700;
  font-size: 1.4rem;
`

export const AccountTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3rem);
`

export const AccountSubtitle = styled.p`
  margin: 6px 0 0;
  color: var(--color-text-muted);
`

export const AccountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

export const AccountInfoCard = styled.div`
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
`

export const AccountLabel = styled.p`
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.84rem;
  text-transform: uppercase;
`

export const AccountValue = styled.p`
  margin: 0;
  color: var(--color-text);
  font-weight: 700;
`

export const AccountActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

export const AccountPrimaryButton = styled.button`
  min-height: 48px;
  padding: 0 20px;
  border-radius: 14px;
  border: 0;
  background: #e28b52;
  color: #1d140f;
  font-weight: 700;
  cursor: pointer;
`

export const AccountSecondaryButton = styled.button`
  min-height: 48px;
  padding: 0 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`

export const AccountState = styled.p`
  margin: 0;
  color: var(--color-text-muted);
`

export const AccountForm = styled.form`
  display: grid;
  gap: 18px;
`

export const AccountFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

export const AccountField = styled.label`
  display: grid;
  gap: 8px;
`

export const AccountFieldLabel = styled.span`
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.84rem;
  text-transform: uppercase;
`

const inputStyles = `
  min-height: 52px;
  width: 100%;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;

  &:focus {
    border-color: rgba(226, 139, 82, 0.88);
    box-shadow: 0 0 0 3px rgba(226, 139, 82, 0.16);
  }
`

export const AccountInput = styled.input`
  ${inputStyles}
`

export const AccountCheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text);
`

export const AccountCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #e28b52;
`

export const AccountHelperText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.94rem;
`

export const AccountStatusMessage = styled.div`
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(86, 154, 91, 0.14);
  border: 1px solid rgba(109, 184, 116, 0.28);
  color: #dbf3dc;
`

export const AccountErrorMessage = styled.div`
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(182, 74, 74, 0.16);
  border: 1px solid rgba(223, 99, 99, 0.28);
  color: #ffd9d9;
`
