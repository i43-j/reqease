/**
 * Builds the HTML receipt email for a booking transaction.
 * Extracted from Confirmation.tsx for reuse and testability.
 */
import { format } from "date-fns";
import { APP_NAME, ROUTE_LABELS, ROOMS, DB } from "@/config/constants";
import type { BookingState } from "@/types/booking";

/**
 * Generate an HTML receipt string for email delivery.
 * @param state - Current booking state (route, room, cart, dates, etc.)
 * @param email - User's email address
 * @param txId  - The transaction ID from the database
 */
export function buildReceiptHTML(state: BookingState, email: string, txId: number): string {
  const roomName = ROOMS.find((r) => r.code === state.room)?.name;

  const itemsHtml = state.cart
    .map(
      (c) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${c.item.stock_description}</td><td style="padding:8px;border-bottom:1px solid #eee;">${c.quantity} ${c.item.uom}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#094c25;color:white;padding:20px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">${APP_NAME} Booking Receipt</h1>
        <p style="margin:4px 0 0;opacity:0.8;">Transaction #${txId}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 12px 12px;">
        <p><strong>Route:</strong> ${state.route ? ROUTE_LABELS[state.route] : ""}</p>
        ${state.room ? `<p><strong>Room:</strong> ${roomName} (${state.room})</p>` : ""}
        ${state.roomReason ? `<p><strong>Reason:</strong> ${state.roomReason}</p>` : ""}
        <p><strong>Date:</strong> ${state.bookingDate ? format(state.bookingDate, "PPPP") : ""}</p>
        <p><strong>Time:</strong> ${state.startTime} – ${state.endTime}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Status:</strong> <span style="background:#fcd802;padding:2px 8px;border-radius:4px;font-size:13px;">${DB.statuses.dueForApproval}</span></p>
        ${
          state.cart.length > 0
            ? `<h3 style="margin-top:16px;">Items</h3>
               <table style="width:100%;border-collapse:collapse;">
                 <thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #094c25;">Item</th><th style="text-align:left;padding:8px;border-bottom:2px solid #094c25;">Qty</th></tr></thead>
                 <tbody>${itemsHtml}</tbody>
               </table>`
            : ""
        }
      </div>
    </div>
  `;
}
