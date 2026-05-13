import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const NotFoundSection = styled.main`
  width: min(720px, calc(100% - 32px));
  margin: 0 auto;
  min-height: calc(100vh - 90px);
  display: grid;
  align-content: center;
  gap: 16px;
  text-align: center;
`

export const NotFoundTitle = styled.h1`
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
`

export const NotFoundText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
`

export const NotFoundAction = styled(Link)`
  justify-self: center;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 8px;
  background: linear-gradient(180deg, var(--color-secondary) 0%, var(--color-primary) 100%);
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
  box-shadow: var(--shadow-soft);
`
