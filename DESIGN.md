---
name: IBPA Web
description: The public site and admin tools for the International Beauty Professionals Association
colors:
  ink: "oklch(0.145 0 0)"
  paper: "#ffffff"
  primary: "#030213"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.95 0.0058 264.53)"
  muted-surface: "#ececf0"
  muted-ink: "#717182"
  accent-surface: "#e9ebef"
  border: "rgba(0, 0, 0, 0.1)"
  field-surface: "#f3f3f5"
  destructive: "#d4183d"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "0.04em"
  editorial:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "0.425rem"
  md: "0.525rem"
  lg: "0.625rem"
  xl: "0.725rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.field-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
---

# Design System: IBPA Web

## 1. Overview

**Creative North Star: "The Editorial Briefing"**

IBPA Web reads like a well-prepared briefing from a credible institution: confident in its facts, restrained in its delivery, and typeset with care. The pairing of a quiet sans-serif workhorse (Inter) with an editorial serif accent (Cormorant Garamond) gives the system a publication's poise without tipping into decoration; the serif appears where the brand wants to be *felt* (headlines, pull quotes, named moments), while Inter carries the actual work of reading and doing across both the public site and the admin tools. This is "professional and trustworthy" translated into typography and restraint rather than into crests, navy-and-gold palettes, or stock-photo gravitas — the system explicitly rejects the dated, bureaucratic, form-heavy look that association and membership sites default to.

Across both registers — the public marketing surfaces and the internal admin/dashboard — the same quiet system holds. The public side leans on the editorial serif and generous rhythm to build credibility and ease visitors toward membership and event actions; the admin side strips back to the sans-serif workhorse and tight, predictable patterns so staff can move through daily tasks without friction. One voice, two tempos.

**Key Characteristics:**
- Near-monochrome palette (ink, paper, tonal grays) with a single near-black primary; color is structural, not decorative
- Inter for everything that needs to be read and used; Cormorant Garamond reserved for moments that need to be felt
- Flat-by-default surfaces — depth comes from tonal layering and 1px borders, never shadows
- Warm, approachable component shapes: soft consistent radii (~0.5–0.625rem), generous click targets, no sharp institutional edges
- Restrained color use: the near-black primary and the single destructive red are the only saturated notes in the system

## 2. Colors

The palette is close to monochrome by design: a warm-neutral paper background, near-black ink and primary, and a tight scale of tonal grays that do the work of hierarchy without reaching for color. A single destructive red is the only saturated accent, reserved entirely for irreversible or error states.

### Primary
- **Ink Black** (`#030213`): the system's one committed color. Carries primary buttons, links, active nav states, and the editorial weight of headings. Used deliberately and sparingly — its rarity is what makes it feel authoritative rather than loud.

### Neutral
- **Paper** (`#ffffff`): the base surface for cards, popovers, and content panels — the "page" the briefing is written on.
- **Deep Ink** (`oklch(0.145 0 0)`): primary text color against paper; carries headings and body copy at full contrast.
- **Quiet Slate** (`oklch(0.95 0.0058 264.53)`): the secondary surface — used for secondary buttons, subtle section breaks, and low-emphasis containers.
- **Mist Gray** (`#ececf0`) / **Mist Ink** (`#717182`): the muted pairing — backgrounds and text for de-emphasized content (timestamps, helper text, disabled states).
- **Fog Surface** (`#e9ebef`): accent surface for hover states and selected rows in tables and lists.
- **Hairline Border** (`rgba(0, 0, 0, 0.1)`): the system's only structural line — defines cards, inputs, and table dividers without ever reading as decoration.
- **Field Gray** (`#f3f3f5`): the resting background for inputs and form fields, distinguishing "things you fill in" from "things you read".

### Named Rules
**The One Accent Rule.** Ink Black is the only color permitted to carry weight or call attention. Everything else in the palette is tonal gray. If a screen needs a second accent color to feel complete, the hierarchy is wrong — fix it with type weight, spacing, or borders before reaching for color.

## 3. Typography

**Display Font:** Inter (with system sans-serif fallback)
**Body Font:** Inter (with system sans-serif fallback)
**Editorial Accent:** Cormorant Garamond (with Georgia, serif fallback)

**Character:** A quiet workhorse paired with an editorial flourish — Inter does the reading and the doing, Cormorant Garamond does the feeling. The pairing is a deliberate contrast (geometric-leaning sans + humanist serif), not two similar faces competing for attention.

### Hierarchy
- **Display** (weight 300, `clamp(1.75rem, 4vw, 2.5rem)`, line-height 1.1, letter-spacing 0.04em): set in Inter at a light weight with slightly opened tracking; reserved for hero moments and section openers on the public site.
- **Editorial** (weight 500, `clamp(1.5rem, 3vw, 2.25rem)`, line-height 1.2): Cormorant Garamond, used for named moments — pull quotes, member spotlights, campaign headlines — where the brand wants warmth and craft to show through.
- **Headline** (weight 500, 1.5rem, line-height 1.5): Inter; section and card headings across both registers (`h1`–`h2` scale).
- **Title** (weight 500, 1.125rem–1rem, line-height 1.5): Inter; subsection headings, table headers, dialog titles (`h3`–`h4` scale).
- **Body** (weight 400, 1rem, line-height 1.5): Inter at full ink contrast; capped at 65–75ch on long-form public pages (about, news, governance).
- **Label** (weight 500, 1rem, line-height 1.5): Inter; form labels, buttons, nav items — never uppercase, never tracked wide.

