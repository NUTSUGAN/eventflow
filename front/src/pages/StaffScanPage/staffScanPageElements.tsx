import styled from 'styled-components'

export const StaffScanSection = styled.main`
  width: min(1120px, calc(100% - 40px));
  min-width: 0;
  margin: 48px auto 96px;
  display: grid;
  gap: 18px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    margin: 34px auto 64px;
  }
`

export const StaffScanHero = styled.section`
  min-width: 0;
  display: grid;
  gap: 22px;
  padding: clamp(22px, 3vw, 34px);
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(36, 29, 25, 0.98), rgba(22, 20, 18, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.36);

  @media (max-width: 560px) {
    padding: 18px;
    border-radius: 16px;
  }
`

export const StaffScanEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
`

export const StaffScanTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1;

  @media (max-width: 560px) {
    font-size: clamp(1.55rem, 8vw, 2.1rem);
  }
`

export const StaffScanText = styled.p`
  margin: 0;
  max-width: 720px;
  color: rgba(255, 237, 222, 0.78);
  line-height: 1.7;
`

export const StaffScanGrid = styled.section`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

export const StaffScanPanel = styled.section`
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 22px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.025));
  border: 1px solid rgba(255, 255, 255, 0.09);

  @media (max-width: 560px) {
    padding: 16px;
    border-radius: 14px;
  }
`

export const StaffScanPanelTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.08rem;
`

export const StaffScanInlineText = styled.p`
  margin: 0;
  padding: 13px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const StaffScanField = styled.div`
  min-width: 0;
  display: grid;
  gap: 10px;
`

export const StaffScanLabel = styled.label`
  color: rgba(255, 237, 222, 0.72);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
`

export const StaffScanSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff8f2;
  font-size: 0.98rem;
  font-weight: 600;
  outline: none;

  option {
    color: #1d1713;
  }

  &:focus {
    border-color: rgba(235, 148, 81, 0.7);
    box-shadow: 0 0 0 4px rgba(235, 148, 81, 0.12);
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

export const StaffScanDiagnosticsCard = styled.div`
  min-width: 0;
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.032));
  border: 1px solid rgba(255, 255, 255, 0.085);
`

export const StaffScanDiagnosticsGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

export const StaffScanDiagnosticsItem = styled.div`
  display: grid;
  gap: 4px;
`

export const StaffScanDiagnosticsLabel = styled.span`
  color: rgba(255, 237, 222, 0.58);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
`

export const StaffScanDiagnosticsValue = styled.span<{ $tone?: 'active' | 'muted' }>`
  width: fit-content;
  padding: ${({ $tone }) => ($tone ? '5px 9px' : '0')};
  border-radius: 999px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'active'
        ? 'rgba(112, 231, 147, 0.2)'
        : $tone === 'muted'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'transparent'};
  background:
    ${({ $tone }) =>
      $tone === 'active'
        ? 'rgba(34, 80, 50, 0.45)'
        : $tone === 'muted'
          ? 'rgba(255, 255, 255, 0.04)'
          : 'transparent'};
  color:
    ${({ $tone }) =>
      $tone === 'active'
        ? '#c7f7d4'
        : $tone === 'muted'
          ? 'rgba(255, 237, 222, 0.58)'
          : '#fff8f2'};
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
`

export const StaffScanActions = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

export const StaffScanCameraViewport = styled.div<{ $visible: boolean }>`
  min-width: 0;
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

export const StaffScanPrimaryButton = styled.button<{ $active?: boolean; $wide?: boolean }>`
  max-width: 100%;
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  min-height: 50px;
  padding: 0 18px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(255, 188, 128, 0.52)' : 'rgba(255, 255, 255, 0.11)'};
  border-radius: 14px;
  background:
    ${({ $active }) =>
      $active
        ? 'linear-gradient(135deg, #eb9451, #c96c3d)'
        : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ $active }) => ($active ? '#fffaf4' : 'rgba(255, 237, 222, 0.72)')};
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
  box-shadow:
    ${({ $active }) =>
      $active ? '0 14px 30px rgba(201, 108, 61, 0.22)' : 'none'};
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease,
    opacity 140ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(235, 148, 81, 0.52);
    background:
      ${({ $active }) =>
        $active
          ? 'linear-gradient(135deg, #eb9451, #c96c3d)'
          : 'rgba(235, 148, 81, 0.08)'};
    box-shadow:
      ${({ $active }) =>
        $active ? '0 18px 36px rgba(201, 108, 61, 0.26)' : 'none'};
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 189, 128, 0.34);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`

export const StaffScanSecondaryButton = styled.button<{ $wide?: boolean }>`
  max-width: 100%;
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  min-height: 50px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background 140ms ease,
    opacity 140ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(235, 148, 81, 0.45);
    background: rgba(235, 148, 81, 0.08);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 189, 128, 0.24);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.58;
    cursor: wait;
  }
`

export const StaffScanMessage = styled.div<{ $tone: 'neutral' | 'success' | 'danger' }>`
  min-width: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: start;
  justify-self: start;
  width: 86px;
  min-height: 154px;
  padding: 18px 12px;
  border-radius: 999px;
  background:
    ${({ $tone }) =>
      $tone === 'success'
        ? 'linear-gradient(180deg, rgba(54, 91, 58, 0.74), rgba(35, 67, 42, 0.92))'
        : $tone === 'danger'
          ? 'linear-gradient(180deg, rgba(111, 50, 42, 0.78), rgba(76, 36, 31, 0.94))'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.038))'};
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
  box-shadow:
    ${({ $tone }) =>
      $tone === 'success'
        ? '0 0 0 1px rgba(112, 231, 147, 0.04), 0 18px 38px rgba(28, 67, 44, 0.28)'
        : $tone === 'danger'
          ? '0 0 0 1px rgba(255, 122, 107, 0.04), 0 18px 38px rgba(89, 30, 24, 0.28)'
          : 'none'};
  text-align: center;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.3;

  @media (max-width: 560px) {
    width: 100%;
    min-height: 64px;
    border-radius: 14px;
  }
`

export const StaffScanResultCard = styled.article`
  min-width: 0;
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.085);
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
  min-width: 0;
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
  letter-spacing: 0;
  text-transform: uppercase;
`

export const StaffScanResultValue = styled.span`
  color: #fff8f2;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
`
