# DS v2 — design system of the public site

Read this before touching anything under `src/app/(public)`. The admin (`src/app/(panel)`) does **not**
use DS v2 (it is antd) — leave it alone.

## Source of truth

- **Figma:** file `tKnB9Hk2kJ6douDcaTKMww` ("DIT · Design System v2 · M3", team OYS, folder Dream Islands).
  - Page **Components**: one dark section per component group (Buttons, Chip, Cards, Top app bar,
    Top bar · Mobile, Mobile menu, Navigation bar, Bottom sheet, Price range, Flags…). Component
    descriptions in Figma explain usage.
  - Page **Сайт v2**: desktop and mobile screens, plus the "Поиск" section (mobile search, map,
    filters, place carousel).
- **Code:** `src/app/(public)/ds/` (tokens + components). Screens live next to their routes.
- Code follows Figma **1:1**, desktop and mobile separately (mobile is its own layout, not a shrunk
  desktop). Do not restyle components to taste; if data for a design is missing, ask the designer
  (Oleg) instead of inventing a substitute. Deviations go to Oleg as a list *before* changing anything.

## Tokens — `ds/tokens.css`

All values are CSS custom properties `--ds-*` in `rem`, exported from Figma variables. Never hardcode
hex/px where a token exists. Light theme is the site default; dark is defined under
`[data-theme="dark"]` (no switch yet).

| Group | Tokens | Notes |
|---|---|---|
| Accent | `--ds-primary` `#60bb89`, `--ds-on-primary`, `--ds-primary-container` | Bright mint: main actions, selected states, hovers of header buttons |
| Brand deep green | `--ds-tertiary` `#2b5c41` | The former accent; logo and deep brand accents |
| Surfaces | `--ds-surface`, `--ds-surface-container-{lowest…highest}`, `--ds-on-surface`, `--ds-on-surface-variant` | Cards and floating elements are white (`container-low/high`); fields use `container-highest` |
| Tracks | `--ds-track-{reset,performance,mind,immersion,sport}` (+`-container`) | Colour per programme track (cohort) |
| On photos | `--ds-image-plate`, `--ds-on-image-plate`, `--ds-on-image` | Buttons/tags placed on photos |
| Shape | `--ds-r-xs … --ds-r-xl-plus` (36px), `--ds-r-full` | 36px for blocks, modals, sheets; 12–16 for small rows |
| Spacing | `--ds-s-1 … --ds-s-24` (4px steps) | Rhythm 24 / 48 |
| State | `--ds-state-hover/focus/pressed/disabled` | Opacity of state layers |
| Elevation | `--ds-elev-1 … 4` | One soft shadow tinted with on-surface. **Popups and floating handles only** |
| Motion | `--ds-spring`, `--ds-spring-dur` (0.55s) | iOS-like spring (`linear()` easing) for UI movement |
| Type | `--ds-font-display` (Bricolage Grotesque), `--ds-font-body` (DM Sans), `--ds-font-icon` (Material Symbols Rounded), `--ds-font-logo` (wordmark only) | |
| Layout | `--ds-container` (80rem lists), `--ds-container-narrow` (70rem details), `--ds-gutter`, `--ds-page-pad` | |

Type scale classes: `.ds-display-{l,m,s}`, `.ds-headline-{l,m,s}`, `.ds-title-{l,m,s}`,
`.ds-body-{l,m,s}`, `.ds-label-{xl,l,m,s}`, helpers `.ds-muted`, `.ds-ink`, `.ds-container*`.

## Components — `ds/`

| File | Exports |
|---|---|
| `ui.tsx` | `Icon` (Material Symbols), `Button`/`ButtonLink` (filled, tonal, text; sizes m, l), `IconButton`/`IconLink` (standard, tonal, filled, photo), `Chip`, `TrackChip`, `Tag`, `UvpPill`, `SeeAll`, `SectionHead`, `TextField`, `Tabs`, `ListItem`, `Radio`, `Badge`, `Notice`, `Stars`, `Faq`, `Route`, `InfoCard`, `Facts`, `Sep` |
| `cards.tsx` | `Photo` (next/image wrapper with children overlay), `ProgramCard` (compact / `wide` full-width 4:3), `PlaceCard`, `CountryCard`, `OutcomeTile`, `ReviewCard`, `ScoreCard`, `JourneyPrompt`, `COHORT_TRACK` |
| `overlay.tsx` | `Dialog`, `BottomSheet` (title, scrollable content, sticky footer), `BottomActionBar` |
| `chrome.tsx` | `Logo`, `TopAppBar` (desktop, guest / signed in), `MobileTopBar`, `MobileBackBar`, `MobileMenu`, `Account` (avatar menu), `NavigationBar` (mobile tab bar: Explore, Programmes, My Journey, Saved + green search button; shrinks on scroll), `Footer`, `NavTracker` |
| `PriceRange.tsx` | Price histogram + two-thumb slider (filters) |
| `Flag.tsx` | Round country flags (circle-flags); `flagCode(country)` |
| `saved.ts` | Favourites in localStorage: `useSaved`, `isSaved`, `toggleSaved` |
| `navHistory.ts` | `useSafeBack(fallback)` — back button that never leaves the site |
| `Gallery`, `HeroVideo`, `MobilePhoto`, `SearchBar`, `SaveButton`, `ShareButton`, `Favorite`, `payment.tsx` | Single-purpose pieces (payment marks use original brand logos) |

Shared data helpers: `_lib/routes.ts` — the goal/track categories used by chips on home, search and
filters (`homeRoutes`, `searchRoutes`, `GOAL_ICONS`, `TRACK_ICONS`, `routeHref`). Use these instead of
hand-made category lists so every screen shows the same categories with the same icons.

Mobile search (`programs/`): `MobileSearch` (search pill, filters button, chips, filters in
`BottomSheet`), `ResultsSheet` (draggable results: collapsed / half / full), `CatalogMap` (Leaflet +
OpenStreetMap tiles, price pins, place-card carousel synced to pins), `searchHref` (URL state).

## Rules from the designer

1. **One element — one component.** Different text = a prop, not a new variant (e.g. one `Chip` for
   every category). When a pattern is praised, make it a component and reuse it.
2. Radius 36 (`--ds-r-xl-plus`) on blocks, modals, bottom sheets; pill buttons.
3. **No ALL CAPS with letter-spacing** anywhere.
4. **Shadows only on popups** (modals, sheets, menus, toasts, floating handles). Cards, search,
   bottom bars — no shadow.
5. Minimalism: avoid outlines/borders and hairline dividers — use air and surface steps instead.
   Secondary buttons and selected chips are neutral; colour only on the main action.
6. Programme card: outcomes as tags **on the photo**; section links read "See All N".
7. Round things (icon circles, avatars, radios) never stretch into ovals — fixed square boxes.
8. Payments: original brand marks (Apple Pay / Google Pay buttons, Visa / Mastercard / Amex).
9. Spelling: **British** in user-facing copy — "programme(s)". Keep "program" in code identifiers,
   URLs (`/programs`), DB values and DB-sourced names.
10. Naming: the survey is the **Wellness Journey**, its result the **Wellness Score**. Do not rename
    established CTAs.
11. Hover of header buttons: accent green (as in the scrolled header).

## Figma housekeeping

- Sections on the Components page use Figma's default dark section colour; one section per component
  group, no decorative frames; component usage goes into the component description.
- When cloning a variant, re-bind `componentPropertyReferences` (clones lose them).

## Verification

Screens built from Figma are checked by a separate review pass against the Figma node (sizes,
spacing, tokens, texts) on both desktop and mobile — a self-report is not enough.
