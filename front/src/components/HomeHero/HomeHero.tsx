import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaPause, FaPlay } from 'react-icons/fa6'
import styled from 'styled-components'

const Hero = styled.section`
  position: relative; isolation: isolate; background: #111715; overflow: hidden;
  min-height: 370px; display: flex; align-items: center; color: #fff;
  picture, video { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
  picture img, video { width: 100%; height: 100%; object-fit: contain; object-position: right center; }
  .hero-copy { width: min(1240px, calc(100% - 64px)); margin: auto; padding: 42px 0; }
  .eyebrow { color: #8bd7b3; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 0 0 12px; }
  h1 { font: 800 48px/1.12 var(--font-heading); letter-spacing: 0; margin: 0; max-width: 650px; }
  .lead { color: #c7d3cc; max-width: 440px; margin: 16px 0 24px; font-size: 16px; }
  a { display: inline-flex; gap: 12px; align-items: center; background: #f88f52; color: #21170e;
    text-decoration: none; border-radius: 6px; padding: 12px 18px; font-weight: 700; }
  button { position: absolute; bottom: 18px; right: 20px; border: 1px solid #617167; background: #152019; color: #fff; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; cursor: pointer; }
  @media (min-width: 1600px) { picture img, video { object-fit: contain; } }
  @media (max-width: 760px) {
    min-height: 445px; align-items: flex-start;
    .hero-copy { width: calc(100% - 32px); margin: 0 auto; padding: 24px 0; }
    h1 { font-size: 30px; max-width: 340px; }
    .lead { font-size: 14px; max-width: 320px; margin: 10px 0 14px; }
    a { font-size: 13px; padding: 10px 12px; }
    picture img, video { object-fit: contain; object-position: center bottom; }
  }
`

export function HomeHero() {
  const video = useRef<HTMLVideoElement>(null)
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [paused, setPaused] = useState(false)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const screen = window.matchMedia('(max-width: 760px)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateScreen = () => { setMobile(screen.matches); setReady(false) }
    const updateMotion = () => setReduced(motion.matches)
    screen.addEventListener('change', updateScreen); motion.addEventListener('change', updateMotion)
    return () => { screen.removeEventListener('change', updateScreen); motion.removeEventListener('change', updateMotion) }
  }, [])
  const stem = mobile ? '/media/scan-demo-mobile' : '/media/scan-demo'
  return <Hero aria-label="EventFlow au Togo">
    <picture><source media="(max-width: 760px)" srcSet="/media/scan-demo-mobile.png" /><img src="/media/scan-demo.png" alt="Démonstration d’un billet EventFlow avec accès autorisé après lecture du QR code" /></picture>
    {!reduced && !failed && <video ref={video} key={stem} src={`${stem}.webm`} muted autoPlay loop playsInline preload="metadata" aria-hidden="true"
      style={{ opacity: ready ? 1 : 0 }} onPlaying={() => { setReady(true); setPaused(false) }} onPause={() => setPaused(true)} onError={() => setFailed(true)} />}
    <div className="hero-copy">
      <p className="eyebrow">Les événements au Togo</p>
      <h1>EventFlow</h1>
      <p className="lead">Ta prochaine sortie commence ici.<br />Un billet, un scan, et place aux souvenirs.</p>
      <Link to="/explorer">Explorer les événements <FaArrowRight aria-hidden="true" /></Link>
    </div>
    {!reduced && !failed && <button type="button" title={paused ? 'Lire la démonstration' : 'Mettre en pause'} aria-label={paused ? 'Lire la démonstration' : 'Mettre en pause'} onClick={() => {
      if (video.current?.paused) void video.current.play().catch(() => setFailed(true)); else video.current?.pause()
    }}>{paused ? <FaPlay /> : <FaPause />}</button>}
  </Hero>
}
