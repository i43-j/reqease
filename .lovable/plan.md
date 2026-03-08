

# Science Lab Booking System — Implementation Plan

## Branding & Design
- Dark green (#094c25) primary, yellow (#fcd802) for pending/warnings, orange (#f6aa10) for urgent/rejected
- Inter font throughout
- Clean card-based UI with the material-picker style shown in the reference image

## Authentication
- Google OAuth2 via Supabase Auth (restricted to `@shap.edu.ph` domain)
- Editable allowlist file (`src/config/allowlist.ts`) for email overrides
- User roles table in Supabase (`basic` / `admin`) using security-definer pattern

## Layout & Navigation
- Top navbar with **Home** and **Requests** links
- Pages swap in-place (no route changes), wizard uses a stepper component

## Home — Booking Wizard (6 steps)

**Step 1 — Route Selection**
Three cards: Book Room (A), Borrow Equipment (B), Both (C)

**Step 2 — Room Selection** (Routes A & C)
Six room cards (B_JHS, P_JHS, B_SHS, GSL, C_SHS, P_SHS) with a text field for reason/requirements. Loading state while fetching.

**Step 3 — Equipment Picker** (Routes B & C)
- Three tabs: Equipment, Chemicals, Materials
- Equipment tab has dynamic sub-category filter buttons (from `SELECT DISTINCT category`)
- Item cards with image, name, notes, qty+uom, and +/- quantity selector (per reference image)
- Cart summary sidebar showing selected items with totals
- Route B: all items; Route C: scoped to selected room's `lab` field

**Step 4 — Date & Time**
- Calendar picker, weekdays only (weekends/holidays greyed out)
- Start time + end time selectors (7:00 AM – 4:00 PM range)

**Step 5 — Confirmation**
- Full summary: route, room, items list, date/time
- "Submit Request" button triggers in order:
  1. Insert `transaction_log` (status = "DUE FOR APPROVAL")
  2. Capture returned ID
  3. Insert all `transaction_items_log` rows
  4. Render styled receipt HTML
  5. POST receipt to n8n webhook for email delivery

**Step 6 — Success**
- Confirmation message with receipt preview

## Requests Page
- Three tabs: Pending, Approved/Rejected, Completed
- Fetches from `transaction_log` filtered by user email and status
- Friendly empty states per tab

## Database (Supabase)
- Tables: `items`, `transaction_log`, `transaction_items_log`, `user_roles`
- RLS policies: users see only their own transactions; items readable by all authenticated users
- Security-definer `has_role` function for role checks

## Backend Integration
- Supabase for auth, database, storage (item images)
- n8n webhook for email receipt delivery

