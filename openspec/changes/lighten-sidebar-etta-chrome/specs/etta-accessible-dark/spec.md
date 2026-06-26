## ADDED Requirements

### Requirement: Etta panel uses warmer dark background in light mode
In light mode, the Etta panel SHALL use a dark background defined by `--etta-ink: 0.28 0.025 45` (warm espresso, L=0.28) rather than near-black (`0.19`). The panel SHALL remain visually distinct from the light main content area (intentionally dark), but SHALL NOT appear as a harsh near-black surface. In dark mode, the Etta panel SHALL retain its existing appearance.

#### Scenario: Etta background warmth
- **WHEN** the Etta panel is open in light mode
- **THEN** the background SHALL be a warm dark tone (L≈0.28) — noticeably warmer and lighter than the current near-black

#### Scenario: Etta remains dark relative to content
- **WHEN** the Etta panel is open alongside the main content area
- **THEN** the Etta panel SHALL be clearly darker than the warm-cream content area, maintaining its role as the intentional contrast surface

#### Scenario: Etta dark mode is unchanged
- **WHEN** the user views the Etta panel in dark mode
- **THEN** the panel SHALL retain its pre-change dark appearance with no lightening regression

---

### Requirement: Etta text meets minimum contrast thresholds
All text elements within the Etta panel SHALL meet a minimum estimated contrast ratio of approximately 3.5:1 against the `etta-ink` background. This applies to labels, suggestion chip text, input placeholder, and thinking-block content. The following opacity floors apply to `sidebar-cream/*` tokens used within Etta:

- Primary labels and body text: minimum `/65` opacity
- Secondary/supporting text: minimum `/50` opacity  
- Placeholder text: minimum `/45` opacity (UI component exemption applies but still improved)

#### Scenario: Etta subtitle label contrast
- **WHEN** the "OSWP AI Planner" or "Wedding Concierge" subtitle is rendered in the Etta header
- **THEN** it SHALL use at minimum `sidebar-cream/65` opacity, providing readable contrast against the dark background

#### Scenario: Suggestion chip text contrast
- **WHEN** suggestion chips are displayed in the Etta panel
- **THEN** their label text SHALL use at minimum `sidebar-cream/70` opacity

#### Scenario: Input placeholder contrast
- **WHEN** the Etta chat input field shows placeholder text
- **THEN** the placeholder SHALL use at minimum `sidebar-cream/45` opacity

#### Scenario: Thinking block text contrast
- **WHEN** the collapsible thinking block content is expanded
- **THEN** its text SHALL use at minimum `sidebar-cream/55` opacity

---

### Requirement: Etta status indicator uses design token
The Etta online/offline status indicator color SHALL use the `text-success` design token (not the hardcoded `text-emerald-400` class) for the "online" state, and `text-destructive` for the "offline" state.

#### Scenario: Online status color
- **WHEN** Etta is configured and online
- **THEN** the status label and dot SHALL use `text-success` and `bg-success` tokens respectively

#### Scenario: Offline status color
- **WHEN** Etta is not configured
- **THEN** the status label and dot SHALL use `text-destructive` and `bg-destructive` tokens
