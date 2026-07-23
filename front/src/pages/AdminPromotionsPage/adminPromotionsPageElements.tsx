import styled from 'styled-components'

export const AdminPromotionPage = styled.main`
  width: min(1240px, calc(100% - 32px));
  min-width: 0;
  margin: 0 auto;
  padding: 48px 0 72px;
  scroll-margin-top: calc(var(--site-header-height) + 24px);

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    padding: 40px 0 64px;
  }
`
export const AdminPromotionHeader = styled.header`
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 22px;
`
export const AdminPromotionTitle = styled.h1`
  margin: 0 0 6px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(1.55rem, 8vw, 2rem);
  overflow-wrap: anywhere;
`
export const AdminPromotionText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.55;
  overflow-wrap: anywhere;
`
export const AdminPromotionFilters = styled.div`
  min-width: 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
`
export const AdminPromotionFilter = styled.button<{ $active: boolean }>`
  max-width: 100%;
  min-height: 38px;
  padding: 0 13px;
  border-radius: 6px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--color-primary)' : 'rgba(255,255,255,.12)')};
  color: var(--color-text);
  background: ${({ $active }) => ($active ? 'rgba(238,137,78,.14)' : 'transparent')};
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
`
export const AdminPromotionLayout = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 330px);
  gap: 18px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`
export const AdminPromotionList = styled.div`
  min-width: 0;
  display: grid;
  gap: 12px;
`
export const AdminPromotionCard = styled.article`
  min-width: 0;
  padding: 18px;
  display: grid;
  gap: 14px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  background: rgba(255,255,255,.025);

  @media (max-width: 560px) {
    padding: 14px;
  }
`
export const AdminPromotionCardHeader = styled.header`
  min-width: 0;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`
export const AdminPromotionCardTitle = styled.h2`
  margin: 0 0 5px;
  color: var(--color-text);
  font-size: 1.08rem;
  overflow-wrap: anywhere;
`
export const AdminPromotionMeta = styled.p`
  margin: 2px 0;
  color: var(--color-text-muted);
  font-size: .88rem;
  overflow-wrap: anywhere;
`
export const AdminPromotionStats = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 8px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`
export const AdminPromotionStat = styled.div`
  min-width: 0;
  padding: 10px;
  border-radius: 6px;
  background: rgba(255,255,255,.035);
  color: var(--color-text);
  font-weight: 750;
  font-size: .86rem;
  overflow-wrap: anywhere;
`
export const AdminPromotionActions = styled.div`
  min-width: 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`
export const AdminPromotionButton = styled.button<{ $danger?: boolean }>`
  max-width: 100%;
  min-height: 38px;
  padding: 0 13px;
  border-radius: 6px;
  border: 1px solid ${({ $danger }) => ($danger ? 'rgba(210,80,70,.5)' : 'rgba(238,137,78,.45)')};
  color: var(--color-text);
  background: ${({ $danger }) => ($danger ? 'rgba(180,50,45,.12)' : 'rgba(238,137,78,.1)')};
  font-weight: 750;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }
`
export const AdminPromotionInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 6px;
  background: rgba(255,255,255,.035);
  color: var(--color-text);
`
export const AdminPromotionSide = styled.aside`
  min-width: 0;
  padding: 18px;
  display: grid;
  gap: 12px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  background: rgba(255,255,255,.025);

  @media (max-width: 560px) {
    padding: 14px;
  }
`
export const AdminPromotionRate = styled.label`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: .84rem;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`
export const AdminPromotionMessage = styled.p<{ $error?: boolean }>`
  min-width: 0;
  padding: 12px;
  border-radius: 6px;
  color: ${({ $error }) => ($error ? '#ffc2bd' : '#bceacb')};
  background: ${({ $error }) => ($error ? 'rgba(180,50,45,.14)' : 'rgba(48,133,79,.14)')};
  overflow-wrap: anywhere;
`
export const AdminPromotionDetail = styled.section`
  min-width: 0;
  display: grid;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,.1);
`
export const AdminPromotionChannelGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`
export const AdminPromotionChannel = styled.article`
  min-width: 0;
  padding: 15px;
  display: grid;
  align-content: start;
  gap: 12px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 7px;
  background: rgba(255,255,255,.025);
`
export const AdminPromotionField = styled.label`
  min-width: 0;
  display: grid;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: .84rem;
`
export const AdminPromotionTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  min-height: 98px;
  resize: vertical;
  padding: 10px 11px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 6px;
  background: rgba(255,255,255,.035);
  color: var(--color-text);
  font: inherit;
`
export const AdminPromotionSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 6px;
  background: #211d1b;
  color: var(--color-text);
`
export const AdminPromotionCheckbox = styled.label`
  min-width: 0;
  display: flex;
  gap: 9px;
  align-items: flex-start;
  color: var(--color-text);
  font-size: .86rem;
  line-height: 1.4;
  overflow-wrap: anywhere;

  input {
    margin-top: 3px;
  }
`
