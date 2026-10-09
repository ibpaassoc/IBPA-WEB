# IBPA SEO Report

**Site:** https://ibpassociations.org · **Organization:** International Beauty Professionals Association (IBPA)
**Audit date:** 2026-10-09 · **Branch:** `refactor/seo` (12 commits on top of `9079403`, including this report; nothing pushed)
**Scope of changes:** `app/web` only. No database migrations, no changes to `ibpa-forum.com` or any other repository, no secrets touched.

> **No ranking claims.** Nothing here promises a position on Google. Indexing, ranking, and traffic depend on crawling, competition, and time. This report separates what is **done and verified in code** from what **needs external access, publishing, or a manual decision**.

---

## 0. Scope, tools, and limitations (read first)

| Item | What happened |
|---|---|
| **claude-seo plugin** (`/plugin marketplace add AgriciDaniel/claude-seo`, `/plugin install …`, `/seo setup`, `/seo doctor`) | **Not installed.** These are interactive Claude Code commands; they cannot be run from the desktop-app session this work was done in. The plugin's documented fallback (`git clone` + `install.sh`) executes a third-party shell script that creates a Python environment, can install Playwright/Chromium, and can write to `~/.config/claude-seo/` and `~/.claude.json`, so I did not run it. |
| What I reviewed instead | The plugin's README summary (MIT license, Python 3.10+, optional Playwright and Google API credentials, self-reported "no telemetry"; its docs say to review `install.sh`, `hooks/`, and `scripts/` before running) and its published `seo-technical` and `seo-schema` skill checklists. I applied those checklists manually with `curl`, Python parsers, the built-in browser, and Google Search Central pages. |
| To use the plugin yourself | In a terminal `claude` session run the four commands from the brief. Read `install.sh` before approving anything. Then `/seo audit https://ibpassociations.org` and `/seo schema https://ibpassociations.org/` against the deployed site. |
| **Ahrefs / Search Console / Keyword Planner data** | **Not available.** No search volumes, keyword-difficulty scores, rankings, traffic, or competitor metrics appear in this report because I had no reliable source and will not invent them. Intent and competitor findings come from live search results (US, 2026-10-09) and are qualitative. |
| **PageSpeed Insights / Core Web Vitals** | The public PSI API returned `429 quota exceeded`, and the embedded browser pane cannot report LCP. **No lab or field CWV scores are claimed.** Field data needs Search Console (section 11). |
| **Google guidance used to verify recommendations** | Sitemaps (`lastmod`, `priority`, `changefreq`), block-indexing (noindex vs robots.txt), Organization structured data, FAQ rich results, favicons, site names, canonicalization, and title links, all fetched from developers.google.com on 2026-10-09. |

---

## 1. Executive summary

**What was holding the site back.** Search engines had been given contradictory and missing identity signals:

1. **Production told Google the wrong domain.** Live `robots.txt`, `sitemap.xml`, and `og:image` all pointed at `https://ibpa-web.vercel.app` (a full duplicate of the site that also answers publicly), because the production `NEXT_PUBLIC_SITE_URL` resolves to the Vercel hostname.
2. **Every public page shared one title and one description** (15 of 16 crawled pages), and **no page declared a canonical URL**.
3. **No structured data at all.** Nothing machine-readable said who IBPA is.
4. **Broken share images.** `og:image` was `…/@/public/file.svg` (invalid) and `twitter:image` was `/og-image.png` (HTTP 404).
5. **`www.ibpassociations.org` has an expired SSL certificate** (expired 2026-06-16), so anyone or any crawler following a `www` link gets a security error. This cannot be fixed in code.
6. The **news and events lists were client-rendered**; `/news` served "Loading news…" to crawlers.
7. Account, checkout, and token pages (`/dashboard`, `/sign-in`, `/success`, `/payment-link/*`, …) were indexable.
8. The brand has **almost no off-site footprint**: an exact-match search for "International Beauty Professionals Association" returned no IBPA page, and "IBPA" collides with the Independent Book Publishers Association.

**What was done.** Eleven commits (ten functional, plus one experiment that was added and reverted) fix items 1–4, 6, 7 in code, add the most valuable new page (`/beauty-association`), add a crawlable homepage statement of what IBPA is, repair heading/landmark semantics, remove a hydration error affecting every first-time visitor, and shrink a 484 KB favicon. 161 unit tests pass (135 before). Lint is unchanged from baseline.

**What only you can do (highest impact first).**
- **P0:** Fix the `www` certificate in Vercel; set production `NEXT_PUBLIC_SITE_URL=https://ibpassociations.org`; deploy; verify the domain in Search Console and submit the sitemap.
- **P0:** Decide and apply a Vercel redirect from `ibpa-web.vercel.app` to the primary domain (after checking webhook endpoints, section 12).
- **P1:** Build the off-site entity (LinkedIn, Facebook, directories) and earn links from owned and partner properties (section 10).
- **P1:** Resolve content-trust issues on the live site (placeholder-sounding standards copy, an expired "upcoming" event, unverifiable statistics; section 2).

**Realistic expectation.** "Beauty association(s)" and "professional beauty association" are head terms dominated by long-established trade bodies and guide articles. A new association should expect the first measurable gains from **brand and entity queries**, then **long-tail role-and-intent queries**, not head terms.

