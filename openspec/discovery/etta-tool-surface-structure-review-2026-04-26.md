# Etta Tool Surface Structure Review

Date: 2026-04-26

## Summary

The current Etta tool surface is workable, but it is not structured in the best way yet.

What is good:

- Tools are split by domain, which keeps the codebase navigable.
- Shared authorization helpers are already in place.
- The vendor tools are in relatively good shape because they reuse domain validators and services.

What is not yet good enough:

- The planner toolset mixes real domain actions, generic escape hatches, and placeholder tools as peers.
- Suggestion-creating tools are duplicated across modules instead of going through one shared creation path.
- Tool return shapes and lifecycle semantics are inconsistent.
- Some tool capabilities are described as stronger than what they actually execute.

## Findings

### 1. Generic suggestion creation weakens the overall tool contract

File: `src/lib/etta/tools/suggestions.ts`

The `create_suggestion` tool accepts any `actionType` string and arbitrary JSON payload.
That bypasses the stricter domain-specific suggestion tools such as vendor add, budget updates, and outbound drafts.

Impact:

- Approval behavior depends on convention instead of registered contracts.
- The model has an easy escape hatch that can create actions the rest of the system does not understand well.
- Tool safety and predictability are lower than they should be.

Recommendation:

- Remove `create_suggestion` from the normal planner toolset, or
- Restrict it to a registry of supported suggestion action types with typed payload schemas.

### 2. Timeline tools are exposed as real tools even though they are placeholders

Files:

- `src/lib/etta/tools/timeline.ts`
- `src/lib/etta/utils/build-system-prompt.ts`

`get_milestones` returns a static milestone list.
`complete_milestone` writes an audit event but does not actually mutate milestone state.
At the same time, the planner prompt says Etta has full access and describes milestone completion as T0 auto-execution.

Impact:

- The model is encouraged to act as though timeline state is real when it is not.
- Users can receive confirmations that imply state changed when only logging happened.

Recommendation:

- Remove placeholder timeline tools from the main planner toolset until they are stateful, or
- Mark them explicitly as non-persistent preview tools in both code and prompt.

### 3. Suggestion-producing tools should be centralized

Files:

- `src/lib/etta/tools/vendors.ts`
- `src/lib/etta/tools/budget.ts`
- `src/lib/etta/tools/outbound.ts`
- `src/lib/etta/tools/suggestions.ts`

Multiple tools hand-roll `db.ettaSuggestion.create(...)`, set tiers, build summaries, and choose response shapes independently.

Impact:

- Status strings drift (`pending` vs `pending_approval`).
- Summary and payload conventions drift across modules.
- Approval-gated tool behavior becomes harder to audit and harder to evolve consistently.

Recommendation:

- Introduce a shared suggestion service or factory for T1/T2 actions.
- Make each tool declare only its action-specific payload and summary inputs.

### 4. Tool output contracts are inconsistent

Files:

- `src/lib/etta/tools/guests.ts`
- `src/lib/etta/tools/suggestions.ts`
- `src/lib/etta/tools/outbound.ts`
- `src/lib/etta/tools/vendors.ts`

Some tools return wrapped objects such as `{ vendors }` or `{ guests }`.
Others return raw DB or service results.
Some failures throw, while `update_guest` returns `{ error: 'Guest not found' }` as data.

Impact:

- Tool calling is less predictable for the model.
- Follow-up reasoning has to adapt to shape differences that do not add product value.

Recommendation:

- Standardize read-tool and write-tool outputs.
- Prefer one approach for errors: throw structured errors instead of returning ad hoc `{ error }` payloads.

### 5. Document reading sits outside the normal domain boundary

File: `src/lib/etta/tools/documents.ts`

`read_pdf` accepts any URL and fetches it directly after only checking that auth context exists.

Impact:

- This tool does not follow the same wedding-scoped domain pattern as the rest of the planner tools.
- It increases the chance of the agent operating on arbitrary external documents instead of first-class wedding assets.

Recommendation:

- Prefer document IDs or trusted attachment URLs from the application domain.
- If raw URLs remain supported, constrain them to expected storage hosts.

## Recommended Direction

Priority order:

1. Remove or constrain `create_suggestion`.
2. Centralize T1/T2 suggestion creation behind one shared abstraction.
3. Remove or clearly downgrade placeholder timeline tools until persistence exists.
4. Standardize tool result shapes and error behavior.
5. Move `read_pdf` toward first-class wedding document references.

## Bottom Line

The current layout is acceptable for iteration, but it is not the cleanest long-term structure.
The main issue is not the number of tools; it is that the tool surface mixes three different classes of capability:

- real domain actions
- approval-gated suggestion creation
- placeholders and utility escapes

Those should be more clearly separated in the architecture and in the model-facing contract.
