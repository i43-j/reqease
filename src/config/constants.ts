/**
 * Central configuration file. All Supabase URLs, DB schema names, room definitions,
 * booking routes, and time constraints are defined here for easy modification.
 */

// ========== SUPABASE ==========
export const SUPABASE_URL = "https://hvwhlouzjyswylfqjwhl.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2d2hsb3V6anlzd3lsZnFqd2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzQ0NjMsImV4cCI6MjA4NTgxMDQ2M30.6Nh8p0XtyYeqB-vTsso3L26Ky7qUhsx1kH2g05T9l9o";

// ========== N8N WEBHOOK ==========
// Replace with your n8n webhook URL for sending receipt emails
export const N8N_WEBHOOK_URL = "https://i43-j.app.n8n.cloud/webhook-test/shap-reqease";

// ========== SUPABASE STORAGE ==========
export const STORAGE_BASE_URL = "https://hvwhlouzjyswylfqjwhl.supabase.co/storage/v1/object/public/images";

// ========== BRANDING ==========
export const APP_NAME = "SHAP REQEASE";

// ========== ROOMS ==========
export const ROOMS = [
  { code: "B_JHS", name: "Junior High School Biology Lab" },
  { code: "P_JHS", name: "Junior High School Physics Lab" },
  { code: "B_SHS", name: "Senior High School Biology Lab" },
  { code: "GSL", name: "Grade School Lab" },
  { code: "C_SHS", name: "Senior High School Chemistry Lab" },
  { code: "P_SHS", name: "Senior High School Physics Lab" },
] as const;

export type RoomCode = typeof ROOMS[number]["code"];

// ========== BOOKING ROUTES ==========
export type BookingRoute = "A" | "B" | "C";

export const ROUTE_LABELS: Record<BookingRoute, string> = {
  A: "Book Room",
  B: "Borrow Equipment",
  C: "Book Room & Borrow Equipment",
};

// ========== TIME CONSTRAINTS ==========
export const EARLIEST_HOUR = 7;
export const LATEST_HOUR = 16; // 4 PM

// ========== DATABASE TABLE & COLUMN NAMES ==========
// Edit these if your Supabase table/column names differ

export const DB = {
  // --- Items table (inventory) ---
  tables: {
    items: "items",
    transactionLog: "transaction_log",
    transactionItems: "transaction_items_log",
  },

  // --- Items table columns ---
  itemsCols: {
    id: "id",
    lab: "lab",
    category: "category",
    stockDescription: "stock_description",
    qty: "qty",
    uom: "uom",
    imageKey: "image_key",
    notes: "notes",
  },

  // --- Category filter values ---
  // Items with these categories go to "Chemicals" / "Materials" tabs;
  // everything else goes to "Equipment" tab
  chemicalCategory: "CHEMICALS",
  consumableCategory: "CONSUMABLE",

  // --- Transaction log columns ---
  txCols: {
    id: "transaction_log",        // primary key / auto-increment column
    timestamp: "timestamp",
    lab: "lab",
    userEmail: "user_email",
    status: "status",
    bookingDate: "booking_date",
    startTime: "start_time",
    endTime: "end_time",
    reason: "reason",
  },

  // --- Transaction items log columns ---
  txItemsCols: {
    transactionId: "transaction_id",
    itemId: "item_id",
    itemName: "item_name",
    qty: "qty",
  },

  // --- Status values ---
  statuses: {
    dueForApproval: "DUE FOR APPROVAL",
    approved: "APPROVED",
    rejected: "REJECTED",
    completed: "COMPLETED",
  },

  // --- Image path pattern ---
  // Final URL = STORAGE_BASE_URL + "/" + imageKey + imageExtension
  imageExtension: ".png",
} as const;
