---
name: ferreteriapp-products-module-planning
description: >
  Planning, implementation guidance, and live progress-tracking workflow for the FerreteriApp `/products` catalog module.
  Trigger: use when planning, specifying, implementing, reviewing, or checking status of the `/products` inventory/catalog view,
  including listing, filters, infinite scroll, product detail modal, stock visibility, and related product operations.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- When the user asks to plan or implement the `/products` module.
- When the user asks what the product catalog should include.
- When the user asks for `/products` backlog, stages, MVP, or roadmap.
- When implementing product listing, filters, infinite scroll, modal detail, stock states, or catalog UX.
- When the user asks for current status or remaining work of the `/products` module.

## Module Intent

This skill defines `/products` as the **operational inventory catalog** of FerreteriApp.

It is NOT the same as `/products/new`.

- `/products` = consult, filter, inspect, and operate over the existing catalog.
- `/products/new` = create/import products manually or massively.

The module must solve the real business problem from the project report:

- quickly finding products
- seeing real stock situation
- identifying low-stock / out-of-stock items
- checking sale and activation status
- opening product detail without losing context
- operating on products without breaking flow

## Critical Rules

### 1) Questions Protocol — NEVER decide open items autonomously

For any item marked in this skill as **Por definir**, **Opción A/B**, **Decision required**, or similar:

- You MUST use OpenCode's interactive **`question` / `Questions`** component/tool.
- You MUST present the available options clearly.
- You MUST wait for the user's choice.
- You MUST NOT choose on behalf of the user.
- You MUST NOT continue implementing the ambiguous part until the user answers.

Use this pattern:

1. Explain briefly what needs definition.
2. Show concrete options.
3. Explain tradeoffs.
4. Ask through `Questions`.
5. Record the final decision in `DECISIONS.md`.

### 2) Progress Tracking Protocol — ALWAYS leave trace

Every time work advances on this module, you MUST update:

- `STATUS.md` → current stage, completed work, next steps, blockers
- `DECISIONS.md` → answered questions, pending questions, chosen options, rationale

Do this IMMEDIATELY after any relevant progress:

- stage started
- stage completed
- subtask completed
- decision answered by user
- scope changed
- implementation blocked
- feature deferred

If the user asks "estado", "qué falta", "dónde estamos", or similar:

1. Read `STATUS.md`
2. Read `DECISIONS.md`
3. Respond from those files, not from memory alone

### 3) Respect project architecture

- Use Next.js App Router.
- Keep UI, application logic, and data access separated.
- Use Prisma for DB access.
- Prefer TypeScript everywhere.
- Keep non-UI identifiers in English.
- Keep user-facing text in Spanish.
- Prefer shadcn/ui primitives.
- Include loading, success, and error states from day one.
- Do not modify the core data model unless the user explicitly requests it.

## Current Baseline of the Project

At the time this skill was created:

- `/products` catalog view does NOT exist yet.
- `/products/new` already exists and handles manual and massive product creation/import flows.
- The real Prisma model for `Product` includes richer fields than the original DER:
  - supplier
  - current price list
  - supplier product code
  - name
  - description
  - brand
  - category code / name
  - barcode
  - cost price
  - sale price
  - stock
  - min stock
  - is active
  - is for sale

This means the `/products` module can support a richer operational catalog from the beginning.

## Functional Blueprint — What `/products` Should Have

### A. Main catalog view

The main `/products` page should provide:

1. Product listing
2. Infinite scroll pagination
3. Quick search
4. Combined filters
5. Sorting
6. Clear stock-state visibility
7. Product detail modal in the same route
8. Strong loading / empty / error states

### B. Product information shown in the list

Recommended visible fields in the list item/card/row:

1. Product name
2. Supplier product code
3. Supplier
4. Brand
5. Category
6. Sale price
7. Cost price
8. Current stock
9. Minimum stock
10. Stock status
11. Commercial status
12. General status

Recommended statuses:

- Stock normal
- Stock bajo
- Sin stock
- Activo / Inactivo
- En venta / No en venta

### C. Filters — MVP

The MVP should include:

1. Text search
2. Supplier filter
3. Category filter
4. Brand filter
5. Stock status filter
6. Active/inactive filter
7. For sale / not for sale filter
8. Sale price range filter

### D. Filters — second stage

Can be added later:

1. Stock range
2. Has barcode / missing barcode
3. Current price list / origin
4. Last updated date
5. Products without category
6. Products without brand

### E. Sorting

Minimum supported sorts:

1. Name A-Z
2. Last updated
3. Sale price
4. Current stock
5. Supplier

Optional but highly useful:

1. Critical stock first
2. Best sellers first

### F. Infinite scroll requirements

The infinite scroll implementation should:

1. Preserve filters and sorting
2. Reset correctly on filter change
3. Show initial skeletons
4. Show incremental loading state
5. Show clear empty states
6. Keep navigation stable enough for backoffice usage

