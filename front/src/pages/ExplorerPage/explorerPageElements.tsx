import styled, { css } from 'styled-components'

export const ExplorerSection = styled.main`
  width: min(1480px, calc(100% - 96px));
  margin: 0 auto;
  padding: 28px 0 64px;

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 28px));
    padding: 24px 0 48px;
  }
`

export const ExplorerHeader = styled.header`
  display: grid;
  gap: 12px;
  margin-bottom: 24px;
`

export const ExplorerEyebrow = styled.span`
  color: rgba(248, 143, 82, 0.86);
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const ExplorerTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2.1rem, 4vw, 3.25rem);
  line-height: 1.04;
`

export const ExplorerLead = styled.p`
  margin: 0;
  max-width: 720px;
  color: var(--color-text-muted);
  font-size: 1rem;
`

export const SearchBadge = styled.span`
  width: fit-content;
  min-height: 40px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(248, 143, 82, 0.12);
  border: 1px solid rgba(248, 143, 82, 0.3);
  color: #ffd8c4;
  font-size: 0.92rem;
  font-weight: 600;
`

export const FilterToolbar = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(34, 31, 29, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 22px 44px rgba(0, 0, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

export const FilterGroup = styled.label`
  display: grid;
  gap: 10px;
`

export const FilterLabel = styled.span`
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.84rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const filterFieldStyles = css`
  width: 100%;
  min-height: 50px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  color-scheme: dark;
  font-weight: 600;
  outline: 0;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    border-color: rgba(248, 143, 82, 0.42);
    box-shadow: 0 0 0 3px rgba(248, 143, 82, 0.12);
  }
`

export const FilterSelect = styled.select`
  ${filterFieldStyles}
  appearance: none;
  cursor: pointer;
  padding-right: 46px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23f4d6c5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px 16px;

  option {
    background: #241f1d;
    color: #f5ede7;
  }
`

export const FilterTextInput = styled.input`
  ${filterFieldStyles}
`

export const FilterDateInput = styled.input`
  ${filterFieldStyles}
  padding-right: 18px;

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.88) sepia(0.14) saturate(0.7) hue-rotate(330deg);
    opacity: 0.92;
  }
`

export const FilterMetaRow = styled.div`
  margin-bottom: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

export const FilterSummary = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.94rem;
`

export const FilterResetButton = styled.button`
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(248, 143, 82, 0.3);
  background: rgba(248, 143, 82, 0.08);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(248, 143, 82, 0.14);
  }
`

export const ExplorerCardsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 1040px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    gap: 22px;
    grid-template-columns: 1fr;
  }
`

export const PaginationRow = styled.div`
  margin-top: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

export const PaginationSummary = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.94rem;
`

export const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

export const PaginationButton = styled.button<{ $active?: boolean }>`
  min-width: 42px;
  height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(248, 143, 82, 0.52)' : 'rgba(255, 255, 255, 0.1)'};
  background:
    ${({ $active }) =>
      $active ? 'rgba(248, 143, 82, 0.18)' : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ $active }) => ($active ? '#fff1e7' : 'var(--color-text)')};
  font-size: 0.94rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(248, 143, 82, 0.34);
    background: rgba(248, 143, 82, 0.12);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.42;
  }
`

export const PaginationEllipsis = styled.span`
  min-width: 18px;
  text-align: center;
  color: var(--color-text-muted);
  font-weight: 700;
`

const StateText = styled.p`
  margin: 0;
  padding: 10px 0 8px;
  color: var(--color-text-muted);
  font-size: 1rem;
`

export const ExplorerStateText = styled(StateText)``;

export const ExplorerErrorText = styled(StateText)`
  color: #ffb4a2;
`

export const ExplorerArchiveDock = styled.div`
  margin-top: 30px;
  display: flex;
  justify-content: center;
`

export const ExplorerArchiveButton = styled.button`
  min-height: 56px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 999px;
  border: 1px solid rgba(248, 143, 82, 0.28);
  background: rgba(248, 143, 82, 0.08);
  color: #fff1e7;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(248, 143, 82, 0.16);
    border-color: rgba(248, 143, 82, 0.42);
  }
`

export const ExplorerArchiveIcon = styled.svg`
  width: 18px;
  height: 18px;
  color: rgba(255, 205, 174, 0.96);
`
