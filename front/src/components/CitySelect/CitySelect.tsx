import { useEffect, useId, useState } from 'react'
import styled from 'styled-components'
import { getCities, type City } from '../../api/cities'

const Field = styled.div`
  display: grid; gap: 10px; min-width: 0;
  select, input { width: 100%; min-width: 0; box-sizing: border-box; padding: 12px;
    border: 1px solid var(--color-border, #555); border-radius: 6px; background: var(--color-surface, #242424);
    color: var(--color-text, #fff); font: inherit; }
  option { background: #242424; color: #fff; }
  small { color: var(--color-text-muted); }
`

type Props = { cityId: string; name: string; onChange: (cityId: string, name: string) => void }

export function CitySelect({ cityId, name, onChange }: Props) {
  const id = useId()
  const [cities, setCities] = useState<City[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [custom, setCustom] = useState(!cityId && !!name)
  useEffect(() => {
    let mounted = true
    getCities().then(data => { if (mounted) { setCities(data); setState('ready') } })
      .catch(() => { if (mounted) setState('error') })
    return () => { mounted = false }
  }, [])
  const isCustom = !cityId && (custom || !!name)
  return <Field>
    <select aria-label="Ville" value={cityId || (isCustom ? 'custom' : '')}
      onChange={event => {
        const value = event.target.value
        setCustom(value === 'custom')
        onChange(value === 'custom' ? '' : value, cities.find(city => String(city.id) === value)?.name ?? '')
      }} required>
      <option value="" disabled>{state === 'loading' ? 'Chargement des villes…' : 'Choisir une ville'}</option>
      {cityId && !cities.some(city => String(city.id) === cityId) && <option value={cityId}>{name}</option>}
      {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
      <option value="custom">Ma ville n’est pas dans la liste</option>
    </select>
    {state === 'error' && <small role="status">Liste indisponible. Réessaie plus tard ou saisis ta ville.</small>}
    {isCustom && <>
      <input id={id} aria-label="Nom de ta ville" value={name} maxLength={120} required
        placeholder="Nom de ta ville" onChange={event => onChange('', event.target.value)} />
      <small>Cette ville sera affichée sur ton événement, mais ne figurera pas dans le filtre Ville.</small>
    </>}
  </Field>
}
