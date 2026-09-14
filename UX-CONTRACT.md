# IBPA Admin UX Contract

## Product context

- **Audience:** IBPA staff operating editorial, membership, communications, and recorded-media workflows.
- **Primary job:** Find a managed record, understand its lifecycle state, complete one clear action, and recover safely from provider or network failures.
- **Locale:** The admin interface is English (`en-US`). Managed content may be Russian, English, or Ukrainian.
- **Time policy:** Stored instants are UTC. Date-only filters are sent as ISO `YYYY-MM-DD`; the browser owns the compact native calendar popup.
- **Accessibility target:** WCAG 2.2 AA.

## Business and implementation sources

| Scope                  | Source                                                                               | Role                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Admin authorization    | `app/backend/src/services/admin.ts` and `app/web/src/lib/admin-api-auth.ts`          | Canonical permission enforcement                        |
| Admin shell/navigation | `app/web/src/features/admin/shared/components/AdminShell.tsx`                        | Canonical workspace shell                               |
| Runtime visual system  | `app/web/src/styles/theme.css`, `app/web/src/styles/index.css`, shared UI primitives | Canonical runtime tokens and controls                   |
| Webinar lifecycle      | `app/backend/src/features/webinars/server/webinar.service.ts`                        | Import, storage, playback, subtitle, and retry behavior |
| Zoom recording access  | Standard `/users` and `/users/{userId}/recordings` APIs                              | Account-admin access without master/subaccount APIs     |
| Subtitle versions      | `app/backend/src/features/webinars/server/webinar-subtitle-state.ts`                 | Version registry, lineage, revisions, member tracks     |
| Subtitle AI jobs       | `app/backend/src/features/webinars/server/webinar-subtitle-jobs.service.ts`          | AssemblyAI transcripts, Claude translations, retries    |
| Member webinar access  | `app/backend/src/features/webinars/server/webinar-access.ts`                         | Canonical publication and member access rule            |

`DESIGN.md` records visual intent. Existing CSS and shared components remain the runtime source of truth; new feature values must follow that mapping rather than introducing a parallel theme.

The Zoom Server-to-Server OAuth app owns these granular admin scopes: `user:read:list_users:admin`, `cloud_recording:read:list_user_recordings:admin`, and `cloud_recording:read:list_recording_files:admin`. Scope changes require reactivation before the backend requests a new token.

## Canonical UI Map

| Capability     | Canonical owner                           | Source of truth                                                               | Allowed variants                    | Verification                                                    |
| -------------- | ----------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| Select/Listbox | Authored Radix select                     | `app/web/src/components/ui/select.tsx`                                        | compact filter / media overlay      | keyboard, Escape, focus restoration, popup collision            |
| Date           | Native browser date input                 | `app/web/src/components/ui/input.tsx` with `type="date"`                      | compact English admin filters       | Chrome locale and keyboard check                                |
| Form           | Application-owned validation              | feature form plus authenticated backend route                                 | search / bounded editor save        | `noValidate`, server error mapping, duplicate-submit prevention |
| Scrollbar      | Admin workspace baseline                  | `app/web/src/styles/index.css` under `.admin-theme`                           | stable-gutter table/editor surfaces | standards and WebKit computed-style review                      |
| Toast          | Sonner                                    | existing admin toast provider and `sonner` calls                              | success / error                     | live-region and duplicate-action review                         |
| CRUD           | Feature repository plus authenticated API | `app/web/src/features/admin/webinars` and `app/backend/src/features/webinars` | import / version edit / publish     | unit, type, build, and authenticated browser flow               |

## Dataset and navigation behavior

