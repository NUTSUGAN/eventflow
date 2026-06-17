import { useNavigate } from 'react-router-dom'
import {
  FeatureAction,
  FeatureActions,
  FeatureContent,
  FeatureDescription,
  FeatureEyebrow,
  FeatureMedia,
  FeatureMediaBadge,
  FeatureMediaCard,
  FeatureMediaImage,
  FeatureMediaSubtext,
  FeatureSection,
  FeatureTitle,
} from './featureSpotlightElements'

export function FeatureSpotlight() {
  const navigate = useNavigate()

  return (
    <FeatureSection>
      <FeatureContent>
        <FeatureEyebrow>EventFlow en avant-première</FeatureEyebrow>
        <FeatureTitle>Chope ton billet, créé des souvenirs</FeatureTitle>
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
          <FeatureMediaImage src="/eventflow-logo.png" alt="Identite visuelle EventFlow" />
          <FeatureMediaBadge>Selection en direct</FeatureMediaBadge>
          <FeatureMediaSubtext>
            Concerts, festivals, expériences culturelles et sorties locales dans une
            interface plus claire et plus immersive.
          </FeatureMediaSubtext>
        </FeatureMediaCard>
      </FeatureMedia>
    </FeatureSection>
  )
}
