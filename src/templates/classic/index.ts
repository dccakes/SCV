/**
 * Classic Template Plugin
 *
 * The original OSWP wedding site, repackaged as a swappable template: warm
 * cream, editorial serif, soft zinc ink, blush/coral accents.
 */

import { classicMeta } from '~/templates/catalog'
import { ClassicHome } from '~/templates/classic/components/home'
import { ClassicHomeMobile } from '~/templates/classic/components/home-mobile'
import { ClassicInvitation } from '~/templates/classic/components/invitation'
import { ClassicMinimal } from '~/templates/classic/components/minimal'
import { ClassicSaveTheDate } from '~/templates/classic/components/save-the-date'
import { classicTheme } from '~/templates/classic/theme'
import type { WeddingTemplate } from '~/templates/types'

export const classicTemplate: WeddingTemplate = {
  ...classicMeta,
  theme: classicTheme,
  components: {
    Home: ClassicHome,
    HomeMobile: ClassicHomeMobile,
    Minimal: ClassicMinimal,
    SaveTheDate: ClassicSaveTheDate,
    Invitation: ClassicInvitation,
  },
}
