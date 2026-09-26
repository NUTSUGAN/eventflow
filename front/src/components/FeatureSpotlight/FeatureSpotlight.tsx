import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FeatureAction,
  FeatureActions,
  FeatureContent,
  FeatureDescription,
  FeatureEyebrow,
  FeatureMedia,
  FeatureMediaCard,
  FeatureMediaImage,
  FeatureMediaSubtext,
  FeatureSection,
  FeatureTitle,
} from './featureSpotlightElements'

export function FeatureSpotlight() {
  const navigate = useNavigate()
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 560px)').matches)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 560px)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateViewport = () => setMobile(viewport.matches)
    const updateMotion = () => setReducedMotion(motion.matches)
    viewport.addEventListener('change', updateViewport)
    motion.addEventListener('change', updateMotion)
    return () => {
      viewport.removeEventListener('change', updateViewport)
      motion.removeEventListener('change', updateMotion)
    }
  }, [])

  return (
    <FeatureSection>
      <FeatureContent>
        <FeatureEyebrow>EventFlow en avant-première</FeatureEyebrow>
        <FeatureTitle>Chope ton billet, crée des souvenirs</FeatureTitle>
        <FeatureDescription>
          Explore les prochains évènements, retrouve les expériences les plus
          attendues près de chez toi et prépare déjà ton parcours EventFlow.
        </FeatureDescription>
        <FeatureActions>
          <FeatureAction type="button" onClick={() => navigate('/explorer')}>
            Explorer maintenant
          </FeatureAction>
          <FeatureAction
            type="button"
            $secondary
            onClick={() => navigate('/auth?mode=register&intent=publish')}
          >
            Publier un évènement
          </FeatureAction>
        </FeatureActions>
      </FeatureContent>

      <FeatureMedia>
        <FeatureMediaCard>
          <FeatureMediaImage src="/eventflow-logo.png" alt="Identité visuelle EventFlow" />
          <video
            className="scan-demo"
            key={mobile ? 'mobile' : 'desktop'}
            poster={mobile ? '/media/scan-demo-mobile.png' : '/media/scan-demo.png'}
            muted
            autoPlay={!reducedMotion}
            loop={!reducedMotion}
            playsInline
            preload="metadata"
            aria-label="Démonstration du scan et de la validation d’un billet EventFlow"
          >
            <source src={mobile ? '/media/scan-demo-mobile.webm' : '/media/scan-demo.webm'} type="video/webm" />
          </video>
          <FeatureMediaSubtext>Scanné et validé</FeatureMediaSubtext>
        </FeatureMediaCard>
      </FeatureMedia>
    </FeatureSection>
  )
}
