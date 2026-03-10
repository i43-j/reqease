import type { BookingRoute, RoomCode } from "@/config/constants";

export interface InventoryItem {
  id: string;
  lab: string;
  category: string;
  stock_description: string;
  qty: number;
  uom: string;
  image_key: string;
  notes: string | null;
}

export interface CartItem {
  item: InventoryItem;
  quantity: number;
}

export interface TransactionLog {
  transaction_log: number;
  timestamp: string;
  lab: string | null;
  user_email: string;
  status: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export interface TransactionItemLog {
  transaction_id: number;
  created_at: string;
  item_id: string;
  item_name?: string;
  qty: number;
}

export interface BookingState {
  route: BookingRoute | null;
  room: RoomCode | null;
  roomReason: string;
  cart: CartItem[];
  bookingDate: Date | null;
  startTime: string;
  endTime: string;
}