### G. Product detail modal within `/products`

The modal should open without leaving the route context and should expose:

1. General information
2. Commercial information
3. Inventory information
4. Supplier relationship
5. Current price list relationship
6. Useful traceability

Recommended modal content:

1. Name
2. Supplier product code
3. Description
4. Brand
5. Category
6. Barcode
7. Cost price
8. Sale price
9. Current stock
10. Minimum stock
11. Active / for sale states
12. Supplier
13. Current price list
14. Created at
15. Updated at

Recommended modal sections/tabs:

1. Resumen
2. Inventario
3. Precios
4. Historial

### H. Actions that should eventually be available

Recommended actions from detail modal:

1. Edit product
2. Activate / deactivate product
3. Enable / disable for sale
4. Manual stock adjustment
5. View stock movements
6. View current pricing source
7. View related supplier lists

### I. Derived operational features that fit naturally

1. Replenishment alerts
2. Critical stock shortcuts
3. Hidden/inactive product management
4. Products with invalid or missing prices
5. Products with weak data quality
6. Potential duplicate detection
7. Quick entry to create/import product

### J. Required UI states

The module must include from the beginning:

1. Initial loading
2. Next-page loading
3. Load error
4. Empty catalog state
5. Empty filtered state
6. Modal loading
7. Modal error
8. Retry path when possible

## What Is Still Open — Decision Required

These are NOT implementation details to guess. They require user confirmation through `Questions`.

### 1. Actions in the list

Decision required:

- Option A: list only opens detail
- Option B: list has small quick actions
- Option C: list supports inline editing
- Option D: list supports bulk selection/actions

Recommendation:

- MVP should favor detail opening + minimal quick actions.

### 2. Detail modal depth

Decision required:

- Option A: read-only modal
- Option B: read + light actions
- Option C: full operational modal with tabs/actions

Recommendation:

- Start with rich read + focused actions, avoid turning the modal into a chaotic mini-app.

### 3. Meaning of delete

Decision required:

- Option A: hard delete
- Option B: deactivate only
- Option C: disable for sale only
- Option D: archive/hide

Recommendation:

- Prefer preserving history via `isActive` and `isForSale`, not hard delete.

### 4. Manual stock adjustment strategy

Decision required:

- Option A: direct stock edit
- Option B: adjustment with required reason
- Option C: adjustment with full movement audit

Recommendation:

- Prefer adjustment with required reason and auditable movement.

### 5. MVP filter scope

Decision required:

- Which filters ship in the first version?

Recommendation:

- Text, supplier, category, stock status, active, for sale.

### 6. Default sort

Decision required:

- Option A: name
- Option B: last updated
- Option C: critical stock first
- Option D: supplier then name

Recommendation:

- For operational backoffice, critical stock first is strong.

### 7. Summary metrics above the list

Decision required:

- Option A: no KPI cards in MVP
- Option B: lightweight KPI cards in MVP

Possible KPIs:

- total products
- active products
- low stock products
- out-of-stock products

### 8. Modal deep-linking / route state

Decision required:

- Option A: modal only in local component state
- Option B: modal controlled by query param, e.g. `?product=<id>`

Recommendation:

- Prefer query param to preserve context on refresh/share.

### 9. Sales history visibility in product detail

Decision required:

- Option A: no sales history in MVP
- Option B: lightweight sales summary
- Option C: richer transactional history

Recommendation:

- If sales module is not mature yet, keep MVP minimal.

### 10. Infinite scroll strategy

Decision required:

- Option A: offset pagination under the hood
- Option B: cursor pagination under the hood
- Option C: hybrid show-more model

Recommendation:

- Prefer cursor pagination if dataset growth is expected.

## Staged Plan

### Stage 0 — Definition and alignment

Goal:

- turn this module from idea into confirmed scope

Deliverables:

1. agreed MVP scope
2. agreed open decisions answered through `Questions`
3. updated `DECISIONS.md`
4. updated `STATUS.md`

Checklist:

- Confirm list actions
- Confirm modal depth
- Confirm delete semantics
- Confirm stock adjustment strategy
- Confirm MVP filters
- Confirm default sort
- Confirm KPI cards yes/no
- Confirm deep-link strategy
- Confirm sales-history scope
- Confirm infinite-scroll backend strategy

### Stage 1 — Data and backend contract

Goal:

- define the backend shape before UI chaos starts

Deliverables:

1. product list query contract
2. filters contract
3. sorting contract
4. product detail contract
5. stock-status derivation rules
6. pagination contract

Backend checklist:

- Define response DTOs for list and detail
- Keep Prisma access isolated in DAL/services
- Avoid leaking raw Prisma models to UI
- Normalize filter parsing and validation
- Prefer stable, typed contracts
- Index for real query patterns when needed
- Avoid N+1 relation loading
- Separate business-derived flags from UI formatting