- Admin datasets use server pagination. Webinar page size is 20 and filters, committed search, and page are URL-backed.
- Search is debounced by 300 ms, safe during IME composition, and cancels stale requests.
- Loading, empty, no-results, provider-error, retry, range-total, and long-running import states are distinct.
- Tables are semantic and scroll horizontally on narrow viewports without imposing viewport height on the shared shell.
- Navigating away from dirty subtitles requires an app-owned confirmation dialog. Saving stays in the webinar workspace.
- Subtitle versions never overwrite each other: Zoom `SOURCE`, `RU_AI`, `RU_MANUAL`, `EN_AI`, and `EN_MANUAL` live in the webinar record's `subtitle_versions` JSONB with lineage and revision history; cue text is immutable R2 revision objects.
- The workspace navigator reads Source → Russian → English; each language chooses at most one member track. Compare mode aligns same-language versions by timestamp and highlights word-level differences.
- Members see only published, imported webinars their account may watch (`canViewerWatchWebinar`); drafts return 404 and ineligible published webinars return 403 on every member endpoint.

## Async and resilience

| Operation                 | Pending state                                                | Success                                             | Failure and recovery                                                         |
| ------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Sync Zoom                 | Disable Sync Zoom and preserve filters                       | Refresh the first page and announce counts          | Inline error with Retry; previous data remains readable                      |
| Import recording          | Disable the selected webinar action and poll lifecycle state | Webinar becomes Imported and opens in its workspace | Failed state retains a concise provider error and offers deterministic retry |
| Load playback             | Reserve the 16:9 player                                      | Use one temporary private R2 URL                    | Player explains that video is unavailable and allows page refresh            |
| Save subtitles            | Keep editor geometry stable and disable duplicate save       | Append a revision, or create a manual version from Source/AI and select it | A newer revision blocks overwrite; "Reload latest revision" discards local edits |
| Restore revision          | Disable restore controls                                     | Append a restore revision and reload cues           | Nothing is deleted; conflicts ask for a reload                               |
| Generate AI Russian       | Confirm dialog, then a processing version with polling       | New RU_AI version; Source and member track unchanged | Failed/interrupted versions keep the provider error and offer Retry          |
| Translate to English      | Source chosen with radio cards; processing version with progress | New EN_AI version with pinned source lineage     | Failed/interrupted versions keep the error and offer Retry                   |
| Publish / edit access     | Disable submit while saving                                  | Draft ↔ Published, access saved with actor/time     | Validation errors stay inline; publishing never requires subtitles           |

- Imports are pessimistic, atomically claimed in the database, and use deterministic R2 object keys.
- Stale list/search requests are aborted. Detail polling is silent and does not erase local edits.
- Browser playback and subtitle requests are lazy; list rows never create signed playback URLs.
- Admin session expiry follows the shared authentication behavior; server endpoints independently require admin access.

## Components and accessibility

- Shared Button, Input, Dialog, Select, Table, status, empty-state, and page-shell owners are reused.
- Enabled actions have pointer, hover, focus-visible, active, disabled, busy, and error states without changing layout.
- Player controls expose text labels, pressed state where applicable, and keyboard-operable native range inputs.
- Subtitle cues are timestamped, searchable, editable, seekable, and visibly active without relying on color alone.
- Dialogs trap focus, support Escape, restore focus, and provide a title and description.
- Nonessential motion is disabled under reduced-motion preferences; forced-colors retains operable scrollbars and controls.

## Responsive behavior

- `AdminShell` owns the sidebar-to-drawer transformation.
- Filters wrap into a compact grid; the recording table owns horizontal overflow.
- The detail editor uses a wide main column and narrower metadata rail, stacking on smaller screens.
- The 16:9 player reserves media geometry before its signed source is ready.

## Verification contract

- Static: backend TypeScript build and lint; web typecheck, targeted lint, tests, production build, and premium audit.
- Browser: Chrome desktop plus narrow-viewport checks of list overflow, dialogs, player controls, cue seeking, and dirty-state navigation.
- Integration: authenticated admin session, Zoom Server-to-Server OAuth app, private R2 bucket with playback CORS, and migrated PostgreSQL schema.
- Failure paths: malformed dates, missing MP4/transcript, Zoom/R2 failures, duplicate import, stale import recovery, invalid VTT, and ETag conflict.
