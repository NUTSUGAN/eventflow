import styled from 'styled-components'

export const OrganizerDashboardSection = styled.main`
  width: min(1240px, calc(100% - 40px));
  margin: 56px auto 96px;
  display: grid;
  gap: 22px;
`

export const OrganizerDashboardHeader = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
`

export const OrganizerDashboardHeaderText = styled.div`
  display: grid;
  gap: 8px;
  max-width: 760px;
`

export const OrganizerDashboardEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`

export const OrganizerDashboardTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(1.9rem, 3vw, 2.7rem);
`

export const OrganizerDashboardText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.65;
`

export const OrganizerDashboardActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

export const OrganizerDashboardPrimaryButton = styled.button`
  min-height: 46px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
  font-size: 0.94rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.68;
  }
`

export const OrganizerDashboardSecondaryButton = styled.button`
  min-height: 46px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.94rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.68;
  }
`

export const OrganizerDashboardHeaderActions = styled(OrganizerDashboardActions)`
  @media (max-width: 720px) {
    display: none;
  }
`

export const OrganizerDashboardMobileActions = styled.div`
  display: none;

  @media (max-width: 720px) {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 52px;
    gap: 8px;
    width: min(100%, 420px);
  }

  ${OrganizerDashboardPrimaryButton} {
    width: 100%;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const OrganizerDashboardMobileActionMenu = styled.details`
  position: relative;
  z-index: 20;
`

export const OrganizerDashboardMobileActionSummary = styled.summary`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 12px;
  border: 1px solid rgba(235, 148, 81, 0.34);
  background: rgba(235, 148, 81, 0.1);
  color: #fff4ea;
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(235, 148, 81, 0.72);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.14);
  }

  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.18s ease;
  }

  details[open] & svg {
    transform: rotate(180deg);
  }
`

export const OrganizerDashboardMobileActionList = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  gap: 8px;
  width: min(270px, calc(100vw - 40px));
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(28, 23, 20, 0.98);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);

  ${OrganizerDashboardSecondaryButton} {
    width: 100%;
    text-align: left;
  }
`

export const OrganizerDashboardGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerDashboardMetric = styled.article`
  display: grid;
  gap: 6px;
  min-height: 116px;
  padding: 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerDashboardMetricLabel = styled.span`
  color: rgba(255, 237, 222, 0.62);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`

export const OrganizerDashboardMetricValue = styled.span`
  color: #fff8f2;
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 1.1;
`

export const OrganizerDashboardMetricHint = styled.span`
  color: rgba(255, 237, 222, 0.62);
  font-size: 0.88rem;
  line-height: 1.45;
`

export const OrganizerDashboardPanel = styled.section`
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(27, 23, 20, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerDashboardPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
`

export const OrganizerDashboardPanelTitle = styled.h2`
  margin: 0 0 6px;
  color: #fff8f2;
  font-size: 1.15rem;
`

export const OrganizerDashboardList = styled.div`
  display: grid;
  gap: 10px;
`

export const OrganizerDashboardRow = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerDashboardRowMain = styled.div`
  display: grid;
  gap: 5px;
`

export const OrganizerDashboardRowTitle = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 0.98rem;
`

export const OrganizerDashboardRowText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.68);
  line-height: 1.45;
`

export const OrganizerDashboardRowStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

export const OrganizerDashboardMiniMetric = styled.div`
  display: grid;
  gap: 3px;
  min-height: 58px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
`

export const OrganizerDashboardMiniMetricLabel = styled.span`
  color: rgba(255, 237, 222, 0.58);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
`

export const OrganizerDashboardMiniMetricValue = styled.span`
  color: #fff8f2;
  font-size: 0.96rem;
  font-weight: 900;
  line-height: 1.2;
`

export const OrganizerDashboardRowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 980px) {
    justify-content: flex-start;
  }
`

export const OrganizerDashboardBadge = styled.span<{ $tone?: 'success' | 'warning' | 'danger' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  width: fit-content;
  padding: 0 10px;
  border-radius: 999px;
  background:
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(84, 174, 106, 0.16)'
        : $tone === 'danger'
          ? 'rgba(197, 86, 72, 0.16)'
          : $tone === 'warning'
            ? 'rgba(226, 139, 82, 0.16)'
            : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff4ea;
  font-size: 0.82rem;
  font-weight: 800;
`

export const OrganizerDashboardEventSelect = styled.select`
  min-height: 46px;
  padding: 0 13px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fffaf4;
  font-size: 0.94rem;
  font-weight: 800;
  outline: none;
  color-scheme: dark;

  &:focus {
    border-color: rgba(235, 148, 81, 0.68);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.12);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.68;
  }

  option {
    background: #2b211b;
    color: #fffaf4;
  }
`

export const OrganizerDashboardMessage = styled.div<{ $tone: 'neutral' | 'success' | 'danger' }>`
  padding: 13px 15px;
  border-radius: 12px;
  background:
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(56, 119, 71, 0.18)'
        : $tone === 'danger'
          ? 'rgba(149, 53, 40, 0.2)'
          : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(135, 255, 173, 0.2)'
        : $tone === 'danger'
          ? 'rgba(255, 135, 114, 0.25)'
          : 'rgba(255, 255, 255, 0.08)'};
  color:
    ${({ $tone }) =>
      $tone === 'success'
        ? '#dfffe7'
        : $tone === 'danger'
          ? '#ffd5ca'
          : 'rgba(255, 239, 229, 0.84)'};

  button {
    margin-left: 8px;
    border: 0;
    border-radius: 999px;
    padding: 7px 12px;
    background: rgba(235, 148, 81, 0.18);
    color: #fff4ea;
    font-weight: 900;
    cursor: pointer;
  }
`
