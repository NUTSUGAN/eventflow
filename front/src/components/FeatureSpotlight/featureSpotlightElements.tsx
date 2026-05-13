import styled, { css } from 'styled-components'

export const FeatureSection = styled.section`
  margin-top: 72px;
  padding: 40px 44px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 36px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(248, 143, 82, 0.14), transparent 24%),
    linear-gradient(180deg, rgba(36, 31, 29, 0.96) 0%, rgba(29, 25, 23, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: var(--shadow-strong);

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    padding: 32px 24px;
  }
`

export const FeatureContent = styled.div`
  display: grid;
  align-content: center;
  gap: 18px;
`

export const FeatureEyebrow = styled.span`
  color: var(--color-secondary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.82rem;
`

export const FeatureTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 0.98;
  max-width: 12ch;
`

export const FeatureDescription = styled.p`
  margin: 0;
  max-width: 34rem;
  color: var(--color-text-muted);
  font-size: 1.18rem;
  line-height: 1.55;
`

export const FeatureActions = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`

export const FeatureAction = styled.button<{ $secondary?: boolean }>`
  min-height: 48px;
  padding: 0 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
  ${({ $secondary }) =>
    $secondary
      ? css`
          background: rgba(255, 255, 255, 0.04);
        `
      : css`
          background: linear-gradient(
            180deg,
            var(--color-secondary) 0%,
            var(--color-primary) 100%
          );
          color: #1b1512;
          border-color: transparent;
        `}
`

export const FeatureMedia = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

export const FeatureMediaCard = styled.div`
  width: min(100%, 520px);
  min-height: 360px;
  padding: 24px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 18px;
  border-radius: 24px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
    rgba(22, 19, 18, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
`

export const FeatureMediaImage = styled.img`
  width: min(100%, 360px);
  height: auto;
  display: block;
  mix-blend-mode: screen;
  filter: brightness(1.12);
`

export const FeatureMediaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(248, 143, 82, 0.14);
  color: #ffe6d7;
  border: 1px solid rgba(248, 143, 82, 0.24);
  font-weight: 700;
`

export const FeatureMediaSubtext = styled.p`
  margin: 0;
  max-width: 28rem;
  text-align: center;
  color: var(--color-text-muted);
  line-height: 1.5;
`
