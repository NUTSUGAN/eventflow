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
  const [isLoading, setIsLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')?.trim() ?? ''

    if ('' === token) {
      setErrorMessage('Le lien de validation est incomplet.')
      setIsLoading(false)
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
  }, [searchParams])

  return (
    <AccountSection>
      <AccountStateCard>
        <div>
          <AccountSectionTitle>Validation de ton nouvel’email</AccountSectionTitle>
          <AccountSectionLead>
            On finalise ici le changement demande depuis ton espace client.
          </AccountSectionLead>
        </div>

        {isLoading ? (
          <AccountState>Vérification du lien en cours...</AccountState>
        ) : null}

        {!isLoading && statusMessage ? (
          <AccountStatusMessage>{statusMessage}</AccountStatusMessage>
        ) : null}

        {!isLoading && errorMessage ? (
          <AccountErrorMessage>{errorMessage}</AccountErrorMessage>
        ) : null}

        <AccountActions>
          <AccountPrimaryButton type="button" onClick={() => navigate('/auth?mode=login')}>
            Se connecter
          </AccountPrimaryButton>
          <AccountSecondaryButton type="button" onClick={() => navigate('/account')}>
            Retour cu profil
          </AccountSecondaryButton>
        </AccountActions>
      </AccountStateCard>
    </AccountSection>
  )
}
