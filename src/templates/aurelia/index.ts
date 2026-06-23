/**
 * Aurelia Template Plugin
 *
 * A clean, elegant template built around violet and blue: pale lavender
 * backdrop, deep indigo ink, a high-contrast display serif for headings and a
 * calm geometric sans for everything else.
 *
 * Aurelia's surfaces are responsive, so the same Home layout serves desktop and
 * mobile.
 */

import { AureliaHome } from '~/templates/aurelia/components/home'
import { AureliaInvitation } from '~/templates/aurelia/components/invitation'
import { AureliaMinimal } from '~/templates/aurelia/components/minimal'
import { AureliaSaveTheDate } from '~/templates/aurelia/components/save-the-date'
import { aureliaTheme } from '~/templates/aurelia/theme'
import { aureliaMeta } from '~/templates/catalog'
import type { WeddingTemplate } from '~/templates/types'

export const aureliaTemplate: WeddingTemplate = {
  ...aureliaMeta,
  theme: aureliaTheme,
  components: {
    Home: AureliaHome,
    HomeMobile: AureliaHome,
    Minimal: AureliaMinimal,
    SaveTheDate: AureliaSaveTheDate,
    Invitation: AureliaInvitation,
  },
}
