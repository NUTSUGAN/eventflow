import styled from 'styled-components'

export const PageSection = styled.main`
  width: min(1480px, calc(100% - 96px));
  min-width: 0;
  margin: 0 auto;
  padding: 28px 0 64px;

  @media (max-width: 640px) {
    width: min(100%, calc(100% - 24px));
    padding: 24px 0 48px;
  }
`

export const PageHeader = styled.header`
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
`

export const PageIntro = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1rem;

  strong {
    color: var(--color-text);
    font-weight: 700;
  }
`

export const PageTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
`

export const CardsGrid = styled.section`
  min-width: 0;
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

export const ActionRow = styled.div`
  margin-top: 36px;
  display: flex;
  justify-content: center;
`

const StateText = styled.p`
  margin: 0;
  padding: 24px 0 8px;
  color: var(--color-text-muted);
  font-size: 1rem;
`

export const LoadingStateText = styled(StateText)``

export const EmptyStateText = styled(StateText)``

export const ErrorStateText = styled(StateText)`
  color: #ffb4a2;
`

export const MoreEventsButton = styled.button`
  max-width: 100%;
  min-height: 50px;
  padding: 0 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(248, 143, 82, 0.42);
  background: linear-gradient(
    180deg,
    rgba(191, 106, 65, 0.26) 0%,
    rgba(248, 143, 82, 0.18) 100%
  );
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 0.96rem;
  letter-spacing: 0;
  line-height: 1.2;
  white-space: normal;
  box-shadow: var(--shadow-soft);
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
  }
`
