import styled from 'styled-components'

export const ProfileSection = styled.main`
  width: min(1480px, calc(100% - 96px));
  margin: 0 auto;
  padding: 28px 0 64px;

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 28px));
    padding: 24px 0 48px;
  }
`

export const ProfileStateBox = styled.div`
  min-height: 240px;
  padding: 28px;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
`

export const ProfileHero = styled.section`
  display: grid;
  gap: 22px;
  padding: 28px;
  margin-bottom: 28px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(248, 143, 82, 0.2), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 900px) {
    padding: 22px;
  }
`

export const ProfileHeroTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
`

export const ProfileIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
`

export const ProfileAvatar = styled.div<{ $imageUrl?: string }>`
  width: 88px;
  height: 88px;
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
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
`

export const ProfileTitleGroup = styled.div`
  display: grid;
  gap: 8px;
`

export const ProfileEyebrow = styled.span`
  color: var(--color-secondary);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const ProfileTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
`

export const ProfileLead = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.6;
`

export const ProfileMetaRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

export const ProfileMetaBadge = styled.div`
  min-height: 42px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 600;
`

export const ProfileActionGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

export const ProfileActionButton = styled.button<{ $active?: boolean }>`
  min-height: 48px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(248, 143, 82, 0.48)' : 'rgba(255, 255, 255, 0.1)'};
  background:
    ${({ $active }) =>
      $active
        ? 'linear-gradient(180deg, rgba(191, 106, 65, 0.28), rgba(248, 143, 82, 0.18))'
        : 'rgba(255, 255, 255, 0.04)'};
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`

export const ProfileActionNote = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
`

export const ProfileBlock = styled.section`
  display: grid;
  gap: 18px;
`

export const ProfileBlockHeader = styled.header`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const ProfileBlockTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(1.4rem, 2vw, 1.9rem);
`

export const ProfileBlockCaption = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
`

export const ProfileCardsGrid = styled.section`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;

  & > * {
    flex: 0 1 calc((100% - 48px) / 3);
    min-width: 280px;
    max-width: 420px;
  }

  @media (max-width: 1040px) {
    & > * {
      flex-basis: calc((100% - 24px) / 2);
    }
  }

  @media (max-width: 700px) {
    gap: 22px;

    & > * {
      flex-basis: 100%;
      max-width: 100%;
    }
  }
`
