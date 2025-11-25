# Development Guidelines - OSWP (The Open Source Wedding Project)

## Quick Reference

**Architecture (see DOMAIN_MIGRATION_PLAN.md for details):**

```
server/
├── domains/              ← Business entities (Event, Guest, Household, etc.)
│   └── event/
│       ├── event.repository.ts   ← Database access (Prisma queries)
│       ├── event.service.ts      ← Business logic
│       ├── event.validator.ts    ← Zod schemas
│       ├── event.types.ts        ← Domain types
│       └── event.router.ts       ← tRPC router (THIN - orchestration only)
│
├── application/          ← Cross-domain orchestration (Dashboard, RSVP flow)
└── infrastructure/       ← Technical services (Database, S3, Email)
```

**Non-Negotiables:**

- ✅ **Test-first always** (Red-Green-Refactor)
- ✅ **Business logic in Services**, NOT in tRPC routers
- ✅ **Repositories for ALL database access** - no Prisma in services
- ✅ **Schema-first with Zod** - derive types, use `.default()` for forms
- ✅ **react-hook-form + Zod** for all forms
- ✅ No `any` types - use `unknown` if needed
- ✅ No `eslint-disable` - fix the underlying issue
- ✅ Immutable data only
- ✅ Server Components default - `'use client'` only when needed
- ✅ Mark props `Readonly<Props>`

**Layer Rules:**

| Layer | Responsibility | Can Call | Cannot Call |
|-------|---------------|----------|-------------|
| **Router** | Input validation, auth, orchestration | Service | Repository, Other Services |
| **Service** | Business logic, validation | Repository | Router, Other Services (use Application layer) |
| **Repository** | Database queries | Prisma | Service, Router |

**Common Commands:**

```bash
npm run dev             # Development server
npm run lint            # Check for errors
npm run lint:fix        # Fix auto-fixable issues
npm run build           # Production build
```

---

## Project Architecture

### Tech Stack

- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** (strict mode)
- **tRPC** for type-safe API
- **Prisma** + PostgreSQL for database
- **Better Auth** for authentication
- **Zod** for validation
- **Tailwind CSS** for styling

### Domain-Driven Structure

See `DOMAIN_MIGRATION_PLAN.md` for complete architecture details.

**8 Core Domains:**

1. **Event** - Wedding events/ceremonies
2. **Guest** - Individual guests
3. **Household** - Guest groups/addresses
4. **Invitation** - Event invitations & RSVPs
5. **Gift** - Gift tracking
6. **Question** - RSVP questions (Event + Website)
7. **Website** - Wedding website config
8. **User** - User accounts

**3 Application Services:**

1. **Dashboard** - Multi-domain aggregation
2. **RSVP Submission** - Guest RSVP flow
3. **Household Management** - Complex household operations

---

## Layer Responsibilities

### 1. Repository Layer (Database Access)

**Responsibility:** Database queries ONLY

```typescript
// ✅ GOOD - Repository handles database access
// server/domains/event/event.repository.ts
import { db } from '~/server/infrastructure/database/client'
import { type CreateEventInput } from './event.types'

export class EventRepository {
  async create(userId: string, data: CreateEventInput) {
    return db.event.create({
      data: {
        ...data,
        userId,
        date: data.date ? new Date(data.date) : null,
      },
    })
  }

  async findByUserId(userId: string) {
    return db.event.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    })
  }
}

// ❌ BAD - Business logic in repository
async create(userId: string, data: CreateEventInput) {
  // ❌ Validation belongs in service
  if (data.date && new Date(data.date) < new Date()) {
    throw new Error('Event date cannot be in the past')
  }
  return db.event.create({ data })
}
```

---

### 2. Service Layer (Business Logic)

**Responsibility:** Business rules, validation, orchestration

```typescript
// ✅ GOOD - Service contains business logic
// server/domains/event/event.service.ts
import { TRPCError } from '@trpc/server'
import { EventRepository } from './event.repository'
import { type CreateEventInput } from './event.types'

export class EventService {
  constructor(private repo: EventRepository) {}

  async createEvent(userId: string, data: CreateEventInput) {
    // ✅ Business rules in service
    if (data.date) {
      const eventDate = new Date(data.date)
      if (eventDate < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Event date cannot be in the past',
        })
      }
    }

    // ✅ Delegate to repository
    return this.repo.create(userId, data)
  }
}

// ❌ BAD - Service accessing database directly
async createEvent(userId: string, data: CreateEventInput) {
  // ❌ Never access db in service
  return db.event.create({ data: { ...data, userId } })
}

// ❌ BAD - Service calling other services
async createEvent(userId: string, data: CreateEventInput) {
  const event = await this.repo.create(userId, data)
  // ❌ Cross-domain operation - use Application layer
  await invitationService.createForAllGuests(event.id)
  return event
}
```

