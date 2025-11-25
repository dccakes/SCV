# Domain-Driven Architecture Migration Plan - OSWP

**Project:** The Open Source Wedding Project (OSWP)

## Executive Summary

This document outlines the **approved migration** from the current feature-based structure to a **domain-driven architecture** with clear separation of concerns using the Application Layer pattern.

**Status:** ✅ **APPROVED - Ready for Implementation**

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Domain Structure](#domain-structure)
3. [Architecture Overview](#architecture-overview)
4. [Layer Responsibilities](#layer-responsibilities)
5. [Domain Definitions](#domain-definitions)
6. [Application Services](#application-services)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Phases](#implementation-phases)
9. [Example Implementations](#example-implementations)
10. [Migration Checklist](#migration-checklist)

---

## Architecture Decisions

✅ **Approved architectural choices:**

### 1. Application Layer Pattern
- **Decision:** Use Application Services for cross-domain orchestration
- **Rationale:** Keeps domain boundaries clean, prevents domain coupling
- **Examples:** Dashboard, RSVP Submission, Household Management

### 2. Question Domain
- **Decision:** Single unified Question domain
- **Rationale:** Same validation, same behavior, just different context (Event vs Website)
- **Implementation:** Service layer enforces business rule (must belong to one, not both)

### 3. Frontend Organization
- **Decision:** Feature-based routes, domain-based components
- **Rationale:** Routes match user mental model, components are reusable
- **Structure:**
  - Routes: `/dashboard`, `/guest-list`, `/auth`
  - Components: `_components/event/`, `_components/guest/`

### 4. Migration Approach
- **Decision:** Incremental, one domain at a time
- **Rationale:** Low risk, testable, can learn and adapt
- **Order:** Simple → Complex (see Migration Strategy)

### 5. Cross-Domain Operations
- **Decision:** Application Services orchestrate domains
- **Example:** Household creation needs Guest + Invitation → HouseholdManagementService
- **Pattern:** Service layer doesn't call other services directly

---

## Domain Structure

### Core Business Domains (8 Domains)

| Domain | Entities | Responsibility |
|--------|----------|----------------|
| **Event** | Event | Wedding events/ceremonies |
| **Guest** | Guest | Individual guest management |
| **Household** | Household | Guest household/address groups |
| **Invitation** | Invitation | Event invitations & RSVP tracking |
| **Gift** | Gift | Gift tracking per household |
| **Question** | Question, Option, Answer, OptionResponse | RSVP questions & responses (Event + Website) |
| **Website** | Website | Wedding website configuration |
| **User** | User | User/couple account management |

### Application Services (3 Services)

| Service | Orchestrates | Purpose |
|---------|--------------|---------|
| **Dashboard** | Event, Guest, Household, Website, User | Overview & statistics |
| **RSVP Submission** | Household, Guest, Invitation, Question | Guest RSVP flow |
| **Household Management** | Household, Guest, Invitation, Gift | Complex household creation |

### Infrastructure (Technical)

- **Database:** Prisma client wrapper
- **Storage:** S3 service for file uploads
- **Email:** Email service (future)
- **Auth:** Better Auth integration

---

## Architecture Overview

```
src/
├── server/
│   ├── domains/                         ← BUSINESS ENTITIES ONLY
│   │   ├── event/
│   │   │   ├── event.types.ts          ← Domain types
│   │   │   ├── event.validator.ts      ← Zod schemas
│   │   │   ├── event.repository.ts     ← Database operations
│   │   │   ├── event.service.ts        ← Business logic
│   │   │   ├── event.router.ts         ← tRPC router (thin)
│   │   │   └── index.ts                ← Barrel export
│   │   │
│   │   ├── guest/
│   │   ├── household/
│   │   ├── invitation/
│   │   ├── gift/
│   │   ├── question/                   ← Handles Event + Website questions
│   │   ├── website/
│   │   └── user/
│   │
│   ├── application/                     ← CROSS-DOMAIN ORCHESTRATION
│   │   ├── dashboard/
│   │   │   ├── dashboard.service.ts
│   │   │   ├── dashboard.router.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── rsvp-submission/
│   │   │   ├── rsvp-submission.service.ts
│   │   │   ├── rsvp-submission.router.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── household-management/
│   │   │   ├── household-management.service.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── infrastructure/                  ← TECHNICAL CONCERNS
│   │   ├── database/
│   │   │   ├── client.ts               ← Prisma client
│   │   │   └── index.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── s3.service.ts
│   │   │   └── index.ts
│   │   │
│   │   └── email/                       ← Future
│   │       ├── email.service.ts
│   │       └── index.ts
│   │
│   └── api/                             ← tRPC API LAYER
│       ├── root.ts                      ← Root router (aggregates all)
│       ├── trpc.ts                      ← tRPC setup
│       └── context.ts                   ← Request context
│
├── lib/                                 ← SHARED UTILITIES
│   ├── types/                           ← Cross-domain types
│   │   ├── index.ts
│   │   └── shared.ts
│   │
│   ├── constants/
│   │   ├── rsvp.ts                     ← RSVP statuses
│   │   ├── routes.ts                   ← Route constants
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   ├── hooks/                           ← Shared React hooks
│   │   └── use-debounce.ts
│   │
│   └── auth/                            ← Auth client
│       └── auth-client.ts
│
├── app/                                 ← NEXT.JS FRONTEND
│   ├── dashboard/                       ← Feature-based routes
│   ├── guest-list/
│   ├── auth/
│   │
│   ├── _components/                     ← Domain-based components
│   │   ├── event/
│   │   │   ├── event-form.tsx
│   │   │   ├── event-card.tsx
│   │   │   ├── event-list.tsx
│   │   │   └── hooks/
│   │   │       └── use-event-form.ts
│   │   │
│   │   ├── guest/
│   │   │   ├── guest-form.tsx
│   │   │   ├── guest-table.tsx
│   │   │   └── hooks/
│   │   │       └── use-guest-form.ts
│   │   │
│   │   ├── household/
│   │   ├── invitation/
│   │   ├── question/
│   │   └── shared/
│   │       ├── loading-spinner.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── providers.tsx
│   └── layout.tsx
│
└── components/                          ← SHARED UI
    ├── ui/                              ← shadcn components
    └── layout/                          ← Layout components
```

---

## Layer Responsibilities

### 1. Domain Layer (`server/domains/`)

**Responsibility:** Business entities and their operations

**Contains:**
- Types (domain-specific)
- Validators (Zod schemas)
- Repository (database access)
- Service (business logic)
- Router (thin tRPC layer)

**Rules:**
- ✅ Can read from own repository
- ✅ Can contain business rules
- ✅ Can validate own data
- ❌ Cannot call other domain services
- ❌ Cannot call other repositories
- ❌ Cannot contain orchestration logic

**Example:**
```typescript
// ✅ GOOD - Event service manages events
class EventService {
  async createEvent(userId: string, data: CreateEventInput) {
    // Validate business rules
    if (data.date && new Date(data.date) < new Date()) {
      throw new Error('Event date cannot be in the past')
    }
    // Use own repository
    return this.eventRepo.create(userId, data)
  }
}

// ❌ BAD - Event service shouldn't know about invitations
class EventService {
  async createEvent(userId: string, data: CreateEventInput) {
    const event = await this.eventRepo.create(userId, data)
    // DON'T DO THIS - cross-domain operation
    await this.invitationRepo.createForEvent(event.id)
    return event
  }
}
```

---

### 2. Application Layer (`server/application/`)

**Responsibility:** Orchestrate multiple domains for complex workflows

**Contains:**
- Application services
- tRPC routers (for application services)
- Cross-domain coordination

**Rules:**
- ✅ Can call multiple domain services
- ✅ Can coordinate transactions
- ✅ Can aggregate data
- ❌ Should not contain business logic
- ❌ Should not access repositories directly

**Example:**
```typescript
// ✅ GOOD - Application service orchestrates
class HouseholdManagementService {
  constructor(
    private householdService: HouseholdService,
    private guestService: GuestService,
    private invitationService: InvitationService,
    private eventService: EventService
  ) {}

  async createHouseholdWithGuests(userId: string, data: CreateHouseholdInput) {
    // 1. Create household
    const household = await this.householdService.create(userId, data)

    // 2. Create guests for household
    const guests = await this.guestService.createManyForHousehold(
      household.id,
      data.guests
    )

    // 3. Get all user events
    const events = await this.eventService.getUserEvents(userId)

    // 4. Create invitations for each guest for each event
    await this.invitationService.createForGuests(guests, events)

    return { household, guests }
  }
}
```

---

### 3. Infrastructure Layer (`server/infrastructure/`)

**Responsibility:** Technical services (database, storage, email)

**Contains:**
- Database client
- S3 service
- Email service
- External API clients

**Rules:**
- ✅ Technical implementations only
- ✅ Can be used by any layer
- ❌ No business logic
- ❌ No domain knowledge

---

## Domain Definitions

### 1. Event Domain

**Responsibility:** Manage wedding events (ceremony, reception, rehearsal dinner, etc.) for OSWP users

**Entities:** Event

**Operations:**
- `create` - Create new event
- `update` - Update event details
- `delete` - Delete event
- `getById` - Get single event with relations
- `getUserEvents` - Get all events for user
- `getEventWithStats` - Get event with RSVP statistics

**Business Rules:**
- Event date cannot be in the past
- User can only access their own events
- Deleting an event cascades to invitations and questions

**Dependencies:**
- Invitation (for RSVP counts - read only)
- Question (event questions - read only)

---

### 2. Guest Domain

**Responsibility:** Manage individual wedding guests

**Entities:** Guest

**Operations:**
- `create` - Create single guest
- `createMany` - Create multiple guests
- `update` - Update guest details
- `delete` - Delete guest
- `search` - Search guests by name
- `getById` - Get guest with invitations

**Business Rules:**
- Guest must belong to a household
- Each household has one primary contact
- Guest names are required

**Dependencies:**
- Household (belongs to)
- Invitation (has many)

---

### 3. Household Domain

**Responsibility:** Manage guest households/groups and contact information

**Entities:** Household

**Operations:**
- `create` - Create household
- `update` - Update household details
- `delete` - Delete household (cascades to guests)
- `search` - Search households
- `getById` - Get household with guests and gifts

**Business Rules:**
- Household belongs to user
- Deleting household deletes all guests
- Email must be valid format

**Dependencies:**
- Guest (has many)
- Gift (has many)

---

### 4. Invitation Domain

**Responsibility:** Track event invitations and RSVP responses

**Entities:** Invitation

**Operations:**
- `create` - Create invitation
- `createMany` - Create multiple invitations
- `updateRsvp` - Update RSVP status
- `getForEvent` - Get all invitations for event
- `getForGuest` - Get all invitations for guest

**Business Rules:**
- RSVP status: Not Invited, Invited, Attending, Declined
- Cannot create duplicate invitations (guestId + eventId unique)
- User can only update their own invitations

**Dependencies:**
- Event (belongs to)
- Guest (belongs to)

---

### 5. Gift Domain

**Responsibility:** Track gifts received per household per event

**Entities:** Gift

**Operations:**
- `create` - Record gift
- `update` - Update gift details
- `markThankyouSent` - Mark thank you as sent
- `getForHousehold` - Get all gifts for household
- `getForEvent` - Get all gifts for event

**Business Rules:**
- Gift unique per household per event
- Thank you status defaults to false

**Dependencies:**
- Household (belongs to)
- Event (belongs to)

---

### 6. Question Domain

**Responsibility:** Manage RSVP questions and collect responses (for both Events and Website)

**Entities:** Question, Option, Answer, OptionResponse

**Operations:**
- `createEventQuestion` - Create question for event
- `createWebsiteQuestion` - Create general question for website
- `addOption` - Add option to multiple choice question
- `deleteOption` - Remove option
- `submitTextAnswer` - Submit text response
- `submitOptionAnswer` - Submit multiple choice response
- `getResponses` - Get all responses for question

**Business Rules:**
- Question must belong to Event OR Website (not both, not neither)
- Question type: "Text" or "Option"
- Required questions must be answered
- Option responses tracked per guest

**Dependencies:**
- Event (optional - for event-specific questions)
- Website (optional - for general questions)
- Guest/Household (for responses)

**Implementation Note:**
```typescript
// Service enforces the exclusive relationship
class QuestionService {
  async createQuestion(data: CreateQuestionInput) {
    // Validate: must have one, not both
    if (!data.eventId && !data.websiteId) {
      throw new Error('Question must belong to Event or Website')
    }
    if (data.eventId && data.websiteId) {
      throw new Error('Question cannot belong to both Event and Website')
    }
    return this.questionRepo.create(data)
  }
}
```

---

### 7. Website Domain

**Responsibility:** Wedding website configuration and settings

**Entities:** Website

**Operations:**
- `create` - Create website (one per user)
- `update` - Update settings
- `updateCoverPhoto` - Update cover photo URL
- `setPassword` - Set/update password protection
- `toggleRsvp` - Enable/disable RSVP
- `getBySubUrl` - Get website by custom URL

**Business Rules:**
- One website per user
- Sub URL must be unique
- Password optional (can enable/disable protection)

**Dependencies:**
- User (belongs to)
- Question (general questions)

---

### 8. User Domain

**Responsibility:** User account management (managed by Better Auth)

**Entities:** User

**Operations:**
- `getById` - Get user details
- `update` - Update profile (names)
- `getWebsite` - Get user's website

**Business Rules:**
- Email must be unique
- User created via Better Auth
- Can have one website

**Dependencies:** None (root entity)

---

## Application Services

### 1. Dashboard Service

**Purpose:** Aggregate data from multiple domains for dashboard overview

**Orchestrates:**
- Event domain (get events)
- Guest domain (get guest counts)
- Household domain (get household counts)
- Invitation domain (get RSVP statistics)
- Website domain (get website settings)
- User domain (get user details)

**Operations:**

```typescript
class DashboardService {
  async getOverview(userId: string) {
    // Aggregate from multiple domains
    const [user, website, events, households, rsvpStats] = await Promise.all([
      this.userService.getById(userId),
      this.websiteService.getByUserId(userId),
      this.eventService.getUserEvents(userId),
      this.householdService.getUserHouseholds(userId),
      this.invitationService.getOverallStats(userId),
    ])

    // Calculate derived data
    const daysUntilWedding = this.calculateDaysRemaining(events)
    const guestCounts = this.calculateGuestCounts(households)

    return {
      user,
      website,
      events,
      daysUntilWedding,
      guestCounts,
      rsvpStats,
    }
  }
}
```

**Router:**
```typescript
export const dashboardRouter = createTRPCRouter({
  getOverview: protectedProcedure.query(({ ctx }) => {
    return dashboardService.getOverview(ctx.auth.userId)
  }),
})
```

---

### 2. RSVP Submission Service

**Purpose:** Handle complete RSVP submission flow from guest website

**Orchestrates:**
- Household domain (find/create household)
- Guest domain (update guest info)
- Invitation domain (update RSVPs)
- Question domain (submit answers)

**Operations:**

```typescript
class RsvpSubmissionService {
  async submitRsvp(data: RsvpFormData) {
    // 1. Find household
    const household = await this.householdService.getById(data.householdId)

    // 2. Update RSVP statuses
    await this.invitationService.updateMany(data.rsvpResponses)

    // 3. Submit question answers
    if (data.questionAnswers?.length > 0) {
      await this.questionService.submitAnswers(data.questionAnswers)
    }

    // 4. Update contact info if provided
    if (data.contactInfo) {
      await this.householdService.updateContactInfo(
        household.id,
        data.contactInfo
      )
    }

    return { success: true, householdId: household.id }
  }
}
```

**Router:**
```typescript
export const rsvpRouter = createTRPCRouter({
  submitRsvp: publicProcedure
    .input(rsvpSubmissionSchema)
    .mutation(({ input }) => {
      return rsvpSubmissionService.submitRsvp(input)
    }),
})
```

---

### 3. Household Management Service

**Purpose:** Handle complex household creation with guests and invitations

**Orchestrates:**
- Household domain
- Guest domain
- Invitation domain
- Event domain (to get events for auto-invitation)
- Gift domain (to create gift records)

**Operations:**

```typescript
class HouseholdManagementService {
  async createWithGuests(userId: string, data: CreateHouseholdWithGuestsInput) {
    // 1. Create household
    const household = await this.householdService.create(userId, {
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
    })

    // 2. Create guests for household
    const guests = await this.guestService.createManyForHousehold(
      household.id,
      userId,
      data.guests
    )

    // 3. Get all events to create invitations
    const events = await this.eventService.getUserEvents(userId)

    // 4. Create invitations for each guest for each event
    const invitations = await this.invitationService.createForGuestsAndEvents(
      guests,
      events,
      userId
    )

    // 5. Create gift records for each event
    const gifts = await this.giftService.createForHouseholdAndEvents(
      household.id,
      events
    )

    return {
      household,
      guests,
      invitations,
      gifts,
    }
  }

  async updateWithGuests(
    userId: string,
    householdId: string,
    data: UpdateHouseholdWithGuestsInput
  ) {
    // 1. Update household
    await this.householdService.update(householdId, userId, data.household)

    // 2. Delete removed guests
    if (data.deletedGuestIds?.length > 0) {
      await this.guestService.deleteMany(data.deletedGuestIds, userId)
    }

    // 3. Update existing guests
    if (data.updatedGuests?.length > 0) {
      await this.guestService.updateMany(data.updatedGuests, userId)
    }

    // 4. Create new guests
    if (data.newGuests?.length > 0) {
      const newGuests = await this.guestService.createManyForHousehold(
        householdId,
        userId,
        data.newGuests
      )

      // 5. Create invitations for new guests
      const events = await this.eventService.getUserEvents(userId)
      await this.invitationService.createForGuestsAndEvents(
        newGuests,
        events,
        userId
      )
    }

    // 6. Update invitations
    if (data.invitationUpdates?.length > 0) {
      await this.invitationService.updateMany(data.invitationUpdates, userId)
    }

    // 7. Update gifts
    if (data.giftUpdates?.length > 0) {
      await this.giftService.updateMany(data.giftUpdates, userId)
    }

    return { success: true }
  }
}
```

---

## Migration Strategy

### Guiding Principles

1. **Incremental Migration** - One domain at a time
2. **Backward Compatibility** - Old code works alongside new
3. **Test Coverage** - Verify functionality before and after
4. **Type Safety** - Maintain full TypeScript coverage
5. **No Database Changes** - Keep current Prisma schema

### Migration Order (Simple → Complex)

```
Phase 1: Foundation & Simple Domains (Week 1)
├── Setup infrastructure
├── 1. User Domain          (simple, no dependencies)
├── 2. Website Domain       (simple, depends on User)
└── 3. Event Domain         (simple, few dependencies)

Phase 2: Core Domains (Week 2)
├── 4. Gift Domain          (simple, tracking only)
├── 5. Guest Domain         (moderate complexity)
└── 6. Invitation Domain    (depends on Event + Guest)

Phase 3: Complex Domains (Week 3)
├── 7. Question Domain      (handles Event + Website, has Options/Answers)
└── 8. Household Domain     (complex, many dependencies)

Phase 4: Application Services (Week 4)
├── 9. Household Management Service
├── 10. RSVP Submission Service
└── 11. Dashboard Service

Phase 5: Cleanup & Frontend (Week 5)
├── 12. Remove old routers
├── 13. Reorganize frontend components
├── 14. Update documentation
└── 15. Final testing & deployment
```

**Total Estimated Time:** 4-5 weeks (part-time)

---

## Implementation Phases

### Phase 1: Foundation Setup (4-6 hours)

**Goal:** Create infrastructure and establish pattern

**Steps:**

1. **Create folder structure**
```bash
mkdir -p src/server/domains
mkdir -p src/server/application
mkdir -p src/server/infrastructure/database
mkdir -p src/server/infrastructure/storage
mkdir -p src/lib/constants
mkdir -p src/lib/types
```

2. **Move database client**
```typescript
// src/server/infrastructure/database/client.ts
export { db } from '~/server/db'
```

3. **Create constants**
```typescript
// src/lib/constants/rsvp.ts
export const RSVP_STATUS = {
  NOT_INVITED: 'Not Invited',
  INVITED: 'Invited',
  ATTENDING: 'Attending',
  DECLINED: 'Declined',
} as const
```

4. **First domain: User**
- Simple domain, no complex dependencies
- Establishes the pattern
- `user.types.ts`, `user.repository.ts`, `user.service.ts`, `user.router.ts`

5. **Test thoroughly**
- All existing user operations work
- No regressions

---

### Phase 2-3: Migrate Core Domains (2-3 hours per domain)

**Per Domain Checklist:**

- [ ] Create `{domain}/` folder
- [ ] Extract types to `{domain}.types.ts`
- [ ] Extract Zod schemas to `{domain}.validator.ts`
- [ ] Create `{domain}.repository.ts`
  - Move all Prisma queries
  - Keep methods focused and simple
- [ ] Create `{domain}.service.ts`
  - Business logic
  - Authorization checks
  - Error handling
- [ ] Create `{domain}.router.ts`
  - Thin layer
  - Just input validation + service call
- [ ] Add barrel export `index.ts`
- [ ] Update `server/api/root.ts`
- [ ] Test all operations
- [ ] Update frontend if needed

---

### Phase 4: Application Services (6-8 hours)

**Goal:** Extract cross-domain orchestration

**Services to Create:**

1. **Household Management Service** (3-4 hours)
   - Complex household creation
   - Guest + Invitation coordination

2. **RSVP Submission Service** (2-3 hours)
   - Guest-facing RSVP flow
   - Household + Guest + Invitation + Question

3. **Dashboard Service** (2-3 hours)
   - Aggregate multiple domains
   - Calculate statistics

---

### Phase 5: Frontend & Cleanup (8-10 hours)

**Goal:** Reorganize components and clean up

**Tasks:**

1. **Move components** (4-5 hours)
```bash
# From:
src/app/_components/forms/event-form.tsx

# To:
src/app/_components/event/event-form.tsx
```

2. **Update imports** (2-3 hours)
```typescript
// Update all frontend imports to new paths
import { EventForm } from '~/app/_components/event/event-form'
```

3. **Remove old code** (1-2 hours)
```bash
# Delete old routers
rm src/server/api/routers/event.ts
rm src/server/api/routers/guest.ts
# etc.
```

4. **Update documentation** (1 hour)

---

## Example Implementations

### Complete Event Domain

See existing Event Domain example in previous section (lines 484-741)

---

### Question Domain (Unified)

```typescript
// question.types.ts
export type Question = {
  id: string
  eventId: string | null      // Optional
  websiteId: string | null     // Optional
  text: string
  type: 'Text' | 'Option'
  isRequired: boolean
}

export type CreateQuestionInput = {
  text: string
  type: 'Text' | 'Option'
  isRequired: boolean
  eventId?: string
  websiteId?: string
  options?: Array<{ text: string; description: string }>
}

// question.service.ts
export class QuestionService {
  async createQuestion(data: CreateQuestionInput) {
    // Enforce: must belong to Event OR Website, not both
    this.validateContext(data)

    return this.questionRepo.create(data)
  }

  private validateContext(data: CreateQuestionInput) {
    const hasEvent = !!data.eventId
    const hasWebsite = !!data.websiteId

    if (!hasEvent && !hasWebsite) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Question must belong to either Event or Website',
      })
    }

    if (hasEvent && hasWebsite) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Question cannot belong to both Event and Website',
      })
    }
  }
}
```

---

### Dashboard Application Service

```typescript
// application/dashboard/dashboard.service.ts
import { EventService } from '~/server/domains/event'
import { GuestService } from '~/server/domains/guest'
import { HouseholdService } from '~/server/domains/household'
import { InvitationService } from '~/server/domains/invitation'
import { WebsiteService } from '~/server/domains/website'
import { UserService } from '~/server/domains/user'

export class DashboardService {
  constructor(
    private eventService: EventService,
    private guestService: GuestService,
    private householdService: HouseholdService,
    private invitationService: InvitationService,
    private websiteService: WebsiteService,
    private userService: UserService
  ) {}

  async getOverview(userId: string) {
    // Parallel fetch all data
    const [user, website, events, households] = await Promise.all([
      this.userService.getById(userId),
      this.websiteService.getByUserId(userId),
      this.eventService.getUserEvents(userId),
      this.householdService.getUserHouseholds(userId),
    ])

    // Get RSVP statistics for all events
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const stats = await this.invitationService.getStatsForEvent(event.id)
        return { ...event, stats }
      })
    )

    // Calculate guest counts
    const totalGuests = households.reduce(
      (sum, household) => sum + household.guests.length,
      0
    )

    // Calculate days until wedding
    const mainEvent = events.find((e) => e.name.toLowerCase().includes('ceremony'))
    const daysRemaining = mainEvent?.date
      ? Math.ceil(
          (new Date(mainEvent.date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

    return {
      user: {
        groomFirstName: user.groomFirstName,
        groomLastName: user.groomLastName,
        brideFirstName: user.brideFirstName,
        brideLastName: user.brideLastName,
      },
      website,
      events: eventsWithStats,
      households,
      stats: {
        totalGuests,
        totalHouseholds: households.length,
        daysRemaining,
      },
    }
  }
}

// application/dashboard/dashboard.router.ts
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { dashboardService } from './index'

export const dashboardRouter = createTRPCRouter({
  getOverview: protectedProcedure.query(({ ctx }) => {
    return dashboardService.getOverview(ctx.auth.userId)
  }),
})
```

---

## Migration Checklist

### Pre-Migration
- [x] Architecture approved
- [x] Create backup branch (`git checkout -b pre-domain-migration`)
- [x] Document current API contracts
- [x] Set up testing strategy

### Phase 1: Foundation ✅ COMPLETE
- [x] Create folder structure
- [x] Move database client to infrastructure
- [x] Create lib/constants
- [x] Migrate User domain
- [x] Migrate Website domain
- [x] Migrate Event domain
- [x] Test Phase 1 thoroughly

### Phase 2: Core Domains ✅ COMPLETE
- [x] Migrate Gift domain
- [x] Migrate Guest domain
- [x] Migrate Invitation domain
- [x] Test Phase 2 thoroughly

### Phase 3: Complex Domains ✅ COMPLETE
- [x] Migrate Question domain
- [x] Migrate Household domain
- [x] Test Phase 3 thoroughly

### Phase 4: Application Services
- [ ] Create Household Management Service
- [ ] Create RSVP Submission Service
- [ ] Create Dashboard Service
- [ ] Update root router
- [ ] Test Phase 4 thoroughly

### Phase 5: Cleanup
- [ ] Remove old router files
- [ ] Reorganize frontend components
- [ ] Update all imports
- [ ] Update documentation
- [ ] Final integration testing
- [ ] Deploy to staging
- [ ] Deploy to production

---

## Benefits After Migration

### Developer Experience
- ✅ **Clear code organization** - Easy to find what you need
- ✅ **Predictable structure** - Every domain follows same pattern
- ✅ **Testable** - Business logic isolated in services
- ✅ **Reusable** - Services can be used anywhere
- ✅ **Maintainable** - Changes isolated to single domain

### Code Quality
- ✅ **Single Responsibility** - Each layer has one job
- ✅ **Dependency Injection** - Services are injectable
- ✅ **Better errors** - Consistent error handling
- ✅ **Type safe** - Full TypeScript coverage
- ✅ **Validated** - Zod schemas at boundaries

### Scalability
- ✅ **Add domains easily** - Just follow the template
- ✅ **Microservices ready** - Domains can be extracted
- ✅ **Clear boundaries** - No spaghetti code
- ✅ **Event-driven ready** - Can add events later
- ✅ **Team friendly** - Multiple devs can work in parallel

---

## Next Steps

1. **Review this plan** ✅ DONE
2. **Create backup branch** ✅ DONE
3. **Phase 1** - Foundation & User, Website, Event domains ✅ DONE
4. **Phase 2** - Gift, Guest, Invitation domains ✅ DONE
5. **Phase 3** - Question, Household domains ✅ DONE
6. **Phase 4** - Application Services (dashboard, rsvp-submission, household-management)
7. **Phase 5** - Cleanup (remove old routers, reorganize frontend)
8. **Deploy incrementally**

Ready to continue with Phase 4!
