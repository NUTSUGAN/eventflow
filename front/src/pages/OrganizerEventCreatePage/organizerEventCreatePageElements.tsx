import styled from 'styled-components'

export const OrganizerEventCreateSection = styled.main`
  width: min(1080px, calc(100% - 40px));
  margin: 72px auto 96px;
`

export const OrganizerEventCreateHero = styled.section`
  display: grid;
  gap: 22px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
`

export const OrganizerEventCreateEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerEventCreateTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
`

export const OrganizerEventCreateText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const OrganizerEventCreateState = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`

export const OrganizerEventCreateError = styled(OrganizerEventCreateState)`
  background: rgba(149, 53, 40, 0.2);
  border-color: rgba(255, 135, 114, 0.25);
  color: #ffd5ca;
`

export const OrganizerEventCreateSuccess = styled(OrganizerEventCreateState)`
  background: rgba(56, 119, 71, 0.18);
  border-color: rgba(135, 255, 173, 0.2);
  color: #dfffe7;
`

export const OrganizerEventCreateForm = styled.form`
  display: grid;
  gap: 18px;
`

export const OrganizerEventCreateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventCreateField = styled.label`
  display: grid;
  gap: 10px;
`

export const OrganizerEventCreateLabel = styled.span`
  color: #fff8f2;
  font-size: 0.92rem;
  font-weight: 600;
`

const fieldStyles = `
  width: 100%;
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

export const OrganizerEventCreateInput = styled.input`
  ${fieldStyles}
`

export const OrganizerEventCreateSelect = styled.select`
  ${fieldStyles}

  option {
    color: #201712;
    background: #fff8f2;
  }
`

export const OrganizerEventCreateTextarea = styled.textarea`
  ${fieldStyles}
  min-height: 144px;
  padding: 14px 16px;
  resize: vertical;
`

export const OrganizerEventCreateHint = styled.span`
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.85rem;
  line-height: 1.5;
`

export const OrganizerEventCreateActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const OrganizerEventCreatePrimaryButton = styled.button`
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
    cursor: wait;
    opacity: 0.72;
  }
`

export const OrganizerEventCreateSecondaryButton = styled.button`
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

export const OrganizerEventCreateSummary = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventCreateSummaryTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.05rem;
`

export const OrganizerEventCreateSummaryText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.65;
`