**Service Rules:**
- ✅ Business logic and validation
- ✅ Call own repository
- ✅ Authorization checks
- ❌ NO database access (use repository)
- ❌ NO calling other services (use Application layer)

---

### 3. Router Layer (tRPC API)

**Responsibility:** Thin orchestration layer - validation, auth, delegation

```typescript
// ✅ GOOD - Thin router delegates to service
// server/domains/event/event.router.ts
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { EventRepository } from './event.repository'
import { EventService } from './event.service'
import { createEventSchema } from './event.validator'

const eventRepository = new EventRepository()
const eventService = new EventService(eventRepository)

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createEventSchema)
    .mutation(({ ctx, input }) => {
      // ✅ Just validate input and delegate
      return eventService.createEvent(ctx.auth.userId, input)
    }),

  getAll: protectedProcedure.query(({ ctx }) => {
    return eventService.getUserEvents(ctx.auth.userId)
  }),
})

// ❌ BAD - Business logic in router
create: protectedProcedure
  .input(createEventSchema)
  .mutation(async ({ ctx, input }) => {
    // ❌ Business rules don't belong here
    if (input.date && new Date(input.date) < new Date()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Date in past' })
    }

    // ❌ Database access doesn't belong here
    return db.event.create({
      data: { ...input, userId: ctx.auth.userId },
    })
  })
```

**Router Rules:**
- ✅ Input validation (Zod)
- ✅ Authentication checks
- ✅ Delegate to service
- ❌ NO business logic
- ❌ NO database access
- ❌ Keep it THIN

---

### 4. Application Services (Cross-Domain)

**Responsibility:** Orchestrate multiple domains

```typescript
// ✅ GOOD - Application service coordinates domains
// server/application/household-management.service.ts
export class HouseholdManagementService {
  constructor(
    private householdService: HouseholdService,
    private guestService: GuestService,
    private invitationService: InvitationService,
    private eventService: EventService
  ) {}

  async createWithGuests(userId: string, data: CreateHouseholdInput) {
    // ✅ Orchestrate multiple domains
    const household = await this.householdService.create(userId, data)
    const guests = await this.guestService.createManyForHousehold(
      household.id,
      data.guests
    )
    const events = await this.eventService.getUserEvents(userId)
    await this.invitationService.createForGuests(guests, events)

    return { household, guests }
  }
}
```

---

## Test-Driven Development

### The TDD Cycle

1. **Red** → Write failing test
2. **Green** → Minimal code to pass
3. **Refactor** → Improve only if it adds value

```typescript
// 1. RED - Write failing test
describe('EventService', () => {
  it('should reject event with past date', async () => {
    const service = new EventService(mockRepository)
    const pastDate = new Date('2020-01-01')

    await expect(
      service.createEvent('user_123', { name: 'Wedding', date: pastDate })
    ).rejects.toThrow('Event date cannot be in the past')
  })
})

// 2. GREEN - Write minimal code to pass
async createEvent(userId: string, data: CreateEventInput) {
  if (data.date && data.date < new Date()) {
    throw new Error('Event date cannot be in the past')
  }
  return this.repo.create(userId, data)
}

// 3. REFACTOR - Extract if it improves clarity
const isDateInPast = (date: Date) => date < new Date()

async createEvent(userId: string, data: CreateEventInput) {
  if (data.date && isDateInPast(data.date)) {
    throw new Error('Event date cannot be in the past')
  }
  return this.repo.create(userId, data)
}
```

### Testing with Jest

**Test Framework:** We use **Jest** for all unit and integration tests.

**Test File Location:**
```
tests/
├── unit/
│   └── domains/
│       └── event/
│           ├── event.service.test.ts
│           └── event.repository.test.ts
└── integration/
```

---

### Manual Mocking Pattern

**CRITICAL:** Always place mocks in `__mocks__` folder next to the module being mocked.

**Mock Folder Structure:**
```
server/domains/event/
├── event.repository.ts          ← Real implementation
├── event.service.ts              ← Real implementation
└── __mocks__/
    └── event.repository.ts       ← Mock repository with exported mock functions
```

**Creating Manual Mocks:**

