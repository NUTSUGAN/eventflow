// Only verified public details belong in these Vite variables; never put credentials here.
export const publicIdentity = {
  operator: import.meta.env.VITE_LEGAL_OPERATOR?.trim() ?? '',
  address: import.meta.env.VITE_LEGAL_ADDRESS?.trim() ?? '',
  registration: import.meta.env.VITE_LEGAL_REGISTRATION?.trim() ?? '',
  support: import.meta.env.VITE_SUPPORT_EMAIL?.trim() ?? '',
  hosting: import.meta.env.VITE_LEGAL_HOSTING?.trim() ?? '',
}

export const publicIdentitySections = [
  { title: 'Exploitant', body: publicIdentity.operator },
  { title: 'Adresse de l’exploitant', body: publicIdentity.address },
  { title: 'Immatriculation', body: publicIdentity.registration },
  { title: 'Contact officiel', body: publicIdentity.support },
  { title: 'Hébergement', body: publicIdentity.hosting },
].filter(section => section.body !== '')
