// ========== SUPABASE ==========
// Replace these with your actual Supabase project values
export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

// ========== N8N WEBHOOK ==========
// Replace with your n8n webhook URL for sending receipt emails
export const N8N_WEBHOOK_URL = "https://YOUR_N8N_INSTANCE.app.n8n.cloud/webhook/YOUR_WEBHOOK_ID";

// ========== SUPABASE STORAGE ==========
export const STORAGE_BASE_URL = "https://hvwhlouzjyswylfqjwhl.supabase.co/storage/v1/object/public/images";

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
