import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaMusic, FaMasksTheater, FaChampagneGlasses, FaPalette, FaMicrophone, FaPeopleGroup, FaPersonRunning, FaWandMagicSparkles, FaTicket, FaPause, FaPlay } from 'react-icons/fa6'
import styled from 'styled-components'
import { getPublicEventFilters } from '../../api/events'
import type { EventFiltersResponse } from '../../types/event'

const themes = [
  { match: /concert|musique/, icon: FaMusic, color: '#f5a66f' },
  { match: /festival/, icon: FaWandMagicSparkles, color: '#eed078' },
  { match: /culture|theatre|spectacle/, icon: FaMasksTheater, color: '#e894b9' },
  { match: /soiree|club|fete/, icon: FaChampagneGlasses, color: '#adadf5' },
  { match: /atelier|exposition|art/, icon: FaPalette, color: '#79cbbb' },
  { match: /conference|formation/, icon: FaMicrophone, color: '#8dbded' },
  { match: /network|rencontre/, icon: FaPeopleGroup, color: '#b8d889' },
  { match: /sport/, icon: FaPersonRunning, color: '#ef9991' },
]

function categoryTheme(name: string) {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return themes.find(theme => theme.match.test(normalized)) ?? { icon: FaTicket, color: '#9fcecb' }
}

export function HomeCategories() {
  const [categories, setCategories] = useState<EventFiltersResponse['categories']>([])
  const rail = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    let active = true
    getPublicEventFilters().then(data => {
      if (active) setCategories(
        ['atelier', 'concert', 'conference', 'festival', 'networking', 'soiree', 'sport'].flatMap(name => {
          const category = data.categories.find(item =>
            item.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === name,
          )
          return category ? [category] : []
        }),
      )
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (paused || interacting || reducedMotion || categories.length < 2) return
    const timer = window.setInterval(() => {
      const element = rail.current
      if (!element || !window.matchMedia('(max-width: 900px)').matches || document.hidden) return
      const step = (element.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 0
      const atEnd = element.scrollLeft >= element.scrollWidth - element.clientWidth - 2
      element.scrollTo({ left: atEnd ? 0 : element.scrollLeft + step + 12, behavior: 'smooth' })
    }, 3000)
    return () => window.clearInterval(timer)
  }, [paused, interacting, reducedMotion, categories.length])

  if (!categories.length) return null

  return (
    <Section aria-labelledby="home-categories-title">
      <Heading>
        <div><span>TA PROCHAINE SORTIE</span><h2 id="home-categories-title">À chaque envie, sa sortie</h2></div>
        <Link to="/explorer">Tout explorer <FaArrowRight aria-hidden="true" /></Link>
      </Heading>
      {!reducedMotion && categories.length > 1 && <Playback type="button" onClick={() => setPaused(value => !value)}
        aria-label={paused ? 'Reprendre le défilement' : 'Mettre le défilement en pause'}
        title={paused ? 'Reprendre le défilement' : 'Mettre le défilement en pause'}>
        {paused ? <FaPlay aria-hidden="true" /> : <FaPause aria-hidden="true" />}
      </Playback>}
      <Grid ref={rail} onPointerEnter={() => setInteracting(true)} onPointerLeave={() => setInteracting(false)}
        onTouchStart={() => setInteracting(true)} onTouchEnd={() => setInteracting(false)}
        onFocusCapture={() => setInteracting(true)} onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false)
        }}>
        {categories.map(category => {
          const { icon: Icon, color } = categoryTheme(category.name)
          return (
            <Tile key={category.id} to={`/explorer?type=${category.id}`} $accent={color}>
              <Icon className="category-icon" aria-hidden="true" />
              <span>{category.name}</span>
              <FaArrowRight className="category-arrow" aria-hidden="true" />
            </Tile>
          )
        })}
      </Grid>
    </Section>
  )
}

const Section = styled.section`
  margin-top: 56px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border);
`

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 24px;
  span { color: var(--color-secondary); font-size: 0.75rem; font-weight: 700; }
  h2 { margin: 8px 0 0; font-size: 1.7rem; line-height: 1.3; }
  a { display: inline-flex; align-items: center; gap: 10px; font-size: 0.9rem; text-decoration: none; }
  a:hover { color: var(--color-secondary); }
`

const Grid = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 16px;
  @media (max-width: 900px) {
    grid-auto-columns: minmax(160px, 44%);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 12px;
    padding: 6px 4px 14px;
    scrollbar-width: thin;
    scrollbar-color: var(--color-secondary) transparent;
    > a { scroll-snap-align: start; }
  }
`

const Playback = styled.button`
  display: none;
  @media (max-width: 900px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin: 0 0 8px auto;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }
`

const Tile = styled(Link)<{ $accent: string }>`
  --category-accent: ${({ $accent }) => $accent};
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  min-height: 160px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--category-accent);
  border-radius: 8px;
  background: #221f1d;
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
  .category-icon { width: 40px; height: 40px; color: var(--category-accent); transition: transform 180ms ease; }
  span { padding-right: 18px; font-weight: 700; overflow-wrap: anywhere; }
  .category-arrow { position: absolute; bottom: 27px; right: 18px; width: 14px; color: var(--category-accent); }
  &:hover, &:focus-visible {
    transform: translateY(-4px);
    border-color: var(--category-accent);
    background: #2b2826;
    .category-icon { transform: rotate(-8deg) scale(1.08); }
  }
  &:focus-visible { outline: 2px solid var(--category-accent); outline-offset: 3px; }
  @media (max-width: 640px) { min-height: 146px; padding: 18px; }
  @media (prefers-reduced-motion: reduce) {
    &, .category-icon { transition: none; }
    &:hover, &:focus-visible { transform: none; .category-icon { transform: none; } }
  }
`
