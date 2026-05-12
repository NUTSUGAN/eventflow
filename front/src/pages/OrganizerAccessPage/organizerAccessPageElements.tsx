import styled from 'styled-components'

export const OrganizerAccessSection = styled.main`
  width: min(1040px, calc(100% - 40px));
  margin: 72px auto 96px;

  @media (max-width: 720px) {
    width: min(100%, calc(100% - 24px));
    margin-top: 36px;
  }
`

export const OrganizerAccessCard = styled.section`
  display: grid;
  gap: 22px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
`

export const OrganizerAccessEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerAccessTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1.02;
  font-family: 'Montserrat', sans-serif;
`

export const OrganizerAccessText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
  font-size: 1rem;
`

export const OrganizerAccessState = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`

export const OrganizerAccessSuccessState = styled(OrganizerAccessState)`
  background: rgba(80, 129, 76, 0.16);
  border-color: rgba(116, 190, 108, 0.24);
  color: #e1f6de;
`

export const OrganizerAccessErrorState = styled(OrganizerAccessState)`
  background: rgba(159, 66, 66, 0.16);
  border-color: rgba(213, 92, 92, 0.24);
  color: #ffd9d9;
`

export const OrganizerAccessApplicationSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerAccessInfoCard = styled.div`
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerAccessInfoLabel = styled.p`
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.82rem;
  text-transform: uppercase;
`

export const OrganizerAccessInfoValue = styled.p`
  margin: 0;
  color: #fff8f2;
  font-size: 1rem;
  font-weight: 700;
`

export const OrganizerAccessForm = styled.form`
  display: grid;
  gap: 18px;
`

export const OrganizerAccessFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerAccessField = styled.label`
  display: grid;
  gap: 8px;
`

export const OrganizerAccessFieldLabel = styled.span`
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.84rem;
  text-transform: uppercase;
`

const fieldStyles = `
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #fff8f2;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;

  &:focus {
    border-color: rgba(235, 148, 81, 0.88);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.16);
  }
`

export const OrganizerAccessInput = styled.input`
  ${fieldStyles}
`

export const OrganizerAccessTextarea = styled.textarea`
  ${fieldStyles}
  min-height: 144px;
  padding: 14px 16px;
  resize: vertical;
`

export const OrganizerAccessHint = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.64);
  line-height: 1.65;
`

export const OrganizerAccessActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const OrganizerAccessPrimaryButton = styled.button`
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

export const OrganizerAccessSecondaryButton = styled.button`
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
