# Guest Drawer Option A Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable direct in-drawer save for existing household contact/address/notes, remove full-editor update actions, and route RSVP edits to Events pages.

**Architecture:** Keep one drawer draft model and one baseline snapshot in `GuestsView`, then gate save/discard UI on an editable-fields-only dirty check. Move from global display/edit mode to section-level edit toggles for `contactAddress` and `notes` only. Persist via `api.household.update` and keep RSVP UI read-only with an Events deep-link CTA.

**Tech Stack:** React 19, TypeScript, Next.js App Router (`next/navigation`), tRPC React (`~/trpc/react`), Sonner toasts, Jest + Testing Library.

---

### Task 1: Replace global drawer mode with section-level edit state

**Files:**
- Modify: `src/components/guest-list/guests-view.tsx`
- Modify: `src/components/guest-list/guest-detail-panel-content.tsx`
- Test: `tests/unit/components/guest-list/guests-view.test.tsx`

**Step 1: Write the failing test**

```tsx
it('shows section edit controls instead of a global edit button', () => {
  renderGuestsView()
  openAlexDrawer()

  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Edit Contact & Address' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Edit Notes' })).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "section edit controls"`
Expected: FAIL because the current UI still exposes global `Edit` flow.

**Step 3: Write minimal implementation**

```tsx
// guests-view.tsx
const [editingSections, setEditingSections] = useState<Set<'contactAddress' | 'notes'>>(new Set())

const toggleSectionEditing = useCallback((section: 'contactAddress' | 'notes') => {
  setEditingSections((prev) => {
    const next = new Set(prev)
    if (next.has(section)) next.delete(section)
    else next.add(section)
    return next
  })
}, [])

// guest-detail-panel-content.tsx props
editingSections: Set<'contactAddress' | 'notes'>
onToggleSectionEditing: (section: 'contactAddress' | 'notes') => void
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "section edit controls"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/guest-list/guests-view.tsx src/components/guest-list/guest-detail-panel-content.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "refactor(guests): replace global drawer edit mode with section editing"
```

### Task 2: Add editable-field dirty tracking and footer save/discard actions

**Files:**
- Modify: `src/components/guest-list/guests-view.tsx`
- Test: `tests/unit/components/guest-list/guests-view.test.tsx`

**Step 1: Write the failing test**

```tsx
it('shows save/discard footer only when editable fields are dirty', () => {
  renderGuestsView()
  openAlexDrawer()

  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
    target: { value: 'new@email.com' },
  })

  expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "dirty"`
Expected: FAIL because footer currently renders mode actions, not dirty-state actions.

**Step 3: Write minimal implementation**

```tsx
const [baselineDraft, setBaselineDraft] = useState<DrawerDraft>(EMPTY_DRAFT)

const editableKeys: Array<keyof DrawerDraft> = [
  'email',
  'phone',
  'address1',
  'address2',
  'city',
  'state',
  'zipCode',
  'country',
  'notes',
]

const isDirty = useMemo(
  () => editableKeys.some((key) => drawerDraft[key] !== baselineDraft[key]),
  [baselineDraft, drawerDraft]
)

const handleDiscardChanges = () => {
  setDrawerDraft(baselineDraft)
  setEditingSections(new Set())
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "dirty"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/guest-list/guests-view.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "feat(guests): add drawer dirty-state save and discard actions"
```

### Task 3: Persist contact/address/notes via household update mutation

**Files:**
- Modify: `src/components/guest-list/guests-view.tsx`
- Test: `tests/unit/components/guest-list/guests-view.test.tsx`

**Step 1: Write the failing test**

```tsx
it('saves edited contact/address/notes in drawer and clears dirty state', async () => {
  renderGuestsView()
  openAlexDrawer()
  fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
    target: { value: 'updated@example.com' },
  })

  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

  await screen.findByText('updated@example.com')
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "saves edited"`
Expected: FAIL because save mutation is not wired in drawer.

**Step 3: Write minimal implementation**

