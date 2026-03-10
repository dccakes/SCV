# Guest Drawer Household Members Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated household-members modal from the guest drawer so users can add, edit, reassign primary, and remove members without leaving drawer context.

**Architecture:** Keep drawer editing split by concern: drawer footer continues to own contact/address/notes persistence, while a new members modal owns guest-party editing and save/discard behavior. Member updates persist via `api.household.update` built from canonical household data, then patch local drawer view immediately and refresh from server truth.

**Tech Stack:** Next.js App Router, React 19, TypeScript, tRPC React, shadcn/ui dialog primitives, Jest + Testing Library.

---

### Task 1: Add failing tests for member-modal entrypoint and sync behavior

**Files:**
- Modify: `tests/unit/components/guest-list/guests-view.test.tsx`

**Step 1: Write the failing test**

```tsx
it('opens manage members modal from party section', () => {
  renderGuestsView()
  openAlexDrawer()

  fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))

  expect(screen.getByRole('dialog', { name: 'Manage Household Members' })).toBeInTheDocument()
})

it('updates drawer party members after modal save', async () => {
  renderGuestsView()
  openAlexDrawer()
  fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))

  fireEvent.click(screen.getByRole('button', { name: /add guest/i }))
  fireEvent.change(screen.getByLabelText('First name (member 3)'), { target: { value: 'Taylor' } })
  fireEvent.change(screen.getByLabelText('Last name (member 3)'), { target: { value: 'Rivera' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

  await screen.findByText('Taylor Rivera')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "Manage Household Members|updates drawer party members"`
Expected: FAIL because modal and flow do not exist yet.

**Step 3: Write minimal implementation**

Create test helpers and minimal mocks required for mutation success callbacks used by modal save.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "Manage Household Members|updates drawer party members"`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "test(guests): add failing specs for household members modal flow"
```

### Task 2: Build household members modal component

**Files:**
- Create: `src/components/guest-list/household-members-modal.tsx`
- Modify: `src/components/guest-list/v2/drawer/guest-detail-sections.tsx`
- Modify: `src/components/guest-list/guest-detail-panel-content.tsx`

**Step 1: Write the failing test**

```tsx
it('shows remove disabled for current primary until another member is primary', () => {
  renderGuestsView()
  openMembersModal()

  expect(screen.getByRole('button', { name: 'Remove Alex Rivera' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Set Jamie Rivera as primary' }))
  expect(screen.getByRole('button', { name: 'Remove Alex Rivera' })).toBeEnabled()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "remove disabled for current primary"`
Expected: FAIL.

**Step 3: Write minimal implementation**

```tsx
// household-members-modal.tsx
export type HouseholdMemberDraft = {
  id?: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  ageGroup: 'ADULT' | 'CHILD'
  isPrimaryContact: boolean
}

export function HouseholdMembersModal(props: Readonly<HouseholdMembersModalProps>) {
  // modal-local draft state
  // set-primary action
  // remove guard when target is current primary and no alternate primary selected
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "remove disabled for current primary"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/guest-list/household-members-modal.tsx src/components/guest-list/v2/drawer/guest-detail-sections.tsx src/components/guest-list/guest-detail-panel-content.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "feat(guests): add dedicated household members management modal"
```

### Task 3: Wire modal save to canonical household update and local sync

**Files:**
- Modify: `src/components/guest-list/guests-view.tsx`
- Modify: `src/components/guest-list/guest-detail-panel-content.tsx`
- Modify: `src/components/guest-list/index.tsx`
- Test: `tests/unit/components/guest-list/guests-view.test.tsx`

**Step 1: Write the failing test**

```tsx
it('saves members using canonical household and keeps drawer draft intact', async () => {
  renderGuestsViewWithFilteredAndCanonicalHouseholds()
  openAlexDrawer()

  editDrawerEmail('draft-only@example.com')
  openMembersModal()
  addMember('Taylor', 'Rivera')
  fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

  await screen.findByText('Taylor Rivera')
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('draft-only@example.com')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "keeps drawer draft intact"`
Expected: FAIL.

**Step 3: Write minimal implementation**

```tsx
// guests-view.tsx
const updateHouseholdMutation = api.household.update.useMutation()

const saveMembers = (nextMembers: HouseholdMemberDraft[]) => {
  const canonical = selectedCanonicalHousehold
  if (!canonical) return

  updateHouseholdMutation.mutate(
    {
      householdId: canonical.id,
      // preserve contact/address/notes from canonical or current drawer as required
      // map nextMembers -> guestParty payload
      guestParty: buildGuestPartyPayload(canonical, nextMembers),
      gifts: canonical.gifts.map(...),
    },
    {
      onSuccess: () => {
        patchHouseholdMembersInLocalList(canonical.id, nextMembers)
        router.refresh()
      },
    }
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "keeps drawer draft intact"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/guest-list/guests-view.tsx src/components/guest-list/guest-detail-panel-content.tsx src/components/guest-list/index.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "feat(guests): persist household member changes from drawer modal"
```

### Task 4: Add failure-path and validation guard tests

**Files:**
- Modify: `tests/unit/components/guest-list/guests-view.test.tsx`
- Modify: `src/components/guest-list/household-members-modal.tsx`

**Step 1: Write the failing test**

```tsx
it('keeps modal open and draft values when member save fails', async () => {
  mockMembersMutationFailure()
  renderGuestsView()
  openMembersModal()
  addMember('Taylor', 'Rivera')

  fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

  expect(screen.getByRole('dialog', { name: 'Manage Household Members' })).toBeInTheDocument()
  expect(screen.getByDisplayValue('Taylor')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "member save fails"`
Expected: FAIL.

**Step 3: Write minimal implementation**

Handle mutation `onError` to preserve modal state and display error messaging without closing.

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "member save fails"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/guest-list/household-members-modal.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "test(guests): cover member modal failure and validation guards"
```

### Task 5: Run full targeted verification

**Files:**
- Verify: `tests/unit/components/guest-list/guests-view.test.tsx`
- Verify: `tests/unit/components/guest-list/v2/guest-detail-drawer.test.tsx`
- Verify: `tests/unit/app/events-page-client.test.tsx`

**Step 1: Run guest drawer suites**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx tests/unit/components/guest-list/v2/guest-detail-drawer.test.tsx`
Expected: PASS.

**Step 2: Run related events suite**

Run: `npm run test:unit -- tests/unit/app/events-page-client.test.tsx`
Expected: PASS.

**Step 3: Run lint on touched files**

Run: `npx biome lint src/components/guest-list/household-members-modal.tsx src/components/guest-list/guest-detail-panel-content.tsx src/components/guest-list/guests-view.tsx tests/unit/components/guest-list/guests-view.test.tsx`
Expected: PASS.

**Step 4: Commit verification-only status check**

Run: `git status --short`
Expected: only intended files changed.

**Step 5: Commit**

```bash
git add src/components/guest-list/household-members-modal.tsx src/components/guest-list/guest-detail-panel-content.tsx src/components/guest-list/guests-view.tsx src/components/guest-list/index.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "feat(guests): add household member management modal from drawer"
```

## Notes for Execution

- Required execution discipline: @superpowers:test-driven-development
- Debugging workflow if failures appear: @superpowers:systematic-debugging
- Keep YAGNI: no RSVP editing in modal, no migration of contact/address/notes into modal.
