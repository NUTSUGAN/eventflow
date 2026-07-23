import styled from 'styled-components'

export const OrganizerEventDetailSection = styled.main`
  width: min(1240px, calc(100% - 40px));
  min-width: 0;
  margin: 72px auto 96px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    margin: 34px auto 64px;
  }
`

export const OrganizerEventDetailShell = styled.section`
  min-width: 0;
  display: grid;
  gap: 24px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(35, 29, 25, 0.98), rgba(22, 19, 17, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);

  @media (max-width: 560px) {
    gap: 18px;
    padding: 18px;
    border-radius: 16px;
  }
`

export const OrganizerEventDetailBackButton = styled.button`
  max-width: 100%;
  justify-self: start;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
`

export const OrganizerEventDetailHero = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
  gap: 22px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailCover = styled.div<{ $imageUrl?: string }>`
  min-height: 320px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.34)),
    ${({ $imageUrl }) =>
      $imageUrl
        ? `url("${$imageUrl}") center/cover no-repeat`
        : 'linear-gradient(135deg, rgba(235, 148, 81, 0.26), rgba(110, 78, 58, 0.12))'};

  @media (max-width: 560px) {
    min-height: 220px;
    border-radius: 16px;
  }
`

export const OrganizerEventDetailHeroContent = styled.div`
  min-width: 0;
  display: grid;
  gap: 16px;
  align-content: start;
`

export const OrganizerEventDetailEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerEventDetailTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);

  @media (max-width: 560px) {
    font-size: clamp(1.55rem, 8vw, 2.1rem);
  }
`

export const OrganizerEventDetailText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const OrganizerEventDetailStatusBadge = styled.span<{ $published: boolean }>`
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  width: fit-content;
  background: ${({ $published }) =>
    $published ? 'rgba(89, 181, 114, 0.14)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid
    ${({ $published }) =>
      $published ? 'rgba(89, 181, 114, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${({ $published }) => ($published ? '#d9ffe3' : '#fff3e5')};
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
`

export const OrganizerEventDetailTabs = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 560px) {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
`

export const OrganizerEventDetailTabButton = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 13px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(235, 148, 81, 0.42)' : 'rgba(255, 255, 255, 0.08)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, rgba(235, 148, 81, 0.28), rgba(121, 65, 39, 0.34))'
      : 'rgba(255, 255, 255, 0.035)'};
  color: ${({ $active }) => ($active ? '#fff7ef' : 'rgba(255, 243, 229, 0.82)')};
  font-size: 0.94rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
`

export const OrganizerEventDetailOverviewGrid = styled.div`
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

export const OrganizerEventDetailOverviewStat = styled.article`
  min-width: 0;
  display: grid;
  gap: 8px;
  min-height: 124px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventDetailOverviewStatLabel = styled.span`
  color: rgba(255, 237, 222, 0.68);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`

export const OrganizerEventDetailOverviewStatValue = styled.span`
  color: #fffaf4;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 900;
`

export const OrganizerEventDetailOverviewStatHint = styled.span`
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.85rem;
  line-height: 1.45;
`

export const OrganizerEventDetailInfoPanel = styled.div`
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventDetailInfoTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.04rem;
`

export const OrganizerEventDetailInfoText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const OrganizerEventDetailScanSummaryGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailScanStat = styled.div`
  min-width: 0;
  display: grid;
  gap: 6px;
  min-height: 92px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventDetailScanStatLabel = styled.span`
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const OrganizerEventDetailScanStatValue = styled.span`
  color: #fff8f2;
  font-size: 1.42rem;
  font-weight: 800;
`

export const OrganizerEventDetailScanStaffList = styled.div`
  display: grid;
  gap: 12px;
`

export const OrganizerEventDetailScanStaffCard = styled.article`
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventDetailScanStaffHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const OrganizerEventDetailScanStaffName = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 1rem;
`

export const OrganizerEventDetailScanStaffMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.9rem;
`

export const OrganizerEventDetailScanStaffTotal = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(235, 148, 81, 0.14);
  border: 1px solid rgba(235, 148, 81, 0.22);
  color: #ffe2cb;
  font-size: 0.84rem;
  font-weight: 800;
`

export const OrganizerEventDetailMediaGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailMediaCard = styled.div`
  min-width: 0;
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventDetailMediaLabel = styled.span`
  color: #fff8f2;
  font-size: 0.92rem;
  font-weight: 600;
`

export const OrganizerEventDetailMediaPreview = styled.div<{ $imageUrl?: string }>`
  min-height: 180px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.34)),
    ${({ $imageUrl }) =>
      $imageUrl
        ? `url("${$imageUrl}") center/cover no-repeat`
        : 'linear-gradient(135deg, rgba(235, 148, 81, 0.26), rgba(110, 78, 58, 0.12))'};
`

export const OrganizerEventDetailVideoPreview = styled.video`
  width: 100%;
  min-height: 180px;
  max-height: 280px;
  border-radius: 18px;
  background: #120f0d;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventDetailState = styled.div`
  min-width: 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`

export const OrganizerEventDetailError = styled(OrganizerEventDetailState)`
  background: rgba(149, 53, 40, 0.2);
  border-color: rgba(255, 135, 114, 0.25);
  color: #ffd5ca;
`

export const OrganizerEventDetailSuccess = styled(OrganizerEventDetailState)`
  background: rgba(56, 119, 71, 0.18);
  border-color: rgba(135, 255, 173, 0.2);
  color: #dfffe7;
