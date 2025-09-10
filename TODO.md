# Refactor tracker (one page at a time)

Current target page: `pages/transactions/[requestKey].vue`
Status: Planning

## Checklist for the current page
- [ ] Dependency inventory (components/composables/utils/server/api, route params/query)
- [ ] Data flow traced end-to-end and SSR-safe
- [ ] SSR decision recorded for this page (keep client-only vs enable SSR)
- [ ] Reactive state normalized (refs/reactive)
- [ ] Computed properties reviewed/simplified
- [ ] Watchers reviewed/reduced
- [ ] Lifecycle hooks reviewed
- [ ] Functions organized and extracted where reusable
- [ ] Loading/error/empty states standardized
- [ ] Confirm helper reuse vs creation (search `composables/string.ts`, `number.ts`, domain composables)
- [ ] Naming and file/module ordering aligned
- [ ] Imports grouped and ordered
- [ ] Duplication removed; utilities extracted
- [ ] Types added/strengthened (no `any`)
- [ ] Comments/docstrings for nontrivial logic
- [ ] Accessibility/performance pass
- [ ] Impact analysis: list consumers of changed composables/utils
- [ ] Update cascade tasks (below)
- [ ] Manual review checkpoint (stop before proceeding)

## Cascade tasks (add items when a shared module changes)
- 

## Notes / Constraints (do not change unless agreed)
- Keep state in composables; do not introduce Pinia.
- Composables call Nuxt `server/api/*`; those call the external indexer (GraphQL).
- Do not enable TS `strict` globally now.
- Keep existing UX: pages use skeletons; cards/atoms use spinners.
- No new test frameworks; legacy site cleanup later.

## Template for next pages (copy as needed)
Target page: ``
Status: Planning

- [ ] Dependency inventory
- [ ] Data flow SSR-safe
- [ ] SSR decision recorded for this page
- [ ] State normalized
- [ ] Computed reviewed
- [ ] Watchers reviewed
- [ ] Lifecycle reviewed
- [ ] Functions organized/extracted
- [ ] Loading/error/empty
- [ ] Confirm helper reuse vs creation
- [ ] Naming/order
- [ ] Imports ordered
- [ ] Duplication removed
- [ ] Types tightened
- [ ] Comments
- [ ] A11y/perf pass
- [ ] Impact analysis
- [ ] Update cascade tasks
- [ ] Manual review checkpoint