### Stage 2 — Catalog shell and list foundation

Goal:

- build the main `/products` screen skeleton

Deliverables:

1. route `/products`
2. layout shell
3. list viewport
4. loading/empty/error states
5. item/card/row presentation

Frontend checklist:

- Keep route component lean
- Move interaction logic to focused client components
- Separate data-fetching, rendering, and filters concerns
- Preserve URL state where appropriate
- Keep components small and composable

UI/UX checklist:

- Fast scanability first
- Clear visual hierarchy
- Strong stock-state colors/tags without noise
- Mobile and desktop behavior considered
- Empty states must explain what to do next

### Stage 3 — Filters, search, and sorting

Goal:

- make the catalog operational for lookup and triage

Deliverables:

1. search input
2. filter panel/bar
3. sorting controls
4. reset/clear filters flow
5. URL persistence if approved

Checklist:

- Debounced search if needed
- Maintain source of truth clearly
- Reset pagination on filter changes
- Keep user-facing labels in Spanish
- Avoid filter explosion in MVP

### Stage 4 — Infinite scroll behavior

Goal:

- load large catalogs smoothly without destroying usability

Deliverables:

1. infinite scroll trigger
2. next-page loading state
3. duplicate request protection
4. stable merge behavior
5. end-of-list state

Checklist:

- Avoid race conditions
- Do not refetch whole list unnecessarily
- Handle quick filter changes safely
- Make sure loading indicators are visible but subtle

### Stage 5 — Product detail modal

Goal:

- expose rich detail without leaving `/products`

Deliverables:

1. modal open/close behavior
2. detail fetch/load state
3. detail sections/tabs
4. deep-link behavior if approved

Checklist:

- Preserve list context
- Keep open/close transitions polished
- Ensure keyboard accessibility
- Avoid overstuffing the modal in MVP

### Stage 6 — Actions and operational workflows

Goal:

- allow product operations from the catalog context

Possible actions:

1. edit product
2. activate/deactivate
3. enable/disable sale
4. adjust stock
5. inspect movements/history

Checklist:

- Ask before implementing any undecided action model
- Use confirmation dialogs only where operation risk justifies it
- Keep success/error feedback consistent with project toast patterns
- Preserve auditability where business-critical

### Stage 7 — Polish, verification, and acceptance

Goal:

- harden the module for real daily use

Deliverables:

1. UX polish
2. accessibility pass
3. empty/error state review
4. performance review
5. acceptance checklist completion

Checklist:

- Review contrast and status semantics
- Review keyboard and focus handling
- Review large-list responsiveness
- Review slow-network behavior
- Confirm final scope matches user decisions

## Best Practices

### Backend

- Validate all query params and payloads explicitly.
- Keep DAL/database logic out of UI components.
- Derive stock states in application logic, not scattered in UI.
- Prefer typed DTOs for list/detail responses.
- Avoid overfetching fields not used by the screen.
- Design for eventual auditability in stock-related actions.
- Use stable sorting keys when paginating.
- Think about indexes for `name`, `supplierId`, `currentPriceListId`, stock-related filters, and any heavy search path.

### Frontend

- Keep server and client responsibilities explicit.
- Preserve a clear container/presentational split where useful.
- Prefer focused components over giant catalog files.
- Persist state intentionally, not accidentally.
- Use optimistic UI only when business risk is low and rollback is clear.
- Avoid mixing modal state, filter state, and fetch state in one giant component.

### UI/UX

- Optimize for operational clarity, not decorative complexity.
- The user should recognize critical stock in seconds.
- Use badges/chips/status colors consistently.
- Keep scanning effortless: name, stock, supplier, price.
- The list must feel fast even before it is perfect.
- Detail modal should extend context, not interrupt it.
- User-facing labels and messages must stay in Spanish.

### Architecture

- Route-level orchestration should stay thin.
- Extract reusable query/filter logic.
- Keep modal detail data flow explicit.
- Keep product domain rules in one place.
- Prefer maintainable primitives over abstraction theater.

## Required Skill Behavior During Use

When this skill is loaded and the user asks to continue the module:

1. Read `STATUS.md`
2. Read `DECISIONS.md`
3. Identify current stage
4. Continue from there
5. If you hit an open decision, use `Questions`
6. After progress, update `STATUS.md`
7. After answers, update `DECISIONS.md`

## Commands

```bash
# Review current module status
# (Use Read tool for these files, not cat)

# Relevant implementation areas once work starts
# app/products/
# app/api/products/
# components/products/
# lib/dal/
# prisma/schema.prisma
```

## Resources

- **Live status**: See [STATUS.md](STATUS.md)
- **Decision log**: See [DECISIONS.md](DECISIONS.md)
- **Backend contracts**: See [CONTRACTS.md](CONTRACTS.md)
