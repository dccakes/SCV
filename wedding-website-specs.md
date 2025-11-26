# Wedding Website Feature Specifications

**Project Name**: Cielo Air - Diego & Holly Wedding Website  
**Created**: November 2024  
**Target Completion**: March 2026  
**Status**: Draft  

---

## Project Overview

A wedding website disguised as a boutique airline ("Cielo Air") for Diego Carvallo and Holly Summers' destination wedding in Mexico (Puebla or Oaxaca, May 2027). The site serves 100-150 international guests traveling from CDMX, London, Amsterdam, Lyon, Atlanta, Seattle, and NYC.

### Technical Stack
- **Framework**: Next.js (App Router)
- **Hosting**: Vercel
- **Database**: Supabase
- **Flights API**: Duffel
- **Maps**: Mapbox
- **RSVP Backend**: RSVPify API integration
- **AI**: Claude API (concierge + future WhatsApp agent)
- **Languages**: English & Spanish (per-guest preference)

### Key Concepts
- **Staged Onboarding**: Guests progress through Contact Gather → Save the Date → Invite → Post-RSVP stages
- **Guest Groups**: Household/booking parties where one primary member manages RSVPs and travel for all
- **Personalized QR Codes**: Each guest (except children) has a unique QR code that adapts behavior based on onboarding stage
- **Subtle Airline Theme**: Retro glam, elegant - guests discover the wedding "joke" gradually

---

## Feature Specifications