---

## 2. Initial technical SEO problems

Evidence was collected from the live site on 2026-10-09 (`curl`, `openssl`, parsed HTML) and from the repository. "Fixed" means fixed and verified in a production build of this branch; it takes effect on the live site only after deployment.

| # | Problem | Evidence | Severity | Status |
|---|---|---|---|---|
| 1 | Sitemap, robots.txt, and `og:image` use the Vercel hostname | Live `robots.txt`: `Host`/`Sitemap: https://ibpa-web.vercel.app…`; all 15 sitemap `<loc>` on that host; `og:image` = `https://ibpa-web.vercel.app/@/public/file.svg` | **P0** | **Fixed in code** (`getSeoOrigin()` ignores `*.vercel.app`). Also set the env var (section 12). |
| 2 | `www.ibpassociations.org` certificate expired | `openssl`: Let's Encrypt cert for `www` `notAfter=Jun 16 2026`; `curl` error 60. Apex cert valid to Dec 17 2026 | **P0** | **External** (Vercel domain config / DNS) |
| 3 | `ibpa-web.vercel.app` serves a full duplicate with no canonical | `HTTP 200`, same title, no `rel=canonical` | **P0** | **Mitigated** by self-canonicals on `ibpassociations.org`; 301 redirect recommended (external) |
| 4 | Identical title/description on every page; no canonicals | 15 of 16 crawled pages: title `IBPA - International Beauty Professionals Association`; 0 canonicals | **P0** | **Fixed** |
| 5 | No structured data | 0 `application/ld+json` blocks on any page | P1 | **Fixed** (Organization, WebSite, BreadcrumbList, Article) |
| 6 | Broken Open Graph / Twitter images | `og:image` invalid path; `/og-image.png` → 404 | P1 | **Fixed** (new 1200×630 card) |
| 7 | `/news` and `/events` content not in HTML | `/news` HTML contains "Loading news…"; `/events` shows only the built-in fallback event | P1 | **Fixed** (server-rendered, same cache/tag as admin edits) |
| 8 | Private/transactional pages indexable | `/dashboard`, `/sign-in`, `/team-invite`, `/success`, `/payment-link/*`, `/application/edit` returned 200 with no robots directive | P1 | **Fixed** (`noindex, nofollow`) |
| 9 | Sitemap hygiene | `/members` missing; every `lastmod` = request time; `priority`/`changefreq` present (Google ignores them) | P1 | **Fixed** |
| 10 | Weak homepage statement of what IBPA is | H1 is the name; body copy never says "beauty association"; no link into category content | P1 | **Fixed** (overview section) |
| 11 | Hydration failure for first-time visitors | Reproduced on `/faq` and `/beauty-association`: cookie banner read `localStorage` during render → server/client mismatch → React discards the server HTML | P1 | **Fixed** |
| 12 | Heading and landmark structure | H2→H4 skip on every page (footer `<h4>`); `/events` H1→H3; `/membership` H2→H4; `/members` had 3 `<main>` | P2 | **Fixed** |
| 13 | 484 KB favicon | `favicon.ico` was a 1024×1024 PNG | P2 | **Fixed** (6.5 KB ICO + 192 px + 180 px icons) |
| 14 | Heading typo "OURS PARTNERS" on the homepage | Live HTML | P2 | **Fixed** |
| 15 | Language is cookie-based on a single URL | `ibpa-locale` cookie switches EN/RU/UK on the same URL; Googlebot only ever sees English; `<html lang>` is always `en` | P2 | **Not changed** (product decision, section 12) |
| 16 | All public pages are dynamically rendered and uncacheable | Response header `cache-control: private, no-cache, no-store`; caused by `cookies()` in the `(public)` layout; first uncached homepage request took ~1.1 s TTFB, later requests ~0.2–0.3 s | P1 | **Not changed** (architectural; section 12) |
| 17 | Content-trust issues on the live site | `/standards` says files "can serve as structural placeholders", "A Central Archive for Team Use"; `/criteria` shows "10+ Experts / 5 Committees / 40+ Countries / 2026 Founded" with no source; the homepage "Upcoming" event (Forum, Sept 25–26, 2026) has already passed | P1 | **Not changed** (needs owner confirmation; I did not alter factual claims) |
| 18 | Member profile pages | `/profile-preview/[id]` are linked from the public directory, share one generic title, and had no robots directive | P1 | **Set to `noindex`** pending a product decision to make profiles indexable with unique titles and member consent |

Observations outside SEO scope: Google Analytics and Meta Pixel are loaded unconditionally in `(public)/layout.tsx`, independent of the cookie banner choice. Worth a privacy/compliance review.

---

## 3. Keyword research and intent mapping

**Method.** Followed the Ahrefs SEO tutorial's stages (keyword research → on-page → technical → link building). The Ahrefs page is an index, and I have no Ahrefs access, so the volume, difficulty, and traffic-potential steps could **not** be performed. In their place: live SERP review (page type, intent, who ranks) for each primary query, plus the three-Cs lens (content type, format, angle). **Treat everything below as qualitative.** Self-reported figures in third-party results (member counts, etc.) are unverified.

### 3.1 What Google currently shows (US, 2026-10-09)

