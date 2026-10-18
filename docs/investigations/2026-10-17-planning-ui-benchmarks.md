# Planning UI Benchmarks: What "Clean, Apple-like, Easy" Looks Like

Date: 2026-10-17
Scope: Research only (no implementation changes)
Goal: Identify the planning tools with the cleanest, most intuitive UI and extract patterns OSWP can adopt for its planning experience.

## 1) Evidence quality

There is no rigorous, independent usability study comparing these apps. Most sources are listicles or comparisons written by competing vendors. Apple's 2025 Design Awards had no productivity or planner category, so "Apple-like" cannot be anchored to an award. Findings below combine reviewer consensus with first-hand product behaviour.

## 2) Benchmark apps

| App | Why the UI is admired | What OSWP could take |
|---|---|---|
| **Things 3** | The reference for an Apple-like task app. Simple and clarifying while keeping power. Separates "When" from "Deadline". Draggable Magic Plus button creates items exactly where dropped. | Checklist bucketed as Now / Next / Later rather than one long list. Keep "when I'll do it" separate from "when it's due". |
| **Structured** | Frequently named the best daily planner because the whole day is one visual timeline. | Wedding day as a vertical timeline (hair, ceremony, photos, reception). Instantly legible to couples and vendors. |
| **Linear** | Feels fast because of optimistic UI: update locally, sync in background, only show errors when they occur. Cmd+K for everything, shortcut hints teach gradually. Not every element carries equal visual weight. | Instant task and RSVP updates. A Cmd+K palette ("add guest", "find florist"). Mute everything except the one thing that matters per screen. |
| **Sunsama** | Calm, deliberate daily planning with a shutdown ritual. The ritual is also the top reason people churn. | A light weekly "here's what's next" from Etta. Avoid mandatory rituals. |
| **Fantastical** | Polished design and natural-language input. | Typed quick-add that Etta parses: "Call florist next Tuesday, budget $2k". |
| **Zola** | Most design-praised wedding product, mainly its theme editor and theme range. | The category bar to match. |
| **Joy / The Knot / Minted** | Large theme libraries; a 2026 user-complaint analysis flags mobile website builder friction. | Opportunity: OSWP can win on mobile. |

Note: Amie was a design favourite, but an independent comparison reports it has shifted away from calendar and to-do toward meeting notes. Use older references only.

## 3) Shared patterns

1. **One primary view per screen.** Today, Timeline, or Board; never all at once.
2. **Time is the organising axis.** People think "what's next", not "which category".
3. **Quick add from anywhere**, ideally natural language.
4. **Instant feedback.** No spinners when checking off a task.
5. **Restraint.** Muted palette, hierarchy via type weight and size, accent colour reserved for the single next action. DESIGN.md's warm OKLCH tokens already fit.
6. **Delight in small places.** Completion animations, not decoration everywhere.

## 4) Recommendation

Combine **Things 3 (checklist) + Structured (day-of timeline) + Linear (speed and Cmd+K)**, with Etta generating the initial checklist from the wedding date so the first screen is never empty.

Proposed views (mocked separately):

1. **Home / Today**: countdown, the one next action, this week's tasks, RSVP and budget pulse.
2. **Checklist**: Now / Next / Later buckets driven by the wedding date.
3. **Wedding Day Timeline**: single vertical timeline with people and vendors per block.
4. **Quick Add (Cmd+K)**: natural-language entry parsed by Etta, plus navigation commands.

## 5) Open questions

- Which planning surface ships first: checklist, budget, or day-of timeline?
- Does a Cmd+K palette fit the couple audience, or should quick add be a visible button first with Cmd+K as an accelerator?

## Sources

- [MacStories: Things 3 review](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/)
- [Blake Crosley: Things design guide](https://blakecrosley.com/guides/design/things)
- [Blake Crosley: Linear design guide](https://blakecrosley.com/guides/design/linear)
- [Linear: behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh)
- [925studios: Linear design breakdown](https://www.925studios.co/blog/linear-design-breakdown-saas-ui-2026)
- [Toolradar: best daily planner apps](https://toolradar.com/blog/best-daily-planner-apps)
- [Ellie Planner: best daily planner apps for iPhone](https://ellieplanner.com/productivity-guides/best-daily-planner-apps-iphone)
- [Efficient.app: Sunsama vs Amie](https://efficient.app/compare/sunsama-vs-amie)
- [Rework: Sunsama alternatives](https://resources.rework.com/tools/productivity/best-sunsama-alternatives)
- [Setapp: best daily planner apps](https://setapp.com/how-to/best-daily-planner-apps)
- [Apple Newsroom: 2025 Apple Design Awards](https://www.apple.com/newsroom/2025/06/apple-unveils-winners-and-finalists-of-the-2025-apple-design-awards/)
- [Greenlit: Zola review](https://greenlitcontent.com/resources/zola-wedding-review)
- [Unstar: wedding planning apps ranked 2026](https://unstar.app/ar/blog/zola-the-knot-joy-weddingwire-minted-wedding-planning-apps-ranked-2026)
- [Joy: best wedding planning apps](https://withjoy.com/blog/15-best-wedding-planning-apps-that-make-wedding-prep-easy/)
