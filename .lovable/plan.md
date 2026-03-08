

## Plan: Codebase Cleanup, Documentation, Handoff, and Spec Sheet

### 1. Delete unused files
- `src/App.css` (not imported anywhere)
- `src/components/NavLink.tsx` (not imported anywhere)

### 2. Extract shared code to reduce duplication

**`src/lib/transactions.ts`** — shared between RequestsPage and ReviewPage:
- `TxWithItems` interface
- `STATUS_COLORS`, `STATUS_GROUPS` constants
- `fetchTransactionsWithItems(email?: string)` — the 3-query fetch+merge logic

**`src/lib/receipt.ts`** — extracted from Confirmation.tsx:
- `buildReceiptHTML(state, user, txId)` function

**`src/components/shared/TransactionCard.tsx`** — base card used by both pages:
- `EmptyState` component
- `InfoRow` component
- `TransactionCard` (the receipt-style card rendering)

### 3. Simplify page components
- **RequestsPage.tsx** — import shared components/logic, reduce to ~50 lines
- **ReviewPage.tsx** — import shared components/logic, add only the status dropdown + confirm dialog, reduce to ~100 lines
- **Confirmation.tsx** — import `buildReceiptHTML` and `submitBooking` from libs, reduce to ~70 lines

### 4. Create documentation files

**`ARCHITECTURE.md`** — comprehensive developer documentation:
- Project overview (SHAP ReqEase — science lab booking system)
- Tech stack (React 18, Vite, Tailwind, shadcn/ui, Supabase as DB, Google GIS auth)
- Folder structure with purpose of each file
- Auth flow: Google Identity Services → JWT decode → allowlist check → localStorage persistence
- Booking wizard flow with route/step mapping table
- Database schema (tables: `items`, `transaction_log`, `transaction_items_log` with all columns)
- Receipt HTML template (the full email HTML from `buildReceiptHTML`)
- Configuration guides (constants.ts, allowlist.ts, adminList.ts)
- n8n webhook integration details
- Google OAuth setup (authorized origins)
- How-to guides: add admin, add room, add allowlisted email, add new booking route

**`HANDOFF.md`** — developer handoff document:
- Quick start (clone, install, dev server)
- Environment/config: Supabase URL/key in constants.ts, Google Client ID in useAuth.tsx
- Key decisions log (why GIS over Supabase Auth, why client-side admin check, etc.)
- Known limitations and tech debt
- Deployment checklist (Google OAuth origins, Supabase RLS, n8n webhook URL)
- Contact/ownership info placeholder

**`SPEC.md`** — product specification sheet:
- Product name, purpose, target users (SHAP faculty/staff)
- Feature list with descriptions (3 booking routes, request tracking, admin review)
- User roles (regular user vs admin)
- Booking routes A/B/C with step-by-step flows
- Status lifecycle: DUE FOR APPROVAL → APPROVED/REJECTED → COMPLETED
- Access control rules (domain restriction, allowlist, admin list)
- Inventory categories (Equipment, Chemicals, Consumable)
- Time constraints (weekdays, 7AM–4PM)
- Room list with codes
- Email receipt format and trigger conditions
- Non-functional requirements (SPA, no backend server, Supabase as data layer)

### Files summary

| Action | File |
|--------|------|
| Delete | `src/App.css` |
| Delete | `src/components/NavLink.tsx` |
| Create | `src/lib/transactions.ts` |
| Create | `src/lib/receipt.ts` |
| Create | `src/components/shared/TransactionCard.tsx` |
| Create | `ARCHITECTURE.md` |
| Create | `HANDOFF.md` |
| Create | `SPEC.md` |
| Simplify | `src/components/RequestsPage.tsx` |
| Simplify | `src/components/ReviewPage.tsx` |
| Simplify | `src/components/wizard/Confirmation.tsx` |