| Query | Dominant results / page types | Intent | Implication for IBPA |
|---|---|---|---|
| beauty associations | Listicle and guide articles from schools and vendors (SelfNamed blog, Evergreen Beauty College, Boulevard), directory aggregators (PocketSuite), and nonprofit-data profiles | Informational / compare ("discover") | A homepage is the wrong page type. Needs a guide or comparison article. |
| beauty association | The Professional Beauty Association (PBA) and aggregator pages describing it | Mixed: navigational to PBA + informational | Category term; compete with guides, not PBA's brand. |
| professional beauty association (membership) | PBA's own site (`probeauty.org`), join pages, press posts | Transactional / navigational ("join") | Hardest to displace; target role- and need-specific "join" long tail. |
| international beauty association | Ambiguous entities: International Beauty and Barber Association, CIDESCO, IFBC, SISA, IBITA | Entity disambiguation | A distinct, well-signalled entity can win its own name; the generic phrase is contested. |
| beauty professionals association | PBA again; a 2020 Barbados group; aggregators | Navigational / informational | Use the phrase naturally on the guide. |
| beauty association for estheticians / cosmetologists | ASCP, PBA, NCA (via PBA), state and regional bodies | Commercial investigation | Role-specific sections are justified. |
| beauty association for lash artists | **No lash-specific association surfaced**; results were companies and general associations | Commercial investigation | A visible gap. Board members are lash/brow experts (see brief 3). |
| beauty association for salon owners | PBA Salon & Spa membership, America's Beauty Show, the UK's NBF | Commercial investigation | Business Owner category with team seats is a real differentiator. |
| "International Beauty Professionals Association" (exact) | **No IBPA result** | Brand | Before this work, the brand had no recognizable off-site presence. |

"IBPA" alone is ambiguous (Independent Book Publishers Association, Irish Beauty Professional Association). **Always pair "IBPA" with the full name** in titles, schema, and outreach.

### 3.2 The three intents the brief singled out

