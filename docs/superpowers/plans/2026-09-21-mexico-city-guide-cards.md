# Mexico City Guide Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render each Mexico City area as a Voyage card with initially collapsed Culture and Food recommendation lists.

**Architecture:** Keep the template-owned recommendation data and rendering in `mexico-city.tsx`. Replace prose fields with typed recommendation arrays and render each non-empty category through one reusable native `<details>` component so disclosure behavior remains accessible without client-side state.

**Tech Stack:** React Server Components, TypeScript, Tailwind CSS, native HTML disclosure elements, Jest and Testing Library.

## Global Constraints

- Render one card for each of the six areas named in the approved spec.
- Culture and Food disclosures start collapsed and expand independently.
- Render each recommendation as `Name — one-line description` in a bullet list.
- Omit empty categories.
- Preserve the practical notes below the cards and the Voyage visual language.
- Do not add database, website-builder schema or client-state changes.

---

### Task 1: Mexico City recommendation cards

**Files:**
- Modify: `src/templates/voyage/components/mexico-city.tsx`
- Modify: `tests/unit/templates/voyage-mexico-guide.test.tsx`

**Interfaces:**
- Consumes: `VoyageMexicoCity(): JSX.Element`, existing Voyage `Band`, typography and decoration primitives.
- Produces: typed `Recommendation`, `Neighbourhood` and reusable `RecommendationDisclosure` rendering.

- [ ] **Step 1: Write the failing behavior test**

Add a test that renders `VoyageMexicoCity`, asserts all six area headings are present, finds Culture and Food disclosures inside representative cards, verifies neither has the `open` attribute, and verifies bullets such as `Museo Tamayo — Contemporary art museum` and `El Cardenal — Traditional Mexican restaurant`.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
rtk npm run test:unit -- --runInBand tests/unit/templates/voyage-mexico-guide.test.tsx
```

Expected: the new assertions fail because the current guide contains prose rather than disclosure lists.

- [ ] **Step 3: Implement typed recommendation data and disclosure rendering**

In `mexico-city.tsx`, define:

```ts
type Recommendation = { name: string; description: string }
type Neighbourhood = {
  name: string
  culture: Recommendation[]
  food: Recommendation[]
}
```

Populate Culture and Food arrays from the reviewed Mexico City source content. Add a `RecommendationDisclosure` that returns `null` for an empty list and otherwise renders a native, initially closed `<details>` with an uppercase summary, plus/close affordance, and a semantic `<ul>` of `Name — description` items. Render each neighbourhood in a bordered cream card in the existing responsive grid. Leave Getting Around and Before You Go unchanged.

- [ ] **Step 4: Run focused and related verification**

Run:

```bash
rtk npm run test:unit -- --runInBand tests/unit/templates tests/unit/app/voyage-content-page.test.tsx
rtk proxy npx tsc --noEmit
rtk proxy npx biome check src/templates/voyage/components/mexico-city.tsx tests/unit/templates/voyage-mexico-guide.test.tsx
rtk git diff --check
```

Expected: all commands pass.

- [ ] **Step 5: Browser-check responsive behavior**

Open the Mexico page at desktop and 390px mobile widths. Confirm Culture and Food begin collapsed, expand independently, use keyboard-native disclosure behavior, and do not cause horizontal overflow.

- [ ] **Step 6: Commit the implementation when authorized**

Stage only the Mexico City component, its tests and this plan, then commit with:

```bash
rtk git -c commit.gpgsign=false commit -m "feat(voyage): organize Mexico City recommendations"
```
