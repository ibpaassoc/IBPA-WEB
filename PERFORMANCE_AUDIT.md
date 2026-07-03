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

---

# Pass 2 — site-wide audit (July 2026)

Scope: entire site (public landing, dashboard, admin, API, DB). Each item below is a
separate commit on the `optimization` branch.

## Shipped

1. **Analytics scoped to public pages** — gtag.js no longer loads on /admin or /dashboard.
2. **Clerk scoped to routes that use it** — ClerkProvider moved from the root layout into
   the dashboard / sign-in / checkout-success layouts. Admin gets the signed-in admin's
   name/email from the server layout, so admin pages ship **zero** clerk-js.
3. **Vimeo click-to-play facade** — the mission video iframe (4–7 MB of player JS + media)
   now mounts only after the visitor presses play; until then only an optimized poster
   renders through next/image.
4. **Images** — `deviceSizes` capped at 2560 (no more 3840px hero requests), AVIF enabled,
   optimized renditions cached 31 days. `ImageWithFallback` routes allowlisted remote
   hosts (utfs.io uploads!) through the Next optimizer instead of a plain `<img>` with the
   original upload. `AvatarImage` serves 96px thumbnails site-wide; admin portfolio grids
   serve 256px thumbnails. Inter no longer downloads twice; the Cormorant accent font no
   longer preloads 16 files per page.
5. **i18n split** — the ~100 KB dashboard dictionary is injected only in the dashboard
   route group instead of shipping with every public page.
6. **Admin nav prefetch off + lazy charts** — sidebar/quick-action links use
   `prefetch={false}`; recharts is a dynamic import behind a skeleton.
7. **Members directory** — `/api/cards` list is now a slim SQL projection with ILIKE
   search + LIMIT/OFFSET + count (was: fetch every member with full JSON blobs, filter in
   memory). `GET /api/cards/:id` filters by id in SQL. The UI loads 30 rows with
   "Load more" and fetches bio/services/portfolio only when a row expands.
8. **Public content caching** — homepage events/news/partners sections and the
   `/api/content` proxy use a 5-minute data cache + `s-maxage=300,
   stale-while-revalidate=600` (only when `target` is explicit in the URL).
9. **Deps** — removed 42 unused packages net (MUI + Emotion, react-slick, react-dnd,
   date-fns, 24 individual @radix-ui packages, etc.); `react-is` added for recharts.

## Recommended next steps (not applied)

- Drizzle indexes: `core_memberships (status, started_at desc)`,
  `core_applications (type, created_at desc)` — needs a migration against Neon.
- The `/api/cards?purpose=mailing` branch still fetches all recipients then slices.
- Public news/events pages are client-rendered (`useEffect` fetch); converting them to
  server components with `revalidate` would remove a client round-trip and improve SEO.
- Bundle analyzer: `@next/bundle-analyzer` is webpack-only; this project builds with
  Turbopack. Use `.next/static/chunks` sizes (or `next build --profile`) to track bundles.
