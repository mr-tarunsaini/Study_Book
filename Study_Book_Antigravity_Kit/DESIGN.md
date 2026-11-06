# Design System — Study Book

## Design goal

Faithfully reproduce the existing Study Book interface and visual hierarchy, correcting visual defects and responsive problems without turning it into a different product. Use the live reference and local assets as evidence; this document is a guide, not permission to invent a new identity.

## Brand and tone
- Product name: **Study Book**
- Tagline: **Study Smarter. Score Better.**
- Tone: clear, student-friendly, practical, trustworthy.
- Keep the existing blue-accented visual language.
- Inspect all assets before deciding whether the blue square with white “S”, a book icon, or another asset is the intended logo.

## Typography
- Existing styles reportedly use Inter and/or Poppins.
- Inspect actual CSS and font loading first; reuse the existing type scale where possible.
- Use a consistent hierarchy: page title, section title, card title, body, metadata, helper/error text.
- Avoid unnecessary font substitutions or oversized decorative typography.

## Color and surfaces
- Preserve the source palette and light/dark theme behavior where implemented.
- Use CSS custom properties/tokens for background, surface, text, muted text, border, primary blue, focus ring, success, warning, and error.
- Verify contrast for text, icons, links, form states, and buttons.
- Avoid hardcoded one-off colors when a token exists.
- Keep existing rounded-card and soft-surface language unless the original source clearly differs.

## Layout and components
- Preserve header, navigation/sidebar, hero/search placement, section order, cards, footer, and responsive behavior.
- Use a consistent spacing scale and predictable content widths.
- Reusable components should include buttons, inputs, resource cards, section headers, badges/metadata, skeletons, empty states, and error states.
- Keep PDF viewer controls and document area usable on narrow screens.
- Preserve familiar interaction patterns and text.

## Interaction and accessibility
- Provide visible keyboard focus and logical tab order.
- Label inputs and expose validation errors clearly.
- Use semantic buttons for actions and anchors for navigation.
- Respect reduced-motion preferences.
- Theme switching must update the actual theme and persist only if the existing app supports persistence or it is deliberately added and documented.
- Search must be usable by keyboard and retain the `q` query parameter.
- Do not rely on color alone to communicate status.

## Responsive validation
Test at representative widths around 360px, 768px, 1024px, and 1440px:
- No horizontal overflow.
- Navigation collapses and remains accessible.
- Cards reflow without clipping.
- Search and forms fit.
- PDF viewer remains readable.
- Footer and legal content remain reachable.

## Visual QA
For each page, compare screenshots against the reference at similar viewport sizes. Record unavoidable differences caused by browser, hosting, or provider limitations. Prefer correcting layout/spacing/typography regressions before adding decoration.