| Searcher says | Really wants | Page that should answer |
|---|---|---|
| "beauty associations" | A list/comparison of organizations | A neutral comparison guide (not yet written; brief 1). Today `/beauty-association` helps them *evaluate* any association with a six-point checklist. |
| "professional beauty association" | To join one / see what joining involves | `/beauty-association` (what it is, who it's for) → `/membership` (categories, fees) → `/apply` |
| "international beauty association" | A global organization | Homepage + `/about` (international, California-registered nonprofit) |

### 3.3 Keyword-to-page map (prevents cannibalization)

| Page | Primary target | Secondary / long-tail | Intent | Keyword placement now |
|---|---|---|---|---|
| `/` | International Beauty Professionals Association; international beauty association | IBPA + full name | Entity / navigational | Title, meta description, H1, H2 "An International Beauty Association for Professionals" |
| `/beauty-association` | professional beauty association; beauty association; beauty professionals association | what is a beauty association; how to choose a beauty association; join a beauty association; beauty association for estheticians / cosmetologists / lash and brow artists / salon owners | Informational → commercial | Title, H1, H2s, role H3s |
| `/membership` | beauty association membership | membership categories and benefits | Transactional | Title |
| `/criteria` | membership criteria / requirements | review process | Informational | n/a |
| `/standards` | beauty industry code of ethics; professional standards | policies | Trust | n/a |
| `/governance`, `/about` | IBPA board / nonprofit status | | Trust / entity | n/a |
| `/events`, `/news` | beauty industry events | | Freshness | n/a |
| *Future* `/resources/beauty-associations-in-usa` | beauty associations; beauty associations in the USA | comparison | Informational list | Brief 1 |

The exact phrase "beauty association" appears in the title or description of only three pages (`/`, `/beauty-association`, `/membership`), by design.

Role pages (`/membership/estheticians`, `/membership/lash-artists`, …) were **not** created: they would repeat the same five categories and add no unique value. The role long-tail is covered by sections on `/beauty-association` that deep-link to `/apply?category=…`. Create separate role pages only when each has unique content (see brief 6).

---

## 4. Competitor findings

All figures are **self-reported or third-party** and unverified.

| Organization | What the SERP/site shows | Lesson for IBPA |
|---|---|---|
| **Professional Beauty Association (PBA)**, `probeauty.org` | Describes itself as the largest US beauty trade organization; tiered memberships (Licensed Professional, Student, Business, Salon & Spa, Visionary); advocacy campaigns; flagship events (NAHA, ISSE-related); a "Visionary Elite" brand-logo grid; "Our History" and annual-report pages; a SalonCentric partnership | Wins on age, advocacy, events, and brand partners. IBPA cannot match those today; it can match **clarity of membership tiers**, publish **governance documents**, and show **real events and partners**. |
| **Associated Skin Care Professionals (ASCP)** | Positions itself as esthetician-specific, with insurance and education bundled (per search results) | Single-role focus ranks for role queries. IBPA's multi-role model needs role-specific explanation (done on the guide). |
| **National Cosmetology Association (NCA)** | Now operates under PBA per search results | Absorbed into PBA; confirms PBA's dominance for generic queries. |
| **America's Beauty Show / Cosmetologists Chicago** | Salon-owner membership with show tickets and CE, regional | Local/event-linked membership. |
| **International Beauty and Barber Association, CIDESCO, IFBC, SISA, IBITA** | Surface for "international beauty association" | The "international" space is fragmented and entity-ambiguous. A clean, consistent entity (full name, schema, `sameAs`) is an advantage. |
| **Guide publishers** (SelfNamed blog, Evergreen Beauty College, Boulevard, PocketSuite directory) | Own the "beauty associations" listicle SERP | These are also the best link and inclusion targets (section 10). |

**What IBPA already has that competitors' summaries emphasize less:** 15 public governance and policy documents (bylaws, code of ethics, membership agreement, conflict-of-interest policy, …), a named board, a Brand Membership vs sponsorship distinction stated explicitly, and a stated California nonprofit registration.

---

## 5. Implemented fixes and changed files

60 files changed (+2,333 / −436 net of the revert). All paths are under `app/web/`.

| Commit | Change | Key files |
|---|---|---|
| `48bf828` fix(seo) | Canonical-origin helper; sitemap/robots corrected; invalid share images replaced | `src/lib/seo/{site,organization,routes}.ts` (+tests), `src/app/{layout,robots,sitemap}.ts(x)`, `public/og/ibpa-og.jpg` |
| `0ae2dd9` feat(seo) | Unique titles, descriptions, self-canonicals, OG/Twitter cards; `noindex` on private routes; `| IBPA` template scoped to `(public)` | `src/lib/seo/{metadata,pages}.ts` (+test), 16 new `layout.tsx` files, `(public)/layout.tsx`, `(public)/page.tsx`, private-route layouts |
| `895ba87` feat(seo) | Organization, WebSite, BreadcrumbList JSON-LD | `src/lib/seo/json-ld.ts` (+test), `src/components/seo/JsonLd.tsx` |
| `6c59be6` fix(perf) | Cookie banner no longer forces a full client re-render | `src/components/layout/CookieConsentBanner.tsx` |
| `ff0049c` feat(seo) | `/beauty-association` guide; Article schema; footer link; navbar light-hero mode | `src/app/(public)/beauty-association/*`, `Footer.tsx`, `Navbar.tsx`, `json-ld.ts`, `pages.ts`, `routes.ts` |
| `885be56` feat(seo) | Crawlable "what IBPA is" homepage section (en/ru/uk); typo fix | `AssociationOverviewSection.tsx`, `SponsorsSection.tsx`, `(public)/page.tsx` |
| `b228fc6` feat(seo) | Server-rendered news and events | `public-content-server.ts` (+test), `public-content.ts`, `news/NewsPageClient.tsx`, `events/EventsPageClient.tsx`, new `page.tsx` wrappers |
| `48b55c1` fix(a11y) | Heading hierarchy and `<main>` nesting | `Footer.tsx`, `EventCard.tsx`, `membership/page.tsx`, `members/{page,loading}.tsx` |
| `5e86b71` perf(seo) | Correctly sized favicon and touch icons | `src/app/{favicon.ico,icon.png,apple-icon.png}` |
| `d821b5d` + `e0dd64b` | A `noindex` header for `*.vercel.app` hosts was added, then **reverted** after checking Google's guidance (see below) | `next.config.mjs` (net: unchanged) |

**Corrections to my own commit messages** (history is unpushed but I did not rewrite it):
- `5e86b71` says a 192 px icon is "a multiple of 48 as Google requires". Google's current favicon page recommends **more than 48×48 px** and does **not** require multiples of 48. The assets satisfy either reading.
- `d821b5d`'s mirror `noindex` was reverted. Google says not to use `noindex` for canonicalization, and while the live sitemap/robots still advertise the Vercel host, Google may have chosen those URLs as canonical, so `noindex` there could drop the cluster. Redirect at Vercel instead (section 12).

**Design and behavior preserved.** No existing layout, animation, form, payment, or auth code was altered. The new pages reuse the existing display fonts, colors, card radii, and button styles. Pre-existing lint findings (6 errors, 8 warnings in admin/dashboard/apply files) are unchanged and not caused by this work.

---

## 6. Newly optimized pages

| Page | Title (suffix `| IBPA` added except homepage) | Notes |
|---|---|---|
| `/` | International Beauty Association for Professionals \| IBPA | New overview section; Organization + WebSite schema |
| `/beauty-association` **(new)** | Professional Beauty Association: Why & How to Join | ~1,090-word answer-first guide: what a beauty association does, six-point selection checklist, IBPA membership by profession with live prices from `lib/membership`, joining steps, six FAQs. English-only by design. Every IBPA statement mirrors published copy; IBPA is described as **not** a licensing body. |
| `/about` | About IBPA: Mission, Vision & Nonprofit Status | |
| `/membership` | Beauty Association Membership: Categories & Benefits | |
| `/criteria` | Membership Criteria & Review Process | |
| `/standards` | Professional Standards, Ethics & Policies | |
| `/governance` | Governance: Board of Directors & Officers | |
| `/members` | Members Directory | Duplicate `<main>` removed |
| `/events` | Beauty Industry Events & Championships | Server-rendered |
| `/news` | News & Insights for Beauty Professionals | Server-rendered |
| `/partnership` | Partner & Sponsor: Brand Membership vs Sponsorship | |
| `/faq` | Membership FAQ: Application, Payment & Certificates | |
| `/contact` | Contact IBPA: Membership & Partnership Questions | |
| `/apply` | Apply for IBPA Membership | Canonical stays `/apply` for `?category=` variants |
| `/privacy`, `/terms`, `/cancellation-policy` | Privacy Policy / Terms of Use / Cancellation Policy | |

Google may rewrite any title it judges a poor match; the headings and `WebSite` name were kept consistent to reduce that.

---

## 7. Structured data and indexing improvements

**Structured data (all JSON-LD, server-rendered, parsed and checked on the production build):**

| Type | Where | Notes |
|---|---|---|
| Organization | `/` | `name`, `alternateName` (IBPA, IBPA Associations), `url`, `logo` (navy logo, 843×341, above Google's 112×112 minimum, legible on white), `description`, `email`, `telephone`, `address`, `contactPoint`, `sameAs` (Instagram, the only profile the site links), `founder` (the President, as stated on `/governance`) |
| WebSite | `/` | `name` + `alternateName` feed Google's site-name display. Per Google, it must be on the homepage. No `SearchAction` (there is no search). |
| BreadcrumbList | 16 pages | Home › page |
| Article | `/beauty-association` | Organization as author (no bylined editor exists yet) |

**Deliberately not added:** `FAQPage` (Google discontinued FAQ rich results on 2026-05-07, so it has no search benefit); `Event` and per-item `Article` for news (CMS items have no event dates or standalone URLs; see brief 7); `foundingDate`, awards, accreditations, member counts (the site states "2026 Founded" and "40+ Countries" together, which needs owner verification before it is machine-asserted).

**Indexing controls:**
- `robots.txt`: allow all; disallow `/api/` and `/admin`; correct canonical `Sitemap:`. The unsupported `Host:` line was removed.
- `noindex, nofollow` meta on `/sign-in`, `/dashboard`, `/team-invite`, `/success`, `/payment-link/*`, `/application/*`, `/profile-preview/*` (and the `/admin` layout). These are **not** blocked in robots.txt, because a blocked URL cannot have its `noindex` read (Google's block-indexing guidance). `/success` was previously disallowed and now uses `noindex` instead. `/admin` stays disallowed in robots.txt and returns 401 to anonymous visitors, so it has no indexable content either way.
- `sitemap.xml`: 17 canonical URLs, absolute, `lastmod` only where a real date is recorded (`/` and `/beauty-association`, 2026-10-09).
- Trailing-slash URLs 308-redirect to the canonical form; unknown URLs return a real 404.
- A test fails the build if a new `(public)` route is added without being classified as indexable or `noindex`.

---

## 8. Before-and-after verification

"Before" is the **live site on 2026-10-09**. "After" is a **local production build of this branch**, run with `NEXT_PUBLIC_SITE_URL=https://ibpa-web.vercel.app` to reproduce the broken production env. The live site will not change until deployed.

| Check | Before (live) | After (production build) |
|---|---|---|
| `robots.txt` sitemap / host | `ibpa-web.vercel.app` | `https://ibpassociations.org/sitemap.xml`; `Host:` removed |
| Sitemap URLs | 15, all on `ibpa-web.vercel.app`; `/members` missing; `lastmod` = request time | 17, all on `ibpassociations.org`; 17/17 return 200, self-canonical, indexable |
| Unique titles | 1 distinct title on 15 of 16 pages | 17/17 unique (19–59 characters) |
| Unique descriptions | 1 shared description | 17/17 unique (109–157 characters) |
| Canonical tags | 0 | 17/17 absolute, self-referencing |
| Structured data | 0 blocks | Organization, WebSite (home); BreadcrumbList on 16 pages; Article on the guide; all parse as valid JSON with canonical absolute URLs |
| `og:image` | `https://ibpa-web.vercel.app/@/public/file.svg` (invalid) | `https://ibpassociations.org/og/ibpa-og.jpg` (1200×630, 46 KB, HTTP 200) |
| `twitter:image` | `/og-image.png` → 404 | same JPG |
| `/news` initial HTML | "Loading news…" | news items and dates (fixture backend) |
| Private routes `noindex` | 0 of 6 | 6 of 6 |
| Heading skips (H2→H4 etc.) | present on every page | 0 across 14 audited pages |
| `<main>` landmarks on `/members` | 3 | 1 |
| Broken internal links | n/a | 0 across 33 distinct targets |
| Favicon payload | 484,241 B | 6,550 B ICO (+31 KB 192 px, +23 KB 180 px icons) |
| Hydration error on first visit | present (reproduced in dev) | none observed |
| Unit tests | 135 pass | **161 pass** |
| `tsc --noEmit` (src) | 0 errors | 0 errors |
| `npm run lint` | 6 errors, 8 warnings | **identical** set of files and counts (all pre-existing) |
| Production build | n/a | succeeds, 84 static pages generated |

**Existing features re-checked on the build:** `/api/content` proxy returns items; unauthenticated `/admin` and `/api/admin/*` return 401 JSON; `/apply?category=Professional` loads and canonicalizes to `/apply`; the contact form renders with all fields; the cookie banner appears for new visitors, dismisses, and persists; mobile (375 px) shows no horizontal overflow on the new page; unknown URLs return 404.

**Not verified here:** Core Web Vitals (no reliable measurement available); behavior behind real Clerk and Stripe credentials; the live deployment.

Reference load measured on the live homepage before changes (embedded browser, not a Lighthouse run): 43 requests, ~413 KB JavaScript transferred, ~667 KB total, TTFB 237 ms.

---

## 9. Recommended future articles and landing pages

Create these **only with the inputs listed**; each serves a distinct intent. None should be thin variations of existing pages.

| # | Page | Target intent | Why it is worth doing | What is needed before writing |
|---|---|---|---|---|
| 1 | `/resources/beauty-associations-in-usa` | "beauty associations", "beauty associations in the USA" (informational list/compare) | This SERP is owned by listicles and aggregators; a rigorous, neutral comparison can earn links and citations | Verified facts for each association from its **official** site (founding, membership types, fees, eligibility, advocacy, date checked). Include IBPA neutrally and say plainly who it is for. Do not copy third-party member counts. |
| 2 | `/resources/benefits-of-beauty-association-membership` | "benefits of joining a beauty association" | Informational, links to `/beauty-association` and `/membership` | A short, honest benefits framework; quotes from real members (with written consent) |
| 3 | `/resources/professional-standards-for-lash-and-brow-artists` | lash/brow standards and association (no clear competitor surfaced) | Board members Tetiana Kysliuk and Eleonora Bediukh are described on `/governance` as lash-lamination and brow experts and accredited judges, which is genuine first-hand expertise | Authorship by those board members with bio and `Person` schema; their own words on quality benchmarks; no invented credentials |
| 4 | `/resources/salon-owner-guide-to-professional-associations` | salon-owner commercial investigation | Business Owner category (team seats, license requirement) is a real differentiator | Facts from `/membership`; owner perspectives |
| 5 | `/resources/beauty-licensing-and-state-boards` | "do estheticians need an association" / licensing questions | High-demand, but legal-adjacent | Per-state research with links to each **state board**; legal review; keep the "IBPA is not a licensing body" statement prominent |
| 6 | `/membership/<role>` pages (esthetician, cosmetologist, lash, brow, salon owner) | role-specific "join" intent | Only if each page carries unique content | Unique per-role content: member stories, role-specific benefits, region-specific licensing notes. Otherwise leave them uncreated. |
| 7 | `/news/[slug]` article pages and `/events/[slug]` pages | news and event discovery | Enables real `Article` and `Event` markup and gives each story a linkable URL | Backend support for slugs and structured event fields (start/end date, venue, status, offers). Today the CMS only stores `createdAt`. |
| 8 | Member spotlights | long-tail local/role queries | Natural link magnets from members | Opt-in consent and a decision to index profiles (replaces the current `noindex` on profile previews) |

---

## 10. Backlink and authority strategy

**Principles.** Editorial links only. No purchased links, no link farms, no private-blog networks, no automated or templated mass outreach. Every pitch needs a specific reason the other site's readers benefit. Expect rejections.

### Tier 1: owned and affiliated (fastest, fully legitimate)

| Target | Reason it should link | Action |
|---|---|---|
| **`ibpa-forum.com`** (IBPA Beauty Award 2026 / Beauty Business Forum site) | Its homepage names IBPA and its president but has **no hyperlink** to `ibpassociations.org` (only an email address on that domain) | Ask the site's owner to link "IBPA" to `https://ibpassociations.org/` in the header or footer and from award and winner pages. I did not modify that site. |
| **Partners listed on `/partnership`** (Alismia, TEORA Beauty, NePOP Radio) | They are named IBPA partners | Ask for a "Partner of IBPA" mention linking to `/partnership`; offer the reciprocal link that already exists |
| **Board members' own sites and brands** (e.g. the TE'ORA Beauty brand and TB Champions pages) | Their bios already reference IBPA roles | Add "Board Member, IBPA" linking to `/governance` |
| **Award winners and forum sponsors/exhibitors** | They benefit from citing recognition | Provide a short factual badge or paragraph and a link to the awards page |

### Tier 2: entity and trust profiles (many are `nofollow`; value is corroboration)

Create and keep consistent (same full name, address, phone, logo): LinkedIn company page, Facebook page, YouTube channel, Google Business Profile (only if the Roseville office is staffed to its guidelines), the Roseville Area Chamber of Commerce directory (verify on the chamber's own site; I could not confirm its join page), Crunchbase. Candid/GuideStar only applies to organizations with an IRS determination; the site describes IBPA as a California mutual-benefit nonprofit, so confirm tax status first. Wikidata/Wikipedia only if independent coverage meets notability.

### Tier 3: editorial and relevance (the real authority builders)

| Target type | Specific examples | Why they might reference IBPA | Pitch |
|---|---|---|---|
| **Pages already ranking for "beauty associations"** | The SelfNamed blog roundup, Evergreen Beauty College's association article, Boulevard's "associations and communities" post, PocketSuite's cosmetology associations directory | They list associations for professionals; IBPA is an international, multi-role body with public governance documents | After the comparison guide (brief 1) exists, ask to be considered **if it fits their criteria**; accept a no |
| **Trade publications** | Modern Salon, Salon Today, American Salon, Skin Inc., Beauty Launchpad, Behind the Chair, Nails Magazine, Les Nouvelles Esthétiques | Newsworthy: IBPA Beauty Awards winners, Forum 2026 results, new championships, a lash/brow standards piece by board experts | Editorial contact paths were **not verifiable** from search results; confirm each publication's current submission page. Send relevant, concise news, not generic releases. |
| **Beauty schools and academies** | Educators in the Trainer/Educator category | Career-services and "professional associations" pages list recommended memberships | Offer a student-relevant explainer and the Specialist category; educators link their own membership |
| **Event and brand partners** | Forum sponsors, TB Champions partners | Co-marketing and sponsor pages | Reciprocal, factual partner pages |
| **Podcasts and radio** | NePOP Radio (named partner), beauty-business podcasts | Expert interviews with board members | Show notes linking to the guide or governance page |
| **Journalist-request platforms** | Expert-quote services (verify each platform's terms) | Board experts answering reporter queries | Respond only where there is genuine expertise |

**Member-driven links.** Members may legitimately cite IBPA membership in bios. Provide a simple member badge or embed that links to `/members` (not to the `noindex` profile preview) as a product follow-up.

**Measure.** Referring domains by tier, relevance, and whether links are editorial; branded query growth. Do not chase raw link counts.

### E-E-A-T improvements to make on the site (needs owner input)

1. Replace the `/standards` placeholder-sounding introduction with finished copy, or publish only finished documents.
2. Verify or remove the `/criteria` statistics (and the "2026 Founded" claim beside "40+ Countries"); only then add `foundingDate` to schema.
3. Add dated, bylined editorial content with author bios (brief 3).
4. Add an "In the press / recognition" page **only** when real third-party coverage exists. None was found; do not create one speculatively.
5. Keep the Awards and Forum pages current; retire or archive past events.

---

## 11. Google Search Console setup and monitoring

**Setup (needs DNS/Google account access):**
1. Add a **Domain property** `ibpassociations.org` and verify via DNS TXT. (Domain properties cover `www`, subdomains, http/https.)
2. Also add the URL-prefix property `https://ibpassociations.org/` for per-path reports.
3. **Deploy first**, then Sitemaps → submit `https://ibpassociations.org/sitemap.xml`.
4. URL Inspection → inspect `/`, `/beauty-association`, `/membership`, `/news`; use *Request indexing* for the new and changed pages. Confirm the user-declared canonical equals the Google-selected canonical.
5. Do **not** add the `ibpa-web.vercel.app` host as a property unless you want its data; consolidation happens through the redirect and canonicals.
6. Import the property into **Bing Webmaster Tools** (IndexNow is optional).

**Check weekly for the first 8 weeks, then monthly:**

| Report | What to watch |
|---|---|
| Pages (indexing) | The 17 sitemap URLs reach "Indexed"; `/dashboard`, `/sign-in`, etc. appear under "Excluded by noindex" (expected); any "Duplicate, Google chose different canonical" entries naming `ibpa-web.vercel.app` should decline |
| Sitemaps | Status "Success", discovered URL count 17, no host warnings |
| Performance | Filter queries containing "IBPA" or "International Beauty Professionals Association" (brand) vs everything else (non-brand). Track impressions and average position for: *beauty association*, *professional beauty association*, *beauty association membership*, role-based phrases. Expect brand impressions first. |
| Core Web Vitals | Field LCP, INP, CLS by mobile/desktop once enough traffic exists. This is where real CWV evidence will come from. |
| Enhancements / Rich results | Breadcrumbs valid; run the Rich Results Test on `/` and `/beauty-association` after deploy |
| Links | Referring domains growth; confirm the `ibpa-forum.com` link appears |
| Settings → Crawl stats | Host status; certificate errors for `www` until fixed |

**Also verify after deploy:** `https://ibpassociations.org/robots.txt` and `/sitemap.xml` show the apex domain; view-source on the homepage shows the canonical, Organization JSON-LD, and `og:image` on `ibpassociations.org`.

---

## 12. Remaining tasks, prioritized

### Completed in code (this branch, verified on a production build, not yet deployed)
Canonical-origin fix; sitemap and robots; per-page metadata and canonicals; Open Graph/Twitter image; Organization, WebSite, BreadcrumbList, and Article schema; `noindex` for private pages; `/beauty-association`; homepage overview; server-rendered news/events; heading and landmark fixes; cookie-banner hydration fix; favicon optimization; 26 new tests.

### Requires external access, publishing, or a manual decision

**P0: do before or at deployment**
1. **Fix `www.ibpassociations.org`'s expired certificate** (Vercel → Domains; check the DNS record and that the domain is attached to this project). Then redirect `www` → apex with a 301 and re-check with `curl -I https://www.ibpassociations.org/`.
2. **Set `NEXT_PUBLIC_SITE_URL=https://ibpassociations.org`** in Vercel (Production) and redeploy. The code now tolerates the wrong value, but the variable should be correct. It is also used by `sign-in` and `dashboard/success` for return links, so confirm those still behave as intended after the change.
3. **Redirect `ibpa-web.vercel.app` → `ibpassociations.org` (301) in Vercel**, *after* confirming that no Stripe webhook, Clerk webhook, or email template depends on the `vercel.app` hostname (webhook senders do not follow redirects). Keep preview deployments (`*-git-*.vercel.app`) reachable.
4. **Deploy this branch**, then complete section 11 (verify domain, submit sitemap, request indexing).

**P1: next 2–4 weeks**
5. Resolve the content-trust items in section 2 (#17): `/standards` copy, `/criteria` statistics, expired homepage "Upcoming" event. These directly affect how Google and prospective members judge the organization.
6. Create LinkedIn, Facebook, YouTube and other profiles (Tier 2), then add them to `sameAs` in `src/lib/seo/organization.ts`.
7. Ask `ibpa-forum.com` to link to `ibpassociations.org` (Tier 1). Start partner and board-member links.
8. Write brief 1 (US associations comparison) and brief 3 (lash/brow standards by board experts).
9. Decide whether public member profiles should be indexable (unique titles, consent). They are `noindex` for now.
10. Review GA/Meta Pixel loading versus the cookie banner choice with whoever owns privacy compliance.

**P2: later**
11. **Performance architecture:** the `(public)` layout reads the locale cookie, which makes every public page dynamic and uncacheable (`cache-control: private, no-store`). Moving language to the URL (`/ru`, `/uk`) or to client-side switching would enable CDN caching and also give Russian/Ukrainian content crawlable URLs with `hreflang` (currently only English can be indexed). This is a product decision with a large blast radius.
12. Set `<html lang>` from the active locale.
13. Backend support for `/news/[slug]`, `/events/[slug]`, and structured event dates, then add `Article` and `Event` markup (brief 7).
14. Add `foundingDate` to schema once the founding claim is verified.
15. Optional: a custom 404 page with links to the guide and membership pages (the current default returns a correct 404).
16. Security headers (CSP, X-Frame-Options, etc.) are not set by the app; Vercel adds HSTS only. Not an SEO factor but part of general hygiene.

---

## Appendix A: Reproduce the checks

```bash
# From app/web
npm test                                   # 161 tests
npx tsc --noEmit                           # src/ is clean; stale .next/types duplicates in this checkout are environmental
npm run lint                               # 6 errors / 8 warnings, all pre-existing
rm -rf .next && NEXT_PUBLIC_SITE_URL=https://ibpa-web.vercel.app npx next build
NEXT_PUBLIC_SITE_URL=https://ibpa-web.vercel.app npx next start -p 3010
curl -s localhost:3010/robots.txt; curl -s localhost:3010/sitemap.xml
```

Live checks used for "before": `curl -s https://ibpassociations.org/robots.txt`, `curl -s https://ibpassociations.org/sitemap.xml`, `openssl s_client -connect www.ibpassociations.org:443 -servername www.ibpassociations.org | openssl x509 -noout -dates`.

## Appendix B: Where to change things later

| To change | Edit |
|---|---|
| A page's title, description, or breadcrumb | `src/lib/seo/pages.ts` (tests enforce uniqueness and length) |
| Sitemap membership and `lastmod` | `src/lib/seo/routes.ts` |
| Organization facts and `sameAs` | `src/lib/seo/organization.ts` |
| Canonical origin logic | `src/lib/seo/site.ts` |
| A new indexable page | Add to `routes.ts` and `pages.ts`; add a `layout.tsx` using `buildPageMetadata` (the route test fails otherwise) |
| A new private page | Add its segment to `NOINDEX_PUBLIC_SEGMENTS` and export `NOINDEX_METADATA` |

## Appendix C: Sources

Google Search Central (fetched 2026-10-09): [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) · [Block indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing) · [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization) · [FAQPage structured data](https://developers.google.com/search/docs/appearance/structured-data/faqpage) · [Favicon in search](https://developers.google.com/search/docs/appearance/favicon-in-search) · [Site names](https://developers.google.com/search/docs/appearance/site-names) · [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) · [Title links](https://developers.google.com/search/docs/appearance/title-link)

Methodology and tooling: [Ahrefs SEO tutorial index](https://ahrefs.com/seo) · [claude-seo plugin](https://github.com/AgriciDaniel/claude-seo) · its [seo-technical](https://raw.githubusercontent.com/AgriciDaniel/claude-seo/main/skills/seo-technical/SKILL.md) and [seo-schema](https://raw.githubusercontent.com/AgriciDaniel/claude-seo/main/skills/seo-schema/SKILL.md) skill docs

SERP and competitor observations (web search, 2026-10-09; third-party claims unverified): [SelfNamed: beauty organizations and associations](https://www.blog.selfnamed.com/business/beauty-organizations-and-associations) · [Evergreen Beauty College: professional associations](https://www.evergreenbeauty.edu/?p=8388) · [PBA overview on PocketSuite](https://directory.pocketsuite.io/professional-beauty-association-pba/) · [PBA (probeauty.org)](https://www.probeauty.org/) · [PBA on GuideStar](https://www.guidestar.org/profile/20-1585064) · [PBA salon & spa membership](https://probeauty.org/salon-spa-membership/) · [America's Beauty Show membership](https://www.americasbeautyshow.com/pages/membership) · [CIDESCO](https://cidesco.com/international-board/)