### Named Rules
**The Two-Voice Rule.** Inter speaks for the system everywhere work happens — navigation, forms, tables, body copy, admin tools. Cormorant Garamond speaks only for moments the brand wants remembered. If the serif starts appearing in tables, buttons, or UI chrome, it has wandered out of its register.

## 4. Elevation

The system is flat by deliberate choice, not by omission: no shadow tokens are defined anywhere in the theme. Depth is conveyed entirely through tonal layering (paper on mist gray, mist gray on fog surface) and the single hairline border token. This keeps the interface calm and current — shadows are one of the fastest ways an interface starts to look like a 2014 SaaS dashboard, and a briefing-style system earns its credibility through structure, not drop shadows.

### Named Rules
**The Flat-By-Default Rule.** Surfaces sit directly on one another, separated by a tonal step or a 1px hairline border — never a shadow. If two surfaces need to be told apart and a border or tonal shift can't do it, the layout has too many surfaces, not too little elevation.

## 5. Components

Components feel warm and approachable rather than corporate-sharp: soft, consistent radii, generous internal spacing, and color used only to mark state, never to decorate. Both registers share the same component grammar — the public site simply gives it more room to breathe.

### Buttons
- **Shape:** soft rounded corners (`border-radius: var(--radius-lg)`, ≈0.625rem) — never sharp, never pill-shaped.
- **Primary:** Ink Black background (`#030213`) with white text, `padding: 8px 10px` at default size, fading to 80% opacity on hover rather than shifting hue.
- **Secondary:** Quiet Slate background with Ink Black text — used for the second-priority action beside a primary button.
- **Outline / Ghost:** transparent or paper background with a hairline border or no border at rest, filling with Mist Gray on hover — the default for tertiary actions and toolbar buttons in the admin views.
- **Hover / Focus:** opacity and tonal shifts only (no color change on primary); focus state shows a 3px ring in `ring/50` plus a border color shift — never an outline-less focus state.
- **Destructive:** Destructive Red at low-opacity tints (`destructive/10` resting, `destructive/20` hover) rather than a solid red fill — keeps the one saturated accent in the system from overwhelming the page even in warning states.

### Cards / Containers
- **Corner Style:** `var(--radius-lg)` (≈0.625rem) — soft, consistent with buttons and inputs.
- **Background:** Paper on the base canvas; Mist Gray or Fog Surface for nested or selected containers.
- **Shadow Strategy:** none — see Elevation. Separation comes from the hairline border and tonal contrast with the surface beneath.
- **Border:** 1px Hairline Border (`rgba(0,0,0,0.1)`) on most cards and panels.
- **Internal Padding:** generous and consistent — `spacing.lg` (1.5rem) for card bodies, `spacing.md` (1rem) for compact list items and table cells.

### Inputs / Fields
- **Style:** Field Gray (`#f3f3f5`) background with a soft `var(--radius-lg)` corner and a transparent border at rest — fields read as "places to type", visually distinct from static content.
- **Focus:** border shifts to the ring color with a soft 3px focus ring (`ring/50`) — no glow, no color change in the fill.
- **Error / Disabled:** error states use the destructive ring/border treatment at low opacity; disabled states drop to 50% opacity and disable pointer events, never gray-on-gray that erodes legibility.

### Navigation
- Set in Inter Label weight (500), never uppercase or letter-spaced wide. Active items take the Ink Black foreground; hover states shift the row to Fog Surface. The admin sidebar uses the dedicated `--sidebar-*` token set (near-white surface, Ink Black active state) so it reads as a distinct operational chrome from the content it frames, while the public site's nav sits directly on the page surface with no chrome of its own.

## 6. Do's and Don'ts

### Do:
- **Do** keep Ink Black (`#030213`) as the system's only committed accent — let tonal grays and spacing carry the rest of the hierarchy.
- **Do** reserve Cormorant Garamond for named, memorable moments (editorial headlines, pull quotes, spotlights) and keep Inter everywhere work gets done.
- **Do** build depth with tonal layering and the single hairline border token (`rgba(0,0,0,0.1)`) — paper on Mist Gray on Fog Surface.
- **Do** keep button and card radii in the soft 0.5–0.625rem range; it's what makes the system read as warm and approachable rather than institutional.
- **Do** keep the admin/dashboard surfaces dense, predictable, and quiet — staff move through these daily and the interface should disappear into the task.

### Don't:
- **Don't** introduce shadows, glows, or drop-shadow "elevation" anywhere — the system is flat by name and by rule (see The Flat-By-Default Rule). It is the fastest way to make this look like a 2014 SaaS dashboard.
- **Don't** let the system look dated or bureaucratic — no crests, no navy-and-gold institutional palettes, no dense form-heavy layouts that feel like a government portal. "Professional and trustworthy" is carried by typography and restraint, not by association-site cliches.
- **Don't** use uppercase, wide-tracked labels or eyebrows above sections — Label type stays sentence case at normal tracking; the system has no kicker convention and shouldn't invent one.
- **Don't** add a second saturated accent color anywhere. If a screen feels like it needs one, the actual problem is weak hierarchy — fix it with weight, spacing, or the existing tonal scale first.
- **Don't** let Cormorant Garamond migrate into UI chrome — tables, buttons, nav, form labels stay in Inter. The serif is a guest, not a resident.
