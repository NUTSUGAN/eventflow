import { getBackendPublicUrl } from '../../api/client'

export function formatOrganizerDate(value: string | null): string {
  if (!value) {
    return 'Date à confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatCurrencyFromString(value: string): string {
  const amount = Number.parseFloat(value)

  if (!Number.isFinite(amount)) {
    return 'Tarif invalide'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyAmount(value: string | number | undefined): string {
  const amount =
    typeof value === 'number' ? value : Number.parseFloat(value ?? '0')

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatStatusLabel(status: string): string {
  if (status === 'published') {
    return 'Public'
  }

  if (status === 'suspended') {
    return 'Suspendu'
  }

  return 'Brouillon'
}

export function resolveMediaUrl(path: string | null): string | undefined {
  if (!path) {
    return undefined
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${getBackendPublicUrl()}${normalizedPath}`
}
