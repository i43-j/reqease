# SHAP ReqEase — Architecture Guide

## Overview

SHAP ReqEase is a science-lab booking system for SHAP (Sacred Heart Academy of Pasig). Faculty and staff can book lab rooms, borrow equipment/chemicals, and track request statuses. Admins can review and approve/reject requests.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Google Identity Services (GIS) |
| Email | n8n webhook |
| State | React Context (useBooking, useAuth) |

---

## Folder Structure

```
src/
├── assets/              # Static images (logo.png)
├── components/
│   ├── shared/          # Reusable UI (TransactionCard, EmptyState, InfoRow)
│   ├── ui/              # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── wizard/          # Booking wizard steps
│   │   ├── BookingWizard.tsx   # Step router
│   │   ├── RouteSelect.tsx     # Step 0: choose A/B/C
│   │   ├── RoomSelect.tsx      # Room picker
│   │   ├── EquipmentPicker.tsx # Inventory browser + cart
│   │   ├── DateTimePicker.tsx  # Calendar + time slots
│   │   ├── Confirmation.tsx    # Review & submit
│   │   ├── Success.tsx         # Done screen
│   │   └── StepIndicator.tsx   # Progress bar
│   ├── LoginPage.tsx    # Google sign-in split screen
│   ├── Navbar.tsx       # Top navigation bar
│   ├── RequestsPage.tsx # User's request history
│   └── ReviewPage.tsx   # Admin review dashboard
├── config/
│   ├── constants.ts     # All config: Supabase URLs, DB schema, rooms, routes
│   ├── allowlist.ts     # Email domain restriction + allowlist
│   └── adminList.ts     # Admin email list
├── hooks/
│   ├── useAuth.tsx      # Google GIS auth context + provider
│   └── useBooking.tsx   # Booking wizard state context + provider
├── lib/
│   ├── supabase.ts      # Supabase client instance
│   ├── transactions.ts  # Shared fetch logic, types, status constants
│   ├── receipt.ts       # HTML receipt builder for emails
│   └── utils.ts         # Tailwind cn() helper
├── pages/
│   ├── Index.tsx        # Root page (auth gate → app shell)
│   └── NotFound.tsx     # 404 page
└── types/
    └── booking.ts       # TypeScript interfaces (InventoryItem, CartItem, etc.)
```

---

## Authentication Flow

```
User clicks "Sign in with Google"
  → Google GIS popup (client_id in useAuth.tsx)
  → JWT credential returned
  → Decode JWT payload (email, name, picture)
  → Check email against allowlist (allowlist.ts)
    → Must be @shap.edu.ph OR in EMAIL_ALLOWLIST
  → Store AppUser in localStorage (key: "shap_user")
  → Set user in AuthContext
```

**Session persistence**: User data is stored in `localStorage` under `shap_user`. On app load, the stored session is restored. Signing out clears it.

**Admin check**: `isAdmin(email)` in `adminList.ts` checks against a hardcoded list. Admins see the "Review" tab in the navbar.

### Configuration

- **Google Client ID**: `GOOGLE_CLIENT_ID` in `src/hooks/useAuth.tsx`
- **Allowed domain**: `ALLOWED_DOMAIN` in `src/config/allowlist.ts`
- **Allowlisted emails**: `EMAIL_ALLOWLIST` array in `src/config/allowlist.ts`
- **Admin emails**: `ADMIN_EMAILS` array in `src/config/adminList.ts`

---

## Booking Wizard Flow

The wizard uses a step-based system. The route determines which steps are shown:

| Step | Route A (Room) | Route B (Equipment) | Route C (Both) |
|------|---------------|---------------------|----------------|
| 0 | Route Select | Route Select | Route Select |
| 1 | Room Select | Equipment Picker | Room Select |
| 2 | Date & Time | Date & Time | Equipment Picker |
| 3 | Confirmation | Confirmation | Date & Time |
| 4 | Success | Success | Confirmation |
| 5 | — | — | Success |

State is managed by `BookingProvider` (useBooking.tsx). Navigating back to Home (step 0) resets all state.

---

## Database Schema

All table/column names are defined in `src/config/constants.ts` under the `DB` object.

### `items` (Inventory)

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Unique item identifier |
| `lab` | text | Lab room code (e.g. "B_JHS") |
| `category` | text | "CHEMICALS", "CONSUMABLE", or equipment category |
| `stock_description` | text | Human-readable item name |
| `qty` | integer | Available quantity |
| `uom` | text | Unit of measure (e.g. "pcs", "mL") |
| `image_key` | text | Storage key for item image |
| `notes` | text | Optional notes |

### `transaction_log` (Bookings)

