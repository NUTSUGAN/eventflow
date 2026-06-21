import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getCurrentUser } from '../../api/auth'
import {
  getOrganizerPayoutAccount,
  saveOrganizerPayoutAccount,
} from '../../api/organizerPayoutAccount'
import type {
  OrganizerPayoutAccount,
  OrganizerPayoutAccountPayload,
  OrganizerPayoutType,
} from '../../types/organizerPayoutAccount'
import {
  OrganizerDashboardActions,
  OrganizerDashboardBadge,
  OrganizerDashboardEyebrow,
  OrganizerDashboardHeader,
  OrganizerDashboardHeaderText,
  OrganizerDashboardMessage,
  OrganizerDashboardPanel,
  OrganizerDashboardPanelHeader,
  OrganizerDashboardPanelTitle,
  OrganizerDashboardPrimaryButton,
  OrganizerDashboardSecondaryButton,
  OrganizerDashboardSection,
  OrganizerDashboardText,
  OrganizerDashboardTitle,
} from '../OrganizerDashboardPage/organizerDashboardPageElements'

type PayoutFormState = {
  type: OrganizerPayoutType
  label: string
  holderName: string
  iban: string
  bic: string
  bankName: string
  mobileMoneyName: string
  mobileMoneyPhone: string
  mobileMoneyProvider: string
  mobileMoneyCountry: string
}

const initialForm: PayoutFormState = {
  type: 'bank',
  label: '',
  holderName: '',
  iban: '',
  bic: '',
  bankName: '',
  mobileMoneyName: '',
  mobileMoneyPhone: '',
  mobileMoneyProvider: '',
  mobileMoneyCountry: '',
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Date à définir'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function payoutLabel(account: OrganizerPayoutAccount): string {
  if (account.label) {
    return account.label
  }

  return account.type === 'bank' ? 'Compte bancaire' : 'Mobile Money'
}

function readApiMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
  ) {
    return String(
      (error as { response?: { data?: { message?: unknown } } }).response?.data?.message,
    )
  }

  return fallback
}