1. [Guest Data Model & QR Code System](#feature-specification-guest-data-model--qr-code-system)
2. [Stage 1: Contact Gathering](#feature-specification-stage-1-contact-gathering)
3. [Stage 2: Save the Date + Flight Search](#feature-specification-stage-2-save-the-date--flight-search)
4. [Stage 3: RSVP / Flight Check-In](#feature-specification-stage-3-rsvp--flight-check-in)
5. [AI Travel Concierge](#feature-specification-ai-travel-concierge)
6. [Admin Dashboard](#feature-specification-admin-dashboard)
7. [Internationalization (i18n)](#feature-specification-internationalization)

---

# Feature Specification: Guest Data Model & QR Code System

**Feature Branch**: `001-guest-data-model`  
**Created**: November 2024  
**Status**: Draft  
**Input**: User description: "Personalized QR codes for each guest that adapt based on onboarding stage. Guest groups (booking parties) where one primary can manage RSVPs/travel for all. Children don't get QR codes. Dietary restrictions are per-person."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Imports Guest List (Priority: P1)

Diego imports the guest list from Google Docs into the system. The system creates guest records, assigns them to guest groups, generates unique QR codes for eligible guests, and sets initial language preferences.

**Why this priority**: Without guest data, no other feature works. This is the foundation.

**Independent Test**: Admin can upload a CSV, see guests created in the database, and download generated QR codes.

**Acceptance Scenarios**:

1. **Given** an admin with a CSV file containing guest names, groups, and metadata, **When** they upload the file, **Then** the system creates Guest and GuestGroup records with correct relationships.

2. **Given** a guest marked as `can_be_primary: false` (e.g., a child), **When** the import completes, **Then** that guest has no QR code generated.

3. **Given** a guest with a specified language preference in the CSV, **When** the import completes, **Then** that preference is stored on their record.

4. **Given** a guest group with multiple members, **When** no primary is specified, **Then** the system sets `primary_guest_id` to null (to be determined on first engagement).

---

### User Story 2 - Guest Scans QR Code (Priority: P1)

A guest receives their printed invitation and scans the QR code. The system identifies them, checks their onboarding stage, sets a browser cookie for future visits, and routes them to the appropriate experience.

**Why this priority**: Core interaction pattern - every guest touchpoint flows through this.

**Independent Test**: Scan a test QR code, verify correct guest is identified, cookie is set, and routing matches their stage.

**Acceptance Scenarios**:

1. **Given** a guest at Stage 1 (contact gather), **When** they scan their QR code, **Then** they are routed to the contact information form with their name pre-filled.

2. **Given** a guest at Stage 2 (save the date), **When** they scan their QR code, **Then** they see the save the date page with flight search and AI concierge available.

3. **Given** a guest at Stage 3 (invite received), **When** they scan their QR code, **Then** they are routed to the RSVP flow (or their dashboard if already RSVPed).

4. **Given** a guest who has already RSVPed, **When** they scan their QR code, **Then** they see their personalized dashboard with boarding pass, itinerary, and travel tools.

5. **Given** a guest scanning their QR code, **When** the page loads, **Then** a secure cookie is set so future visits auto-recognize them.

---

### User Story 3 - Guest Returns Without QR Code (Priority: P2)

A guest who previously scanned their QR code returns to the website directly (no QR scan). The system recognizes them via cookie and provides their personalized experience.

**Why this priority**: Important for repeat engagement, but secondary to initial QR flow.

**Independent Test**: After initial QR scan, clear URL but keep cookies, revisit site, verify personalization persists.

**Acceptance Scenarios**:

1. **Given** a returning guest with a valid cookie, **When** they visit the homepage, **Then** they see "Welcome back, [Name]" and their personalized dashboard.

2. **Given** a returning guest whose cookie has expired or been cleared, **When** they visit the homepage, **Then** they see a generic landing page with an option to "Find my invitation" (re-enter code or scan QR).

---

### User Story 4 - Primary Guest Assignment (Priority: P2)

When the first eligible member of a guest group engages with the system, they are prompted to confirm they are managing RSVPs/travel for the group, and become the primary.

**Why this priority**: Enables group RSVP flow, but the data model itself is P1.

**Independent Test**: Create a group with no primary, have one member scan QR, verify prompt appears and primary is assigned.

**Acceptance Scenarios**:

1. **Given** a guest group with no assigned primary, **When** an eligible member (can_be_primary: true) first engages, **Then** the system prompts "Will you be managing RSVPs and travel for your group?"

2. **Given** the engaging guest confirms, **When** they submit, **Then** they are set as `primary_guest_id` on the GuestGroup.

3. **Given** admin has pre-assigned a primary, **When** a different eligible member engages first, **Then** the system prompts "We expected [Primary Name] to manage your group. Is that still correct, or would you like to take over?"

4. **Given** a guest who cannot be primary (e.g., child) somehow accesses the system, **When** they engage, **Then** they are shown a message to have their parent/guardian manage their RSVP.

---

### Edge Cases

- What happens when a QR code is scanned by someone other than the intended guest? → Show guest name, ask "Are you [Name]?" with option to switch.
- What happens if a guest group has no eligible primaries? → Flag for admin review; should not occur with proper data setup.
- What happens if cookies are disabled? → Fall back to QR code or manual code entry for each visit.
- What happens if a guest is removed from a group? → Reassign primary if they were primary; orphan guest becomes their own single-person group.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique, URL-safe token for each guest where `can_be_primary: true`.
- **FR-002**: System MUST encode QR codes containing a URL with the guest's unique token (e.g., `https://cieloair.com/g/{token}`).
- **FR-003**: System MUST NOT generate QR codes for guests where `can_be_primary: false`.
- **FR-004**: System MUST store and check `onboarding_stage` per guest to determine routing behavior.
- **FR-005**: System MUST set a secure, HTTP-only cookie upon QR code scan containing an encrypted guest identifier.
- **FR-006**: System MUST support guest groups with one-to-many relationship (one group, many guests).
- **FR-007**: System MUST track `primary_guest_id` on each guest group, nullable until first engagement.
- **FR-008**: System MUST prompt for primary confirmation when first eligible group member engages and no primary is set.
- **FR-009**: System MUST allow admin to manually override primary assignment.
- **FR-010**: System MUST store dietary restrictions per individual guest, not per group.
- **FR-011**: System MUST store language preference (`en` or `es`) per individual guest.
- **FR-012**: System MUST support CSV import of guest data with columns: name, email, phone, group_name, can_be_primary, language_preference, suggested_primary.
- **FR-013**: System MUST allow admin to bulk-download generated QR codes as PNG files (for print) with guest names as filenames.

### Key Entities

- **Guest**: Individual person (name, email, phone, language_preference, dietary_restrictions, can_be_primary, onboarding_stage, unique_token, guest_group_id)
- **GuestGroup**: Booking party / household (name, primary_guest_id, travel_plans, accommodation_info)
- **OnboardingStage**: Enum (CONTACT_GATHER, SAVE_THE_DATE, INVITED, RSVP_COMPLETE)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of eligible guests have unique QR codes generated within 1 minute of import completion.
- **SC-002**: QR code scan to personalized page load completes in under 2 seconds.
- **SC-003**: Returning guests with valid cookies are recognized and personalized in under 500ms.
- **SC-004**: Zero guests marked `can_be_primary: false` receive QR codes.
- **SC-005**: Admin can import 150 guests and download all QR codes in under 5 minutes total.

---

# Feature Specification: Stage 1 Contact Gathering

**Feature Branch**: `002-contact-gathering`  
**Created**: November 2024  
**Status**: Draft  
**Input**: User description: "First stage - digital way to gather contact info (mailing addresses etc.) before save the dates. Should have some branding but can be simpler than full site."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Submits Contact Information (Priority: P1)

A guest receives a digital link (email/text) to provide their mailing address and contact details. They land on a branded but simple form, see their name pre-filled, and submit their information.

**Why this priority**: Must collect addresses before physical save-the-dates can be sent.

**Independent Test**: Send test link, submit form, verify data appears in admin dashboard and guest record is updated.

**Acceptance Scenarios**:

1. **Given** a guest clicking their personalized link, **When** the page loads, **Then** they see a form with their name pre-filled and fields for mailing address, email, and phone.

2. **Given** a guest viewing the form, **When** the page renders, **Then** they see subtle Cielo Air branding (logo, colors) but not the full airline experience.

3. **Given** a guest filling out the form, **When** they submit valid data, **Then** their guest record is updated and they see a confirmation message.

4. **Given** a guest who has already submitted, **When** they revisit their link, **Then** they see their submitted info with an option to edit.

5. **Given** a guest submitting the form, **When** complete, **Then** their `onboarding_stage` advances to `SAVE_THE_DATE` (or remains there awaiting admin trigger).

---

### User Story 2 - Guest Submits for Group (Priority: P2)

A primary guest can optionally provide contact info for other members of their guest group (e.g., spouse's email) if those members don't have their own links.

**Why this priority**: Reduces friction for households where one person handles logistics.

**Independent Test**: Primary submits form, toggle to add group member info, verify both records updated.

**Acceptance Scenarios**:

1. **Given** a primary guest with group members, **When** they view the form, **Then** they see an option "Also provide info for [Group Member Names]?"

2. **Given** the primary opts to provide group info, **When** they submit, **Then** all specified group members' records are updated.

---

### User Story 3 - Admin Monitors Collection Progress (Priority: P2)

Admin can view a dashboard showing which guests have submitted contact info and which are outstanding.

**Why this priority**: Needed to know when to send reminders and when collection is complete.

**Independent Test**: View dashboard, verify counts match submitted vs pending, export list of pending guests.

**Acceptance Scenarios**:

1. **Given** an admin viewing the contact gather dashboard, **When** the page loads, **Then** they see counts: X submitted, Y pending, Z% complete.

2. **Given** pending guests exist, **When** admin clicks "View Pending", **Then** they see a list with names and last contact attempt date.

3. **Given** admin wants to send reminders, **When** they select pending guests, **Then** they can trigger reminder emails/texts.

---

### Edge Cases

- What happens if a guest submits an international address? → Form supports international address formats (no US-specific validation).
- What happens if a guest submits incomplete data? → Required fields enforced; optional fields (phone) can be skipped.
- What happens if two group members both try to submit for the group? → Last write wins; admin notified of conflict.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a contact collection form with fields: mailing address (street, city, state/province, postal code, country), email, phone (optional).
- **FR-002**: System MUST pre-fill guest name from their record.
- **FR-003**: System MUST support international address formats without US-centric validation.
- **FR-004**: System MUST validate email format before submission.
- **FR-005**: System MUST display subtle Cielo Air branding (logo, color palette) without full airline UI.
- **FR-006**: System MUST update guest record upon successful submission.
- **FR-007**: System MUST show confirmation page with submitted details and edit option.
- **FR-008**: System MUST allow primary guests to submit contact info for their group members.
- **FR-009**: System MUST provide admin dashboard showing collection progress (submitted/pending counts).
- **FR-010**: System MUST allow admin to export list of guests with pending contact info.
- **FR-011**: System MUST support admin-triggered reminder notifications (email/SMS).
- **FR-012**: System MUST display form in guest's preferred language (EN/ES).

### Key Entities

- **ContactInfo**: Mailing address fields, added to Guest entity or as separate related record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of guests can complete the contact form in under 2 minutes.
- **SC-002**: Form submission success rate > 99% (no silent failures).
- **SC-003**: Admin can view collection status and identify pending guests in under 30 seconds.
- **SC-004**: System supports addresses from all guest origin countries (US, UK, Netherlands, France, Mexico) without validation errors.

---

# Feature Specification: Stage 2 Save the Date + Flight Search

**Feature Branch**: `003-save-the-date-flight-search`  
**Created**: November 2024  
**Status**: Draft  
**Input**: User description: "Save the date stage unlocks flight search and AI concierge. Want embedded search widget with custom UI using Duffel API. Visual maps showing routes from origin cities. Point guests in right direction for booking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Views Save the Date (Priority: P1)

A guest at Stage 2 visits the site and sees the save the date announcement with wedding date, destination teaser, and clear call-to-action to start planning travel.

**Why this priority**: Core purpose of this stage - communicate the date and build excitement.

**Independent Test**: Guest at Stage 2 scans QR, lands on save the date page with correct date, location teaser, and navigation to flight search.

**Acceptance Scenarios**:

1. **Given** a guest at SAVE_THE_DATE stage, **When** they access the site, **Then** they see a branded save the date page with wedding date (May 2027) and destination (Mexico - specific city TBD).

2. **Given** the save the date page, **When** rendered, **Then** it includes the Cielo Air branding with retro-glam airline aesthetic.

3. **Given** the save the date page, **When** guest views it, **Then** they see clear CTAs: "Plan Your Flight", "Explore Destination", "Ask Our Concierge".

---

### User Story 2 - Guest Searches for Flights (Priority: P1)

A guest uses the flight search feature to find flights from their origin city to the wedding destination. The search displays real-time results from Duffel API in a custom airline-themed UI.

**Why this priority**: Core differentiating feature - actually useful flight search for guests.

**Independent Test**: Select origin city, search flights for wedding date range, verify real results displayed from Duffel.

**Acceptance Scenarios**:

1. **Given** a guest on the flight search page, **When** it loads, **Then** they see a search form with origin (dropdown of served cities), destination (pre-filled: OAX or PBC), and date range (pre-filled: wedding week).

2. **Given** guest's origin city is known from their record, **When** the page loads, **Then** the origin is pre-selected to their city.

3. **Given** a guest submits a search, **When** results return from Duffel, **Then** they see flights displayed in airline-themed UI (departure/arrival times, airline, price, duration).

4. **Given** flight results, **When** guest clicks a flight, **Then** they are deep-linked to the airline or OTA to complete booking (Duffel affiliate link).

5. **Given** no direct flights exist, **When** results display, **Then** connecting flights are shown with layover information clearly indicated.

---

### User Story 3 - Guest Views Route Map (Priority: P2)

A guest views an interactive map showing "routes served" from all origin cities to Mexico, styled like a classic airline route map.

**Why this priority**: Visual delight and reinforces airline theme, but not blocking for functionality.

**Independent Test**: Load map page, verify all origin cities displayed with route lines to destination, click city to trigger flight search.

**Acceptance Scenarios**:

1. **Given** a guest viewing the route map, **When** the page loads, **Then** they see a Mapbox map with animated route lines from LHR, AMS, Lyon, ATL, Seattle, NYC, CDMX to destination.

2. **Given** the route map, **When** guest clicks an origin city marker, **Then** flight search is triggered for that origin.

3. **Given** the route map, **When** guest hovers over a route, **Then** they see tooltip with "X hrs direct" or "via [Hub]" information.

---

### User Story 4 - Guest Records Travel Plans (Priority: P2)

After finding flights, a guest can record their intended travel dates (not booking - just intent) so the couple can plan logistics like ground transport.

**Why this priority**: Useful for planning but not blocking guest experience.

**Independent Test**: Guest enters arrival/departure dates, verify data saved to guest group record, visible in admin dashboard.

**Acceptance Scenarios**:

1. **Given** a guest on the flight search page, **When** they find suitable flights, **Then** they see an option "Let us know your travel plans".

2. **Given** a guest entering travel plans, **When** they submit arrival date, departure date, and flight details (optional), **Then** data is saved to their GuestGroup record.

3. **Given** a guest group with travel plans recorded, **When** admin views dashboard, **Then** they see aggregated arrival/departure data for logistics planning.

---

### Edge Cases

- What happens if Duffel API is unavailable? → Show cached results if available, otherwise display fallback message with links to Google Flights.
- What happens if a guest's origin city isn't in the served list? → Show "Other" option that allows any airport code, or link to general flight search.
- What happens if the destination airport isn't finalized (Puebla vs Oaxaca)? → Admin can update destination; cached searches invalidated on change.
- What happens if prices change between search and click-through? → Disclaimer that prices are indicative; final price on booking site.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate with Duffel API for real-time flight search.
- **FR-002**: System MUST support flight searches from predefined origin cities: CDMX (MEX), London (LHR), Amsterdam (AMS), Lyon (LYS), Atlanta (ATL), Seattle (SEA), New York (JFK/EWR/LGA).
- **FR-003**: System MUST allow destination to be configured by admin (OAX or PBC initially).
- **FR-004**: System MUST pre-fill search dates based on wedding week with +/- flexibility.
- **FR-005**: System MUST pre-select origin based on guest's recorded origin city if known.
- **FR-006**: System MUST display flight results including: airline, departure/arrival times, duration, number of stops, price.
- **FR-007**: System MUST provide deep-links to booking sites for flight purchase (Duffel affiliate links).
- **FR-008**: System MUST render flight results in custom UI matching Cielo Air aesthetic.
- **FR-009**: System MUST display interactive route map using Mapbox showing all served routes.
- **FR-010**: System MUST animate route lines on map in airline route map style.
- **FR-011**: System MUST allow clicking origin city on map to trigger flight search.
- **FR-012**: System MUST allow guests to record intended travel dates (arrival, departure).
- **FR-013**: System MUST handle Duffel API failures gracefully with fallback to Google Flights links.
- **FR-014**: System MUST cache flight searches to reduce API costs (cache TTL: 1 hour).
- **FR-015**: System MUST display all UI in guest's preferred language (EN/ES).

### Key Entities

- **FlightSearch**: Cached search results (origin, destination, dates, results_json, searched_at)
- **TravelPlans**: Added to GuestGroup (arrival_date, departure_date, arrival_flight_info, departure_flight_info, notes)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Flight search returns results in under 3 seconds (95th percentile).
- **SC-002**: 80% of guests who search for flights record their travel plans.
- **SC-003**: Route map loads and animates in under 2 seconds.
- **SC-004**: Duffel API cost per guest averages under $0.50 (via caching and reasonable search limits).
- **SC-005**: 90% of guests find the flight search "helpful" or "very helpful" (post-wedding survey).

---

# Feature Specification: Stage 3 RSVP / Flight Check-In

**Feature Branch**: `004-rsvp-checkin`  
**Created**: November 2024  
**Status**: Draft  
**Input**: User description: "RSVP styled as flight check-in. Integrate with RSVPify API for reliability. Multiple events to RSVP for. Guest groups where primary RSVPs for all. Dietary restrictions per person. Generate boarding pass on completion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Primary Guest Completes RSVP for Group (Priority: P1)

The primary guest of a group goes through the RSVP flow, confirming attendance for each group member across multiple events, providing dietary restrictions for each, and receiving a confirmation/boarding pass.

**Why this priority**: Core wedding website function - must reliably capture RSVPs.

**Independent Test**: Primary scans QR, completes RSVP for self + group members, verify all data persisted in RSVPify and local DB, boarding pass generated.

**Acceptance Scenarios**:

1. **Given** a primary guest at INVITED stage, **When** they access the site, **Then** they are prompted to "Check In for Your Flight" (RSVP).

2. **Given** the RSVP flow, **When** primary begins, **Then** they see all group members listed with attendance toggle for each.

3. **Given** multiple events (welcome drinks, ceremony, reception, brunch), **When** RSVP flow progresses, **Then** primary selects attendance per event for each attending group member.

4. **Given** dietary restrictions step, **When** displayed, **Then** primary enters dietary needs for each attending guest individually.

5. **Given** RSVP completion, **When** submitted, **Then** data is sent to RSVPify API and mirrored to local Supabase.

6. **Given** successful RSVP, **When** complete, **Then** primary sees confirmation and can download/view "boarding passes" for each attending guest.

7. **Given** successful RSVP, **When** complete, **Then** guest's `onboarding_stage` updates to `RSVP_COMPLETE`.

---

### User Story 2 - Guest Declines Invitation (Priority: P1)

A guest who cannot attend declines the invitation through a streamlined flow.

**Why this priority**: Must capture declines, not just acceptances.

**Independent Test**: Start RSVP, select "Cannot Attend", verify decline recorded, appropriate confirmation shown.

**Acceptance Scenarios**:

1. **Given** RSVP flow start, **When** guest indicates they cannot attend, **Then** flow shortcuts to decline confirmation.

2. **Given** a decline, **When** submitted, **Then** all group members are marked as not attending.

3. **Given** a decline, **When** confirmed, **Then** guest sees a warm message ("We'll miss you!") without further RSVP steps.

---

### User Story 3 - Guest Modifies RSVP (Priority: P2)

A guest who has already RSVPed returns to modify their response (change attendance, update dietary restrictions, etc.).

**Why this priority**: Important but less common than initial RSVP.

**Independent Test**: After RSVP complete, return to site, modify attendance for one event, verify update persisted.

**Acceptance Scenarios**:

1. **Given** a guest with completed RSVP, **When** they access the site, **Then** they see their dashboard with "Modify RSVP" option.

2. **Given** RSVP modification, **When** guest changes attendance or dietary info, **Then** changes sync to RSVPify and local DB.

3. **Given** RSVP modification, **When** complete, **Then** boarding pass regenerates with updated info.

4. **Given** RSVP modification attempted after admin-set deadline, **When** guest tries to modify, **Then** they see message to contact couple directly.

---

### User Story 4 - Guest Views Boarding Pass (Priority: P2)

After RSVPing, guests can view and download their personalized boarding pass with event details.

**Why this priority**: Delightful feature that reinforces theme, but not blocking.

**Independent Test**: After RSVP, view boarding pass, verify correct guest name, events, QR code present, downloadable as image/PDF.

**Acceptance Scenarios**:

1. **Given** a guest with completed RSVP, **When** they view their boarding pass, **Then** it displays: guest name, "flight" details (wedding date/venue), events attending, dietary notes, unique QR code.

2. **Given** boarding pass view, **When** guest clicks download, **Then** they receive a print-ready PDF or image.

3. **Given** a guest group, **When** primary views boarding passes, **Then** they can see/download passes for all group members.

---

### Edge Cases

- What happens if RSVPify API is unavailable during submission? → Queue submission, retry with exponential backoff, show "confirmation pending" state.
- What happens if a non-primary group member tries to RSVP? → Prompt them that [Primary Name] is managing the group, offer to notify primary or take over as primary.
- What happens if group composition changes after RSVP? → Admin can adjust; guest prompted to update RSVP.
- What happens if an event is capacity-limited? → Show availability, waitlist if full.
- What happens if guest RSVPs "yes" to some events but "no" to ceremony? → Allow (it's their choice), but flag for admin awareness.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate with RSVPify API for RSVP data storage and management.
- **FR-002**: System MUST mirror RSVP data to local Supabase database for querying and redundancy.
- **FR-003**: System MUST support RSVP for multiple events (configurable by admin).
- **FR-004**: System MUST allow primary guest to RSVP for all members of their guest group.
- **FR-005**: System MUST collect per-guest dietary restrictions for each attending guest.
- **FR-006**: System MUST support both "attending" and "not attending" responses.
- **FR-007**: System MUST handle RSVPify API failures gracefully with retry queue.
- **FR-008**: System MUST generate personalized boarding pass upon RSVP completion.
- **FR-009**: System MUST include QR code on boarding pass linking to guest's dashboard.
- **FR-010**: System MUST allow boarding pass download as PDF.
- **FR-011**: System MUST allow RSVP modification until admin-configured deadline.
- **FR-012**: System MUST display RSVP flow in guest's preferred language (EN/ES).
- **FR-013**: System MUST track RSVP status per guest per event.
- **FR-014**: System MUST update `onboarding_stage` to RSVP_COMPLETE upon submission.
- **FR-015**: System MUST notify admin of new RSVPs (email digest or real-time).

### Key Entities

- **RSVP**: Per-guest, per-event attendance record (guest_id, event_id, status: attending/declined/pending, dietary_restrictions, submitted_at, rsvpify_id)
- **Event**: Wedding event (name, date, time, location, capacity, description)
- **BoardingPass**: Generated asset (guest_id, image_url, pdf_url, generated_at)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: RSVP submission success rate > 99.5% (including retry recovery).
- **SC-002**: Primary guest can complete RSVP for a group of 4 in under 5 minutes.
- **SC-003**: Zero data loss between RSVPify and local database (verified by reconciliation job).
- **SC-004**: Boarding pass generation completes within 10 seconds of RSVP submission.
- **SC-005**: 90% of guests successfully RSVP without contacting couple for help.

---

# Feature Specification: AI Travel Concierge

**Feature Branch**: `005-ai-concierge`  
**Created**: November 2024  
**Status**: Draft  
**Input**: User description: "AI concierge to help guests plan Mexico trip. Should know about destination, activities, restaurants, packing, local tips. Also knows Diego & Holly's story. Responds in guest's language. Personality of a helpful wedding assistant. Future: WhatsApp agent."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Asks Destination Questions (Priority: P1)

A guest chats with the AI concierge to get recommendations for restaurants, activities, and travel tips for the wedding destination and surrounding areas.

**Why this priority**: Core value proposition of the AI feature.

**Independent Test**: Ask concierge "What are the best restaurants near the venue?", verify relevant, accurate response drawing from knowledge base.

**Acceptance Scenarios**:

1. **Given** a guest accessing the AI concierge, **When** they ask about restaurants, **Then** the AI provides curated recommendations from the knowledge base with descriptions and context.

2. **Given** a guest asking about activities, **When** they inquire about day trips, **Then** the AI suggests options appropriate to the region (cenotes, ruins, markets, etc.).

3. **Given** a guest asking about practical matters, **When** they ask about tipping or currency, **Then** the AI provides accurate Mexico travel tips.

4. **Given** a guest planning extended travel, **When** they ask "We're staying 4 extra days, what should we do?", **Then** the AI creates a suggested itinerary.

---

### User Story 2 - Guest Asks About Diego & Holly (Priority: P2)

A guest asks the AI about the couple's story, how they met, the proposal, or why they chose Mexico.

**Why this priority**: Adds personality and wedding context, but secondary to travel help.

**Independent Test**: Ask "How did Diego and Holly meet?", verify response matches provided couple story.

**Acceptance Scenarios**:

1. **Given** a guest asking about the couple's story, **When** they ask "How did you two meet?", **Then** the AI responds with the couple's story in a warm, personal tone.

2. **Given** a guest asking about the wedding, **When** they ask "Why Mexico?", **Then** the AI explains the couple's connection to the destination.

3. **Given** personal questions, **When** asked something not in the knowledge base, **Then** the AI gracefully indicates it doesn't know that detail.

---

### User Story 3 - Guest Asks About Wedding Logistics (Priority: P1)

A guest asks the AI about wedding-specific information: schedule, dress code, venue details, accommodation.

**Why this priority**: Critical for guest experience alongside travel questions.

**Independent Test**: Ask "What's the dress code for the ceremony?", verify accurate response matching event data.

**Acceptance Scenarios**:

1. **Given** a guest asking about the schedule, **When** they ask "What time is the ceremony?", **Then** the AI provides accurate event details.

2. **Given** a guest asking about logistics, **When** they ask "Where should I stay?", **Then** the AI provides accommodation recommendations with pros/cons.

3. **Given** a guest asking about dress code, **When** they inquire, **Then** the AI provides appropriate guidance per event.

---

### User Story 4 - Concierge Responds in Guest's Language (Priority: P1)

The AI concierge detects the language the guest is using and responds in that language, defaulting to their stored preference.

**Why this priority**: Critical for international guest experience.

**Independent Test**: Guest with Spanish preference asks question in Spanish, verify response in Spanish.

**Acceptance Scenarios**:

1. **Given** a guest with Spanish preference, **When** they ask a question in Spanish, **Then** the AI responds in Spanish.

2. **Given** a guest with English preference who writes in Spanish, **When** they submit, **Then** the AI responds in Spanish (matching input language).

3. **Given** ambiguous language, **When** detected, **Then** the AI uses stored preference as tiebreaker.

---

### User Story 5 - Concierge Maintains Conversation Context (Priority: P2)

The AI maintains context within a conversation and across sessions (for the same guest/group).

**Why this priority**: Better experience but MVP can work without cross-session memory.

**Independent Test**: Ask follow-up question without restating context, verify AI remembers previous messages.

**Acceptance Scenarios**:

1. **Given** a multi-turn conversation, **When** guest asks "What about vegetarian options there?", **Then** AI understands "there" refers to previously discussed restaurant.

2. **Given** a returning guest, **When** they start a new chat, **Then** AI can reference previous conversations ("Last time you asked about cenotes...").

3. **Given** a guest group, **When** different group members chat, **Then** conversation history is shared within the group.

---

### Edge Cases

- What happens if guest asks something inappropriate? → Standard Claude safety; gracefully decline.
- What happens if guest asks about something not in knowledge base? → AI acknowledges limitation, offers to help find info or suggests web search.
- What happens if AI hallucinates incorrect info about venue/events? → Knowledge base takes precedence; system prompt emphasizes accuracy over creativity.
- What happens if guest asks in a language other than EN/ES? → Attempt to respond in that language with disclaimer that EN/ES are best supported.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide chat interface for AI concierge accessible from Save the Date stage onward.
- **FR-002**: System MUST use Claude API for conversation handling.
- **FR-003**: System MUST maintain a curated knowledge base including: destination info, venue details, accommodation options, restaurant recommendations, activity suggestions, travel tips, couple's story.
- **FR-004**: System MUST inject relevant knowledge base content into AI context via RAG or structured system prompt.
- **FR-005**: System MUST detect input language and respond in same language.
- **FR-006**: System MUST support at minimum English and Spanish fluently.
- **FR-007**: System MUST store conversation history per guest group.
- **FR-008**: System MUST include guest context in AI system prompt (name, group members, RSVP status if applicable).
- **FR-009**: System MUST give AI a consistent personality: warm, helpful, knowledgeable "wedding assistant" persona.
- **FR-010**: System MUST prioritize knowledge base accuracy over AI creativity for factual questions.
- **FR-011**: System MUST rate-limit AI usage to prevent abuse (e.g., max 50 messages/day/guest).
- **FR-012**: System MUST log conversations for admin review (with privacy considerations noted to guests).

### Key Entities

- **ConversationMessage**: (guest_group_id, role: user/assistant, content, language, timestamp)
- **KnowledgeBase**: (category, title, content_en, content_es, metadata)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AI response latency under 3 seconds (95th percentile).
- **SC-002**: 90% of guest questions answered satisfactorily without escalation to couple.
- **SC-003**: Zero factual errors about wedding logistics (venue, times, events) in AI responses.
- **SC-004**: Language detection accuracy > 95%.
- **SC-005**: Average conversation length > 3 messages (indicates engagement).
- **SC-006**: AI API cost per guest averages under $1 total.

---

# Feature Specification: Admin Dashboard

**Feature Branch**: `006-admin-dashboard`  
**Created**: November 2024  
**Status**: Draft  
**Input**: User description: "Admin needs to import guests, view RSVP progress, manage events, see travel plans, configure site settings, download QR codes, review AI conversations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Imports and Manages Guest List (Priority: P1)

Diego imports guests from a CSV, assigns them to groups, and generates QR codes.

**Why this priority**: Foundation for all guest-facing features.

**Independent Test**: Upload CSV with 10 test guests, verify records created, QR codes downloadable.

**Acceptance Scenarios**:

1. **Given** an admin on the guest management page, **When** they upload a CSV, **Then** guests and groups are created per the file.

2. **Given** import complete, **When** admin views guest list, **Then** they see all guests with group assignments, onboarding stage, and RSVP status.

3. **Given** guest list, **When** admin clicks "Download QR Codes", **Then** they receive a ZIP file with PNG QR codes named by guest.

4. **Given** a guest record, **When** admin edits it, **Then** they can update name, group, language preference, can_be_primary flag.

5. **Given** guest list, **When** admin filters by stage or RSVP status, **Then** list updates accordingly.

---

### User Story 2 - Admin Monitors RSVP Progress (Priority: P1)

Admin views real-time RSVP statistics and can drill into details.

**Why this priority**: Core wedding planning need.

**Independent Test**: View RSVP dashboard, verify counts match database, export guest list by status.

**Acceptance Scenarios**:

1. **Given** RSVP dashboard, **When** loaded, **Then** admin sees: total invited, RSVPs received, attending, declined, pending, by-event breakdowns.

2. **Given** RSVP data, **When** admin clicks an event, **Then** they see list of guests attending that event with dietary info.

3. **Given** RSVP data, **When** admin exports, **Then** they receive CSV with all guest RSVPs, dietary restrictions, and event attendance.

4. **Given** RSVPify integration, **When** admin views dashboard, **Then** data reflects RSVPify as source of truth (with local cache).

---

### User Story 3 - Admin Configures Events (Priority: P1)

Admin creates and manages wedding events that guests RSVP to.

**Why this priority**: Required before RSVP flow works.

**Independent Test**: Create event with name, date, time, location, capacity; verify appears in RSVP flow.

**Acceptance Scenarios**:

1. **Given** event management page, **When** admin creates an event, **Then** they specify: name, date, time, location, description, dress code, capacity (optional).

2. **Given** existing events, **When** admin edits an event, **Then** changes reflect in guest-facing content.

3. **Given** events, **When** admin reorders them, **Then** RSVP flow respects the order.

---

### User Story 4 - Admin Views Travel Plans (Priority: P2)

Admin sees aggregated travel plan data to help with logistics.

**Why this priority**: Helpful for planning but not blocking.

**Independent Test**: View travel dashboard, verify arrival/departure dates aggregated correctly.

**Acceptance Scenarios**:

1. **Given** travel dashboard, **When** loaded, **Then** admin sees arrivals/departures by date as a chart.

2. **Given** travel data, **When** admin views details, **Then** they see which guests arrive when, for ground transport planning.

3. **Given** travel data, **When** admin exports, **Then** they receive CSV with guest, arrival date, departure date, flight info.

---

### User Story 5 - Admin Manages Knowledge Base (Priority: P2)

Admin adds/edits content for the AI concierge knowledge base.

**Why this priority**: Important for AI quality but can start with static seed data.

**Independent Test**: Add restaurant recommendation in EN/ES, verify AI references it in responses.

**Acceptance Scenarios**:

1. **Given** knowledge base editor, **When** admin creates entry, **Then** they provide: category, title, content (EN), content (ES).

2. **Given** existing entry, **When** admin edits, **Then** changes reflect in subsequent AI conversations.

3. **Given** categories, **When** admin views, **Then** they see: Restaurants, Activities, Accommodations, Travel Tips, Couple Story, Wedding Logistics.

---

### User Story 6 - Admin Reviews AI Conversations (Priority: P3)

Admin can browse AI conversation logs to monitor quality and guest needs.

**Why this priority**: Nice to have for quality assurance.

**Independent Test**: View conversation list, filter by guest, read conversation thread.

**Acceptance Scenarios**:

1. **Given** conversation log page, **When** loaded, **Then** admin sees list of recent conversations with guest name and preview.

2. **Given** conversation selected, **When** viewed, **Then** admin sees full thread.

3. **Given** conversations, **When** admin searches, **Then** they can find conversations by keyword.

---

### Edge Cases

- What happens if admin deletes a guest with existing RSVPs? → Soft delete; RSVP data preserved for records.
- What happens if two admins edit simultaneously? → Last write wins; consider optimistic locking for v2.
- What happens if RSVPify sync fails? → Alert admin; show last successful sync time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require authentication for admin access (Supabase Auth or similar).
- **FR-002**: System MUST support CSV import for guest data with validation and error reporting.
- **FR-003**: System MUST display guest list with filtering by stage, RSVP status, group, language.
- **FR-004**: System MUST allow bulk QR code download as ZIP file.
- **FR-005**: System MUST display RSVP statistics dashboard with real-time data.
- **FR-006**: System MUST allow export of guest/RSVP data as CSV.
- **FR-007**: System MUST provide event CRUD (create, read, update, delete) interface.
- **FR-008**: System MUST display travel plans aggregated by date.
- **FR-009**: System MUST provide knowledge base CRUD interface with EN/ES content fields.
- **FR-010**: System MUST display AI conversation logs with search capability.
- **FR-011**: System MUST sync with RSVPify and display sync status.
- **FR-012**: System MUST send admin notifications for new RSVPs (configurable: email digest, real-time).

### Key Entities

- **Admin**: (user_id, email, role, created_at)
- **AuditLog**: (admin_id, action, entity_type, entity_id, changes, timestamp)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can import 150 guests and generate all QR codes in under 10 minutes.
- **SC-002**: RSVP dashboard loads in under 2 seconds.
- **SC-003**: Admin can find any guest's status within 30 seconds.
- **SC-004**: CSV exports complete in under 10 seconds for full guest list.
- **SC-005**: Zero data discrepancies between RSVPify and local database (verified by daily reconciliation).

---

# Feature Specification: Internationalization (i18n)

**Feature Branch**: `007-internationalization`  
**Created**: November 2024  
**Status**: Draft  
**Input**: User description: "Site must support English and Spanish. Language preference is per-guest. AI responds in language guest uses. All UI text needs translation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Sees Site in Preferred Language (Priority: P1)

A guest with Spanish preference sees all UI text, labels, and static content in Spanish.

**Why this priority**: Core requirement for international guest list.

**Independent Test**: Set guest preference to Spanish, load pages, verify all visible text is Spanish.

**Acceptance Scenarios**:

1. **Given** a guest with `language_preference: es`, **When** they load any page, **Then** all UI text renders in Spanish.

2. **Given** a guest with `language_preference: en`, **When** they load any page, **Then** all UI text renders in English.

3. **Given** a new/unknown visitor, **When** they visit without personalization, **Then** they see a language selector or browser-detected default.

---

### User Story 2 - Guest Switches Language (Priority: P2)

A guest can switch their language preference at any time.

**Why this priority**: Flexibility for guests, but most will stick with default.

**Independent Test**: Toggle language, verify page re-renders in new language, preference persisted.

**Acceptance Scenarios**:

1. **Given** any page, **When** guest clicks language toggle (EN/ES), **Then** page content switches to selected language.

2. **Given** language switch, **When** completed, **Then** preference is saved to guest record for future visits.

3. **Given** anonymous visitor, **When** they switch language, **Then** preference stored in cookie until identified.

---

### User Story 3 - Content Displays in Correct Language (Priority: P1)

Dynamic content (events, knowledge base entries) displays in the guest's language.

**Why this priority**: Critical for content-heavy pages.

**Independent Test**: Create event with EN/ES descriptions, view as Spanish-preference guest, verify Spanish shown.

**Acceptance Scenarios**:

1. **Given** an event with `description_en` and `description_es`, **When** Spanish guest views, **Then** they see Spanish description.

2. **Given** knowledge base entry, **When** AI retrieves it for Spanish guest, **Then** Spanish content is used.

3. **Given** content with missing translation, **When** displayed, **Then** fallback to English with subtle indicator.

---

### Edge Cases

- What happens if translation is missing? → Fallback to English; log for admin awareness.
- What happens if guest's browser language differs from stored preference? → Stored preference wins.
- What happens with user-generated content (dietary notes)? → Not translated; displayed as entered.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support English (en) and Spanish (es) languages.
- **FR-002**: System MUST store language preference per guest.
- **FR-003**: System MUST render all UI text (labels, buttons, messages) in guest's preferred language.
- **FR-004**: System MUST use Next.js i18n routing or equivalent for language management.
- **FR-005**: System MUST provide language toggle accessible from all pages.
- **FR-006**: System MUST store both EN and ES versions of admin-created content (events, knowledge base).
- **FR-007**: System MUST fallback to English when translation is missing.
- **FR-008**: System MUST detect browser language for anonymous visitors as initial default.
- **FR-009**: System MUST pass language context to AI concierge for response generation.
- **FR-010**: System MUST ensure date/time formatting respects locale (e.g., DD/MM/YYYY vs MM/DD/YYYY).

### Key Entities

- **Translation**: (key, content_en, content_es) for static UI strings
- Bilingual fields on existing entities: Event (description_en, description_es), KnowledgeBase (content_en, content_es)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of UI strings have Spanish translations before launch.
- **SC-002**: Language switch applies in under 500ms (no full page reload).
- **SC-003**: Zero guest complaints about language/translation issues.
- **SC-004**: AI responds in correct language 99% of the time.

---

# Appendix A: AI Knowledge Base Template

The following template should be completed to seed the AI concierge's knowledge base.

## Couple Story

```markdown
### How We Met
[Tell the story of how Diego and Holly met - where, when, circumstances]

### Our Journey
[Key milestones: first date, moving in together, travels, etc.]

### The Proposal
[How and where did the proposal happen?]

### Why Mexico
[Why did you choose Mexico / Puebla / Oaxaca for your wedding?]

### Fun Facts
- [Fun fact 1 about the couple]
- [Fun fact 2]
- [Shared interests, traditions, inside jokes guests might ask about]
```

## Wedding Logistics

```markdown
### Venue
- **Name**: [Venue name]
- **Location**: [Address]
- **Description**: [What makes it special]
- **Getting There**: [Directions, transport options]

### Events
For each event, provide:
- **Name**: [e.g., Welcome Drinks]
- **Date & Time**: [Day, time]
- **Location**: [If different from main venue]
- **Dress Code**: [Specific guidance]
- **What to Expect**: [Brief description]

### Accommodations
For each recommended hotel:
- **Name**: [Hotel name]
- **Price Range**: [Budget/Mid/Luxury]
- **Distance to Venue**: [X minutes]
- **Pros**: [Why you recommend it]
- **Booking Link**: [URL]
- **Group Rate Code**: [If applicable]
```

## Destination Guide

```markdown
### Getting There
- **Nearest Airport**: [Code - Name]
- **Alternative Airports**: [If applicable]
- **From Airport to Venue**: [Options: taxi, shuttle, rental car, bus]
- **Approximate Cost**: [Range]
- **Travel Time**: [Duration]

### Restaurants
For each recommendation:
- **Name**: [Restaurant]
- **Cuisine**: [Type]
- **Price Range**: [$, $$, $$$]
- **Best For**: [Romantic dinner, group, casual lunch]
- **Must-Try Dish**: [Specific recommendation]
- **Location**: [Neighborhood/proximity to venue]
- **Reservation Needed**: [Yes/No]

### Activities
For each activity:
- **Name**: [Activity]
- **Description**: [What it is]
- **Duration**: [Half day, full day, etc.]
- **Best For**: [Adventurous, families, culture lovers]
- **Cost**: [Approximate]
- **How to Book**: [Walk-up, advance booking, tour company]

### Day Trips
For each day trip option:
- **Destination**: [Place]
- **Distance**: [From wedding location]
- **Highlights**: [What to see/do]
- **Recommended Duration**: [Half day, full day, overnight]

### Practical Tips
- **Currency**: [Pesos, USD acceptance, exchange tips]
- **Tipping**: [Customs and amounts]
- **Language**: [Spanish basics, English prevalence]
- **Safety**: [Any specific advice]
- **Weather in May**: [What to expect]
- **What to Pack**: [Specific recommendations]
- **Health**: [Water, sun, altitude if applicable]
```

## Frequently Asked Questions

```markdown
### Travel
- Q: Do I need a visa?
  A: [Answer based on common guest nationalities]

- Q: What's the best way to get from the airport?
  A: [Specific recommendation]

- Q: Should I rent a car?
  A: [Honest assessment]

### Wedding
- Q: What should I wear?
  A: [Dress code guidance by event]

- Q: Can I bring my kids?
  A: [Policy]

- Q: What's the gift policy?
  A: [Registry info or preference]

### Practical
- Q: Is tap water safe?
  A: [Advice]

- Q: Will my phone work?
  A: [International roaming, local SIM advice]

- Q: What's the weather like in May?
  A: [Temperature, rain, what to expect]
```

---

# Appendix B: Data Model Overview

```
┌─────────────────┐       ┌─────────────────┐
│   GuestGroup    │       │     Guest       │
├─────────────────┤       ├─────────────────┤
│ id              │───┐   │ id              │
│ name            │   │   │ name            │
│ primary_guest_id│   └──<│ guest_group_id  │
│ travel_plans    │       │ email           │
│ accommodation   │       │ phone           │
│ created_at      │       │ language_pref   │
└─────────────────┘       │ can_be_primary  │
                          │ unique_token    │
                          │ onboarding_stage│
                          │ dietary_restrict│
                          │ mailing_address │
                          └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │      RSVP       │           │ ConversationMsg │
          ├─────────────────┤           ├─────────────────┤
          │ id              │           │ id              │
          │ guest_id        │           │ guest_group_id  │
          │ event_id        │           │ role            │
          │ status          │           │ content         │
          │ rsvpify_id      │           │ language        │
          │ submitted_at    │           │ timestamp       │
          └────────┬────────┘           └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │     Event       │
          ├─────────────────┤
          │ id              │
          │ name            │
          │ date            │
          │ time            │
          │ location        │
          │ description_en  │
          │ description_es  │
          │ dress_code      │
          │ capacity        │
          │ order           │
          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  KnowledgeBase  │       │  FlightSearch   │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ category        │       │ origin          │
│ title           │       │ destination     │
│ content_en      │       │ date_from       │
│ content_es      │       │ date_to         │
│ metadata        │       │ results_json    │
│ updated_at      │       │ searched_at     │
└─────────────────┘       └─────────────────┘
```

---

# Appendix C: Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Next.js App                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Pages/    │  │    API      │  │  Components │   │  │
│  │  │   App       │  │   Routes    │  │             │   │  │
│  │  └─────────────┘  └──────┬──────┘  └─────────────┘   │  │
│  └──────────────────────────┼────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Supabase    │    │   RSVPify     │    │   External    │
│   Database    │    │     API       │    │    APIs       │
│   + Auth      │    │               │    │               │
└───────────────┘    └───────────────┘    │ - Duffel      │
                                          │ - Claude      │
                                          │ - Mapbox      │
                                          └───────────────┘
```

---

# Appendix D: Project Timeline

| Phase | Dates | Deliverables |
|-------|-------|--------------|
| **Phase 1: Foundation** | Nov 2024 - Dec 2024 | Data model, Auth, Admin guest import, QR generation |
| **Phase 2: Stage 1** | Jan 2025 | Contact gathering flow, basic branding |
| **Phase 3: Stage 2** | Feb - Mar 2025 | Save the date, Flight search, Route map |
| **Phase 4: AI Concierge** | Apr - May 2025 | AI chat, Knowledge base, Conversation history |
| **Phase 5: Stage 3 RSVP** | Jun - Jul 2025 | RSVPify integration, RSVP flow, Boarding passes |
| **Phase 6: Polish** | Aug - Oct 2025 | i18n completion, Admin dashboard, Testing |
| **Phase 7: Beta** | Nov - Dec 2025 | Beta with close friends/family, Bug fixes |
| **Phase 8: Launch** | Jan 2026 | Stage 1 (contact gather) goes live |
| **Buffer** | Feb - Mar 2026 | Final testing, fixes, Stage 2 launch |

**Hard Deadline**: All features working and tested by March 2026.

---

# Appendix E: Open Decisions

| Item | Options | Decision Needed By |
|------|---------|-------------------|
| Destination | Puebla or Oaxaca | Before flight search development |
| Airline Name | Cielo Air (proposed) or alternatives | Before any branding work |
| RSVPify Plan | Which tier needed for API access | Before RSVP development |
| Events List | Which events require RSVP | Before RSVP development |
| Venue Details | Name, location, logistics | Before knowledge base population |

---

# Appendix F: RSVP System Implementation Options

## The Core Decision

There are two fundamentally different approaches to building the RSVP system:

| Approach | Philosophy | Risk Profile |
|----------|------------|--------------|
| **A: Fork & Extend** | Take an existing open-source wedding RSVP codebase and adapt it | Lower initial effort, inherited complexity |
| **B: Orchestrate APIs** | Use proven third-party services, build thin UI layer on top | Higher cost, lower complexity, battle-tested reliability |

---

## Option A: Fork TheNot (Open Source)

**Repository**: https://github.com/Kenford20/TheNot

### What It Is
A full-stack TheKnot clone built by a solo developer as a learning project. It's the most feature-complete open-source wedding RSVP system in the Next.js ecosystem.

### Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- tRPC (type-safe API layer)
- Prisma ORM
- PostgreSQL (Supabase-compatible)
- Clerk (auth)
- AWS S3 (image storage)
- Zod (validation)

### What's Already Built
- ✅ Multi-event RSVP with per-event attendance tracking
- ✅ Guest "parties" (households/groups)
- ✅ Custom questions per event
- ✅ Admin dashboard with charts
- ✅ Guest list CRUD with filtering/sorting
- ✅ Password-protected websites
- ✅ Multi-step RSVP form flow

### What You'd Need to Add
- Staged onboarding (contact gather → save the date → invite → post-RSVP)
- QR code generation and token-based guest identification
- Per-guest `can_be_primary` flag and primary assignment logic
- i18n (EN/ES)
- Per-guest language preference
- Dietary restrictions as structured data (not just custom questions)
- Boarding pass generation
- Flight search integration
- AI concierge
- Airline theming throughout

### Pros
- Significant head start on RSVP data model
- Multi-event and guest group patterns already solved
- No ongoing API costs for RSVP functionality
- Full control over every aspect
- Can be open-sourced after your wedding

### Cons
- **Created as a learning project** - code quality may be inconsistent
- You inherit someone else's architectural decisions
- tRPC adds complexity if team isn't familiar
- Clerk auth may not fit your QR-code-based auth model (likely needs replacing)
- No guarantees of maintenance or bug fixes
- You own all reliability concerns

### Effort Estimate
- **Initial setup & understanding**: 2-3 days
- **Rip out Clerk, add token-based guest auth**: 3-5 days
- **Add staged onboarding**: 3-4 days
- **Add i18n**: 2-3 days
- **Add your custom features**: 2-3 weeks
- **Testing & hardening**: 1-2 weeks

**Total**: ~6-8 weeks of focused development

### Risk Assessment
- **Technical risk**: Medium - you're adapting code you didn't write
- **Reliability risk**: Medium - needs thorough testing
- **Maintenance risk**: Low - you own the code

---

## Option B: Orchestrate Third-Party APIs

### Philosophy
Use battle-tested services for the hard parts (RSVP data management, email, etc.) and build a custom UI layer that orchestrates them. You're a system integrator, not building from scratch.

### Service Options for RSVP Backend

#### B1: Airtable as Backend
**What it is**: Spreadsheet-database hybrid with a proper REST API

**How it works**:
- Create Airtable base with tables: Guests, GuestGroups, Events, RSVPs
- Use Airtable API to read/write from your Next.js app
- Build custom UI that hits Airtable endpoints
- Airtable handles data storage, validation, views

**Pros**:
- Rock-solid reliability (enterprise-grade)
- Holly can view/edit data directly in Airtable UI
- API is well-documented and stable
- Automations built-in (send email on new RSVP)
- Free tier handles 1,200 records (plenty for 150 guests)

**Cons**:
- API rate limits (5 requests/sec)
- Not a "real" database - no joins, limited querying
- Data lives in third-party system
- Paid plans get expensive for advanced features

**Cost**: Free tier likely sufficient; Pro is $20/user/month if needed

#### B2: Supabase as Headless Backend
**What it is**: Postgres database with auto-generated REST API, auth, and realtime

**How it works**:
- Define your schema in Supabase
- Use Supabase client library in Next.js
- Build custom UI components
- Supabase handles auth, storage, database

**Pros**:
- Real Postgres database with full SQL power
- Row-level security for data protection
- Generous free tier (500MB, 50k monthly active users)
- You control the schema entirely
- Can export data anytime

**Cons**:
- You're still building the RSVP logic yourself
- No pre-built RSVP patterns to follow
- More "building" than "orchestrating"

**Cost**: Free tier sufficient; Pro is $25/month

#### B3: RSVPify + Webhooks (Limited)
**What it is**: Use RSVPify as the RSVP backend, sync data via webhooks

**How it works**:
- Guests RSVP through RSVPify-hosted forms (or embedded)
- Webhooks notify your app of new RSVPs
- Your app stores a mirror of RSVP data for display
- RSVPify handles the hard parts (validation, reminders, etc.)

**Pros**:
- RSVPify is purpose-built for wedding RSVPs
- They handle edge cases you haven't thought of
- Reminder emails, meal tracking, etc. included

**Cons**:
- **No direct API** - webhooks only, can't query data
- Can't build fully custom RSVP UI
- Your airline theme would be limited to their forms
- Subscription cost (~$20-50/month)

**Verdict**: Not recommended for your use case - the custom UI requirement disqualifies it.

#### B4: Notion as Backend (Honorable Mention)
Similar to Airtable but with better free tier. API is newer and less mature.

---

## Recommended Hybrid: Airtable + Custom UI

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your Next.js App                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Guest UI   │  │  Admin UI   │  │  API Routes     │  │
│  │  (RSVP flow)│  │  (Dashboard)│  │  (orchestration)│  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  Airtable │   │  Supabase │   │  Resend   │
    │  (RSVPs)  │   │  (Auth,   │   │  (Email)  │
    │           │   │  Sessions)│   │           │
    └───────────┘   └───────────┘   └───────────┘
```

### How It Would Work

1. **Guest & Group data** lives in Airtable
   - Tables: Guests, GuestGroups, Events, RSVPs, DietaryRestrictions
   - Holly can view/edit in Airtable's UI for quick fixes
   - Your app reads/writes via Airtable API

2. **Session & Auth** handled by Supabase
   - QR code tokens stored in Supabase
   - Cookie-based sessions managed by Supabase Auth
   - Lightweight - just for identifying guests

3. **Email** via Resend or similar
   - RSVP confirmations
   - Reminders
   - Triggered by Airtable automations or your app

4. **Your Next.js app** is the orchestration layer
   - Custom airline-themed UI
   - Calls Airtable API for RSVP operations
   - Manages staged onboarding logic
   - Generates boarding passes
   - Integrates AI concierge, flight search, etc.

### Airtable Schema

**Table: Guests**
| Field | Type |
|-------|------|
| id | Auto |
| name | Text |
| email | Email |
| phone | Phone |
| language_preference | Single Select (EN, ES) |
| can_be_primary | Checkbox |
| unique_token | Text |
| onboarding_stage | Single Select |
| mailing_address | Long Text |
| guest_group | Link to GuestGroups |

**Table: GuestGroups**
| Field | Type |
|-------|------|
| id | Auto |
| name | Text |
| primary_guest | Link to Guests |
| travel_arrival | Date |
| travel_departure | Date |
| accommodation_notes | Long Text |

**Table: Events**
| Field | Type |
|-------|------|
| id | Auto |
| name | Text |
| date | Date |
| time | Text |
| location | Text |
| description_en | Long Text |
| description_es | Long Text |
| dress_code | Text |
| order | Number |

**Table: RSVPs**
| Field | Type |
|-------|------|
| id | Auto |
| guest | Link to Guests |
| event | Link to Events |
| status | Single Select (attending, declined, pending) |
| dietary_restrictions | Long Text |
| submitted_at | Created time |

### Pros of This Approach
- **Battle-tested infrastructure** - Airtable doesn't go down
- **Holly can help** - she can manage guest data directly
- **Faster development** - no database modeling, migrations, etc.
- **Easy debugging** - see data directly in Airtable
- **Flexibility** - change schema without migrations
- **Lower risk** - less custom code = fewer bugs

### Cons
- **API rate limits** - 5/sec on free, 50/sec on paid
- **Vendor dependency** - data lives in Airtable
- **Less "pure"** - not a single-stack solution
- **Airtable learning curve** - though it's pretty intuitive

### Effort Estimate
- **Airtable schema setup**: 1 day
- **Supabase auth setup**: 1-2 days
- **Next.js API routes for Airtable**: 3-4 days
- **RSVP UI components**: 1 week
- **Staged onboarding flow**: 3-4 days
- **Admin dashboard**: 3-4 days
- **Testing**: 1 week

**Total**: ~4-5 weeks of focused development

### Cost
- Airtable: Free (or $20/month for Pro if needed)
- Supabase: Free tier
- Resend: Free tier (3,000 emails/month)
- Vercel: Free tier

**Total**: $0-20/month

---

## Comparison Matrix

| Factor | Fork TheNot | Airtable + Custom UI |
|--------|-------------|---------------------|
| **Development time** | 6-8 weeks | 4-5 weeks |
| **Reliability risk** | Medium | Low |
| **Code complexity** | High (inherit tRPC, Clerk) | Medium |
| **Data visibility** | DB queries only | Airtable UI |
| **Holly can help** | No (needs dev access) | Yes |
| **Ongoing cost** | $0 | $0-20/month |
| **Custom UI control** | Full | Full |
| **i18n effort** | Higher (more code) | Lower |
| **Exit strategy** | Own all code | Export from Airtable |
| **Junior dev friendly** | Harder | Easier |

---

## Recommendation

Given:
- You're a full-stack dev who values reliability
- March 2026 deadline (plenty of time but no need to over-engineer)
- International guests (reliability matters)
- Holly might want visibility into RSVP data
- This is a wedding, not a startup (pragmatism > purity)

**I recommend Option B: Airtable + Custom UI**

Reasons:
1. **Lower risk** - Airtable's API is rock-solid
2. **Faster iteration** - change schema in Airtable, not migrations
3. **Holly access** - she can view/edit guest data without you
4. **Junior-dev friendly** - simpler architecture to maintain
5. **Focus on differentiation** - spend time on airline theme, AI concierge, flight search - not reinventing RSVP

You can always migrate to a pure Supabase solution later if needed. Airtable data exports cleanly to CSV.

---

## Alternative: If You Want Full Control

If the Airtable dependency bothers you, use **Supabase directly** but:
1. Don't fork TheNot - too much inherited complexity
2. Use a clean starter like [Nextbase](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter)
3. Build RSVP tables from scratch with clear, simple schema
4. Reference TheNot's patterns for multi-event RSVP logic

This is more work but gives you full ownership.

---

## For the Junior Developer

If you're the developer implementing this, here's your starting checklist:

### If using Airtable approach:
1. [ ] Create Airtable account and base
2. [ ] Set up tables per schema above
3. [ ] Get API key and base ID
4. [ ] Install `airtable` npm package
5. [ ] Create `/lib/airtable.ts` with typed client
6. [ ] Build API routes in `/app/api/` that call Airtable
7. [ ] Build React components that call your API routes
8. [ ] Test with sample guest data

### If forking TheNot:
1. [ ] Fork and clone the repo
2. [ ] Get it running locally (follow their README)
3. [ ] Understand the data model (look at `prisma/schema.prisma`)
4. [ ] Understand tRPC routers (look at `/src/server/`)
5. [ ] Map their concepts to our requirements
6. [ ] Plan what to keep, remove, and add
7. [ ] Create a branch for your modifications

---

*End of Appendix F*

---

*End of Specification Document*
PALLATE

- CSV

52489c,4062bb,59c3c3,ebebeb,f45b69

- With #

#52489c, #4062bb, #59c3c3, #ebebeb, #f45b69

- Array

["52489c","4062bb","59c3c3","ebebeb","f45b69"]

- Object

{"Dusty Grape":"52489c","Smart Blue":"4062bb","Strong Cyan":"59c3c3","Platinum":"ebebeb","Bubblegum Pink":"f45b69"}

- Extended Array

[{"name":"Dusty Grape","hex":"52489c","rgb":[82,72,156],"cmyk":[47,54,0,39],"hsb":[247,54,61],"hsl":[247,37,45],"lab":[36,27,-45]},{"name":"Smart Blue","hex":"4062bb","rgb":[64,98,187],"cmyk":[66,48,0,27],"hsb":[223,66,73],"hsl":[223,49,49],"lab":[43,17,-51]},{"name":"Strong Cyan","hex":"59c3c3","rgb":[89,195,195],"cmyk":[54,0,0,24],"hsb":[180,54,76],"hsl":[180,47,56],"lab":[73,-30,-9]},{"name":"Platinum","hex":"ebebeb","rgb":[235,235,235],"cmyk":[0,0,0,8],"hsb":[0,0,92],"hsl":[0,0,92],"lab":[93,0,0]},{"name":"Bubblegum Pink","hex":"f45b69","rgb":[244,91,105],"cmyk":[0,63,57,4],"hsb":[355,63,96],"hsl":[355,87,66],"lab":[60,60,24]}]

- XML

<palette>
  <color name="Dusty Grape" hex="52489c" r="82" g="72" b="156" />
  <color name="Smart Blue" hex="4062bb" r="64" g="98" b="187" />
  <color name="Strong Cyan" hex="59c3c3" r="89" g="195" b="195" />
  <color name="Platinum" hex="ebebeb" r="235" g="235" b="235" />
  <color name="Bubblegum Pink" hex="f45b69" r="244" g="91" b="105" />
</palette>




- CSV

424b54,e1ce7a,ebcfb2,c5baaf,ffffff

- With #

#424b54, #e1ce7a, #ebcfb2, #c5baaf, #ffffff

- Array

["424b54","e1ce7a","ebcfb2","c5baaf","ffffff"]

- Object

{"Charcoal Blue":"424b54","Golden Sand":"e1ce7a","Desert Sand":"ebcfb2","Silver":"c5baaf","White":"ffffff"}

- Extended Array

[{"name":"Charcoal Blue","hex":"424b54","rgb":[66,75,84],"cmyk":[21,11,0,67],"hsb":[210,21,33],"hsl":[210,12,29],"lab":[31,-1,-7]},{"name":"Golden Sand","hex":"e1ce7a","rgb":[225,206,122],"cmyk":[0,8,46,12],"hsb":[49,46,88],"hsl":[49,63,68],"lab":[83,-5,44]},{"name":"Desert Sand","hex":"ebcfb2","rgb":[235,207,178],"cmyk":[0,12,24,8],"hsb":[31,24,92],"hsl":[31,59,81],"lab":[85,5,18]},{"name":"Silver","hex":"c5baaf","rgb":[197,186,175],"cmyk":[0,6,11,23],"hsb":[30,11,77],"hsl":[30,16,73],"lab":[76,2,7]},{"name":"White","hex":"ffffff","rgb":[255,255,255],"cmyk":[0,0,0,0],"hsb":[0,0,100],"hsl":[0,0,100],"lab":[100,0,0]}]

- XML

<palette>
  <color name="Charcoal Blue" hex="424b54" r="66" g="75" b="84" />
  <color name="Golden Sand" hex="e1ce7a" r="225" g="206" b="122" />
  <color name="Desert Sand" hex="ebcfb2" r="235" g="207" b="178" />
  <color name="Silver" hex="c5baaf" r="197" g="186" b="175" />
  <color name="White" hex="ffffff" r="255" g="255" b="255" />
</palette>