import styled from 'styled-components'

export const StaffScanSection = styled.main`
  width: min(1120px, calc(100% - 40px));
  margin: 72px auto 96px;
  display: grid;
  gap: 18px;
`

export const StaffScanHero = styled.section`
  display: grid;
  gap: 18px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(40, 31, 25, 0.96), rgba(28, 24, 21, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
`

export const StaffScanEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const StaffScanTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
`

export const StaffScanText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const StaffScanGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

export const StaffScanPanel = styled.section`
  display: grid;
  gap: 16px;
  padding: 22px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const StaffScanPanelTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.08rem;
`

export const StaffScanInlineText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const StaffScanField = styled.div`
  display: grid;
  gap: 10px;
`

export const StaffScanLabel = styled.label`
  color: rgba(255, 237, 222, 0.72);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const StaffScanSelect = styled.select`
  min-height: 52px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff8f2;
  font-size: 0.98rem;
  font-weight: 600;

  option {
    color: #1d1713;
  }
`

export const StaffScanHiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
`

export const StaffScanActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

export const StaffScanCameraViewport = styled.div<{ $visible: boolean }>`
  min-height: ${({ $visible }) => ($visible ? '280px' : '0')};
  max-height: ${({ $visible }) => ($visible ? '280px' : '0')};
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid
    ${({ $visible }) =>
      $visible ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  background:
    ${({ $visible }) =>
      $visible
        ? 'radial-gradient(circle at top, rgba(235, 148, 81, 0.12), transparent 50%), rgba(9, 8, 7, 0.58)'
        : 'transparent'};
  opacity: ${({ $visible }) => ($visible ? '1' : '0')};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition:
    opacity 160ms ease,
    max-height 160ms ease,
    border-color 160ms ease;

  > div {
    width: 100%;
    min-height: 280px;
  }

  video,
  canvas {
    width: 100% !important;
    height: 280px !important;
    object-fit: cover;
    display: block;
  }
`

export const StaffScanPrimaryButton = styled.button`
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

export const StaffScanSecondaryButton = styled.button`
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

export const StaffScanMessage = styled.div<{ $tone: 'neutral' | 'success' | 'danger' }>`
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

export const StaffScanStatusPill = styled.div<{ $tone: 'success' | 'danger' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background:
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(73, 183, 106, 0.18)'
        : $tone === 'danger'
          ? 'rgba(255, 122, 107, 0.16)'
          : 'rgba(255, 255, 255, 0.06)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(112, 231, 147, 0.24)'
        : $tone === 'danger'
          ? 'rgba(255, 122, 107, 0.24)'
          : 'rgba(255, 255, 255, 0.08)'};
  color:
    ${({ $tone }) =>
      $tone === 'success'
        ? '#dfffe7'
        : $tone === 'danger'
          ? '#ffd6d1'
          : '#fff3e5'};
  font-size: 0.92rem;
  font-weight: 700;
`

export const StaffScanResultCard = styled.article`
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const StaffScanResultTitle = styled.h3`
  margin: 0;
  color: #fff8f2;
  font-size: 1.02rem;
`

export const StaffScanResultMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.76);
  line-height: 1.55;
`

export const StaffScanResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

export const StaffScanResultItem = styled.div`
  display: grid;
  gap: 4px;
`

export const StaffScanResultLabel = styled.span`
  color: rgba(255, 237, 222, 0.58);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const StaffScanResultValue = styled.span`
  color: #fff8f2;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.5;
`
