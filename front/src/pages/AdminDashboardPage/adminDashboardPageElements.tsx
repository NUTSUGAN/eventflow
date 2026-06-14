import styled from 'styled-components'

export const AdminDashboardSection = styled.main`
  width: min(1240px, calc(100% - 40px));
  margin: 56px auto 96px;
  display: grid;
  gap: 22px;
`

export const AdminDashboardHeader = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
`

export const AdminDashboardHeaderText = styled.div`
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
`

export const AdminDashboardText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.65;
`

export const AdminDashboardActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

export const AdminDashboardPrimaryButton = styled.button`
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

export const AdminDashboardSecondaryButton = styled.button`
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

export const AdminDashboardTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

export const AdminDashboardTab = styled.button<{ $active: boolean }>`
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
  cursor: pointer;
`

export const AdminDashboardGrid = styled.section`
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
`

export const AdminDashboardMetricValue = styled.span`
  color: #fff8f2;
  font-size: 1.8rem;
  font-weight: 900;
`

export const AdminDashboardPanel = styled.section`
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(27, 23, 20, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const AdminDashboardPanelHeader = styled.div`
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
`

export const AdminDashboardList = styled.div`
  display: grid;
  gap: 10px;
`

export const AdminDashboardGroup = styled.section`
  display: grid;
  gap: 10px;
`

export const AdminDashboardGroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  padding: 10px 2px 2px;
  flex-wrap: wrap;
`

export const AdminDashboardRow = styled.article`
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
`

export const AdminDashboardRowMain = styled.div`
  display: grid;
  gap: 4px;
`

export const AdminDashboardRowTitle = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 0.98rem;
`

export const AdminDashboardRowText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.68);
  line-height: 1.45;
`

export const AdminDashboardBadge = styled.span<{ $tone?: 'success' | 'warning' | 'danger' | 'neutral' }>`
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

export const AdminDashboardForm = styled.form`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: end;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

export const AdminDashboardField = styled.label`
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

export const AdminDashboardPickerSelection = styled.div`
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
  display: grid;
  gap: 8px;
`

export const AdminDashboardPickerButton = styled.button<{ $active?: boolean }>`
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
`

export const AdminDashboardPickerMain = styled.div`
  display: grid;
  gap: 4px;
`

export const AdminDashboardPickerTitle = styled.span`
  color: #fff8f2;
  font-size: 0.95rem;
  font-weight: 800;
`

export const AdminDashboardPickerMeta = styled.span`
  color: rgba(255, 237, 222, 0.7);
  font-size: 0.88rem;
  line-height: 1.45;
`

export const AdminDashboardMessage = styled.div<{ $tone: 'neutral' | 'success' | 'danger' }>`
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
`

export const AdminDashboardPaginationSummary = styled.span`
  color: rgba(255, 237, 222, 0.72);
  font-size: 0.88rem;
  font-weight: 800;
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
