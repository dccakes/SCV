<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of this project using the Next.js App Router setup. It added client initialization through `instrumentation-client.ts`, wired client-side identity syncing for authenticated sessions, enabled server-side PostHog usage with exception autocapture, instrumented business events across website customization and event-management flows, added backend event capture for upload-token and Telegram webhook activity, configured client and server PostHog environment variables locally, created a PostHog dashboard, and added error tracking in the app and global error boundaries.

| Event | Description | File |
|---|---|---|
| `website_template_selected` | Captures when a signed-in user switches their wedding website template. | `src/app/_components/website/template-picker.tsx` |
| `website_rsvp_toggled` | Captures when a signed-in user enables or disables public RSVPs for their website. | `src/app/_components/website/rsvp-toggle-card.tsx` |
| `website_home_saved` | Captures when a signed-in user saves homepage copy for their public wedding site. | `src/app/_components/website/website-editor.tsx` |
| `website_media_saved` | Captures when a signed-in user saves website header or gallery media. | `src/app/_components/website/website-media-editor.tsx` |
| `event_created` | Captures when a signed-in user creates a wedding event. | `src/app/(authenicated)/events/_components/events-page-client.tsx` |
| `event_updated` | Captures when a signed-in user updates a wedding event. | `src/app/(authenicated)/events/_components/events-page-client.tsx` |
| `event_deleted` | Captures when a signed-in user deletes a wedding event. | `src/app/(authenicated)/events/_components/events-page-client.tsx` |
| `event_rsvp_collection_toggled` | Captures when a signed-in user changes RSVP collection for an event. | `src/app/(authenicated)/events/_components/events-page-client.tsx` |
| `blob_upload_token_requested` | Captures when an authenticated user requests a browser upload token. | `src/app/api/blob/upload/route.ts` |
| `telegram_webhook_received` | Captures when the Telegram webhook accepts an incoming update for background handling. | `src/app/api/webhooks/telegram/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- Dashboard: https://us.posthog.com/project/501403/dashboard/1809682
- Insight: Event lifecycle volume — https://us.posthog.com/project/501403/insights/3IFrwHY8
- Insight: Website configuration actions — https://us.posthog.com/project/501403/insights/bxQIB5wd
- Insight: Website setup funnel — https://us.posthog.com/project/501403/insights/WV8JfUJw
- Insight: Operational ingestion activity — https://us.posthog.com/project/501403/insights/PUC2ochC
- Insight: RSVP configuration adoption — https://us.posthog.com/project/501403/insights/a71t2lqL

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names you added to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
