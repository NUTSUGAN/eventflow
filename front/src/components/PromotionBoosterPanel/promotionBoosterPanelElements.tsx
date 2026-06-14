import styled from 'styled-components'

export const BoosterPanel = styled.section`
  display: grid;
  gap: 22px;
`

export const BoosterHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
`

export const BoosterTitle = styled.h2`
  margin: 0 0 6px;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1.55rem;
`

export const BoosterText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
`

export const BoosterDuration = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

export const BoosterDurationButton = styled.button<{ $active: boolean }>`
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--color-primary)' : 'rgba(255,255,255,.14)')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? 'rgba(238, 137, 78, .16)' : 'rgba(255,255,255,.03)')};
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`

export const BoosterChannels = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

export const BoosterChannel = styled.label<{ $disabled: boolean; $selected: boolean }>`
  min-height: 156px;
  padding: 18px;
  display: grid;
  align-content: start;
  gap: 10px;
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(238,137,78,.72)' : 'rgba(255,255,255,.1)')};
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? 'rgba(238,137,78,.08)' : 'rgba(255,255,255,.025)')};
  opacity: ${({ $disabled }) => ($disabled ? 0.48 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
`

export const BoosterChannelHead = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  font-weight: 800;
`

export const BoosterChannelCopy = styled.span`
  color: var(--color-text-muted);
  line-height: 1.5;
  font-size: .9rem;
`

export const BoosterPrice = styled.strong`
  margin-top: auto;
  color: var(--color-secondary);
  font-size: 1.1rem;
`

export const BoosterSummary = styled.footer`
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(255,255,255,.1);
`

export const BoosterTotal = styled.strong`
  color: var(--color-text);
  font-size: 1.35rem;
`

export const BoosterButton = styled.button`
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 6px;
  background: var(--color-primary);
  color: #1c130f;
  font-weight: 800;
  cursor: pointer;

  &:disabled { opacity: .5; cursor: not-allowed; }
`

export const BoosterMessage = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: 12px 14px;
  border-radius: 6px;
  color: ${({ $error }) => ($error ? '#ffc2bd' : '#bceacb')};
  background: ${({ $error }) => ($error ? 'rgba(180,50,45,.14)' : 'rgba(48,133,79,.14)')};
`