Export both individual mock functions AND the mocked class. This allows tests to:
1. Configure mock return values per test
2. Assert specific mock calls
3. Reset mocks between tests

```typescript
// server/domains/event/__mocks__/event.repository.ts
import { type Event } from '~/server/domains/event/event.types'

// Export test fixtures for reuse
export const mockEvent: Event = {
  id: 'event-123',
  name: 'Wedding Day',
  date: new Date('2024-06-15'),
  userId: 'user-123',
  // ... other fields
}

// Export individual mock functions
export const mockFindById = jest.fn()
export const mockFindByUserId = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockDelete = jest.fn()
export const mockBelongsToUser = jest.fn()

// Export mocked class that uses the mock functions
export const EventRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByUserId: mockFindByUserId,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete,
  belongsToUser: mockBelongsToUser,
}))

// Export reset helper for use in beforeEach
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByUserId.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
  mockBelongsToUser.mockReset()
  EventRepository.mockClear()
}
```

**Why This Pattern:**
1. **Co-location** - Mocks live next to code they mock
2. **Auto-discovery** - Jest automatically finds `__mocks__` folders
3. **Reusable** - Same mock functions used across all tests
4. **Configurable** - Each test can set up different return values
5. **Resettable** - Clean slate between tests with `resetMocks()`

---

### Using Mocks in Tests

**CRITICAL:** Import order matters! `jest.mock()` must come before importing from the mocked module.

```typescript
// tests/unit/domains/event/event.service.test.ts
import { TRPCError } from '@trpc/server'

// 1. FIRST: Declare the mock (hoisted by Jest)
jest.mock('~/server/domains/event/event.repository')

// 2. THEN: Import from the ORIGINAL path (Jest resolves to __mocks__)
// @ts-expect-error - Importing mock functions from mocked module
import {
  EventRepository,
  mockCreate,
  mockEvent,
  mockFindById,
  resetMocks,
} from '~/server/domains/event/event.repository'
import { EventService } from '~/server/domains/event/event.service'

// 3. Create typed aliases for mock functions
const mockCreateFn = mockCreate as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock

describe('EventService', () => {
  let service: EventService

  beforeEach(() => {
    // 4. ALWAYS reset mocks between tests
    resetMocks()
    const mockRepository = new EventRepository({})
    service = new EventService(mockRepository)
  })

  describe('createEvent', () => {
    it('should create event with valid data', async () => {
      // 5. Setup mock return value for this test
      mockCreateFn.mockResolvedValue(mockEvent)

      const result = await service.createEvent('user-123', {
        eventName: 'Wedding',
        date: '2025-12-01',
      })

      // 6. Assert behavior
      expect(result).toEqual(mockEvent)
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Wedding' })
      )
    })

    it('should reject past dates', async () => {
      // Test business logic without hitting database
      await expect(
        service.createEvent('user-123', {
          eventName: 'Wedding',
          date: '2020-01-01',
        })
      ).rejects.toThrow(TRPCError)

      // Repository should NOT be called
      expect(mockCreateFn).not.toHaveBeenCalled()
    })
  })
})
```

