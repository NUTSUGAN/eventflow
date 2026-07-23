import styled from 'styled-components'

export const AdminDashboardSection = styled.main`
  width: min(1300px, calc(100% - 40px));
  min-width: 0;
  margin: 56px auto 96px;
  display: grid;
  gap: 22px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    margin: 34px auto 64px;
    gap: 16px;
  }
`

export const AdminDashboardHeader = styled.section`
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
`

export const AdminDashboardHeaderText = styled.div`
  min-width: 0;
  display: grid;
  gap: 8px;
  max-width: 760px;
`

export const AdminDashboardEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`

export const AdminDashboardTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(1.9rem, 3vw, 2.7rem);
  overflow-wrap: anywhere;

  @media (max-width: 560px) {
    font-size: clamp(1.55rem, 8vw, 2.1rem);
  }
`

export const AdminDashboardText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.65;
  overflow-wrap: anywhere;
`

export const AdminDashboardActions = styled.div`
  min-width: 0;
  max-width: 100%;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

export const AdminDashboardPrimaryButton = styled.button`
  max-width: 100%;
  min-height: 46px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
  font-size: 0.94rem;
  font-weight: 800;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.68;
  }
`

export const AdminDashboardSecondaryButton = styled.button`
  max-width: 100%;
  min-height: 46px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.94rem;
  font-weight: 800;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.68;
  }
`

export const AdminDashboardHeaderActions = styled(AdminDashboardActions)`
  width: 100%;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 4px;

  ${AdminDashboardPrimaryButton},
  ${AdminDashboardSecondaryButton} {
    flex: 0 0 auto;
  }

  @media (max-width: 720px) {
    display: none;
  }
`

export const AdminDashboardMobileActions = styled.div`
  display: none;

  @media (max-width: 720px) {
    min-width: 0;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 52px;
    gap: 8px;
    width: 100%;
    max-width: 420px;
  }

  ${AdminDashboardPrimaryButton} {
    width: 100%;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const AdminDashboardMobileActionMenu = styled.details`
  position: relative;
  z-index: 20;
`

export const AdminDashboardMobileActionSummary = styled.summary`
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

export const AdminDashboardMobileActionList = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  gap: 8px;
  width: min(270px, calc(100vw - 24px));
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(28, 23, 20, 0.98);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);

  ${AdminDashboardSecondaryButton} {
    width: 100%;
    text-align: left;
  }
`

export const AdminDashboardTabs = styled.div`
  min-width: 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 560px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }
`

export const AdminDashboardTab = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(235, 148, 81, 0.4)' : 'rgba(255, 255, 255, 0.08)')};
  background: ${({ $active }) =>
    $active ? 'rgba(235, 148, 81, 0.16)' : 'rgba(255, 255, 255, 0.035)'};
  color: ${({ $active }) => ($active ? '#ffe1c8' : 'rgba(255, 237, 222, 0.78)')};
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
`

export const AdminDashboardGrid = styled.section`
  min-width: 0;
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

export const AdminDashboardMetric = styled.article`
  min-width: 0;
  display: grid;
  gap: 6px;
  min-height: 104px;
  padding: 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const AdminDashboardMetricLabel = styled.span`
  color: rgba(255, 237, 222, 0.62);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  overflow-wrap: anywhere;
`

export const AdminDashboardMetricValue = styled.span`
  color: #fff8f2;
  font-size: 1.8rem;
  font-weight: 900;
  overflow-wrap: anywhere;
`

export const AdminDashboardPanel = styled.section`
  min-width: 0;
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(27, 23, 20, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 560px) {
    gap: 14px;
    padding: 16px;
    border-radius: 14px;
  }
`

export const AdminDashboardPanelHeader = styled.div`
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
`

export const AdminDashboardPanelTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.15rem;
  overflow-wrap: anywhere;
`

export const AdminDashboardList = styled.div`
  min-width: 0;
  display: grid;
  gap: 10px;
