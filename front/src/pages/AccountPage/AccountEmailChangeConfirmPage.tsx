import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmEmailChange } from '../../api/auth'
import {
  AccountActions,
  AccountErrorMessage,
  AccountPrimaryButton,
  AccountSection,
  AccountSectionLead,
  AccountSectionTitle,
  AccountSecondaryButton,
  AccountState,
  AccountStateCard,
  AccountStatusMessage,
} from './accountPageElements'

export function AccountEmailChangeConfirmPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const hasToken = token !== ''
  const [isLoading, setIsLoading] = useState(hasToken)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!hasToken) {
      return
    }

    let isMounted = true

    async function runConfirmation() {
      setIsLoading(true)
      setStatusMessage(null)
      setErrorMessage(null)

      try {
        const response = await confirmEmailChange({ token })

        if (isMounted) {
          setStatusMessage(response.message)
        }
      } catch (error) {
        const responseMessage =
          typeof error === 'object' &&
          error !== null &&
          'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : null

        if (isMounted) {
          setErrorMessage(
            responseMessage ?? "Impossible de confirmer ce changement d’email.",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void runConfirmation()

    return () => {
      isMounted = false
    }
  }, [hasToken, token])

  const displayedIsLoading = hasToken ? isLoading : false
  const displayedErrorMessage = hasToken
    ? errorMessage
    : 'Le lien de validation est incomplet.'

  return (
    <AccountSection>
      <AccountStateCard>
        <div>
          <AccountSectionTitle>Validation de ton nouvel’email</AccountSectionTitle>
          <AccountSectionLead>
            On finalise ici le changement demande depuis ton espace client.
          </AccountSectionLead>
        </div>

        {displayedIsLoading ? (
          <AccountState>Vérification du lien en cours...</AccountState>
        ) : null}

        {!displayedIsLoading && statusMessage ? (
          <AccountStatusMessage>{statusMessage}</AccountStatusMessage>
        ) : null}

        {!displayedIsLoading && displayedErrorMessage ? (
          <AccountErrorMessage>{displayedErrorMessage}</AccountErrorMessage>
        ) : null}

        <AccountActions>
          <AccountPrimaryButton type="button" onClick={() => navigate('/auth?mode=login')}>
            Se connecter
          </AccountPrimaryButton>
          <AccountSecondaryButton type="button" onClick={() => navigate('/account')}>
            Retour au profil
          </AccountSecondaryButton>
        </AccountActions>
      </AccountStateCard>
    </AccountSection>
  )
}
