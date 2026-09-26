import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { FaPen, FaCheck, FaTrash } from 'react-icons/fa6'
import { assignCity, deleteCity, getCities, getCityLocations, saveCity, type City, type CityLocation } from '../../api/cities'

const Page = styled.section<{ $embedded: boolean }>`
  box-sizing: border-box;
  width: ${({ $embedded }) => $embedded ? '100%' : 'min(1100px, calc(100% - 32px))'};
  margin: ${({ $embedded }) => $embedded ? '0' : '32px auto 64px'};
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: #211c19;
  h1, h2 { font-size: 22px; margin: 0 0 12px; } h3 { font-size: 18px; margin-top: 36px; }
  a { color: var(--color-text); } form { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
  input, select, button { font: inherit; color: var(--color-text); background: #252525; border: 1px solid #555; border-radius: 6px; padding: 10px 12px; }
  input { flex: 1; min-width: 160px; } input[type=checkbox] { flex: none; min-width: auto; }
  button { cursor: pointer; } button:disabled { opacity: .5; cursor: default; }
  button[type=submit] { background: #e48649; color: #171717; border-color: transparent; }
  table { width: 100%; border-collapse: collapse; } td, th { padding: 12px 8px; text-align: left; border-bottom: 1px solid #444; }
  .table-scroll { overflow-x: auto; } .notice { color: #f4b984; } .error { color: #ffaaa1; }
  td:last-child { white-space: nowrap; } label { display: inline-flex; align-items: center; gap: 8px; }
  td button + button { margin-left: 8px; }
  @media (max-width: 640px) { padding: 16px; }
`

export function AdminCitiesPage({ embedded = false }: { embedded?: boolean }) {
  const [cities, setCities] = useState<City[]>([])
  const [locations, setLocations] = useState<CityLocation[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<City | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [choices, setChoices] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function load() {
    const [nextCities, nextLocations] = await Promise.all([getCities(true), getCityLocations()])
    setCities(nextCities); setLocations(nextLocations)
  }
  useEffect(() => {
    let active = true
    Promise.all([getCities(true), getCityLocations()]).then(([nextCities, nextLocations]) => {
      if (active) { setCities(nextCities); setLocations(nextLocations) }
    }).catch(() => { if (active) setError('Impossible de charger les villes. Accès réservé à l’administration.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function perform(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(''); setNotice('')
    try { await action(); await load(); setNotice(message); setConfirmDelete(null) }
    catch (caught) {
      const response = caught as { response?: { data?: { message?: string } } }
      setError(response.response?.data?.message ?? 'Enregistrement impossible. Vérifie les droits, le nom et les doublons.')
    }
    finally { setBusy(false) }
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    const active = editing ? cities.find(city => city.id === editing.id)?.active ?? editing.active : true
    void perform(async () => { await saveCity({ name, active }, editing?.id); setName(''); setEditing(null) }, 'Ville enregistrée.')
  }
  return <Page as={embedded ? 'section' : 'main'} $embedded={embedded}>
    {!embedded && <Link to="/admin">Retour à l’administration</Link>}
    {embedded ? <h2>Villes</h2> : <h1>Villes</h1>}
    <p>Ajoute les villes proposées aux organisateurs. Une ville saisie librement reste hors du filtre public.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p className="notice" role="status">{notice}</p>}
    <form onSubmit={submit}>
      <input aria-label="Nom de la ville" placeholder="Nom de la ville" value={name} maxLength={120} required onChange={event => setName(event.target.value)} />
      <button type="submit" disabled={busy || loading}>{editing ? 'Enregistrer' : 'Ajouter la ville'}</button>
      {editing && <button type="button" onClick={() => { setEditing(null); setName('') }}>Annuler</button>}
    </form>
    {loading ? <p>Chargement…</p> : <div className="table-scroll"><table>
      <thead><tr><th>Ville</th><th>Disponible</th><th>Actions</th></tr></thead>
      <tbody>{cities.map(city => <tr key={city.id}><td>{city.name}</td><td><label>
        <input type="checkbox" checked={city.active} disabled={busy} aria-label={`Activer ${city.name}`}
          onChange={() => void perform(() => saveCity({ name: city.name, active: !city.active }, city.id), 'Disponibilité mise à jour.')} />
        {city.active ? 'Active' : 'Inactive'}</label></td>
        <td><button type="button" title="Renommer" aria-label={`Renommer ${city.name}`} disabled={busy} onClick={() => { setEditing(city); setName(city.name) }}><FaPen /></button>
          {confirmDelete === city.id ? <>
            <button type="button" disabled={busy} onClick={() => void perform(async () => {
              await deleteCity(city.id)
              if (editing?.id === city.id) { setEditing(null); setName('') }
            }, 'Ville supprimée.')}>Confirmer</button>
            <button type="button" disabled={busy} onClick={() => setConfirmDelete(null)}>Annuler</button>
          </> : <button type="button" title="Supprimer" aria-label={`Supprimer ${city.name}`} disabled={busy} onClick={() => setConfirmDelete(city.id)}><FaTrash /></button>}
        </td></tr>)}</tbody>
    </table>{!cities.length && <p>Aucune ville ajoutée.</p>}</div>}
    <h3>Lieux à rattacher</h3>
    <div className="table-scroll"><table><thead><tr><th>Lieu saisi</th><th>Événements</th><th>Ville</th><th>Validation</th></tr></thead>
      <tbody>{locations.map(location => <tr key={location.id}>
        <td>{location.name}<br /><small>{location.address} · {location.country}</small></td><td>{location.eventCount}</td>
        <td><select aria-label={`Ville pour ${location.name}`} value={choices[location.id] ?? ''} onChange={event => setChoices({ ...choices, [location.id]: event.target.value })}>
          <option value="">Choisir</option>{cities.filter(city => city.active).map(city => <option value={city.id} key={city.id}>{city.name}</option>)}
        </select></td>
        <td><button title="Confirmer le rattachement" aria-label={`Rattacher ${location.name}`} disabled={busy || !choices[location.id]}
          onClick={() => void perform(() => assignCity(location.id, Number(choices[location.id])), 'Rattachement confirmé.')}><FaCheck /></button></td>
      </tr>)}</tbody></table>{!loading && !locations.length && <p>Aucun lieu en attente de rattachement.</p>}</div>
  </Page>
}
