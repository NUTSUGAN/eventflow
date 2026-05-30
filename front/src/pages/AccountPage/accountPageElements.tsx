import styled, { css } from 'styled-components'

type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger'

export const AccountSection = styled.section`
  width: min(1180px, calc(100% - 56px));
  margin: 40px auto 96px;

  @media (max-width: 720px) {
    width: min(100%, calc(100% - 28px));
    margin: 24px auto 56px;
  }
`

export const AccountShell = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.1fr);
  align-items: start;
  gap: 24px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const panelStyles = css`
  display: grid;
  gap: 22px;
  padding: 28px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(43, 31, 25, 0.96) 0%, rgba(34, 26, 23, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
`

export const AccountOverviewCard = styled.div`
  ${panelStyles}
  align-content: start;
`

export const AccountFormCard = styled.div`
  ${panelStyles}
`

export const AccountStateCard = styled.div`
  ${panelStyles}
`

export const AccountHero = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: center;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export const AccountAvatar = styled.div<{ $imageUrl?: string }>`
  width: 92px;
  height: 92px;
  border-radius: 50%;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.22)), url(${$imageUrl})`
        : 'linear-gradient(135deg, rgba(191, 106, 65, 0.95), rgba(248, 143, 82, 0.82))'};
  background-size: cover;
  background-position: center;
  color: #fff7f2;
  font-weight: 800;
  font-size: 1.9rem;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.18);
`

export const AccountEyebrow = styled.span`
  color: rgba(248, 143, 82, 0.9);
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

export const AccountTitle = styled.h1`
  margin: 8px 0 0;
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.02;
`

export const AccountSubtitle = styled.p`
  margin: 10px 0 0;
  color: var(--color-text-muted);
  font-size: 0.98rem;
  line-height: 1.6;
`

export const AccountBadgeRow = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

export const AccountStatusBadge = styled.span<{ $tone?: BadgeTone }>`
  width: fit-content;
  min-height: 34px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) => {
      switch ($tone) {
        case 'accent':
          return 'rgba(248, 143, 82, 0.34)'
        case 'success':
          return 'rgba(108, 182, 115, 0.34)'
        case 'danger':
          return 'rgba(214, 97, 97, 0.34)'
        default:
          return 'rgba(255, 255, 255, 0.1)'
      }
    }};
  background:
    ${({ $tone }) => {
      switch ($tone) {
        case 'accent':
          return 'rgba(248, 143, 82, 0.12)'
        case 'success':
          return 'rgba(108, 182, 115, 0.14)'
        case 'danger':
          return 'rgba(214, 97, 97, 0.14)'
        default:
          return 'rgba(255, 255, 255, 0.05)'
      }
    }};
  color:
    ${({ $tone }) => {
      switch ($tone) {
        case 'accent':
          return '#ffe1cf'
        case 'success':
          return '#def4e0'
        case 'danger':
          return '#ffd9d9'
        default:
          return 'var(--color-text)'
      }
    }};
  font-size: 0.84rem;
  font-weight: 700;
`

export const AccountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export const AccountInfoCard = styled.div`
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
`

export const AccountLabel = styled.p`
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const AccountValue = styled.p`
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
`

export const AccountMutedValue = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.94rem;
  line-height: 1.55;
`

export const AccountSectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
`

export const AccountSectionLead = styled.p`
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.55;
`

export const AccountForm = styled.form`
  display: grid;
  gap: 18px;
`

export const AccountFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const AccountField = styled.label`
  display: grid;
  gap: 8px;
`

export const AccountFieldLabel = styled.span`
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const inputStyles = css`
  min-height: 54px;
  width: 100%;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-text);
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;

  &:focus {
    border-color: rgba(226, 139, 82, 0.88);
    box-shadow: 0 0 0 3px rgba(226, 139, 82, 0.16);
    background: rgba(255, 255, 255, 0.05);
  }
`

export const AccountInput = styled.input`
  ${inputStyles}
`

export const AccountReadonlyField = styled.div`
  min-height: 54px;
  width: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.025);
  color: var(--color-text);
  font-weight: 600;
`

export const AccountUploadCard = styled.div`
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.028);
`

export const AccountUploadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

export const AccountUploadPreview = styled.div<{ $imageUrl?: string }>`
  width: 88px;
  height: 88px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.16)), url(${$imageUrl})`
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02))'};
  background-size: cover;
  background-position: center;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.16);
`

export const AccountUploadMeta = styled.div`
  display: grid;
  gap: 6px;
`

export const AccountUploadTitle = styled.p`
  margin: 0;
  color: var(--color-text);
  font-weight: 700;
`

export const AccountHelperText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.93rem;
  line-height: 1.55;
`

export const AccountActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const buttonStyles = css`
  min-height: 48px;
  padding: 0 20px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

export const AccountPrimaryButton = styled.button`
  ${buttonStyles}
  border: 0;
  background: #e28b52;
  color: #1d140f;
`

export const AccountSecondaryButton = styled.button`
  ${buttonStyles}
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
`

export const AccountGhostButton = styled.button`
  ${buttonStyles}
  border: 1px solid rgba(248, 143, 82, 0.24);
  background: rgba(248, 143, 82, 0.08);
  color: #ffe1cf;
`

export const AccountDangerButton = styled.button`
  ${buttonStyles}
  border: 1px solid rgba(223, 99, 99, 0.22);
  background: rgba(182, 74, 74, 0.12);
  color: #ffd9d9;
`

export const AccountHiddenFileInput = styled.input`
  display: none;
`

export const AccountCheckboxRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--color-text);
  line-height: 1.55;
`

export const AccountCheckbox = styled.input`
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #e28b52;
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

export const AccountState = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.6;
`
