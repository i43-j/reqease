

## Admin Review Page

### Overview
Add an admin role system and a "Review" tab visible only to admins. The Review page shows all transactions (from all users) with receipt cards and a dropdown to update status via PATCH. Guest email (`guest@shap.edu.ph`) will be treated as admin.

### Plan

**1. Create admin check utility (`src/config/adminList.ts`)**
- Hardcoded list of admin emails (include `guest@shap.edu.ph`)
- Export `isAdmin(email: string): boolean` function
- Note: Since auth is currently disabled (login commented out) and there's no Supabase user_roles table populated, we use a client-side admin email list for now. This is acceptable since database writes (status updates) go through Supabase with anon key anyway.

**2. Create ReviewPage component (`src/components/ReviewPage.tsx`)**
- Queries ALL transactions (no email filter) ordered by ID desc
- Same data-fetching pattern as RequestsPage (transactions + items + item details merge)
- Tabs: All, Due for Approval, Approved/Rejected, Completed
- Each receipt card includes a status dropdown (Select component) with options: DUE FOR APPROVAL, APPROVED, REJECTED, COMPLETED
- On status change, PATCH the transaction_log row via `supabase.from(...).update({ status }).eq(id, txId)`
- Reuse the ReceiptCard component but extend it with an optional `onStatusChange` prop for the dropdown

**3. Update Navbar (`src/components/Navbar.tsx`)**
- Add "Review" tab, visible only when user email is admin
- Update `activePage` type to include `"review"`

**4. Update Index page (`src/pages/Index.tsx`)**
- Add `"review"` to the activePage union type
- Render ReviewPage when active
- Pass admin check to Navbar

### Technical Details
- Status update uses Supabase `.update()` which sends a PATCH request
- The ReceiptCard from RequestsPage will be extracted/shared, or ReviewPage will have its own version with the dropdown
- Admin list is a simple array check — no database table needed for now

