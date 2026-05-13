import styled from 'styled-components'

export const OrderPreparationSection = styled.main`
  width: min(980px, calc(100% - 40px));
  margin: 72px auto 96px;
`

export const OrderPreparationHero = styled.section`
  display: grid;
  gap: 22px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
`

export const OrderPreparationEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrderPreparationTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
`

export const OrderPreparationText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const OrderPreparationState = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`

export const OrderPreparationError = styled(OrderPreparationState)`
  background: rgba(149, 53, 40, 0.2);
  border-color: rgba(255, 135, 114, 0.25);
  color: #ffd5ca;
`

export const OrderPreparationSuccess = styled(OrderPreparationState)`
  background: rgba(56, 119, 71, 0.18);
  border-color: rgba(135, 255, 173, 0.2);
  color: #dfffe7;
`

export const OrderPreparationGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);
  gap: 18px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`

export const OrderPreparationCard = styled.section`
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrderPreparationCardTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.08rem;
`

export const OrderPreparationList = styled.dl`
  margin: 0;
  display: grid;
  gap: 12px;
`

export const OrderPreparationListRow = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
`

export const OrderPreparationLabel = styled.dt`
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.9rem;
`

export const OrderPreparationValue = styled.dd`
  margin: 0;
  color: #fffaf4;
  font-weight: 600;
  text-align: right;
`

export const OrderPreparationField = styled.label`
  display: grid;
  gap: 10px;
`

export const OrderPreparationFieldLabel = styled.span`
  color: #fff8f2;
  font-size: 0.92rem;
  font-weight: 600;
`

export const OrderPreparationInput = styled.input`
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

export const OrderPreparationHint = styled.span`
  color: rgba(255, 237, 222, 0.66);
  font-size: 0.85rem;
  line-height: 1.5;
`

export const OrderPreparationActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const OrderPreparationPrimaryButton = styled.button`
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

export const OrderPreparationSecondaryButton = styled.button`
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
