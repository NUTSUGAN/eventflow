import styled from 'styled-components'

export const MyTicketsSection = styled.main`
  width: min(1180px, calc(100% - 48px));
  margin: 48px auto 96px;
  display: grid;
  gap: 24px;
`

export const MyTicketsHero = styled.section`
  display: grid;
  gap: 18px;
  padding: 24px 0 8px;
`

export const MyTicketsTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2.1rem, 5vw, 3.4rem);
  text-transform: uppercase;
`

export const MyTicketsSubtitle = styled.p`
  margin: 0;
  max-width: 720px;
  color: var(--color-text-muted);
  line-height: 1.7;
`

export const MyTicketsTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`

export const MyTicketsTabButton = styled.button<{ $active: boolean }>`
  min-height: 44px;
  padding: 0 4px;
  border: 0;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? 'rgba(214, 141, 51, 0.95)' : 'transparent')};
  background: transparent;
  color: ${({ $active }) => ($active ? '#fff7f2' : 'rgba(255, 255, 255, 0.66)')};
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
`

export const MyTicketsStateCard = styled.section`
  display: grid;
  gap: 18px;
  padding: 28px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const MyTicketsStateTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
`

export const MyTicketsStateText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
`

export const MyTicketsPrimaryButton = styled.button`
  min-height: 48px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: #ece7e2;
  color: #201713;
  font-weight: 800;
  cursor: pointer;
`

export const MyTicketsInfoCard = styled.section`
  display: grid;
  gap: 10px;
  padding: 22px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const MyTicketsInfoTitle = styled.h3`
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
`

export const MyTicketsInfoText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.7;
`

export const MyTicketsGrid = styled.div`
  display: grid;
  gap: 18px;
`

export const MyTicketsCard = styled.article`
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.22);

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`

export const MyTicketsCoverButton = styled.button<{ $imageUrl?: string }>`
  min-height: 180px;
  width: 100%;
  padding: 0;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(17, 16, 15, 0.12), rgba(17, 16, 15, 0.48)), url(${$imageUrl})`
        : `linear-gradient(160deg, rgba(226, 139, 82, 0.45), rgba(54, 39, 31, 0.98))`};
  background-size: cover;
  background-position: center;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(248, 143, 82, 0.35);
    box-shadow: 0 18px 32px rgba(0, 0, 0, 0.22);
  }
`

export const MyTicketsCardBody = styled.div`
  display: grid;
  gap: 16px;
`

export const MyTicketsMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

export const MyTicketsTag = styled.span`
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.82rem;
  font-weight: 700;
`

export const MyTicketsEventTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.35rem, 2vw, 1.8rem);
`

export const MyTicketsTitleButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  color: inherit;
  cursor: pointer;
`

export const MyTicketsCardText = styled.p`
  margin: 0;
  color: rgba(27, 24, 24, 0.58);;
  line-height: 1.7;
`

export const MyTicketsSummaryGrid = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const MyTicketsSummaryItem = styled.div`
  display: grid;
  gap: 4px;
`

export const MyTicketsSummaryLabel = styled.dt`
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.82rem;
  text-transform: uppercase;
`

export const MyTicketsSummaryValue = styled.dd`
  margin: 0;
  color: var(--color-text);
  font-weight: 700;
`

export const MyTicketsActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const MyTicketsSecondaryButton = styled.button`
  min-height: 48px;
  padding: 0 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`

export const MyTicketsDangerButton = styled.button`
  min-height: 48px;
  padding: 0 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 135, 114, 0.28);
  background: rgba(112, 37, 31, 0.22);
  color: #ffd5ca;
  font-weight: 700;
  cursor: pointer;
`

export const MyTicketsStatusMessage = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(86, 154, 91, 0.14);
  border: 1px solid rgba(109, 184, 116, 0.28);
  color: #dbf3dc;
`

export const MyTicketsPendingList = styled.div`
  display: grid;
  gap: 16px;
`

export const MyTicketsPendingCard = styled.article`
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(45, 34, 28, 0.94), rgba(29, 25, 22, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.2);
`

export const MyTicketsPendingHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: 680px) {
    display: grid;
  }
`

export const MyTicketsPendingTitleGroup = styled.div`
  display: grid;
  gap: 6px;
`

export const MyTicketsPendingTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.25rem, 2vw, 1.65rem);
`

export const MyTicketsPendingText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.72);
  line-height: 1.65;
`

export const MyTicketsPendingItems = styled.ul`
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  list-style: none;
`

export const MyTicketsPendingItem = styled.li`
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 247, 242, 0.88);
  font-weight: 700;
`

export const TicketDetailShell = styled.main`
  width: min(1080px, calc(100% - 48px));
  margin: 48px auto 96px;
  display: grid;
  gap: 24px;
`

export const TicketDetailHeader = styled.section`
  display: grid;
  gap: 22px;
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const TicketDetailHero = styled.div<{ $imageUrl?: string }>`
  min-height: 220px;
  border-radius: 18px;
  padding: 22px;
  display: flex;
  align-items: end;
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(14, 12, 11, 0.12), rgba(14, 12, 11, 0.72)), url(${$imageUrl})`
        : `linear-gradient(160deg, rgba(226, 139, 82, 0.52), rgba(45, 33, 27, 0.98))`};
  background-size: cover;
  background-position: center;
`

export const TicketDetailHeroText = styled.div`
  display: grid;
  gap: 8px;
`

export const TicketDetailEyebrow = styled.span`
  color: #ffab73;
  font-size: 0.84rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const TicketDetailTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 4vw, 3rem);
`

export const TicketDetailSubtitle = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const TicketDetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

export const TicketDetailCard = styled.section`
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const TicketDetailCardTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.06rem;
`

export const TicketDetailCodePanel = styled.div`
  min-height: 320px;
  padding: 22px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(237, 232, 226, 0.96));
  color: #1c140f;
  display: grid;
  align-content: center;
  gap: 18px;
  box-shadow: inset 0 0 0 1px rgba(32, 23, 17, 0.08);
`

export const TicketDetailQrWrap = styled.div`
  position: relative;
  width: min(100%, 240px);
  margin: 0 auto;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(32, 23, 17, 0.08);
  line-height: 0;
`

export const TicketDetailQrLogo = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28px;
  height: 28px;
  padding: 6px;
  border-radius: 11px;
  background:
    #ffffff url('/eventflow-logo-mobile.png') center / 135% auto no-repeat;
  box-shadow:
    0 0 0 1px rgba(28, 20, 15, 0.1),
    0 8px 18px rgba(28, 20, 15, 0.14);
  transform: translate(-50%, -50%);
  pointer-events: none;
`

export const TicketDetailCodeBadge = styled.span`
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(28, 20, 15, 0.08);
  color: #4f3728;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
`

export const TicketDetailCodeValue = styled.code`
  display: block;
  padding: 18px;
  border-radius: 16px;
  background: rgba(28, 20, 15, 0.06);
  color: #231913;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.7;
  word-break: break-all;
`

export const TicketDetailNote = styled.p`
  margin: 0;
  color: rgba(36, 24, 18, 0.74);
  line-height: 1.7;
`

export const TicketDetailState = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`