| Column | Type | Description |
|--------|------|-------------|
| `transaction_log` | serial (PK) | Auto-increment ID |
| `timestamp` | text | Submission timestamp (Manila TZ) |
| `lab` | text | Room code (nullable for Route B) |
| `user_email` | text | Submitter's email |
| `status` | text | DUE FOR APPROVAL / APPROVED / REJECTED / COMPLETED |
| `booking_date` | date | Requested date |
| `start_time` | text | Start time (e.g. "08:00") |
| `end_time` | text | End time (e.g. "10:00") |
| `reason` | text | Purpose/reason (nullable) |

### `transaction_items_log` (Booked Items)

| Column | Type | Description |
|--------|------|-------------|
| `transaction_id` | integer (FK) | References transaction_log |
| `created_at` | timestamptz | Auto-set |
| `item_id` | text (FK) | References items.id |
| `qty` | integer | Quantity requested |

### Status Lifecycle

```
DUE FOR APPROVAL  →  APPROVED  →  COMPLETED
                  →  REJECTED
```

---

## Receipt HTML Template

The email receipt is built in `src/lib/receipt.ts` by `buildReceiptHTML()`. Structure:

```html
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <!-- Header: dark green (#094c25) banner -->
  <div style="background:#094c25;color:white;padding:20px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;font-size:20px;">SHAP REQEASE Booking Receipt</h1>
    <p style="margin:4px 0 0;opacity:0.8;">Transaction #{{txId}}</p>
  </div>
  <!-- Body: bordered content area -->
  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 12px 12px;">
    <p><strong>Route:</strong> {{routeLabel}}</p>
    <p><strong>Room:</strong> {{roomName}} ({{roomCode}})</p>     <!-- if applicable -->
    <p><strong>Reason:</strong> {{reason}}</p>                    <!-- if provided -->
    <p><strong>Date:</strong> {{bookingDate formatted PPPP}}</p>
    <p><strong>Time:</strong> {{startTime}} – {{endTime}}</p>
    <p><strong>Email:</strong> {{userEmail}}</p>
    <p><strong>Status:</strong>
      <span style="background:#fcd802;padding:2px 8px;border-radius:4px;font-size:13px;">
        DUE FOR APPROVAL
      </span>
    </p>
    <!-- Items table (if any) -->
    <h3 style="margin-top:16px;">Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #094c25;">Item</th>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #094c25;">Qty</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">{{stock_description}}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">{{qty}} {{uom}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## n8n Webhook Integration

On booking submission, a POST request is sent to `N8N_WEBHOOK_URL` (defined in `constants.ts`):

```json
{
  "to": "user@shap.edu.ph",
  "subject": "SHAP REQEASE Booking Receipt — Transaction #123",
  "html": "<full receipt HTML>",
  "transaction_id": 123
}
```

On admin approval, another POST is sent:

```json
{
  "transaction_id": 123
}
```

---

## Rooms

Defined in `ROOMS` array in `constants.ts`:

| Code | Name |
|------|------|
| B_JHS | Junior High School Biology Lab |
| P_JHS | Junior High School Physics Lab |
| B_SHS | Senior High School Biology Lab |
| GSL | Grade School Lab |
| C_SHS | Senior High School Chemistry Lab |
| P_SHS | Senior High School Physics Lab |

---

## How-To Guides

### Add an admin
Edit `src/config/adminList.ts` → add email to `ADMIN_EMAILS` array.

### Add an allowlisted email
Edit `src/config/allowlist.ts` → add email to `EMAIL_ALLOWLIST` array.

### Add a room
Edit `src/config/constants.ts` → add `{ code: "X", name: "Room Name" }` to `ROOMS` array. Add the code to the `RoomCode` union type.

### Add a new booking route
1. Add route letter to `BookingRoute` type in `constants.ts`
2. Add label to `ROUTE_LABELS`
3. Update `getSteps()` and `getStepComponent()` in `BookingWizard.tsx`
4. Update `prevStep`/`successStep` in `Confirmation.tsx`
5. Update `maxStep` in `useBooking.tsx`

### Change Supabase project
Edit `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `src/config/constants.ts`.

### Change Google OAuth client
Edit `GOOGLE_CLIENT_ID` in `src/hooks/useAuth.tsx`. Update authorized JavaScript origins in Google Cloud Console.

---

## Google OAuth Setup

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create OAuth 2.0 Client ID (Web application)
2. Add **Authorized JavaScript Origins**:
   - `http://localhost:5173` (dev)
   - `https://your-published-url.lovable.app` (production)
   - Lovable preview URL
3. Copy the Client ID to `GOOGLE_CLIENT_ID` in `useAuth.tsx`
