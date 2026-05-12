import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const EventLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`

export const Card = styled.article`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
`

export const CardCover = styled.div<{ $imageUrl?: string }>`
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1.68;
  border-radius: 6px;
  background-image:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.18) 100%), url(${$imageUrl})`
        : `radial-gradient(circle at 20% 20%, rgba(244, 208, 122, 0.2), transparent 18%),
           radial-gradient(circle at 78% 18%, rgba(255, 87, 154, 0.28), transparent 18%),
           radial-gradient(circle at 74% 72%, rgba(23, 211, 170, 0.26), transparent 28%),
           linear-gradient(180deg, rgba(7, 13, 30, 0.96) 0%, rgba(15, 31, 53, 0.98) 100%)`};
  background-size: cover;
  background-position: center;
  box-shadow: 0 14px 24px rgba(0, 0, 0, 0.28);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(160deg, rgba(255, 255, 255, 0.03), transparent 55%),
      linear-gradient(180deg, transparent 45%, rgba(0, 0, 0, 0.35) 100%);
  }

  ${EventLink}:hover & {
    transform: translateY(-3px);
    box-shadow: 0 22px 34px rgba(0, 0, 0, 0.34);
  }
`

export const CardTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(1.2rem, 1.8vw, 1.55rem);
  line-height: 1.2;
`

export const CardLocation = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
`

export const CardMetaRow = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`

export const CardWhen = styled.span`
  color: var(--color-secondary);
  font-size: 1rem;
  font-weight: 700;
`

export const PriceTag = styled.span`
  color: var(--color-text);
  font-weight: 700;
  font-size: 1rem;
`