**Key Points:**
- ✅ `jest.mock('path')` BEFORE any imports from that path
- ✅ Import from ORIGINAL path, NOT from `__mocks__` (avoids ESLint `jest/no-mocks-import` error)
- ✅ Use `@ts-expect-error` for TypeScript (original module doesn't export mock functions)
- ✅ Cast to `jest.Mock` for type safety on mock function calls
- ✅ Call `resetMocks()` in `beforeEach` to prevent test pollution

---

### Mocking Infrastructure

For infrastructure like database or S3, create mocks in `__mocks__`:

```typescript
// server/infrastructure/database/__mocks__/client.ts

// Export individual mock functions for each model method
export const mockUserFindUnique = jest.fn()
export const mockUserCreate = jest.fn()
export const mockEventFindMany = jest.fn()
export const mockGuestFindMany = jest.fn()
export const mockInvitationCreate = jest.fn()

// Export the mock db object
export const db = {
  user: {
    findUnique: mockUserFindUnique,
    create: mockUserCreate,
  },
  event: {
    findMany: mockEventFindMany,
  },
  guest: {
    findMany: mockGuestFindMany,
  },
  invitation: {
    create: mockInvitationCreate,
  },
}

// Reset helper
export const resetMocks = (): void => {
  mockUserFindUnique.mockReset()
  mockUserCreate.mockReset()
  mockEventFindMany.mockReset()
  mockGuestFindMany.mockReset()
  mockInvitationCreate.mockReset()
}
```

Usage:
```typescript
// tests/unit/domains/event/event.repository.test.ts
jest.mock('~/server/infrastructure/database/client')

// @ts-expect-error - Importing mock functions from mocked module
import {
  db,
  mockEventFindMany,
  resetMocks,
} from '~/server/infrastructure/database/client'
import { EventRepository } from '~/server/domains/event/event.repository'

const mockEventFindManyFn = mockEventFindMany as jest.Mock

describe('EventRepository', () => {
  let repository: EventRepository

  beforeEach(() => {
    resetMocks()
    repository = new EventRepository(db as any)
  })

  it('should find events by user ID', async () => {
    const events = [{ id: 'evt_123', name: 'Wedding' }]
    mockEventFindManyFn.mockResolvedValue(events)

    const result = await repository.findByUserId('user_123')

    expect(result).toEqual(events)
    expect(mockEventFindManyFn).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      orderBy: { createdAt: 'asc' },
    })
  })
})
```

---

### Test Principles

- **Test behavior, not implementation**
- **Mock at boundaries** (repositories, external APIs)
- **Use factories for test data**
- **Never redefine schemas in tests** - import real ones
- **Always `jest.clearAllMocks()` in `beforeEach`**

```typescript
// ❌ BAD - Testing implementation
it('should call validateDate method', () => {
  const spy = jest.spyOn(service, 'validateDate')
  service.createEvent(userId, data)
  expect(spy).toHaveBeenCalled()
})

// ✅ GOOD - Testing behavior
it('should reject event with past date', async () => {
  await expect(
    service.createEvent(userId, { date: pastDate })
  ).rejects.toThrow('Event date cannot be in the past')
})

// ❌ BAD - Redefining schemas in tests
const EventSchema = z.object({ id: z.string() })

// ✅ GOOD - Import real schema
import { EventSchema } from '~/server/domains/event/event.types'
```

---

## Schema-First Development

### Define Schemas First

```typescript
// server/domains/event/event.validator.ts
import { z } from 'zod'

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name required'),
  date: z.string().optional(),
  venue: z.string().optional(),
  collectRsvp: z.boolean().default(false),
})

export const updateEventSchema = createEventSchema.partial()

// server/domains/event/event.types.ts
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
```

### Form Schemas with Defaults

```typescript
// app/_components/event/event-form.schema.ts
import { z } from 'zod'

export const EventFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').default(''),
  date: z.string().optional().default(''),
  venue: z.string().trim().max(200).default(''),
  collectRsvp: z.boolean().default(true),
})

export type EventFormData = z.infer<typeof EventFormSchema>

// Extract defaults utility
export const getSchemaDefaults = <T extends z.ZodTypeAny>(schema: T): z.infer<T> => {
  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => [
      key,
      value instanceof z.ZodDefault ? value._def.defaultValue() : undefined,
    ])
  )
}
```

---

## React Hook Form + Zod

### Standard Form Pattern

```typescript
// app/_components/event/event-form.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@/components/ui'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { EventFormSchema, type EventFormData } from './event-form.schema'

export function EventForm({ onSubmit }: EventFormProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: EventFormSchema.parse({}), // Use schema defaults
  })

  const { register, handleSubmit, formState } = form
  const { errors, isSubmitting } = formState

  const handleFormSubmit: SubmitHandler<EventFormData> = async (data) => {
    // Data is already validated and normalized by Zod
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div>
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          {...register('name')}
          disabled={isSubmitting}
          error={errors.name?.message}
        />
      </div>

      <div>
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          {...register('venue')}
          disabled={isSubmitting}
          error={errors.venue?.message}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Event'}
      </Button>
    </form>
  )
}
```

### Form Best Practices

```typescript
// ✅ GOOD - Use schema defaults
defaultValues: EventFormSchema.parse({})

// ✅ GOOD - Use formState.isDirty for change detection
const { isDirty } = formState
if (!isDirty) return // No changes

// ✅ GOOD - Use Zod .trim() for normalization
name: z.string().trim().min(1)

// ✅ GOOD - Send complete validated data
const onSubmit: SubmitHandler<FormData> = async (data) => {
  await updateEvent(id, data) // Send all fields
}

// ❌ BAD - Manual trimming
const trimmedName = data.name.trim()

// ❌ BAD - Manual change detection
if (data.name !== originalData.name) { }

// ❌ BAD - Building partial updates
const updates = {}
if (data.name !== original.name) updates.name = data.name
```

---

## TypeScript Standards

### Strict Mode (Non-Negotiable)

- ✅ No `any` - use `unknown` if type is truly unknown
- ✅ No `@ts-ignore` or `@ts-expect-error` without explanation
- ✅ Mark component props `Readonly<Props>`

```typescript
// ✅ GOOD - Readonly props
type EventCardProps = {
  event: Event
  onEdit?: () => void
}

export function EventCard(props: Readonly<EventCardProps>) {
  return <div>{props.event.name}</div>
}

// ❌ BAD - Missing readonly
export function EventCard(props: EventCardProps) { }
```

### Options Objects

Use for functions with 3+ parameters:

```typescript
// ❌ BAD - Too many positional params
const createInvitation = (
  guestId: number,
  eventId: string,
  rsvp: string,
  userId: string
) => { }

// ✅ GOOD - Options object
type CreateInvitationOptions = {
  guestId: number
  eventId: string
  rsvp: string
  userId: string
}

const createInvitation = (options: CreateInvitationOptions) => {
  const { guestId, eventId, rsvp, userId } = options
  // Implementation
}
```

---

## Common Patterns

### Result Types

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: string }

