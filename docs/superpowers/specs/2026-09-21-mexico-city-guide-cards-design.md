# Mexico City guide cards

## Goal

Make the Mexico City recommendations easier to scan by grouping activities and restaurants by neighbourhood while preserving Voyage’s editorial visual language.

## Content structure

The Mexico City guide will render one card for each area:

- Chapultepec & Polanco
- Centro Histórico
- Paseo de la Reforma
- Coyoacán
- Teotihuacán
- San Ángel

Each card contains two independently expandable native disclosure sections:

1. **Culture** — museums, landmarks, parks, markets and activities.
2. **Food** — restaurants, cafés and other food recommendations.

Both disclosures start collapsed. Every recommendation is a bullet using the concise format `Name — one-line description`. A category with no recommendations is omitted rather than shown empty.

## Interaction and presentation

Cards use the existing Voyage cream surface, fine border, display-serif area heading and terracotta interaction accents. Disclosure summaries are keyboard accessible and use a plus/close affordance consistent with the template. Opening a category expands only that card and does not close other open categories.

The practical “Getting around” and “Before you go” notes remain below the neighbourhood cards.

## Implementation

Recommendation data will be represented as typed culture and food item arrays in the Mexico City guide component. A small reusable disclosure-list component will render both categories consistently. No database or website-builder schema changes are required because this guide is currently template-owned content.

## Verification

- Every neighbourhood renders as a card.
- Culture and Food start collapsed and expand independently.
- Recommendations render as bulleted `Name — description` lines.
- Empty categories are not rendered.
- Keyboard interaction and disclosure semantics remain native.
- The two-column desktop layout and single-column mobile layout have no horizontal overflow.
- Existing Voyage template tests, TypeScript and formatting checks pass.
