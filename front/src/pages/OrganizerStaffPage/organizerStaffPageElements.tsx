import styled from 'styled-components'

export const OrganizerStaffSection = styled.main`
  width: min(1080px, calc(100% - 40px));
  margin: 72px auto 96px;
  display: grid;
  gap: 18px;
`

export const OrganizerStaffHero = styled.section`
  display: grid;
  gap: 18px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
`

export const OrganizerStaffEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerStaffTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
`

export const OrganizerStaffText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const OrganizerStaffGrid = styled.section`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerStaffPanel = styled.section`
  display: grid;
  gap: 16px;
  padding: 22px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerStaffPanelTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.08rem;
`

export const OrganizerStaffCounter = styled.div`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff3e5;
  font-size: 0.94rem;
  font-weight: 700;
`

export const OrganizerStaffInlineText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const OrganizerStaffForm = styled.form`
  display: grid;
  gap: 12px;
`

export const OrganizerStaffInput = styled.input`
  min-height: 54px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff9f3;
  font-size: 0.98rem;

  &::placeholder {
    color: rgba(255, 237, 222, 0.46);
  }
`

export const OrganizerStaffActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const OrganizerStaffPrimaryButton = styled.button`
  min-height: 50px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`

export const OrganizerStaffSecondaryButton = styled.button`
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

export const OrganizerStaffMessage = styled.div<{ $tone: 'neutral' | 'success' | 'danger' }>`
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(112, 231, 147, 0.24)'
        : $tone === 'danger'
          ? 'rgba(255, 122, 107, 0.24)'
          : 'rgba(255, 255, 255, 0.08)'};
  background:
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(28, 67, 44, 0.56)'
        : $tone === 'danger'
          ? 'rgba(89, 30, 24, 0.56)'
          : 'rgba(255, 255, 255, 0.04)'};
  color:
    ${({ $tone }) =>
      $tone === 'success'
        ? '#ddffe7'
        : $tone === 'danger'
          ? '#ffd6d1'
          : 'rgba(255, 237, 222, 0.82)'};
  line-height: 1.55;
`

export const OrganizerStaffList = styled.div`
  display: grid;
  gap: 12px;
`

export const OrganizerStaffMemberCard = styled.article`
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerStaffMemberHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const OrganizerStaffMemberName = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 1rem;
`

export const OrganizerStaffMemberMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.72);
  line-height: 1.5;
`

export const OrganizerStaffMemberStatus = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${({ $active }) =>
    $active ? 'rgba(73, 183, 106, 0.18)' : 'rgba(255, 184, 95, 0.16)'};
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(112, 231, 147, 0.24)' : 'rgba(255, 197, 112, 0.24)'};
  color: ${({ $active }) => ($active ? '#ddffe7' : '#ffe3bf')};
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
`
