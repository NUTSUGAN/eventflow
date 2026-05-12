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
  box-shadow: var(--shadow-soft);

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
  outline: 0;
  transition:
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
`

export const FilterDateInput = styled.input`
  ${filterFieldStyles}
`;

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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;

  & > * {
    flex: 0 1 calc((100% - 48px) / 3);
    min-width: 280px;
    max-width: 420px;
  }

  @media (max-width: 1040px) {
    & > * {
      flex-basis: calc((100% - 24px) / 2);
    }
  }

  @media (max-width: 700px) {
    gap: 22px;

    & > * {
      flex-basis: 100%;
      max-width: 100%;
    }
  }
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
