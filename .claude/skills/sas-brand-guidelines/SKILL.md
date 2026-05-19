---
name: sas-brand-guidelines
description: Use when making design decisions for this app — colors, typography, voice/tone, logo usage. Provides Singapore American School brand guidelines as a baseline for visual and written choices in any UI work.
---

# SAS Brand Guidelines

## About SAS

Singapore American School (SAS) is a non-profit, independent, co-educational
K–12 international day school founded in 1956, located on a 36-acre campus at
40 Woodlands Street 41, Singapore. It serves over 4,000 students from 65+
nationalities and offers an American-based curriculum with one of the largest
Advanced Placement programs outside the United States. The school's mascot is
the Eagle, and its identity centers on three brand pillars: **Excellence,
Extraordinary Care, and Possibilities**.

## When to use this skill

Load this skill whenever you are about to make a design or copy decision that
should feel "on-brand" for SAS. Typical triggers:

- Choosing colors for components, charts, badges, or marketing surfaces
- Picking typography or weights for a new page
- Writing UI copy, empty states, error messages, or onboarding flows
- Specifying logo placement, clear space, or favicons
- Selecting photography, illustrations, or iconography
- Reviewing PRs that touch visual design or marketing-adjacent copy

If the decision has no brand surface (pure backend work, internal tooling for
engineers only), this skill is optional.

## Brand pillars and personality

SAS describes its strategic direction with three words:

- **Excellence** — high standards, careful craft, "excellence in the detail."
- **Extraordinary Care** — student-centered, personalized, attentive to "the
  needs of every child."
- **Possibilities** — forward-looking, opportunity-rich, "personal awakenings."

Tagline language used publicly: *"A World Leader in Education. Cultivating
Exceptional Thinkers. Prepared for the Future."* Students are encouraged to
demonstrate **"The Eagle Way"** by pursuing excellence while living the core
values of **compassion, fairness, honesty, respect, and responsibility**.

