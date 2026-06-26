# IBPA-WEB Performance Audit & Optimization Notes

Scope: `/` (public landing), `/admin/applications`, `/admin/mailing`, and shared admin
data-fetching. The goal of this pass is to remove unnecessary payload weight and
unnecessary work without changing any existing flow or the premium blue / glassmorphic
look.

## How to measure (before/after)

- **Lighthouse / PageSpeed**: run against `/`, `/admin/applications`, `/admin/mailing`.
  Watch LCP (landing hero) and TBT (admin JS + payload parsing).
- **Network panel**: for admin routes, the most useful metric is the *transfer size* of
  the list API calls (`/api/orders`, `/api/cards`, `/api/admin/partner-applications`) and
  the *number of requests* fired on first paint.
- **Server timing**: the backend list endpoints fetch-all-then-filter in memory, so the DB
  read size matters as much as the JSON transfer.

## Findings

### 1. Admin orders list shipped the full application payload (biggest win)
`app/backend/src/routes/orders.ts` → `buildAdminOrderRows()` selected the entire
`coreApplications` row (including the large `applicationData` JSON blob and
`applicationFiles`) for **every** member application and returned it as `applicationPayload`
on each list item. The list UI (`toMemberApplicationRecord`) only needs
name / email / status / package / payment / date, and never reads `applicationPayload`,
`.raw`, or `secureToken`. Full detail already loads on demand via `GET /api/orders/:id`.

This list response also feeds `/admin/mailing` (`/api/orders?limit=500`), so the bloat hit
two routes.

**Fix:** select only summary columns and stop returning `applicationPayload` /
`secureToken` from the list. Certificate number is sourced from the canonical
`coreCertificates` join. Detail endpoint is unchanged.

### 2. Admin mailing did all audience work up front
`AdminMailingPage` loaded four sources on mount. Two of them
(`listApplicationAudienceEmails`, `listEventRegistrantAudienceEmails`) are only needed once
the admin opens the compose sheet *and* picks a status/event audience, yet they fired on
first paint and triggered:
- `/api/orders?limit=500` (now slim after #1) + `/api/admin/partner-applications?limit=500`
- `/api/admin/content` followed by an **N+1** of `/api/admin/events/:id/registrations`.

**Fix:** the landing of `/admin/mailing` now loads only what it renders (recipients +
history). Audience emails load lazily the first time the compose sheet opens.

### 3. Mailing recipients query was over-fetching
`/api/cards?purpose=mailing&limit=500` (`buildAdminClientRows`) joins applications +
certificates and returns full payloads, portfolio arrays, and bios. Mailing only uses
`email`, `cardName`, `membershipCategory`, `userName`, `id`.

**Fix:** a dedicated slim query (`buildMailingRecipientRows`) for the mailing purpose that
selects only the needed columns and skips the applications/certificates joins. The members
directory (`purpose` unset) keeps its richer shape because `MemberProfileTab` reads
`applicationPayload`.

### 4. Landing images had no `sizes`
The landing is already mostly server components, the hero is correctly `priority`, and the
Vimeo player is lazy + desktop-only + dynamically imported. The gap: below-the-fold images
went through `next/image` with the default `sizes="100vw"`, so the browser downloaded
viewport-width renders of ~1 MB originals even for 450px carousel cards and ~104px
thumbnails.

**Fix:** pass accurate `sizes` per usage so `next/image` serves appropriately scaled
images. The remote-image branch of `ImageWithFallback` also now uses
`loading="lazy"` + `decoding="async"`.

## Recommended DB indexes (not auto-applied)

These need a Drizzle migration run against Neon, so they are recommendations rather than
part of this change set. They back the list/filter queries that currently scan-and-filter:

- `core_applications (type, created_at desc)` — orders & partner list ordering + type filter.
- `core_payments (id)` / `core_certificates (membership_id)` — already PK/FK, used by joins.
- `core_memberships (status, started_at desc)` — cards/members directory.

Longer term, the admin list endpoints should filter + paginate at the SQL layer instead of
fetching all rows and slicing in memory; the column-trimming here is the low-risk first step.
