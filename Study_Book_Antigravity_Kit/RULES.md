# Project Rules — Study Book

## Product fidelity
1. Recreate the current Study Book experience faithfully before proposing visual redesigns.
2. Fix bugs without removing intended features, changing copy, or changing workflows without approval.
3. Inspect existing assets before creating replacements. Preserve the Study Book name and “Study Smarter. Score Better.” tagline.
4. Keep the existing Google Form upload CTA during parity work unless its destination is verified broken or the owner approves a replacement.
5. Do not fabricate resource records, profile data, recent history, ratings, counts, upload completion, or saved states.

## Technical rules
6. Use React + Vite for the frontend. Keep components small and purposeful.
7. Separate page/UI code from authentication, database, and storage provider code.
8. Evaluate Firebase alternatives before choosing a replacement; document the decision in an ADR.
9. Do not migrate or delete data until there is a verified backup, test import, approval, and rollback plan.
10. Preserve existing URLs where possible; record route changes and add compatibility redirects.
11. Keep all interactive states real and accessible; every button/link must have a meaningful action.
12. Add no dependency without a reason. Keep versions and setup documented.

## Security and privacy
13. Never commit passwords, API secrets, service-role keys, private keys, or populated `.env` files.
14. Do not place backend/admin secrets in `VITE_*` variables or browser bundles.
15. Enforce file/profile ownership and protected-download authorization on the backend, not only in React.
16. Validate uploads for type and size; add abuse controls and safe error messages.
17. Audit database and storage access policies, OAuth domains, CORS, and data exposure.
18. Do not disable TLS certificate verification. Fix certificate/trust issues properly.
19. Do not collect extra personal information without a clear product need and documented handling.

## Quality gates
20. Run build, lint/type checks, and tests after each meaningful phase.
21. Test desktop and mobile layouts, keyboard navigation, focus visibility, and error/empty/loading states.
22. Check browser console and network errors; do not ignore warnings that affect reliability.
23. Update `PROGRESS.md` after each phase with completed work, tests run, results, known issues, and next actions.
24. Mark assumptions and unverified behavior explicitly.
25. Never claim a feature is complete until its actual behavior has been tested.
