import styled from 'styled-components'

export const DetailSection = styled.main`
  width: min(1480px, calc(100% - 96px));
  margin: 0 auto;
  padding: 28px 0 72px;

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 24px));
    padding: 24px 0 56px;
  }
`

export const DetailHero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 28px;
  margin-bottom: 28px;
  padding: 0;
  align-items: stretch;

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }
`

export const DetailHeroCover = styled.div<{ $imageUrl: string }>`
  min-height: 420px;
  border-radius: 8px;
  background-image:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.36) 100%),
    url(${({ $imageUrl }) => $imageUrl});
  background-size: cover;
  background-position: center;
  box-shadow: var(--shadow-soft);

  @media (max-width: 1040px) {
    min-height: 320px;
  }
`

export const DetailHeroContent = styled.div`
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 26px 0 12px;
`

export const DetailMetaBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const DetailMetaBadge = styled.span`
  min-height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-muted);
  font-size: 0.9rem;
`

export const DetailTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3.2rem);
`

export const DetailLead = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1.02rem;
  line-height: 1.7;
`

export const DetailHeroTop = styled.div`
  display: grid;
  gap: 12px;
`

export const DetailHeroMeta = styled.div`
  margin-top: 8px;
`

export const DetailInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

export const DetailInfoItem = styled.div`
  min-height: 82px;
  padding: 18px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: rgba(34, 31, 29, 0.92);
  box-shadow: var(--shadow-soft);
`

export const DetailInfoLabel = styled.span`
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-soft);
  font-size: 0.85rem;
  text-transform: uppercase;
`

export const DetailInfoValue = styled.strong`
  color: var(--color-text);
  font-weight: 600;
  line-height: 1.4;
`

export const DetailInfoSelect = styled.select`
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.98rem;
  appearance: none;

  &:disabled {
    opacity: 1;
    cursor: default;
  }
`

export const DetailGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.9fr);
  gap: 28px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

export const DetailBody = styled.div`
  display: grid;
  gap: 24px;
`

export const DetailPanel = styled.section`
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: rgba(34, 31, 29, 0.9);
  box-shadow: var(--shadow-soft);
`

export const DetailPanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
`

export const DetailPanelTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.3rem;
`

export const DetailCaption = styled.span`
  color: var(--color-text-soft);
  font-size: 0.92rem;
`

export const DetailText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.75;
`

export const DetailTicketList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
`

export const DetailTicketListItem = styled.li`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    rgba(191, 106, 65, 0.12) 0%,
    rgba(43, 37, 34, 0.92) 100%
  );
  color: var(--color-text);
  border: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 640px) {
    flex-direction: column;
  }
`

export const DetailTicketText = styled.strong`
  display: block;
  margin-bottom: 6px;
  color: var(--color-text);
  font-size: 1rem;
`

export const DetailTicketDescription = styled.p`
  margin: 0 0 8px;
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
`

export const DetailTicketMeta = styled.span`
  color: var(--color-text-soft);
  font-size: 0.9rem;
`

export const DetailTicketActions = styled.div`
  display: grid;
  justify-items: end;
  gap: 10px;

  @media (max-width: 640px) {
    width: 100%;
    justify-items: stretch;
  }
`

export const DetailTicketPrice = styled.strong`
  display: block;
  margin-bottom: 6px;
  color: var(--color-secondary);
  font-size: 1rem;
  text-align: right;

  @media (max-width: 640px) {
    text-align: left;
  }
`

export const TicketReserveButton = styled.button`
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(191, 106, 65, 0.98) 0%,
    rgba(207, 121, 77, 0.92) 100%
  );
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 0.92rem;
  cursor: pointer;
`

export const TicketReserveHint = styled.span`
  color: var(--color-text-soft);
  font-size: 0.84rem;
  text-align: right;

  @media (max-width: 640px) {
    text-align: left;
  }
`

export const DetailOrganizerCard = styled.div`
  display: grid;
  gap: 18px;
`

export const DetailOrganizerIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

export const DetailOrganizerAvatar = styled.div<{ $imageUrl?: string }>`
  width: 68px;
  height: 68px;
  flex: 0 0 68px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.18) 100%), url(${$imageUrl})`
        : 'linear-gradient(180deg, rgba(191, 106, 65, 0.95) 0%, rgba(248, 143, 82, 0.82) 100%)'};
  background-size: cover;
  background-position: center;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
`

export const DetailOrganizerName = styled.h3`
  margin: 0 0 4px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.1rem;
`

export const DetailOrganizerNote = styled.p`
  margin: 0;
  color: var(--color-text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
`

export const DetailOrganizerActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const FollowButton = styled.button<{ $active: boolean }>`
  min-height: 50px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(248, 143, 82, 0.6)' : 'rgba(255, 255, 255, 0.14)'};
  background:
    ${({ $active }) =>
      $active
        ? 'linear-gradient(180deg, rgba(191, 106, 65, 0.26) 0%, rgba(248, 143, 82, 0.18) 100%)'
        : 'rgba(255, 255, 255, 0.04)'};
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.64;
    cursor: wait;
  }
`

export const AuthPromptButton = styled.button`
  min-height: 50px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(
    180deg,
    rgba(191, 106, 65, 0.98) 0%,
    rgba(207, 121, 77, 0.92) 100%
  );
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  cursor: pointer;
`

export const FollowIcon = styled.svg`
  width: 16px;
  height: 16px;
  color: var(--color-secondary);
`

export const DetailMapCard = styled.div`
  margin-top: 18px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.18);
`

export const DetailMapFrame = styled.iframe`
  width: 100%;
  min-height: 320px;
  border: 0;
  display: block;
`

export const DetailMapLink = styled.a`
  color: var(--color-secondary);
  font-size: 0.92rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

export const DetailEmptyText = styled.p`
  margin: 0;
  color: var(--color-text-soft);
`

export const DetailStateBox = styled.section`
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: rgba(34, 31, 29, 0.9);
  box-shadow: var(--shadow-soft);
`

export const DetailRelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`
