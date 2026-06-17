import { useState } from 'react'
import {
  CookieConsentActions,
  CookieConsentPrimaryButton,
  CookieConsentSecondaryButton,
  CookieConsentText,
  CookieConsentTitle,
  CookieConsentWrapper,
} from './cookieConsentBannerElements'

const cookieConsentStorageKey = 'eventflow-cookie-consent'

type CookieConsentChoice = 'accepted' | 'refused'

function readCookieConsentChoice(): CookieConsentChoice | null {
  try {
    const value = window.localStorage.getItem(cookieConsentStorageKey)
    return value === 'accepted' || value === 'refused' ? value : null
  } catch {
    return null
  }
}

function persistCookieConsentChoice(choice: CookieConsentChoice) {
  try {
    window.localStorage.setItem(cookieConsentStorageKey, choice)
  } catch {
    // The banner still closes even if storage is unavailable.
  }
}

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(() =>
    readCookieConsentChoice(),
  )

  function handleChoice(nextChoice: CookieConsentChoice) {
    persistCookieConsentChoice(nextChoice)
    setChoice(nextChoice)
  }

  if (choice !== null) {
    return null
  }

  return (
    <CookieConsentWrapper aria-live="polite" aria-label="Preference cookies EventFlow">
      <CookieConsentTitle>Cookies EventFlow</CookieConsentTitle>
      <CookieConsentText>
        EventFlow utilis? des cookies essentiels pour maintenir ta session et
        des cookies optionnels pour améliorer l’expérience. Tu peux accepter
        ou refuser ces cookies optionnels maintenant.
      </CookieConsentText>
      <CookieConsentActions>
        <CookieConsentPrimaryButton
          type="button"
          onClick={() => handleChoice('accepted')}
        >
          Accepter
        </CookieConsentPrimaryButton>
        <CookieConsentSecondaryButton
          type="button"
          onClick={() => handleChoice('refused')}
        >
          Refuser
        </CookieConsentSecondaryButton>
      </CookieConsentActions>
    </CookieConsentWrapper>
  )
}