```tsx
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '~/trpc/react'

const router = useRouter()
const updateHousehold = api.household.update.useMutation({
  onSuccess: () => {
    toast.success('Guest details saved')
    setBaselineDraft(drawerDraft)
    setEditingSections(new Set())
    router.refresh()
  },
  onError: () => {
    toast.error('Failed to save guest details')
  },
})

const handleSaveChanges = () => {
  if (!selectedHousehold) return
  const guestParty = selectedHousehold.guests.map((guest) => ({
    guestId: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.isPrimaryContact ? drawerDraft.email || null : guest.email,
    phone: guest.isPrimaryContact ? drawerDraft.phone || null : guest.phone,
    isPrimaryContact: guest.isPrimaryContact,
    ageGroup: guest.ageGroup ?? 'ADULT',
    tagIds: guest.guestTags?.map((tag) => tag.tagId) ?? [],
    invites: Object.fromEntries(
      guest.invitations.map((invitation) => [invitation.eventId, invitation.rsvp ?? 'Not Invited'])
    ),
  }))

  updateHousehold.mutate({
    householdId: selectedHousehold.id,
    address1: drawerDraft.address1 || null,
    address2: drawerDraft.address2 || null,
    city: drawerDraft.city || null,
    state: drawerDraft.state || null,
    zipCode: drawerDraft.zipCode || null,
    country: drawerDraft.country || null,
    notes: drawerDraft.notes || null,
    guestParty,
    gifts: selectedHousehold.gifts.map((gift) => ({
      eventId: gift.eventId,
      thankyou: gift.thankyou,
      description: gift.description ?? null,
    })),
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "saves edited"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/guest-list/guests-view.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "feat(guests): save household profile edits directly from drawer"
```

### Task 4: Remove full-editor update actions and add RSVP Events CTA

**Files:**
- Modify: `src/components/guest-list/guests-view.tsx`
- Modify: `src/components/guest-list/guest-detail-panel-content.tsx`
- Test: `tests/unit/components/guest-list/guests-view.test.tsx`

**Step 1: Write the failing test**

```tsx
it('does not show full-editor update actions and routes RSVP management to Events', () => {
  renderGuestsView()
  openAlexDrawer()

  expect(screen.queryByRole('button', { name: 'Open Full Editor' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Continue in Full Editor' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Manage RSVPs in Events' })).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "Manage RSVPs in Events"`
Expected: FAIL because full-editor buttons and old RSVP affordances still exist.

**Step 3: Write minimal implementation**

```tsx
// guests-view.tsx
const getRsvpManageHref = () => {
  if (selectedEventId !== 'all') return `/events?eventId=${selectedEventId}&tab=rsvps`
  return '/events?tab=rsvps'
}

// guest-detail-panel-content.tsx
type GuestDetailPanelContentProps = {
  ...
  rsvpManageHref: string
}

<GuestDetailSection
  title='Seating & Event'
  action={
    <a href={rsvpManageHref} className='text-primary text-xs underline-offset-2 hover:underline'>
      Manage RSVPs in Events
    </a>
  }
>
```

**Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "Manage RSVPs in Events"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/guest-list/guests-view.tsx src/components/guest-list/guest-detail-panel-content.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "refactor(guests): remove update-time full-editor paths and add RSVP events link"
```

### Task 5: Add unsaved-close guard and full regression pass

**Files:**
- Modify: `src/components/guest-list/guests-view.tsx`
- Modify: `tests/unit/components/guest-list/guests-view.test.tsx`
- Verify: `tests/unit/components/guest-list/v2/guest-detail-drawer.test.tsx`

**Step 1: Write the failing test**

```tsx
it('prompts before closing when drawer has unsaved changes', () => {
  renderGuestsView()
  openAlexDrawer()
  fireEvent.click(screen.getByRole('button', { name: 'Edit Notes' }))
  fireEvent.change(screen.getByPlaceholderText('No notes yet'), {
    target: { value: 'Updated note' },
  })

  fireEvent.click(screen.getByRole('button', { name: 'Close guest details' }))

  expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Discard and close' })).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx -t "unsaved changes"`
Expected: FAIL because close currently exits immediately.

**Step 3: Write minimal implementation**

```tsx
const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

const handleDrawerOpenChange = useCallback(
  (open: boolean) => {
    if (!open && isDirty) {
      setShowDiscardConfirm(true)
      return
    }
    setIsDrawerOpen(open)
    if (!open) {
      setSelectedHouseholdId(undefined)
      setEditingSections(new Set())
    }
  },
  [isDirty]
)

// Add confirmation UI with Keep editing / Discard and close actions.
```

**Step 4: Run tests to verify pass**

Run: `npm run test:unit -- tests/unit/components/guest-list/guests-view.test.tsx`
Expected: PASS.

Run: `npm run test:unit -- tests/unit/components/guest-list/v2/guest-detail-drawer.test.tsx`
Expected: PASS.

Run: `npm run lint`
Expected: PASS with no new lint errors.

**Step 5: Commit**

```bash
git add src/components/guest-list/guests-view.tsx tests/unit/components/guest-list/guests-view.test.tsx
git commit -m "feat(guests): guard drawer close when profile edits are unsaved"
```