export const closeEvent = async (eventId: string): Promise<Result<Event>> => {
  const invitations = await invitationRepo.getByEventId(eventId)
  const hasPending = invitations.some((inv) => inv.rsvp === 'Invited')

  if (hasPending) {
    return {
      success: false,
      error: 'Cannot close event with pending RSVPs',
    }
  }

  const event = await eventRepo.update(eventId, { status: 'closed' })
  return { success: true, data: event }
}
```

### Immutable Updates

```typescript
// ❌ BAD - Mutation
const addGuest = (household: Household, guest: Guest) => {
  household.guests.push(guest)
  return household
}

// ✅ GOOD - Immutable
const addGuest = (household: Household, guest: Guest): Household => {
  return {
    ...household,
    guests: [...household.guests, guest],
  }
}
```

### Early Returns

```typescript
// ❌ BAD - Nested conditions
if (event.status === 'published') {
  if (event.date > new Date()) {
    return true
  }
}

// ✅ GOOD - Early returns
if (event.status !== 'published') return false
if (event.date <= new Date()) return false
return true
```

---

## Anti-Patterns

```typescript
// ❌ Business logic in router
eventRouter.create(async ({ input }) => {
  if (input.date < new Date()) throw new Error() // Move to service
})

// ❌ Database access in service
async createEvent(data) {
  return db.event.create({ data }) // Use repository
}

// ❌ Service calling other services
async createEvent(data) {
  const event = await eventRepo.create(data)
  await invitationService.create() // Use Application layer
}

// ❌ Using any type
const processData = (data: any) => {} // Use proper types

// ❌ setTimeout for state updates
setTimeout(() => setState(value), 0) // Causes race conditions

// ❌ Mutation
household.guests.push(guest) // Return new object

// ❌ Manual change detection
if (data.name !== original.name) {} // Use formState.isDirty

// ❌ eslint-disable comments
// eslint-disable-next-line // Fix the type issue instead
```

---

## Quick Decision Guide

**Where does this code go?**

| What | Where | Why |
|------|-------|-----|
| Prisma query | Repository | Database access |
| Business rule | Service | Domain logic |
| Input validation | Router (Zod) | API boundary |
| Authorization | Service | Business concern |
| Cross-domain operation | Application Service | Orchestration |
| Form validation | Component (Zod) | User input |
| API endpoint | Router | tRPC API |

**Should I refactor?**

After tests pass, ask:
- ✅ Would names be clearer?
- ✅ Is structure unnecessarily complex?
- ✅ Is knowledge duplicated?
- ❌ Is it already clear and simple? → Move on

---

## Summary

**Core principles:**

1. **TDD always** - Red, Green, Refactor
2. **Business logic in Services** - NOT routers
3. **Repository pattern** - All database access
4. **Thin routers** - Validate, auth, delegate
5. **Application layer** - Cross-domain orchestration
6. **Schema-first** - Zod schemas, derived types
7. **react-hook-form + Zod** - All forms
8. **Test behavior** - Not implementation

**When in doubt:**
- Check `DOMAIN_MIGRATION_PLAN.md` for architecture
- Business logic? → Service
- Database query? → Repository
- Multiple domains? → Application Service
- User input? → react-hook-form + Zod

---

*Keep this document updated with patterns you wish you'd known earlier.*
