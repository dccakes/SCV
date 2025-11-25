# Architecture Overview

## Design Philosophy

OSWP follows a **domain-driven architecture** with clear separation of concerns using the Application Layer pattern. This architecture provides:

- **Clear code organization** - Easy to find and understand code
- **Predictable structure** - Every domain follows the same pattern
- **Testability** - Business logic is isolated and easily testable
- **Reusability** - Services can be used anywhere in the application
- **Maintainability** - Changes are isolated to single domains

---

## Layer Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[Next.js Pages/Components]
        HOOKS[React Hooks]
    end

    subgraph "API Layer"
        ROUTER[tRPC Root Router]
        PROC[Procedures]
    end

    subgraph "Application Layer"
        AS[Application Services]
        note1[Cross-domain orchestration]
    end

    subgraph "Domain Layer"
        DS[Domain Services]
        DR[Domain Repositories]
        DV[Domain Validators]
        DT[Domain Types]
    end

    subgraph "Infrastructure Layer"
        DB[Prisma Client]
        AUTH[Better Auth]
        STORAGE[Storage - Future]
    end

    UI --> HOOKS
    HOOKS --> ROUTER
    ROUTER --> PROC
    PROC --> AS
    PROC --> DS
    AS --> DS
    DS --> DR
    DS --> DV
    DR --> DB
    DR --> DT
```

---

## Domain Layer

### Responsibility
Business entities and their operations. Each domain manages a single business concept.

### Structure
Each domain follows this consistent structure:

```
src/server/domains/{domain}/
├── {domain}.types.ts       # TypeScript interfaces
├── {domain}.validator.ts   # Zod validation schemas
├── {domain}.repository.ts  # Database operations
├── {domain}.service.ts     # Business logic
├── {domain}.router.ts      # tRPC procedures
├── __mocks__/              # Test mocks
│   └── {domain}.repository.ts
└── index.ts                # Barrel export
```

### Rules

| Allowed | Not Allowed |
|---------|-------------|
| Read from own repository | Call other domain services |
| Contain business rules | Call other repositories |
| Validate own data | Contain orchestration logic |

### Example Flow

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant Service
    participant Repository
    participant Database

    Client->>Router: createEvent(input)
    Router->>Router: Validate input (Zod)
    Router->>Service: create(userId, data)
    Service->>Service: Apply business rules
    Service->>Repository: create(data)
    Repository->>Database: INSERT
    Database-->>Repository: Event record
    Repository-->>Service: Event
    Service-->>Router: Event
    Router-->>Client: Event
```

---

## Application Layer

### Responsibility
Orchestrate multiple domains for complex workflows that span domain boundaries.

### Structure

```
src/server/application/{service}/
├── {service}.types.ts      # Composite types
├── {service}.validator.ts  # Input validation
├── {service}.service.ts    # Orchestration logic
├── {service}.router.ts     # tRPC procedures
└── index.ts                # Barrel export
```

### Rules

| Allowed | Not Allowed |
|---------|-------------|
| Call multiple domain services | Contain business logic |
| Coordinate transactions | Access repositories directly |
| Aggregate data | Bypass domain services |

### Example: Household Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant HouseholdMgmt as Household Management
    participant HouseholdSvc as Household Service
    participant GuestSvc as Guest Service
    participant EventSvc as Event Service
    participant InvitationSvc as Invitation Service
    participant GiftSvc as Gift Service

    Client->>HouseholdMgmt: createWithGuests(data)
    HouseholdMgmt->>HouseholdSvc: create(household)
    HouseholdSvc-->>HouseholdMgmt: Household
    HouseholdMgmt->>GuestSvc: createMany(guests)
    GuestSvc-->>HouseholdMgmt: Guests[]
    HouseholdMgmt->>EventSvc: getUserEvents()
    EventSvc-->>HouseholdMgmt: Events[]
    HouseholdMgmt->>InvitationSvc: createForGuestsAndEvents()
    InvitationSvc-->>HouseholdMgmt: Invitations[]
    HouseholdMgmt->>GiftSvc: createForHouseholdAndEvents()
    GiftSvc-->>HouseholdMgmt: Gifts[]
    HouseholdMgmt-->>Client: Result
```

---

## Infrastructure Layer

### Responsibility
Technical services that support the application (database, storage, email).

### Current Implementation

```
src/server/infrastructure/
├── database/
│   ├── client.ts           # Prisma client singleton
│   ├── __mocks__/
│   │   └── client.ts       # Test mock
│   └── index.ts
└── index.ts
```

### Future Additions

- **Storage** - S3 service for file uploads
- **Email** - Email service for notifications
- **Cache** - Redis caching layer

---

## tRPC API Layer

### Root Router Aggregation

All domain and application service routers are aggregated in a single root router:

```typescript
export const appRouter = createTRPCRouter({
  // Domain routers
  user: userRouter,
  website: websiteRouter,
  event: eventRouter,
  gift: giftRouter,
  guest: guestRouter,
  invitation: invitationRouter,
  question: questionRouter,
  household: householdRouter,

  // Application service routers
  dashboard: dashboardRouter,
  householdManagement: householdManagementRouter,
  rsvpSubmission: rsvpSubmissionRouter,
})
```

### Procedure Types

| Type | Usage |
|------|-------|
| `publicProcedure` | No authentication required |
| `protectedProcedure` | Requires authenticated user |

---

## Data Flow Patterns

### Read Operation (Query)

```mermaid
flowchart LR
    A[Client] --> B[tRPC Query]
    B --> C{Auth Check}
    C -->|Protected| D[Verify Session]
    C -->|Public| E[Service]
    D --> E
    E --> F[Repository]
    F --> G[(Database)]
    G --> F
    F --> E
    E --> B
    B --> A
```

### Write Operation (Mutation)

```mermaid
flowchart LR
    A[Client] --> B[tRPC Mutation]
    B --> C[Zod Validation]
    C -->|Invalid| D[Error Response]
    C -->|Valid| E[Auth Check]
    E --> F[Service]
    F --> G[Business Rules]
    G -->|Fail| H[Domain Error]
    G -->|Pass| I[Repository]
    I --> J[(Database)]
    J --> I
    I --> F
    F --> B
    B --> A
```

---

## Error Handling

### Domain Errors

Domain services throw `TRPCError` with appropriate codes:

| Code | Usage |
|------|-------|
| `NOT_FOUND` | Resource doesn't exist |
| `FORBIDDEN` | User lacks permission |
| `BAD_REQUEST` | Invalid input/business rule violation |
| `UNAUTHORIZED` | Not authenticated |

### Example

```typescript
if (!event || event.userId !== userId) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Event not found or access denied',
  })
}
```

---

## Testing Strategy

### Unit Tests

Each domain has mock repositories for isolated testing:

```
src/server/domains/{domain}/__mocks__/
└── {domain}.repository.ts
```

### Test Commands

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage

# Run specific domain tests
npm run test:unit -- --testPathPattern=domains/event
```

---

## Best Practices

### DO

- Keep domain services focused on single responsibility
- Use application services for cross-domain operations
- Validate all inputs with Zod schemas
- Include authorization checks in services
- Use barrel exports for clean imports

### DON'T

- Call domain services from other domain services
- Access repositories outside their domain
- Put business logic in routers
- Skip validation at boundaries
- Mix infrastructure concerns with domain logic
