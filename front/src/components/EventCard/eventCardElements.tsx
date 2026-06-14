import { Link } from 'react-router-dom'
import styled from 'styled-components'

type CardVariant = 'default' | 'explorer'

export const EventLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`

export const Card = styled.article<{ $variant?: CardVariant }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $variant }) => ($variant === 'explorer' ? '0' : '8px')};
  min-height: 100%;
  overflow: hidden;
  border-radius: ${({ $variant }) => ($variant === 'explorer' ? '8px' : '0')};
  border: ${({ $variant }) =>
    $variant === 'explorer' ? '1px solid rgba(255, 255, 255, 0.08)' : '0'};
  background:
    ${({ $variant }) =>
      $variant === 'explorer'
        ? 'linear-gradient(180deg, rgba(38, 33, 31, 0.98) 0%, rgba(28, 24, 22, 0.98) 100%)'
        : 'transparent'};
  box-shadow:
    ${({ $variant }) =>
      $variant === 'explorer'
        ? '0 18px 34px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        : 'none'};
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;

  ${EventLink}:hover & {
    transform: translateY(-4px);
    border-color: ${({ $variant }) =>
      $variant === 'explorer' ? 'rgba(248, 143, 82, 0.22)' : 'transparent'};
    box-shadow:
      ${({ $variant }) =>
        $variant === 'explorer'
          ? '0 24px 42px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
          : 'none'};
  }
`

export const CardCover = styled.div<{ $imageUrl?: string; $variant?: CardVariant }>`
  position: relative;
  z-index: 2;
  overflow: visible;
  width: 100%;
  aspect-ratio: 1.68;
  border-radius: ${({ $variant }) => ($variant === 'explorer' ? '0' : '6px')};
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
`

export const SponsoredBadge = styled.img`
  position: absolute;
  z-index: 2;
  right: -14px;
  bottom: -54px;
  width: clamp(104px, 31%, 146px);
  aspect-ratio: 1;
  object-fit: contain;
  mix-blend-mode: screen;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, .48));
  pointer-events: none;

  @media (max-width: 600px) {
    right: -8px;
    bottom: -42px;
    width: 112px;
  }
`

export const CardContent = styled.div<{ $variant?: CardVariant }>`
  position: relative;
  z-index: 1;
  padding: ${({ $variant }) => ($variant === 'explorer' ? '16px 16px 18px' : '0')};
  display: grid;
  gap: ${({ $variant }) => ($variant === 'explorer' ? '10px' : '8px')};
`

export const CardCategory = styled.span`
  width: fit-content;
  min-height: 28px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(248, 143, 82, 0.22);
  background: rgba(248, 143, 82, 0.1);
  color: #ffd8c4;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
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

export const CardDescription = styled.p`
  margin: 0;
  color: rgba(255, 244, 236, 0.76);
  font-size: 0.94rem;
  line-height: 1.55;
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
