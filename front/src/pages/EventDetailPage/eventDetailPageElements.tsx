import styled from 'styled-components'

export const DetailSection = styled.main`
  width: min(1480px, calc(100% - 96px));
  min-width: 0;
  margin: 0 auto;
  padding: 28px 0 72px;

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 24px));
    padding: 24px 0 56px;
  }
`

export const DetailHero = styled.section`
  min-width: 0;
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
  position: relative;
  overflow: visible;
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

  @media (max-width: 560px) {
    min-height: 240px;
  }
`

export const DetailSponsoredBadge = styled.img`
  position: absolute;
  right: -24px;
  bottom: -38px;
  width: clamp(126px, 24%, 190px);
  aspect-ratio: 1;
  object-fit: contain;
  mix-blend-mode: screen;
  filter: drop-shadow(0 14px 24px rgba(0, 0, 0, .5));
  pointer-events: none;

  @media (max-width: 640px) {
    right: 8px;
    bottom: -24px;
    width: 112px;
  }
`

export const DetailEventVideoPanel = styled.section`
  min-width: 0;
  display: grid;
  gap: 16px;
  margin: 0 0 28px;
  padding: 20px;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(44, 34, 29, 0.96), rgba(24, 21, 19, 0.98));
  border: 1px solid rgba(248, 143, 82, 0.18);
  box-shadow: var(--shadow-soft);
`

export const DetailEventVideo = styled.video`
  width: 100%;
  max-height: 620px;
  border-radius: 8px;
  background: #0f0d0c;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const DetailHeroContent = styled.div`
  min-width: 0;
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
  max-width: 100%;
  min-height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
`

export const DetailTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3.2rem);

  @media (max-width: 560px) {
    font-size: clamp(1.7rem, 9vw, 2.4rem);
  }
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
  min-width: 0;
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
  min-width: 0;
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
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.9fr);
  gap: 28px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

export const DetailBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 24px;
`

export const DetailPanel = styled.section`
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: rgba(34, 31, 29, 0.9);
  box-shadow: var(--shadow-soft);

  @media (max-width: 560px) {
    padding: 18px;
  }
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
  min-width: 0;
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
  max-width: 100%;
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
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  &:disabled {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 243, 229, 0.58);
    cursor: not-allowed;
    box-shadow: none;
  }
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

  @media (max-width: 420px) {
    align-items: flex-start;
  }
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

export const DetailReportButton = styled.button`
  max-width: 100%;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(248, 143, 82, 0.38);
  background: rgba(248, 143, 82, 0.14);
  color: #fff1e7;
  font-family: var(--font-heading);
  font-size: 0.94rem;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
`

export const FollowButton = styled.button<{ $active: boolean }>`
  max-width: 100%;
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
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  &:disabled {
    opacity: 0.64;
    cursor: wait;
  }
`

export const AuthPromptButton = styled.button`
  max-width: 100%;
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
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
`

export const FollowIcon = styled.svg`
  width: 16px;
  height: 16px;
  color: var(--color-secondary);
`

export const DetailReportCard = styled.div`
  min-width: 0;
  display: grid;
  gap: 14px;
  margin-top: 6px;
  padding: 18px;
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    rgba(248, 143, 82, 0.08) 0%,
    rgba(34, 31, 29, 0.96) 100%
  );
  border: 1px solid rgba(248, 143, 82, 0.16);
`

export const DetailField = styled.label`
  display: grid;
  gap: 8px;
`

export const DetailFieldLabel = styled.span`
  color: var(--color-text-soft);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const DetailReportSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.96rem;
  appearance: none;
  color-scheme: dark;
`

export const DetailReportTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  min-height: 132px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.96rem;
  line-height: 1.6;
  resize: vertical;
`

export const DetailReasonGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const DetailReasonButton = styled.button<{ $active: boolean }>`
  max-width: 100%;
  min-height: 50px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(248, 143, 82, 0.54)' : 'rgba(255, 255, 255, 0.08)'};
  background:
    ${({ $active }) =>
      $active
        ? 'linear-gradient(180deg, rgba(248, 143, 82, 0.2) 0%, rgba(96, 49, 31, 0.54) 100%)'
        : 'rgba(255, 255, 255, 0.03)'};
  color: ${({ $active }) => ($active ? '#fff4eb' : 'rgba(255, 241, 231, 0.82)')};
  font-size: 0.92rem;
  font-weight: 700;
  text-align: left;
  line-height: 1.25;
  white-space: normal;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(248, 143, 82, 0.34);
  }
`

export const DetailInlineMessage = styled.div<{ $tone?: 'success' | 'danger' }>`
  padding: 12px 14px;
  border-radius: 12px;
  background:
    ${({ $tone }) =>
      'danger' === $tone
        ? 'rgba(138, 55, 55, 0.24)'
        : 'rgba(86, 154, 91, 0.14)'};
  border: 1px solid
    ${({ $tone }) =>
      'danger' === $tone
        ? 'rgba(201, 92, 92, 0.34)'
        : 'rgba(109, 184, 116, 0.28)'};
  color: ${({ $tone }) => ('danger' === $tone ? '#ffd6d1' : '#dbf3dc')};
  font-size: 0.94rem;
  line-height: 1.6;
`

export const DetailActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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
  min-width: 0;
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
