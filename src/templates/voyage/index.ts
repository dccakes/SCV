/**
 * Voyage Template Plugin
 *
 * A refined luxury destination-wedding editorial: a cinematic hero over warm
 * ivory, soft-black ink, champagne-gold accents and a high-contrast display
 * serif. A concise editorial home links to dedicated wedding weekend, stay,
 * travel, destination guide, story, FAQ and registry pages.
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
