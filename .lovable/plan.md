

## Plan: Add Review Webhook + Send HTML to Both

### Changes

**1. `src/config/constants.ts`**
- Add: `export const N8N_REVIEW_WEBHOOK_URL = "https://i43-j.app.n8n.cloud/webhook/shap-reqease-due";`

**2. `src/components/wizard/Confirmation.tsx`**
- Update the existing receipt webhook payload to also include full structured booking details (not just `to`, `subject`, `html`, `transaction_id`)
- Add a second webhook POST to `N8N_REVIEW_WEBHOOK_URL` with:
  - Full structured data: `transaction_id`, `user_email`, `booking_type`, `room`, `room_name`, `booking_date`, `start_time`, `end_time`, `reason`, `status`, `items[]`
  - Plus `html` (the receipt HTML from `buildReceiptHTML`)
- Both webhook calls remain fire-and-forget (failures logged but don't block the booking)

