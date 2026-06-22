## Why

Guests need a household-specific digital save-the-date link that can be opened from email or messages without requiring a normal app login. Opening the link should authenticate that browser for the invited household, show the wedding save-the-date information, and let the household correct names and mailing details so physical invitations can be sent later.

## What Changes

- **New: Household invite links** — dashboard users can copy a signed invite link for a known household.
- **New: Browser authentication cookie** — opening a valid invite link stores a one-year, HTTP-only household invite cookie for that browser.
- **New: Save-the-date page** — invited households see the couple, household names, May 30, 2027, and Puebla, Mexico.
- **New: Household details update form** — invited households can update mailing address and existing household member name/contact details.
- **Security: Household scoping** — invite access is restricted to the token household and website subdomain; guests cannot edit other households or dashboard-only fields.
- **No RSVP** — the flow is for save-the-date delivery and address collection only.

## Capabilities

### New Capabilities

- `household-save-the-date-invites`: Household-specific public invite flow with signed tokens, one-year browser cookies, save-the-date rendering, and scoped detail updates.

### Modified Capabilities

<!-- None -->

## Impact

- Public routes under `/{websiteSubUrl}/invite`.
- New household invite token helper and application service.
- New guest-facing household details form components.
- Guest-list household detail panel gains a copy invite link action.
- Middleware permits public invite token and invite update routes while preserving household cookie scoping.
- Unit tests cover token verification, service authorization, pages, middleware, and guest-list integration.
