import { NotFoundAction, NotFoundSection, NotFoundText, NotFoundTitle } from './notFoundPageElements'

export function NotFoundPage() {
  return (
    <NotFoundSection>
      <NotFoundTitle>Page introuvable</NotFoundTitle>
      <NotFoundText>
        Cette route n&apos;existe pas encore dans le front EventFlow.
      </NotFoundText>
      <NotFoundAction to="/">Retour a la liste publique</NotFoundAction>
    </NotFoundSection>
  )
}
