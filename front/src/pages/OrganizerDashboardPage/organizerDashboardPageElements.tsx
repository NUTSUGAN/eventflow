import styled from 'styled-components'

export const OrganizerDashboardSection = styled.main`
  width: min(1080px, calc(100% - 40px));
  margin: 72px auto 96px;
`

export const OrganizerDashboardHero = styled.section`
  display: grid;
  gap: 18px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
`

export const OrganizerDashboardEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerDashboardTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
`

export const OrganizerDashboardText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const OrganizerDashboardGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerDashboardCard = styled.div`
  padding: 22px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerDashboardCardTitle = styled.h2`
  margin: 0 0 10px;
  color: #fff8f2;
  font-size: 1.05rem;
`

export const OrganizerDashboardCardText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.65;
`

export const OrganizerDashboardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const OrganizerDashboardPrimaryButton = styled.button`
  min-height: 50px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
`

export const OrganizerDashboardSecondaryButton = styled.button`
  min-height: 50px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
`

export const OrganizerDashboardState = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`

export const OrganizerDashboardEventTitle = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 1rem;
`

export const OrganizerDashboardEventMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const OrganizerDashboardEventBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff3e5;
  font-size: 0.85rem;
  font-weight: 600;
`

export const OrganizerDashboardEventHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

export const OrganizerDashboardEventStatusBlock = styled.div`
  display: grid;
  gap: 8px;
  min-width: 170px;
`

export const OrganizerDashboardEventStatusLabel = styled.span`
  color: rgba(255, 237, 222, 0.72);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const OrganizerDashboardEventSelect = styled.select`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.94rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  option {
    color: #1a1512;
  }
`

export const OrganizerDashboardEventsSection = styled.section`
  display: grid;
  gap: 16px;
  margin-top: 28px;
`

export const OrganizerDashboardSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`

export const OrganizerDashboardSectionTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.28rem;
`

export const OrganizerDashboardInlineState = styled.p`
  margin: 0;
  color: #ffcfb4;
  font-size: 0.88rem;
  line-height: 1.5;
`
