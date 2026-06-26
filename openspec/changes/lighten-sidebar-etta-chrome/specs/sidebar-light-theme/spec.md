## ADDED Requirements

### Requirement: Sidebar uses warm-beige background in light mode
In light mode, the sidebar SHALL render with `bg-sidebar` (warm beige, L=0.97) as its background color. The sidebar SHALL NOT use `bg-sidebar-ink` or any near-black background in light mode.

#### Scenario: Sidebar background in light mode
- **WHEN** a user views any authenticated page in light mode
- **THEN** the sidebar background SHALL be the warm beige `--sidebar` token, visually matching the cream content area family

#### Scenario: Sidebar background in dark mode is unchanged
- **WHEN** a user views any authenticated page in dark mode
- **THEN** the sidebar background SHALL remain the dark tone defined by the `.dark` token override (no regression)

---

### Requirement: Sidebar text uses light-surface tokens
All text rendered inside the sidebar SHALL use tokens calibrated for a light background. `text-muted-foreground` is correct for light surfaces and SHALL be used for inactive labels. `text-foreground/60` and `text-foreground/50` are acceptable alternatives. `text-sidebar-cream/*` tokens SHALL NOT appear in sidebar components (they are reserved for the Etta dark panel).

#### Scenario: Inactive nav item text
- **WHEN** a nav item is not the active route
- **THEN** its label SHALL render in a muted foreground tone readable against the warm-beige sidebar background

#### Scenario: Section label text
- **WHEN** a nav section label ("Planning", "Guests", "Settings") is rendered
- **THEN** it SHALL be visible at minimum `text-xs` (12px) size with muted foreground contrast

#### Scenario: User name and role label
- **WHEN** the user avatar footer is rendered in the sidebar
- **THEN** the user's first name and role label SHALL be readable against the warm-beige background

---

### Requirement: Active nav item uses warm-on-cream treatment
The active navigation item SHALL use `text-primary` (warm rust) text on a `bg-primary/10` (warm blush) background, with a `border-primary` left border indicator. It SHALL NOT use white (`text-primary-foreground`) text.

#### Scenario: Active nav item appearance
- **WHEN** the current route matches a nav item's href
- **THEN** the item SHALL display with a warm rust left border, warm blush background, and rust-colored label text

---

### Requirement: Sidebar chrome details use design-system tokens
All borders, chip card backgrounds, and button borders inside the sidebar SHALL use standard design-system tokens (`border-border`, `bg-secondary`). Glass-on-dark tokens (`border-white/10`, `bg-white/[0.07]`, `border-white/25`) SHALL NOT be used in the sidebar when in light mode.

#### Scenario: Wedding chip card background
- **WHEN** the wedding chip card is rendered in the sidebar
- **THEN** it SHALL use `bg-secondary` and `border-border` for its container

#### Scenario: Sign-out button border
- **WHEN** the sign-out button is rendered
- **THEN** its border SHALL use `border-border` (not `border-white/25`)

---

### Requirement: Minimum text size of 12px in sidebar
No text element inside the sidebar SHALL be rendered below `text-xs` (12px / 0.75rem). This applies to section labels, user role labels, and any badge or meta text.

#### Scenario: Section label minimum size
- **WHEN** a nav section label is rendered
- **THEN** its font size SHALL be at least 12px

#### Scenario: User role label minimum size
- **WHEN** the user role label is rendered in the avatar footer
- **THEN** its font size SHALL be at least 12px
