import styled from 'styled-components'

export const ContactPageShell = styled.main`
  width: min(900px, calc(100% - 32px));
  margin: 0 auto;
  padding: 72px 0 44px;
  overflow: hidden;
`

export const ContactBackLink = styled.a`
  display: inline-flex;
  margin-bottom: 24px;
  color: var(--color-secondary);
  text-decoration: none;
  font-weight: 700;
`

export const ContactTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2.1rem, 5vw, 3.4rem);
`

export const ContactLead = styled.p`
  margin: 14px 0 0;
  max-width: 720px;
  color: var(--color-text-muted);
  font-size: 1.08rem;
  line-height: 1.6;
`

export const ContactForm = styled.form`
  display: grid;
  gap: 18px;
  margin-top: 32px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
`

export const ContactFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`

export const ContactField = styled.div`
  display: grid;
  gap: 8px;

  label {
    color: var(--color-text);
    font-weight: 800;
  }
`

const fieldStyles = `
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  font: inherit;
  outline: none;
  color-scheme: dark;

  &:focus {
    border-color: rgba(248, 143, 82, 0.78);
    box-shadow: 0 0 0 3px rgba(248, 143, 82, 0.14);
  }
`

export const ContactInput = styled.input`
  ${fieldStyles}
  min-height: 46px;
  padding: 0 14px;
`

export const ContactSelect = styled.select`
  ${fieldStyles}
  min-height: 46px;
  padding: 0 14px;
  cursor: pointer;

  option {
    background: #241f1c;
    color: var(--color-text);
  }

  option:checked,
  option:hover {
    background: rgba(248, 143, 82, 0.24);
    color: var(--color-text);
  }
`

export const ContactTextarea = styled.textarea`
  ${fieldStyles}
  min-height: 180px;
  padding: 14px;
  resize: vertical;
`

export const ContactActions = styled.div`
  display: flex;
  justify-content: flex-end;
`

export const ContactButton = styled.button`
  min-height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(180deg, var(--color-secondary) 0%, var(--color-primary) 100%);
  color: var(--color-text);
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`

export const ContactSuccess = styled.p`
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(80, 180, 110, 0.14);
  color: #9ff0b8;
  font-weight: 700;
`

export const ContactError = styled.p`
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(235, 95, 72, 0.14);
  color: #ffb09e;
  font-weight: 700;
`
