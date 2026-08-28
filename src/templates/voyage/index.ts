/**
 * Voyage Template Plugin
 *
 * A refined luxury destination-wedding editorial: a cinematic hero over warm
 * ivory, soft-black ink, champagne-gold accents and a high-contrast display
 * serif. Its long-scroll home page composes the content sections into an
 * editorial layout — story timeline, destination feature, weekend itinerary,
 * curated experiences, travel & stay, gallery and a registry / RSVP close.
 *
 * Voyage's surfaces are responsive, so the same Home layout serves desktop and
 * mobile.
 */

import { voyageMeta } from '~/templates/catalog'
import type { WeddingTemplate } from '~/templates/types'
import { VoyageHome, VoyageHomeMobile } from '~/templates/voyage/components/home'
import { VoyageInvitation } from '~/templates/voyage/components/invitation'
import { VoyageMinimal } from '~/templates/voyage/components/minimal'
import { VoyageSaveTheDate } from '~/templates/voyage/components/save-the-date'
import { VoyageSections } from '~/templates/voyage/components/sections'
import { voyageTheme } from '~/templates/voyage/theme'

export const voyageTemplate: WeddingTemplate = {
  ...voyageMeta,
  theme: voyageTheme,
  components: {
    Home: VoyageHome,
    HomeMobile: VoyageHomeMobile,
    Minimal: VoyageMinimal,
    SaveTheDate: VoyageSaveTheDate,
    Invitation: VoyageInvitation,
    Sections: VoyageSections,
  },
}
