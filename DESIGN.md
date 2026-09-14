---
version: alpha
name: "IBPA Web"
description: "A calm, editorial association experience with a compact cool-blue administrative workspace."
colors:
  primary: "#21466D"
  admin-canvas: "#F4F7FB"
  admin-ink: "#0B1F44"
  admin-action: "#21466D"
  admin-border: "#D4E0F0"
  admin-surface: "#FFFFFF"
  admin-soft: "#EEF6FF"
typography:
  admin:
    fontFamily: "Raleway, Inter, sans-serif"
  public:
    fontFamily: "Inter, sans-serif"
rounded:
  DEFAULT: "0.625rem"
  control: "1rem"
  card: "1.75rem"
  feature: "2rem"
spacing:
  admin-gap: "1.5rem"
  admin-max: "100rem"
components:
  button:
    backgroundColor: "#21466D"
    textColor: "#FFFFFF"
    rounded: "1rem"
  card:
    backgroundColor: "#FFFFFF"
    rounded: "1.75rem"
  dialog:
    backgroundColor: "#FFFFFF"
    rounded: "1.75rem"
  table:
    backgroundColor: "#FFFFFF"
    height: "3.5rem"
  input:
    backgroundColor: "#F8FBFF"
    rounded: "1rem"
---

# IBPA Web Design System

## Overview

### Creative North Star

The public experience takes cues from an international association journal. The authenticated admin workspace is its compact production desk: pale blue paper, navy ink, carefully ruled surfaces, and one clear action at a time.

### Product context and register

- **Audience and primary job:** IBPA administrators managing membership, editorial content, communications, finance, and recorded media.
- **Target market and evidence:** An international beauty-professional association, based on the product identity and current English-language interface.
- **Locales and language policy:** English is the owned interface language. Russian, English, and Ukrainian may appear as managed subtitle content without changing the admin UI locale.
- **Usage scene:** Desktop-first operational work with responsive access for review on smaller screens; data density is comfortable rather than spreadsheet-dense.
- **Register:** Hybrid product: expressive public pages and a restrained operational `/admin` register.
- **Memorable signature:** Media-management screens connect playback time directly to the active transcript cue through a blue timing rail.
- **Restraint:** Tables, filters, forms, error recovery, and destructive actions remain familiar and compact.
- **Anti-references:** Avoid dark broadcast-control rooms, generic statistic dashboards, giant marketing headers, and decorative glass that reduces contrast.
- **Token ownership/runtime mapping:** This file documents the established runtime implementation in `app/web/src/styles/theme.css`, `app/web/src/styles/index.css`, and the shared admin components. Existing runtime code remains canonical; changes must reconcile both sources.

## Colors

Admin pages use `admin-canvas` behind white cards, `admin-ink` for strong hierarchy, `admin-action` for actions and focus, `admin-border` for quiet structure, and `admin-soft` for selected or nested states. Status colors remain semantic and always include text.

## Typography

Admin controls and headings use Raleway with Inter fallback. Technical values, timestamps, and durations use tabular figures. Uppercase eyebrow and table labels are reserved for structural metadata, not body copy.

## Layout

The shared `AdminShell` owns the responsive sidebar and a 1600px content maximum. Admin features use a 24px vertical rhythm, 16px controls, and 28–32px primary cards. Tables scroll horizontally on narrow screens; long editors retain document scrolling.

## Elevation & Depth

Depth comes from white/light-blue layering, one-pixel blue borders, and soft navy shadows. Blur is limited to navigation overlays and persistent media controls. Static nested content remains flatter than the owning card.

## Shapes

Primary cards use 28–32px radii, controls use 12–16px radii, and status labels use pills. Icons sit in small rounded containers when they identify a section or state.

## Components

### Foundational visual states

Controls provide visible hover, focus-visible, active, disabled, and busy states without changing geometry. Loading regions reserve space; errors stay inline when the administrator must act on them.

### Buttons and actions

One solid blue action leads each decision area. White outlined buttons are secondary; ghost buttons handle low-emphasis utilities. Busy labels keep the button width stable.

### Navigation and data display

Admin navigation uses the shared animated navy selection indicator. Data lists use semantic tables, URL-backed filters and pagination, explicit range totals, and distinct empty/no-result/error states.

### Forms and overlays

Radix primitives own authored select and dialog behavior. Native English date inputs are acceptable for compact administrative filtering because platform calendar geometry is not part of the product contract. Search always has an owned clear action. Subtitle editing guards newer R2 versions before saving.

### Iconography

Lucide is the canonical admin icon family. Icons use a consistent light stroke, typically 16–18px, and never replace a non-universal action label.

### Motion

Motion explains selection, overlay entry, and active playback state. Routine transitions stay within 150–300ms and all nonessential transforms stop under reduced motion.

### Content and data visualization

Copy uses direct verbs such as “Sync Zoom,” “Import recording,” and “Save subtitles.” Dates, durations, file sizes, and cue times remain explicit and scan-friendly.

## Do's and Don'ts

- **Do:** Reuse `AdminShell`, shared controls, status language, spacing, and error patterns.
- **Do:** Keep media state honest: only show tracks and renditions that exist.
- **Don't:** Add unrelated metrics, oversized headers, or ornamental animation to operational routes.
- **Don't:** expose provider secrets, permanent media URLs, or color-only state.
