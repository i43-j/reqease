# SHAP ReqEase — Developer Handoff

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd shap-reqease

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Configuration Checklist

All config is in source files (no `.env` needed):

| Setting | File | Variable |
|---------|------|----------|
| Supabase URL | `src/config/constants.ts` | `SUPABASE_URL` |
| Supabase Anon Key | `src/config/constants.ts` | `SUPABASE_ANON_KEY` |
| Google Client ID | `src/hooks/useAuth.tsx` | `GOOGLE_CLIENT_ID` |
| n8n Webhook URL | `src/config/constants.ts` | `N8N_WEBHOOK_URL` |
| Allowed domain | `src/config/allowlist.ts` | `ALLOWED_DOMAIN` |
| Allowlisted emails | `src/config/allowlist.ts` | `EMAIL_ALLOWLIST` |
| Admin emails | `src/config/adminList.ts` | `ADMIN_EMAILS` |

---

## Key Decisions Log

| Decision | Rationale |
|----------|-----------|
| **Google GIS over Supabase Auth** | Simpler integration, no extra Supabase auth config needed. Direct JWT decode gives us email/name/picture. |
| **Client-side admin check** | Admin list is small and static. No server-side role enforcement needed since Supabase RLS handles data access. The admin check only controls UI visibility (Review tab). |
| **localStorage for sessions** | Lightweight persistence without Supabase auth session management. User stays logged in across refreshes. |
| **Constants file for DB schema** | All table/column names in one place. If Supabase schema changes, edit one file. |
| **n8n for emails** | Decouples email logic from the frontend. Easy to modify email templates and add workflows in n8n. |
| **No React Router** | Single-page app with tab-based navigation (Home/Requests/Review). No URL routing needed beyond the index page. |

---

## Known Limitations & Tech Debt

1. **No server-side admin enforcement** — Admin check is client-side only. Add Supabase RLS policies or Edge Functions for production security.
2. **No real-time updates** — RequestsPage and ReviewPage fetch on mount only. Could add Supabase realtime subscriptions.
3. **No offline support** — App requires network for all operations.
4. **Timestamp format** — Uses `toLocaleString("en-US", { timeZone: "Asia/Manila" })` which produces a string, not a proper timestamptz. Consider using ISO 8601.
5. **Image storage** — Items reference images by `image_key` + `.png` extension. No upload UI exists; images must be added directly to Supabase storage.
6. **No pagination** — All transactions are fetched at once. May need pagination for large datasets.
7. **Cart state lost on refresh** — Booking wizard state is in-memory only.

---

## Deployment Checklist

- [ ] Set correct `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `constants.ts`
- [ ] Set correct `GOOGLE_CLIENT_ID` in `useAuth.tsx`
- [ ] Add production domain to Google OAuth authorized origins
- [ ] Add admin emails to `adminList.ts`
- [ ] Set `N8N_WEBHOOK_URL` to production webhook
- [ ] Verify Supabase RLS policies are enabled
- [ ] Test Google Sign-In flow on production domain
- [ ] Verify n8n webhook receives and sends emails

---

## Ownership

| Role | Contact |
|------|---------|
| Project Owner | _[Add name/email]_ |
| Lead Developer | _[Add name/email]_ |
| Supabase Admin | _[Add name/email]_ |
| Google Cloud Admin | _[Add name/email]_ |

---

## Support

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).
For product specifications, see [SPEC.md](./SPEC.md).