`

export const OrganizerEventDetailForm = styled.form`
  min-width: 0;
  display: grid;
  gap: 18px;
`

export const OrganizerEventDetailGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailField = styled.label`
  min-width: 0;
  display: grid;
  gap: 10px;
`

export const OrganizerEventDetailLabel = styled.span`
  color: #fff8f2;
  font-size: 0.92rem;
  font-weight: 600;
`

const fieldStyles = `
  width: 100%;
  min-width: 0;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fffaf4;
  font-size: 0.96rem;
  outline: none;

  &:focus {
    border-color: rgba(255, 157, 90, 0.7);
    box-shadow: 0 0 0 3px rgba(255, 157, 90, 0.14);
  }
`

export const OrganizerEventDetailInput = styled.input`
  ${fieldStyles}
`

export const OrganizerEventDetailSelect = styled.select`
  ${fieldStyles}

  option {
    color: #1a1512;
    background: #fff8f2;
  }
`

export const OrganizerEventDetailTextarea = styled.textarea`
  ${fieldStyles}
  min-height: 144px;
  padding: 14px 16px;
  resize: vertical;
`

export const OrganizerEventDetailHint = styled.span`
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.85rem;
  line-height: 1.5;
`

export const OrganizerEventDetailActions = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const OrganizerEventDetailSplitSection = styled.section`
  min-width: 0;
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 560px) {
    padding: 16px;
    border-radius: 16px;
  }
`

export const OrganizerEventDetailSplitHeader = styled.div`
  display: grid;
  gap: 10px;
`

export const OrganizerEventDetailSplitEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerEventDetailSplitTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.35rem;
`

export const OrganizerEventDetailSplitText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.65;
`

export const OrganizerEventDetailDivider = styled.div`
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0)
  );
`

export const OrganizerEventDetailTicketSection = styled.section`
  display: grid;
  gap: 18px;
`

export const OrganizerEventDetailTicketHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`

export const OrganizerEventDetailTicketTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.2rem;
`

export const OrganizerEventDetailTicketText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const OrganizerEventDetailTicketGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailTicketCreateCard = styled.div`
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  align-content: start;
  min-width: 0;
`

export const OrganizerEventDetailTicketList = styled.div`
  min-width: 0;
  display: grid;
  gap: 16px;
`

export const OrganizerEventDetailTicketCard = styled.article`
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 0;
`

export const OrganizerEventDetailTicketCardHeader = styled.div`
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`

export const OrganizerEventDetailTicketBadge = styled.span<{ $active: boolean }>`
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${({ $active }) =>
    $active ? 'rgba(89, 181, 114, 0.14)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(89, 181, 114, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${({ $active }) => ($active ? '#d9ffe3' : '#fff3e5')};
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
`

export const OrganizerEventDetailTicketCardTitle = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 1rem;
`

export const OrganizerEventDetailTicketCardText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const OrganizerEventDetailTicketStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailTicketStat = styled.div`
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-width: 0;
`

export const OrganizerEventDetailTicketStatLabel = styled.span`
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const OrganizerEventDetailTicketStatValue = styled.span`
  color: #fff8f2;
  font-size: 0.98rem;
  font-weight: 700;
  overflow-wrap: anywhere;
`

export const OrganizerEventDetailGuestSection = styled.section`
  display: grid;
  gap: 18px;
  padding-top: 4px;
`

export const OrganizerEventDetailGuestGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 18px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailGuestList = styled.div`
  min-width: 0;
  display: grid;
  gap: 12px;
`

export const OrganizerEventDetailGuestCard = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 0;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventDetailGuestMeta = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`

export const OrganizerEventDetailGuestName = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 1rem;
  overflow-wrap: anywhere;
`

export const OrganizerEventDetailGuestText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.72);
  line-height: 1.55;
  overflow-wrap: anywhere;
`

export const OrganizerEventDetailGuestBadge = styled.span<{ $checkedIn: boolean }>`
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${({ $checkedIn }) =>
    $checkedIn ? 'rgba(89, 181, 114, 0.16)' : 'rgba(235, 148, 81, 0.14)'};
  border: 1px solid
    ${({ $checkedIn }) =>
      $checkedIn ? 'rgba(89, 181, 114, 0.26)' : 'rgba(235, 148, 81, 0.24)'};
  color: ${({ $checkedIn }) => ($checkedIn ? '#d9ffe3' : '#ffe2cb')};
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
`

export const OrganizerEventDetailLinkButton = styled.button`
  max-width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(235, 148, 81, 0.26);
  background: rgba(235, 148, 81, 0.1);
  color: #ffe2cb;
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
`

export const OrganizerEventDetailTicketCardActions = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

export const OrganizerEventDetailPrimaryButton = styled.button`
  max-width: 100%;
  min-height: 50px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.72;
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`

export const OrganizerEventDetailSecondaryButton = styled.button`
  max-width: 100%;
  min-height: 50px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  @media (max-width: 560px) {
    width: 100%;
  }
`

export const OrganizerEventDetailDangerButton = styled.button`
  max-width: 100%;
  min-height: 50px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 135, 114, 0.26);
  background: rgba(149, 53, 40, 0.16);
  color: #ffd5ca;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  @media (max-width: 560px) {
    width: 100%;
  }
`
