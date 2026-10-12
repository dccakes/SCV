## ADDED Requirements

### Requirement: Typed domain event catalog

The system SHALL define a typed catalog of domain events, each named `{scope}.{object}.{action}` (reusing the existing analytics taxonomy in `src/lib/analytics/events.ts`) and carrying a typed payload. Plugins SHALL declare in their manifest the events they `emit` and the events they `subscribe` to, so cross-plugin reactions are visible and validated at build/startup.

#### Scenario: Emitting an event with a typed payload

- **WHEN** the RSVP flow emits `rsvp.managed_submission.submitted` with its typed payload (wedding id, household id, responses)
- **THEN** the payload type-checks against the catalog entry and the event is accepted by the dispatcher

#### Scenario: Subscribing plugin is validated against the catalog

- **WHEN** a plugin declares a subscription to an event name not present in the catalog
- **THEN** the registry fails fast at build/startup with an error naming the unknown event

### Requirement: In-process event dispatcher with never-throw contract

The system SHALL provide an in-process event dispatcher (in `src/server/infrastructure/events/`) that fans out an emitted event to all subscribers active for the relevant wedding. The dispatcher SHALL follow the same never-throw contract as `captureServerEvent`: a subscriber that throws or hangs SHALL NOT fail the emitter or the originating request, and SHALL NOT prevent other subscribers from running. Subscriber ordering SHALL NOT be guaranteed.

#### Scenario: One subscriber failing does not affect others or the request

- **WHEN** an event has three subscribers and one throws
- **THEN** the other two subscribers still run, the emitter and the originating request succeed, and the failure is logged

#### Scenario: Only subscribers of active plugins receive the event

- **WHEN** an event is emitted for a wedding and a subscribing plugin is not active for that wedding (per the three-tier resolver)
- **THEN** that plugin's subscriber is not invoked

### Requirement: After-commit, best-effort delivery in V1

The system SHALL deliver events after the originating database transaction commits, asynchronously and best-effort (at-most-once). Subscribers SHALL therefore be idempotent and off the critical request path. The system SHALL NOT implement a transactional outbox in V1; the outbox (at-least-once, guaranteed delivery) is documented as the future upgrade path for effects that require it.

#### Scenario: Event fires only after the write is committed

- **WHEN** a mutation emits an event and its transaction is rolled back
- **THEN** no event is delivered to subscribers

#### Scenario: Event fires after successful commit

- **WHEN** a mutation's transaction commits successfully
- **THEN** the event is dispatched to active subscribers after commit, without blocking the response returned to the caller

#### Scenario: Best-effort delivery is documented as at-most-once

- **WHEN** the process crashes between commit and dispatch
- **THEN** the event may be lost (at-most-once), which is the accepted V1 contract; guaranteed delivery requires the documented outbox upgrade

### Requirement: Automatic and explicit emit seams

The system SHALL provide two ways events reach the dispatcher: (1) an automatic seam generalizing the existing tRPC `analyticsMiddleware` so every mutation also dispatches its canonical event to the bus (in addition to analytics); and (2) explicit `emit()` calls inside application-layer orchestrators and non-tRPC entrypoints (Telegram webhook, cron, Etta agent tools) for semantic events with richer payloads that the middleware cannot observe.

#### Scenario: Every tRPC mutation dispatches automatically

- **WHEN** any tRPC mutation succeeds
- **THEN** its canonical `{scope}.{object}.{action}` event is dispatched to the bus in addition to being captured by analytics, with no per-endpoint wiring

#### Scenario: A non-tRPC entrypoint emits explicitly

- **WHEN** the Telegram webhook handler completes an action that other plugins may react to
- **THEN** it emits the corresponding domain event explicitly, since the tRPC middleware does not observe non-tRPC entrypoints

### Requirement: First subscriber wires the notification stub

The system SHALL demonstrate the event system by adding a subscriber that writes a `Notification` row in response to a domain event (e.g. `rsvp.*.submitted`), activating the currently-unused `Notification` model as the reference subscriber.

#### Scenario: RSVP submission produces a notification

- **WHEN** an RSVP is submitted and the notifications subscriber is active for the wedding
- **THEN** a `Notification` row is created for that wedding after commit, using the previously-unused `Notification` model

### Requirement: Client-side reactivity to events is declarative

The system SHALL let a plugin declare, via the SDK, which client query caches to invalidate in response to which events, rather than requiring every mutating component to hand-invalidate cross-plugin caches. This SHALL build on the existing react-query invalidation model without introducing a mandatory global client store.

#### Scenario: Cross-plugin cache invalidation without direct coupling

- **WHEN** an event a plugin subscribes to occurs and the plugin declares an affected query key
- **THEN** that plugin's query cache is invalidated and its UI refetches, without the emitting component importing or knowing about the subscribing plugin
