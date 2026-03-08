import { createContext, useContext, useState, type ReactNode } from "react";
import type { BookingState, CartItem } from "@/types/booking";
import type { BookingRoute, RoomCode } from "@/config/constants";

interface BookingContextType {
  state: BookingState;
  step: number;
  setStep: (s: number) => void;
  setRoute: (r: BookingRoute) => void;
  setRoom: (r: RoomCode) => void;
  setRoomReason: (s: string) => void;
  setCart: (c: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  setBookingDate: (d: Date | null) => void;
  setStartTime: (t: string) => void;
  setEndTime: (t: string) => void;
  reset: () => void;
  maxStep: number;
}

const initial: BookingState = {
  route: null,
  room: null,
  roomReason: "",
  cart: [],
  bookingDate: null,
  startTime: "",
  endTime: "",
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initial);
  const [step, setStep] = useState(0);

  const maxStep = state.route === "A" ? 5 : state.route === "B" ? 5 : 6;

  const setRoute = (r: BookingRoute) => setState(s => ({ ...s, route: r }));
  const setRoom = (r: RoomCode) => setState(s => ({ ...s, room: r }));
  const setRoomReason = (v: string) => setState(s => ({ ...s, roomReason: v }));
  const setCart = (c: CartItem[]) => setState(s => ({ ...s, cart: c }));
  const setBookingDate = (d: Date | null) => setState(s => ({ ...s, bookingDate: d }));
  const setStartTime = (t: string) => setState(s => ({ ...s, startTime: t }));
  const setEndTime = (t: string) => setState(s => ({ ...s, endTime: t }));

  const addToCart = (item: CartItem) => {
    setState(s => {
      const existing = s.cart.find(c => c.item.id === item.item.id);
      if (existing) {
        return {
          ...s,
          cart: s.cart.map(c =>
            c.item.id === item.item.id
              ? { ...c, quantity: c.quantity + item.quantity }
              : c
          ),
        };
      }
      return { ...s, cart: [...s.cart, item] };
    });
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    setState(s => ({
      ...s,
      cart: qty <= 0
        ? s.cart.filter(c => c.item.id !== itemId)
        : s.cart.map(c => c.item.id === itemId ? { ...c, quantity: qty } : c),
    }));
  };

  const removeFromCart = (itemId: string) => {
    setState(s => ({ ...s, cart: s.cart.filter(c => c.item.id !== itemId) }));
  };

  const reset = () => {
    setState(initial);
    setStep(0);
  };

  return (
    <BookingContext.Provider
      value={{
        state, step, setStep, setRoute, setRoom, setRoomReason,
        setCart, addToCart, updateCartQuantity, removeFromCart,
        setBookingDate, setStartTime, setEndTime, reset, maxStep,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