export function OrganizerBankPage() {
  const navigate = useNavigate()
  const [activeAccount, setActiveAccount] = useState<OrganizerPayoutAccount | null>(null)
  const [history, setHistory] = useState<OrganizerPayoutAccount[]>([])
  const [form, setForm] = useState<PayoutFormState>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ORGANIZER' && user.role !== 'ROLE_ADMIN') {
          navigate('/organizer-access', { replace: true })
          return
        }

        const response = await getOrganizerPayoutAccount()

        if (!isMounted) {
          return
        }

        setActiveAccount(response.active)
        setHistory(response.history)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
          navigate('/auth?mode=login&intent=organizer', { replace: true })
          return
        }

        setErrorMessage(
          readApiMessage(error, 'Impossible de charger ton moyen de retrait.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const payload: OrganizerPayoutAccountPayload =
      form.type === 'bank'
        ? {
            type: 'bank',
            label: form.label,
            holderName: form.holderName,
            iban: form.iban,
            bic: form.bic,
            bankName: form.bankName,
          }
        : {
            type: 'mobile_money',
            label: form.label,
            mobileMoneyName: form.mobileMoneyName,
            mobileMoneyPhone: form.mobileMoneyPhone,
            mobileMoneyProvider: form.mobileMoneyProvider,
            mobileMoneyCountry: form.mobileMoneyCountry,
          }

    setIsSaving(true)
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      const response = await saveOrganizerPayoutAccount(payload)

      setActiveAccount(response.active)
      setHistory(response.history)
      setForm((current) => ({ ...initialForm, type: current.type }))
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        readApiMessage(error, "Impossible d'enregistrer ce moyen de retrait."),
      )
    } finally {
      setIsSaving(false)
    }
  }

  function patchForm(patch: Partial<PayoutFormState>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  return (
    <OrganizerDashboardSection>
      <OrganizerDashboardHeader>
        <OrganizerDashboardHeaderText>
          <OrganizerDashboardEyebrow>Espace organisateur</OrganizerDashboardEyebrow>
          <OrganizerDashboardTitle>Banque et Mobile Money</OrganizerDashboardTitle>
          <OrganizerDashboardText>
            Configure le moyen de retrait utilisé par EventFlow pour tes paiements.
            Chaque modification garde une trace dans l'historique.
          </OrganizerDashboardText>
        </OrganizerDashboardHeaderText>
        <OrganizerDashboardActions>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
          >
            Tableau de bord
          </OrganizerDashboardSecondaryButton>
          <OrganizerDashboardSecondaryButton
            type="button"
            onClick={() => navigate('/organizer/withdrawals')}
          >
            Retraits
          </OrganizerDashboardSecondaryButton>
        </OrganizerDashboardActions>
      </OrganizerDashboardHeader>

      {statusMessage ? (
        <OrganizerDashboardMessage $tone="success">{statusMessage}</OrganizerDashboardMessage>
      ) : null}
      {errorMessage ? (
        <OrganizerDashboardMessage $tone="danger">{errorMessage}</OrganizerDashboardMessage>
      ) : null}
      {isLoading ? (
        <OrganizerDashboardMessage $tone="neutral">
          Chargement du moyen de retrait...
        </OrganizerDashboardMessage>
      ) : null}

      <OrganizerDashboardPanel>
        <OrganizerDashboardPanelHeader>
          <div>
            <OrganizerDashboardPanelTitle>Moyen actif</OrganizerDashboardPanelTitle>
            <OrganizerDashboardText>
              C'est celui qui sera copié dans la prochaine demande de retrait.
            </OrganizerDashboardText>
          </div>
          {activeAccount ? (
            <OrganizerDashboardBadge $tone="success">Actif</OrganizerDashboardBadge>
          ) : (
            <OrganizerDashboardBadge $tone="warning">À compléter</OrganizerDashboardBadge>
          )}
        </OrganizerDashboardPanelHeader>

        {activeAccount ? (
          <PayoutAccountCard account={activeAccount} />
        ) : (
          <OrganizerDashboardMessage $tone="neutral">
            Aucun moyen actif pour le moment. Ajoute un compte bancaire ou Mobile Money.
          </OrganizerDashboardMessage>
        )}
      </OrganizerDashboardPanel>

      <OrganizerDashboardPanel>
        <OrganizerDashboardPanelHeader>
          <div>
            <OrganizerDashboardPanelTitle>Ajouter un moyen de retrait</OrganizerDashboardPanelTitle>
            <OrganizerDashboardText>
              Une nouvelle saisie remplacera le moyen actif, sans supprimer l'ancienne version.
            </OrganizerDashboardText>
          </div>
        </OrganizerDashboardPanelHeader>

        <PayoutTabs>
          <PayoutTabButton
            type="button"
            $active={form.type === 'bank'}
            onClick={() => patchForm({ type: 'bank' })}
          >
            Compte bancaire
          </PayoutTabButton>
          <PayoutTabButton
            type="button"
            $active={form.type === 'mobile_money'}
            onClick={() => patchForm({ type: 'mobile_money' })}
          >
            Mobile Money
          </PayoutTabButton>
        </PayoutTabs>

        <PayoutForm onSubmit={handleSubmit}>
          <PayoutField>
            <PayoutLabel>Nom interne</PayoutLabel>
            <PayoutInput
              value={form.label}
              onChange={(event) => patchForm({ label: event.target.value })}
              placeholder={form.type === 'bank' ? 'Compte principal' : 'Orange Money'}
            />
          </PayoutField>

          {form.type === 'bank' ? (
            <>
              <PayoutField>
                <PayoutLabel>Titulaire</PayoutLabel>
                <PayoutInput
                  value={form.holderName}
                  onChange={(event) => patchForm({ holderName: event.target.value })}
                  placeholder="Nom du titulaire"
                  required
                />
              </PayoutField>
              <PayoutField>
                <PayoutLabel>IBAN</PayoutLabel>
                <PayoutInput
                  value={form.iban}
                  onChange={(event) => patchForm({ iban: event.target.value })}
                  placeholder="FR76..."
                  required
                />
              </PayoutField>
              <PayoutField>
                <PayoutLabel>BIC</PayoutLabel>
                <PayoutInput
                  value={form.bic}
                  onChange={(event) => patchForm({ bic: event.target.value })}
                  placeholder="AGRIFRPP"
                  required
                />
              </PayoutField>
              <PayoutField>
                <PayoutLabel>Banque</PayoutLabel>
                <PayoutInput
                  value={form.bankName}
                  onChange={(event) => patchForm({ bankName: event.target.value })}
                  placeholder="Nom de la banque"
                />
              </PayoutField>
            </>
          ) : (
            <>
              <PayoutField>
                <PayoutLabel>Titulaire</PayoutLabel>
                <PayoutInput
                  value={form.mobileMoneyName}
                  onChange={(event) => patchForm({ mobileMoneyName: event.target.value })}
                  placeholder="Nom du titulaire"
                  required
                />
              </PayoutField>
              <PayoutField>
                <PayoutLabel>Numéro Mobile Money</PayoutLabel>
                <PayoutInput
                  value={form.mobileMoneyPhone}
                  onChange={(event) => patchForm({ mobileMoneyPhone: event.target.value })}
                  placeholder="+243..."
                  required
                />
              </PayoutField>
              <PayoutField>
                <PayoutLabel>Opérateur</PayoutLabel>
                <PayoutInput
                  value={form.mobileMoneyProvider}
                  onChange={(event) => patchForm({ mobileMoneyProvider: event.target.value })}
                  placeholder="Orange Money, M-Pesa..."
                  required
                />
              </PayoutField>
              <PayoutField>
                <PayoutLabel>Pays</PayoutLabel>
                <PayoutInput
                  value={form.mobileMoneyCountry}
                  onChange={(event) => patchForm({ mobileMoneyCountry: event.target.value })}
                  placeholder="RDC, France..."
                  required
                />
              </PayoutField>
            </>
          )}

          <PayoutFormActions>
            <OrganizerDashboardPrimaryButton type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </OrganizerDashboardPrimaryButton>
          </PayoutFormActions>
        </PayoutForm>
      </OrganizerDashboardPanel>

      <OrganizerDashboardPanel>
        <OrganizerDashboardPanelHeader>
          <div>
            <OrganizerDashboardPanelTitle>Historique</OrganizerDashboardPanelTitle>
            <OrganizerDashboardText>
              Les anciennes versions restent disponibles pour garder une trace.
            </OrganizerDashboardText>
          </div>
        </OrganizerDashboardPanelHeader>

        {history.length === 0 ? (
          <OrganizerDashboardMessage $tone="neutral">
            Aucune ancienne version pour le moment.
          </OrganizerDashboardMessage>
        ) : (
          <PayoutHistoryList>
            {history.map((account) => (
              <PayoutAccountCard key={account.id} account={account} />
            ))}
          </PayoutHistoryList>
        )}
      </OrganizerDashboardPanel>
    </OrganizerDashboardSection>
  )
}

