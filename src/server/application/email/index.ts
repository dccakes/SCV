/**
 * Email application-layer singletons.
 *
 * Imported from `/api/webhooks/resend`. Keeping construction here ensures the
 * inbound handler (and its wired-in triage function) is shared across requests
 * inside the same Lambda instance.
 */

import { triageEmail } from '~/lib/email/triage'
import { InboundEmailHandler } from '~/server/application/email/inbound-email-handler'
import { emailService } from '~/server/domains/email'

export { InboundEmailHandler } from '~/server/application/email/inbound-email-handler'

let _handler: InboundEmailHandler | null = null

export function getInboundEmailHandler(): InboundEmailHandler {
  if (!_handler) {
    _handler = new InboundEmailHandler({ email: emailService, triage: triageEmail })
  }
  return _handler
}
