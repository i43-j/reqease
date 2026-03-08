# SHAP ReqEase — Product Specification

## Product Overview

| Field | Value |
|-------|-------|
| **Name** | SHAP ReqEase |
| **Type** | Single-page web application |
| **Purpose** | Science lab room booking and equipment borrowing system |
| **Organization** | SHAP (Sacred Heart Academy of Pasig) |
| **Target Users** | Faculty and staff with @shap.edu.ph Google accounts |

---

## User Roles

### Regular User
- Sign in with Google (@shap.edu.ph)
- Book lab rooms (Route A)
- Borrow equipment/chemicals (Route B)
- Book rooms and borrow equipment (Route C)
- View and track their own requests

### Admin
- All regular user capabilities
- Access the "Review" tab
- View all requests from all users
- Change request statuses (approve, reject, complete)
- Triggers approval webhook/email

**Admin access**: Controlled by `ADMIN_EMAILS` in `src/config/adminList.ts`.

---

## Features

### 1. Google Sign-In
- OAuth via Google Identity Services
- Restricted to @shap.edu.ph domain
- Optional email allowlist for external users
- Persistent session via localStorage

### 2. Booking Wizard (3 Routes)

#### Route A — Book Room
1. Select a lab room from 6 available rooms
2. Provide reason for booking
3. Pick date (weekdays only) and time slot (7 AM – 4 PM)
4. Review and confirm
5. Success screen

#### Route B — Borrow Equipment
1. Browse inventory by lab/category (Equipment, Chemicals, Consumable)
2. Add items to cart with quantities
3. Pick date and time slot
4. Review and confirm
5. Success screen

#### Route C — Book Room & Borrow Equipment
1. Select lab room + reason
2. Browse and select equipment
3. Pick date and time
4. Review and confirm
5. Success screen

### 3. Request Tracking (My Requests)
- Three tabs: Pending, Resolved, Completed
- Receipt-style cards showing transaction details
- Shows room, date, time, items, and status

### 4. Admin Review Dashboard
- Four tabs: All, Pending, Resolved, Completed
- Status dropdown on each transaction card
- Confirmation dialog before status changes
- Webhook fired on approval

### 5. Email Receipts
- HTML receipt sent via n8n webhook on submission
- Contains transaction ID, route, room, items, date/time, status
- Approval webhook also triggered when admin approves

---

## Rooms

| Code | Full Name |
|------|-----------|
| B_JHS | Junior High School Biology Lab |
| P_JHS | Junior High School Physics Lab |
| B_SHS | Senior High School Biology Lab |
| GSL | Grade School Lab |
| C_SHS | Senior High School Chemistry Lab |
| P_SHS | Senior High School Physics Lab |

---

## Inventory Categories

| Category | Tab | Quantity Input |
|----------|-----|----------------|
| Equipment (any non-chemical/consumable) | Equipment | Numeric (1 to available qty) |
| CHEMICALS | Chemicals | Toggle (on/off, qty = 1) |
| CONSUMABLE | Materials | Toggle (on/off, qty = 1) |

---

## Status Lifecycle

```
                    ┌──→ APPROVED ──→ COMPLETED
DUE FOR APPROVAL ──┤
                    └──→ REJECTED
```

| Status | Meaning |
|--------|---------|
| DUE FOR APPROVAL | Newly submitted, awaiting admin review |
| APPROVED | Admin approved the request |
| REJECTED | Admin rejected the request |
| COMPLETED | Booking has been fulfilled/completed |

---

## Time Constraints

- **Days**: Weekdays only (Monday–Friday)
- **Hours**: 7:00 AM to 4:00 PM
- **Minimum duration**: 1 hour (enforced by time picker)

---

## Access Control

| Rule | Implementation |
|------|----------------|
| Domain restriction | Email must end with `@shap.edu.ph` |
| Email allowlist | Specific emails bypass domain check (`allowlist.ts`) |
| Admin access | Email must be in `ADMIN_EMAILS` array (`adminList.ts`) |
| Auth persistence | `localStorage` key `shap_user` |

---

## Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Architecture | Client-side SPA, no backend server |
| Database | Supabase (hosted PostgreSQL) |
| Hosting | Lovable (Vite build) |
| Browser support | Modern browsers (Chrome, Firefox, Safari, Edge) |
| Mobile responsive | Yes, all components are mobile-friendly |
| Offline | Not supported, requires network |
| Real-time | Not implemented (polling on page load) |

---

## Integration Points

| System | Purpose | Config Location |
|--------|---------|-----------------|
| Supabase | Database + storage | `src/config/constants.ts` |
| Google Cloud | OAuth sign-in | `src/hooks/useAuth.tsx` |
| n8n | Email webhook | `src/config/constants.ts` |

---

## Data Flow

```
User submits booking
  → Insert into transaction_log (Supabase)
  → Insert items into transaction_items_log (Supabase)
  → POST receipt HTML to n8n webhook
  → n8n sends email to user

Admin approves request
  → Update status in transaction_log (Supabase)
  → POST approval to n8n webhook
  → n8n sends approval email
```
