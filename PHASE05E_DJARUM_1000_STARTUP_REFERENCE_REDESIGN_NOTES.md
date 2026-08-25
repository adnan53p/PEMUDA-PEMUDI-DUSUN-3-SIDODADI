# Phase 05E — Djarum Foundation × 1000 Startup Digital Reference Redesign

Scope: presentation/UI only. No Supabase Auth, RLS, RPC, finance logic, ImageKit, Edge Function, or database behavior changed.

## Reference analysis applied

### Djarum Foundation
- Inter-style neutral sans typography and calm editorial hierarchy.
- Large photography as the primary storytelling medium.
- Clear initiative/activity/achievement sections.
- Large achievement numbers with restrained decoration.
- Thin dividers, strong whitespace, minimal card treatment.

### 1000 Startup Digital
- Energetic Indonesian digital-program character.
- Blue/red brand contrast used as controlled accents rather than every section becoming a different color.
- Strong, concise campaign-oriented labels and CTAs.

## Unified visual system
- Typeface: Inter across public UI and login.
- Primary blue: #1E3A8A
- Deep blue: #162A63
- Accent red: #C9252D
- Text: #171717
- Muted: #6B7280
- White: #FFFFFF
- Surface gray: #F6F7F9
- Soft border: #E5E7EB

## Redesign decisions
- Removed blob/bento/rounded-startup visual language from Phase 05D.
- Navbar is minimal with thin red active indicator.
- Hero uses strong editorial typography and a dominant real activity photo.
- Impact section uses large-number achievement columns instead of colorful bento cards.
- Activities use one featured editorial story and a clean activity list.
- Programs use equal initiative columns with thin rules.
- Gallery uses disciplined photo cards and red rule accents.
- CTA uses one deep-blue field with clean white actions.
- Footer is neutral dark with one red identity rule.
- Existing CMS color defaults updated to the same palette so runtime variables do not fall back to the old green scheme.

## Validation
- TypeScript TSX syntax/transpile check: PASS for all 14 touched TS/TSX files.
- Full npm production build could not be completed in packaging environment because dependencies are not installed and `npm ci` timed out on network access. Run `npm run build` locally before Git push.
