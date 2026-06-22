## Goal

Guests receive a household-specific digital save-the-date link. Opening the link authenticates that browser for the household for one year, shows the wedding save-the-date information, and lets the household update names, contact details, and mailing address for future physical invitations. The flow does not collect RSVPs.

## Scope

This feature is for known households already in the guest list. It does not replace the existing open self-fill registration link and does not create new households from the public site.

The save-the-date displays:

- Date: May 30, 2027
- Location: Puebla, Mexico
- Couple names from the wedding record
- Household guest names from the household record

## Architecture

Use signed household invite tokens instead of a new token table. A token contains the wedding ID, household ID, purpose, and expiration timestamp. It is signed with an HMAC using the app auth secret, so guests cannot change household IDs or extend expiration.

The first link opens at `/{websiteSubUrl}/invite/{token}`. A route handler validates the token, confirms that the household belongs to the wedding behind `websiteSubUrl`, sets a one-year `httpOnly` cookie for that browser, and redirects to `/{websiteSubUrl}/invite`.

The authenticated invite pages read the cookie, revalidate the token, and load only the matching household. This allows the same invite to be opened in more than one browser; every browser that opens the link gets its own cookie.

## Public Flow

1. Guest opens the household link.
2. The app validates the token and sets `household_invite_{websiteSubUrl}` for one year.
3. The guest lands on a save-the-date page.
4. The page shows May 30, 2027 in Puebla, Mexico, the couple names, and the household names.
5. The guest clicks "Update our details".
6. The guest updates only the household address and existing household member name/contact fields.
7. The app saves the update and returns to the save-the-date page with confirmation.

## Dashboard Flow

Add a copy action in the household detail panel. The action asks the server for a one-year signed invite link for that household and writes it to the clipboard.

## Authorization Rules

- Public invite tokens must validate signature, purpose, and expiration.
- The token wedding ID must match the website sub URL.
- The token household ID must belong to that wedding.
- Updates may only touch the household resolved from the token or cookie.
- Updates may only change existing guests in that household; no public add/delete guest behavior is included.
- RSVP statuses, invitations, tags, notes, gifts, and dashboard-only fields are not editable from the invite flow.

## UI

The save-the-date page is guest-facing, mobile-first, and styled like personal stationery. It uses the existing OSWP tokens and avoids dashboard chrome. The form is simple and prefilled so guests can correct spelling, email, phone, and mailing address quickly.

## Testing

Unit tests cover token creation/verification and the public update service scope checks. Page tests cover cookie-setting behavior and authenticated rendering. Focused verification includes the relevant Jest tests plus `npm run check`.
