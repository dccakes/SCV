/**
 * Classic Template Plugin
 *
 * The original OSWP wedding site, repackaged as a swappable template: warm
 * cream, editorial serif, soft zinc ink, blush/coral accents.
 */

import { classicMeta } from '~/templates/catalog'
import type { WeddingTemplate } from '~/templates/types'
import { ClassicHome } from './components/home'
import { ClassicHomeMobile } from './components/home-mobile'
import { ClassicInvitation } from './components/invitation'
import { ClassicMinimal } from './components/minimal'
import { ClassicSaveTheDate } from './components/save-the-date'
import { classicTheme } from './theme'

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
