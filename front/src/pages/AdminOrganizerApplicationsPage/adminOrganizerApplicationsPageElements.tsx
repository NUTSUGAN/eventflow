import styled from 'styled-components'

export const AdminOrganizerApplicationsSection = styled.main`
  width: min(1180px, calc(100% - 40px));
  min-width: 0;
  margin: 72px auto 96px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    margin: 34px auto 64px;
  }
`

export const AdminOrganizerApplicationsHeader = styled.section`
  display: grid;
  gap: 14px;
  margin-bottom: 24px;
`

export const AdminOrganizerApplicationsEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const AdminOrganizerApplicationsTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);

  @media (max-width: 560px) {
    font-size: clamp(1.55rem, 8vw, 2.1rem);
  }
`

export const AdminOrganizerApplicationsText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.76);
  line-height: 1.7;
`

export const AdminOrganizerApplicationsState = styled.div`
  min-width: 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`

export const AdminOrganizerApplicationsTabs = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 560px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }
`

export const AdminOrganizerApplicationsTab = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(235, 148, 81, 0.38)' : 'rgba(255, 255, 255, 0.08)')};
  background:
    ${({ $active }) =>
      $active ? 'rgba(235, 148, 81, 0.14)' : 'rgba(255, 255, 255, 0.03)'};
  color: #fff8f2;
  font-size: 0.92rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
`

export const AdminOrganizerApplicationsSearch = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff8f2;
  outline: none;

  &:focus {
    border-color: rgba(235, 148, 81, 0.88);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.16);
  }
`

export const AdminOrganizerApplicationsList = styled.section`
  min-width: 0;
  display: grid;
  gap: 18px;
`

export const AdminOrganizerApplicationsCard = styled.article`
  min-width: 0;
  display: grid;
  gap: 16px;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 560px) {
    padding: 16px;
    border-radius: 16px;
  }
`

export const AdminOrganizerApplicationsMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

export const AdminOrganizerApplicationsBadge = styled.span<{ $tone?: 'pending' | 'approved' | 'rejected' }>`
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background:
    ${({ $tone }) =>
      $tone === 'approved'
        ? 'rgba(78, 138, 83, 0.18)'
        : $tone === 'rejected'
          ? 'rgba(163, 69, 69, 0.18)'
          : 'rgba(226, 139, 82, 0.16)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'approved'
        ? 'rgba(101, 181, 108, 0.28)'
        : $tone === 'rejected'
          ? 'rgba(214, 93, 93, 0.28)'
          : 'rgba(226, 139, 82, 0.24)'};
  color: #fff8f2;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
`

export const AdminOrganizerApplicationsCardTitle = styled.h2`
  margin: 0;
  color: #fffaf4;
  font-size: 1.35rem;
`

export const AdminOrganizerApplicationsApplicant = styled.p`
  margin: 4px 0 0;
  color: rgba(255, 237, 222, 0.78);
`

export const AdminOrganizerApplicationsGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`

export const AdminOrganizerApplicationsInfoCard = styled.div`
  min-width: 0;
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const AdminOrganizerApplicationsLabel = styled.p`
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.82rem;
  text-transform: uppercase;
`

export const AdminOrganizerApplicationsValue = styled.p`
  margin: 0;
  color: #fff8f2;
  line-height: 1.6;
`

export const AdminOrganizerApplicationsTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  min-height: 124px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #fff8f2;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: rgba(235, 148, 81, 0.88);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.16);
  }
`

export const AdminOrganizerApplicationsActions = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const AdminOrganizerApplicationsPrimaryButton = styled.button`
  max-width: 100%;
  min-height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  @media (max-width: 560px) {
    width: 100%;
  }
`

export const AdminOrganizerApplicationsSecondaryButton = styled.button`
  max-width: 100%;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  @media (max-width: 560px) {
    width: 100%;
  }
`