function PayoutAccountCard({ account }: { account: OrganizerPayoutAccount }) {
  const isBank = account.type === 'bank'

  return (
    <PayoutCard>
      <PayoutCardHeader>
        <div>
          <PayoutCardTitle>{payoutLabel(account)}</PayoutCardTitle>
          <PayoutCardMeta>
            {isBank ? 'Compte bancaire' : 'Mobile Money'} - créé le{' '}
            {formatDate(account.createdAt)}
          </PayoutCardMeta>
          {account.replacedAt ? (
            <PayoutCardMeta>Remplacé le {formatDate(account.replacedAt)}</PayoutCardMeta>
          ) : null}
        </div>
        <OrganizerDashboardBadge $tone={account.isActive ? 'success' : 'neutral'}>
          {account.isActive ? 'Actif' : 'Archivé'}
        </OrganizerDashboardBadge>
      </PayoutCardHeader>

      <PayoutDetails>
        {isBank ? (
          <>
            <PayoutInfo>
              <span>Titulaire</span>
              <strong>{account.bank.holderName ?? 'À définir'}</strong>
            </PayoutInfo>
            <PayoutInfo>
              <span>IBAN</span>
              <strong>{account.bank.iban ?? 'À définir'}</strong>
            </PayoutInfo>
            <PayoutInfo>
              <span>BIC</span>
              <strong>{account.bank.bic ?? 'À définir'}</strong>
            </PayoutInfo>
            <PayoutInfo>
              <span>Banque</span>
              <strong>{account.bank.bankName ?? 'À définir'}</strong>
            </PayoutInfo>
          </>
        ) : (
          <>
            <PayoutInfo>
              <span>Titulaire</span>
              <strong>{account.mobileMoney.name ?? 'À définir'}</strong>
            </PayoutInfo>
            <PayoutInfo>
              <span>Numéro</span>
              <strong>{account.mobileMoney.phone ?? 'À définir'}</strong>
            </PayoutInfo>
            <PayoutInfo>
              <span>Opérateur</span>
              <strong>{account.mobileMoney.provider ?? 'À définir'}</strong>
            </PayoutInfo>
            <PayoutInfo>
              <span>Pays</span>
              <strong>{account.mobileMoney.country ?? 'À définir'}</strong>
            </PayoutInfo>
          </>
        )}
      </PayoutDetails>
    </PayoutCard>
  )
}

const PayoutTabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

const PayoutTabButton = styled.button<{ $active: boolean }>`
  min-height: 42px;
  padding: 0 15px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(235, 148, 81, 0.72)' : 'rgba(255, 255, 255, 0.1)')};
  background: ${({ $active }) => ($active ? 'rgba(235, 148, 81, 0.18)' : 'rgba(255, 255, 255, 0.04)')};
  color: #fff4ea;
  font-weight: 900;
  cursor: pointer;
`

const PayoutForm = styled.form`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const PayoutField = styled.label`
  display: grid;
  gap: 7px;
`

const PayoutLabel = styled.span`
  color: rgba(255, 237, 222, 0.64);
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
`

const PayoutInput = styled.input`
  min-height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.045);
  color: #fffaf4;
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: rgba(235, 148, 81, 0.68);
    box-shadow: 0 0 0 3px rgba(235, 148, 81, 0.12);
  }

  &::placeholder {
    color: rgba(255, 237, 222, 0.38);
  }
`

const PayoutFormActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: end;
`

const PayoutHistoryList = styled.div`
  display: grid;
  gap: 12px;
`

const PayoutCard = styled.article`
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

const PayoutCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`

const PayoutCardTitle = styled.h3`
  margin: 0 0 6px;
  color: #fff8f2;
  font-size: 1.05rem;
`

const PayoutCardMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.64);
  line-height: 1.5;
`

const PayoutDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const PayoutInfo = styled.div`
  display: grid;
  gap: 5px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);

  span {
    color: rgba(255, 237, 222, 0.58);
    font-size: 0.74rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  strong {
    color: #fff8f2;
    overflow-wrap: anywhere;
  }
`
