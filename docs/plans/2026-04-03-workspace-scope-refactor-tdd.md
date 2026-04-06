# Workspace Scope Refactor (TDD + Parallel Agents)

## Goal

Refactor workspace scope resolution so decision logic is separated from persistence, while preserving runtime behavior.

## Guardrails

- Keep behavior unchanged.
- Do not alter role policy in this phase.
- Keep `resolveWorkspaceScope()` public contract stable.
- Use TDD: Red -> Green -> Refactor for each task.

## Architecture Target

1. `src/server/authz/workspace-scope-resolver.ts`
   - Pure resolver logic.
   - No DB calls.
2. `src/server/authz/workspace-scope.repository.ts`
   - DB reads/writes only.
3. `src/server/authz/workspace-scope.service.ts`
   - Orchestrates repo + resolver + persistence action.
4. `src/server/authz/workspace-scope.ts`
   - Facade delegating to the new service.

## Task Board

- [x] Task A: Add pure resolver tests (`workspace-scope-resolver.test.ts`) - Red
- [x] Task A: Implement pure resolver (`workspace-scope-resolver.ts`) - Green
- [x] Task A: Refactor + keep tests green

- [x] Task B: Add repository tests (`workspace-scope.repository.test.ts`) - Red
- [x] Task B: Extract repository (`workspace-scope.repository.ts`) - Green
- [x] Task B: Refactor + keep tests green

- [x] Task C: Add service orchestration tests (`workspace-scope.service.test.ts`) - Red
- [x] Task C: Implement service (`workspace-scope.service.ts`) - Green
- [x] Task C: Refactor + keep tests green

- [x] Task D: Rewire facade (`workspace-scope.ts`) to service
- [x] Task D: Update compatibility tests (`workspace-scope.test.ts`, `trpc-context-authz.test.ts`, `etta/utils/auth.test.ts`)
- [x] Task D: Refactor + keep tests green

## Parallelization Plan

1. Wave 1
   - Agent 1: Task A (resolver tests + implementation)
   - Agent 2: Task B (repository tests + extraction)
2. Wave 2
   - Agent 3: Task C (service tests + implementation)
   - Agent 4: Task D (facade wiring + compatibility tests)

## Validation Gates

- `npm run test:unit -- --runInBand --no-cache <targeted tests>`
- `npm run check`
- `npx tsc --noEmit --incremental false`

## Progress Log

- 2026-04-03: Plan created.
- 2026-04-03: Task A completed with new pure resolver + dedicated unit tests.
- 2026-04-03: Task B completed with repository extraction + dedicated unit tests.
- 2026-04-03: Task C completed with orchestration service + dedicated unit tests.
- 2026-04-03: Task D completed; facade now delegates to service with compatibility tests green.