Source: [sas.edu.sg/about-us](https://www.sas.edu.sg/about-us), [Our Strategic
Direction](https://www.sas.edu.sg/about-us/our-strategic-direction).

## Color palette

> **Status:** The school colors **red, white, and blue** are confirmed
> publicly. Exact hex values are **not** published in a public brand guide.
> Treat the hex values below as reasonable defaults until the SAS
> communications team confirms.

### Confirmed (from public sources)

SAS's official school colors are **red, white, and blue** — the same three
colors used in division uniforms (Elementary = blue, Middle = red, High =
white) and on the eagle crest.

Source: [Wikipedia: Singapore American School](https://en.wikipedia.org/wiki/Singapore_American_School),
[SAS uniform / dress code](https://www.sas.edu.sg/mysas-portal/eagle-stop/uniform/uniform-dress-code).

### Working palette (defaults — confirm with brand team)

<!-- TODO: confirm exact hex values with SAS communications / brand team -->

| Token              | Role                            | Default hex   | Notes |
| ------------------ | ------------------------------- | ------------- | ----- |
| `sas-navy`         | Primary brand color             | `#0A2A5E`     | Deep navy used on the school crest. Pairs with white for AAA body text. |
| `sas-red`          | Accent / spirit / "Red Out"     | `#C8102E`     | Eagle red — energetic accent, not body text on white. |
| `sas-white`        | Surface / background            | `#FFFFFF`     | |
| `sas-gold`         | Optional accent (crest detail)  | `#C8A24B`     | Used sparingly on the Eagle crest; not a primary brand color. |
| `sas-ink`          | Body text                       | `#0F172A`     | Near-black; prefer over pure black for less harsh contrast. |
| `sas-slate`        | Secondary text / borders        | `#475569`     | |
| `sas-paper`        | Off-white surface               | `#F8FAFC`     | |

Map these to the repo's existing OKLCH tokens in
`packages/ui/src/styles/globals.css` rather than introducing parallel hex
constants. Keep semantic names (`--color-primary`, `--color-accent`) — do not
hard-code `sas-navy` at call sites.

### Usage rules

- **Navy** is the workhorse — chrome, headers, primary buttons, links.
- **Red** is for spirit moments, alerts, and CTAs that need urgency. Avoid
  large red text on white (fails APCA AAA for body).
- **White space is brand-aligned.** SAS communications skew clean and
  uncluttered; resist the urge to fill every surface.
- Never combine red and navy at small sizes without a neutral separator.

## Typography

> **Status:** SAS does not publish an official typeface list. The public
> website uses a clean modern sans-serif. Defaults below are reasonable picks
> that fit the school's profile and are well-supported on the web.

<!-- TODO: confirm display + body typefaces with SAS brand team -->

| Role      | Default                                            | Why |
| --------- | -------------------------------------------------- | --- |
| Display   | `"Source Serif 4", "Source Serif Pro", serif`      | Adds gravitas for headlines; matches "exemplary American educational experience" tone. |
| UI / Body | `Inter, "Helvetica Neue", Arial, system-ui, sans-serif` | Neutral, accessible, renders well at small sizes. |
| Mono      | `"JetBrains Mono", ui-monospace, monospace`        | For code surfaces only. |

Type rules:

- Use **one display + one body face** per surface. Do not introduce a third.
- Headlines: tracking slightly tightened (-1% to -2%), weight 600–700.
- Body: weight 400, line-height 1.5–1.6, max measure ~70ch for long-form.
- Avoid all-caps for body. All-caps is acceptable for short eyebrow labels.

## Logo usage

> **Status:** A high-resolution color version of the SAS logo exists in the
> public domain via the US Department of State fact sheet. The school does
> not publish a logo usage guide publicly.

Source: [SAS 2021 logo (US State Department)](https://www.state.gov/singapore-american-school-2018-2019-fact-sheet/sas-2021-logo_full-hr_color/).

<!-- TODO: confirm clear-space + minimum-size rules with SAS brand team -->

Working rules until confirmed:

- **Clear space:** keep an empty margin equal to the height of the "S" in
  "SAS" on all sides of the wordmark/crest.
- **Minimum size:** 24 px tall for digital, 12 mm tall for print. Below that,
  use a simplified eagle mark only.
- **Background:** prefer white or `sas-navy` backgrounds. On photography, use
  the all-white version over a dark scrim.
- **Do not:** stretch, recolor outside the approved palette, add drop
  shadows, place on busy photography without a scrim, or rotate.
- **Do not:** combine the SAS logo with another logo without a vertical or
  horizontal divider and equal optical weight.

## Voice and tone

SAS public copy is **warm, confident, and student-centered**. It reads like a
school that takes itself seriously without being stiff. Useful adjectives:

- Clear, plainspoken (not corporate jargon)
- Warm and inclusive ("each student," "the needs of every child")
- Internationally minded (acknowledges 65+ nationalities)
- Aspirational but grounded ("prepared for the future")
- Specific over vague — name things, cite outcomes

Do:

- Lead with the student or the outcome, not the institution.
- Use active voice. "Students learn X" beats "X is learned by students."
- Acknowledge a global audience — avoid US-only idioms unless intentional.
- Pair "Excellence" with concrete examples; the word alone reads as boast.

Don't:

- Don't use buzzwords like *synergy*, *world-class* (overused), *leverage*,
  *cutting-edge*.
- Don't write at a corporate register. SAS is a school; people are reading.
- Don't over-claim. "One of the largest AP programs outside the US" is
  specific and true; "the best school in Asia" is not on-brand.

## Photography and illustration

> **Status:** No public guide. Inferred from sas.edu.sg.

- Photography: candid, well-lit, diverse student groups; classrooms,
  campus, activities. Avoid heavily filtered or stock-feeling imagery.
- Illustration: minimal, geometric, used sparingly. Do not introduce a
  mascot illustration style without brand-team sign-off.
- Always check release/consent for student photos before using in product UI.

## Accessibility commitment

This repo uses **APCA AAA 3.0** contrast (see `packages/accessibility/`), not
the older WCAG 2.x ratios. Brand colors must clear the bar at usage size:

- **Body text:** Lc ≥ 90
- **Large text (24 px+ bold or 32 px+ regular):** Lc ≥ 75
- **Non-text UI (icons, borders, focus rings):** Lc ≥ 60

Practical implications for the working palette:

- `sas-navy` (#0A2A5E) on white: passes Lc ≥ 90. Safe for body text.
- `sas-red` (#C8102E) on white: **does not** reliably pass Lc ≥ 90. Use only
  for icons, accents, or large display text — not for body copy.
- `sas-gold` (#C8A24B) on white: fails for text. Decorative use only.

When in doubt, run the candidate pair through
`packages/accessibility/src/apca/` helpers before shipping.

## How to apply — quick checklist

Before merging a UI change, confirm:

- [ ] Colors map to existing design tokens (no parallel hex constants).
- [ ] Primary color is navy; red is reserved for spirit / urgency.
- [ ] All text/background pairs clear APCA AAA at their rendered size.
- [ ] One display + one body typeface per surface.
- [ ] Logo, if present, has correct clear space and is not below minimum size.
- [ ] Copy is in active voice, student-centered, free of corporate jargon.
- [ ] Photography (if used) shows diverse, real students with consent on file.
- [ ] Any placeholder marked `TODO: confirm with brand team` is flagged in
      the PR description so the design team can confirm before launch.

## Sources

Confirmed from public sources:

- [Singapore American School — sas.edu.sg](https://www.sas.edu.sg/) (mission,
  pillars, tagline language)
- [Our Strategic Direction](https://www.sas.edu.sg/about-us/our-strategic-direction)
  ("Excellence, Extraordinary Care, Possibilities")
- [About Singapore American School](https://www.sas.edu.sg/about-us) (mission
  statement, "exemplary American educational experience")
- [Wikipedia: Singapore American School](https://en.wikipedia.org/wiki/Singapore_American_School)
  (founding, campus, enrollment, school colors red/white/blue, Eagle mascot)
- [SAS 2021 logo, US Department of State](https://www.state.gov/singapore-american-school-2018-2019-fact-sheet/sas-2021-logo_full-hr_color/)
  (public logo asset)
- [SAS dress code](https://www.sas.edu.sg/mysas-portal/eagle-stop/uniform/uniform-dress-code)
  (color usage by division)

To be confirmed by the SAS brand / communications team:

- Exact hex / Pantone / CMYK values for the primary palette
- Official typeface families for display and body
- Logo clear-space and minimum-size rules
- Approved photography / illustration style guide
- Co-branding lock-up rules