`

export const AdminDashboardGroup = styled.section`
  min-width: 0;
  display: grid;
  gap: 10px;
`

export const AdminDashboardGroupHeader = styled.div`
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  padding: 10px 2px 2px;
  flex-wrap: wrap;
`

export const AdminDashboardRow = styled.article`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(180px, 0.8fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 560px) {
    padding: 12px;
  }
`

export const AdminDashboardRowMain = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`

export const AdminDashboardRowTitle = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 0.98rem;
  overflow-wrap: anywhere;
`

export const AdminDashboardRowText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.68);
  line-height: 1.45;
  overflow-wrap: anywhere;
`

export const AdminDashboardBadge = styled.span<{ $tone?: 'success' | 'warning' | 'danger' | 'neutral' }>`
  max-width: 100%;
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
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-align: center;
  white-space: normal;
`

export const AdminDashboardForm = styled.form`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: end;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

export const AdminDashboardField = styled.label`
  min-width: 0;
  display: grid;
  gap: 8px;
`

export const AdminDashboardLabel = styled.span`
  color: rgba(255, 237, 222, 0.7);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`

const adminFieldStyles = `
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 0 13px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fffaf4;
  font-size: 0.94rem;
  outline: none;

  &:focus {
    border-color: rgba(235, 148, 81, 0.68);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.12);
  }
`

export const AdminDashboardInput = styled.input`
  ${adminFieldStyles}
`

export const AdminDashboardSelect = styled.select`
  ${adminFieldStyles}
  color-scheme: dark;

  option {
    background: #2b211b;
    color: #fffaf4;
  }
`

export const AdminDashboardFilterBar = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

export const AdminDashboardPickerSelection = styled.div`
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(235, 148, 81, 0.08);
  border: 1px solid rgba(235, 148, 81, 0.2);
  flex-wrap: wrap;
`

export const AdminDashboardPickerList = styled.div`
  min-width: 0;
  display: grid;
  gap: 8px;
`

export const AdminDashboardPickerButton = styled.button<{ $active?: boolean }>`
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(235, 148, 81, 0.38)' : 'rgba(255, 255, 255, 0.08)')};
  background:
    ${({ $active }) =>
      $active
        ? 'rgba(235, 148, 81, 0.12)'
        : 'rgba(255, 255, 255, 0.03)'};
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;

  &:hover {
    border-color: rgba(235, 148, 81, 0.32);
    background:
      ${({ $active }) =>
        $active
          ? 'rgba(235, 148, 81, 0.16)'
          : 'rgba(235, 148, 81, 0.08)'};
    transform: translateY(-1px);
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`

export const AdminDashboardPickerMain = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`

export const AdminDashboardPickerTitle = styled.span`
  color: #fff8f2;
  font-size: 0.95rem;
  font-weight: 800;
  overflow-wrap: anywhere;
`

export const AdminDashboardPickerMeta = styled.span`
  color: rgba(255, 237, 222, 0.7);
  font-size: 0.88rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
`

export const AdminDashboardMessage = styled.div<{ $tone: 'neutral' | 'success' | 'danger' }>`
  min-width: 0;
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
`

export const AdminDashboardPagination = styled.nav`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;

  @media (max-width: 560px) {
    justify-content: center;
  }
`

export const AdminDashboardPaginationSummary = styled.span`
  color: rgba(255, 237, 222, 0.72);
  font-size: 0.88rem;
  font-weight: 800;

  @media (max-width: 560px) {
    width: 100%;
    text-align: center;
  }
`

export const AdminDashboardPaginationButton = styled.button<{ $active?: boolean }>`
  min-width: 38px;
  min-height: 38px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(235, 148, 81, 0.48)' : 'rgba(255, 255, 255, 0.09)')};
  background: ${({ $active }) =>
    $active ? 'rgba(235, 148, 81, 0.18)' : 'rgba(255, 255, 255, 0.04)'};
  color: #fff4ea;
  font-size: 0.9rem;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }
`
