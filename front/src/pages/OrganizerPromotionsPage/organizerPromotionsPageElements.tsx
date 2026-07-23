import styled from 'styled-components'

export const PromotionPage = styled.main`
  width: min(1180px, calc(100% - 32px));
  min-width: 0;
  margin: 0 auto;
  padding: 42px 0 72px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    padding: 34px 0 64px;
  }
`
export const PromotionPageHeader = styled.header`
  min-width: 0; display: flex; justify-content: space-between; gap: 18px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 24px;
`
export const PromotionPageTitle = styled.h1`
  margin: 0 0 6px; color: var(--color-text); font-family: var(--font-heading); font-size: clamp(1.55rem, 8vw, 2rem); overflow-wrap: anywhere;
`
export const PromotionPageText = styled.p`
  margin: 0; color: var(--color-text-muted); line-height: 1.55; overflow-wrap: anywhere;
`
export const PromotionList = styled.div`
  min-width: 0; display: grid; gap: 12px;
`
export const PromotionCard = styled.article`
  min-width: 0; padding: 20px; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, .7fr) auto; gap: 20px; align-items: center;
  border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.025);
  @media (max-width: 820px) { grid-template-columns: 1fr; }
  @media (max-width: 560px) { padding: 14px; }
`
export const PromotionActions = styled.div`
  min-width: 0; display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;
  @media (max-width: 820px) { justify-content: flex-start; }
`
export const PromotionCardTitle = styled.h2`
  margin: 0 0 8px; color: var(--color-text); font-size: 1.12rem; overflow-wrap: anywhere;
`
export const PromotionMeta = styled.p`
  margin: 3px 0; color: var(--color-text-muted); font-size: .9rem; overflow-wrap: anywhere;
`
export const PromotionBrief = styled.p`
  margin: 3px 0; color: var(--color-text-muted); font-size: .9rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere;
  a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 3px; }
`
export const PromotionBadge = styled.span<{ $status: string }>`
  max-width: 100%; width: fit-content; padding: 6px 10px; border-radius: 999px; font-size: .78rem; font-weight: 800; line-height: 1.25; overflow-wrap: anywhere; white-space: normal;
  color: ${({ $status }) => $status === 'rejected' ? '#ffc2bd' : $status === 'active' ? '#bceacb' : '#ffe2bd'};
  background: ${({ $status }) => $status === 'rejected' ? 'rgba(180,50,45,.16)' : $status === 'active' ? 'rgba(48,133,79,.16)' : 'rgba(194,125,45,.16)'};
`
export const PromotionButton = styled.button`
  max-width: 100%; min-height: 40px; padding: 0 15px; border: 1px solid rgba(238,137,78,.45); border-radius: 6px;
  color: var(--color-text); background: rgba(238,137,78,.1); font-weight: 800; line-height: 1.2; white-space: normal; cursor: pointer;
  &:disabled { opacity: .5; cursor: not-allowed; }
  @media (max-width: 560px) { width: 100%; }
`
export const PromotionMessage = styled.p<{ $error?: boolean }>`
  min-width: 0; padding: 14px; border-radius: 6px; color: ${({ $error }) => $error ? '#ffc2bd' : '#bceacb'};
  background: ${({ $error }) => $error ? 'rgba(180,50,45,.14)' : 'rgba(48,133,79,.14)'};
`
export const PromotionDetail = styled.section`
  min-width: 0; grid-column: 1 / -1; display: grid; gap: 16px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.1);
`
export const PromotionDetailCard = styled.section`
  min-width: 0; margin-top: 18px; padding: 20px; display: grid; gap: 18px;
  border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.025);
  @media (max-width: 560px) { padding: 14px; }
`
export const PromotionSummary = styled.header`
  min-width: 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; flex-wrap: wrap;
`
export const PromotionDetailGrid = styled.div`
  min-width: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`
export const PromotionChannel = styled.article`
  min-width: 0; min-height: 160px; padding: 16px; display: grid; align-content: start; gap: 8px;
  border: 1px solid rgba(255,255,255,.1); border-radius: 7px; background: rgba(255,255,255,.025);
`
export const PromotionChannelHead = styled.header`
  min-width: 0; display: flex; justify-content: space-between; gap: 10px; align-items: center; color: var(--color-text); flex-wrap: wrap;
`
export const PromotionMetrics = styled.div`
  min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(145px, 100%), 1fr)); gap: 10px;
`
export const PromotionMetric = styled.div`
  min-width: 0; min-height: 74px; padding: 12px; display: grid; gap: 3px; border-radius: 6px; background: rgba(255,255,255,.035);
  strong { color: var(--color-text); font-size: 1.05rem; }
  span { color: var(--color-text-muted); font-size: .8rem; }
`
