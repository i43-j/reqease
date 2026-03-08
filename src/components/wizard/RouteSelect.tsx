import React from "react";
import { useBooking } from "@/hooks/useBooking";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTE_LABELS, type BookingRoute } from "@/config/constants";
import { DoorOpen, Package, Layers } from "lucide-react";
import { motion } from "framer-motion";

const icons: Record<BookingRoute, React.ReactNode> = {
  A: <DoorOpen className="h-14 w-14" />,
  B: <Package className="h-14 w-14" />,
  C: <Layers className="h-14 w-14" />,
};

const descriptions: Record<BookingRoute, string> = {
  A: "Reserve a science lab room for your class or activity.",
  B: "Borrow equipment, chemicals, or materials from the inventory.",
  C: "Reserve a room and borrow items from that room's inventory.",
};

/** Step 0: Route selection screen. User picks between Room (A), Equipment (B), or Both (C). Resets wizard state on selection. */
export function RouteSelect() {
  const { setRoute, setStep, reset } = useBooking();

  const handleSelect = (route: BookingRoute) => {
    reset();
    setRoute(route);
    setStep(1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] py-6 space-y-6 sm:space-y-8">
      <div className="text-center space-y-2 px-4">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">What would you like to do?</h2>
        <p className="text-sm sm:text-lg text-muted-foreground">Select a request type to get started</p>
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3 w-full max-w-5xl mx-auto px-4 items-stretch">
        {(["A", "B", "C"] as BookingRoute[]).map((route, i) => (
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex"
          >
            <Card
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group w-full flex"
              onClick={() => handleSelect(route)}
            >
              <CardContent className="flex flex-col items-center gap-3 sm:gap-4 p-5 sm:p-8 text-center w-full h-full">
                <div className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {React.cloneElement(icons[route] as React.ReactElement, { className: "h-8 w-8 sm:h-14 sm:w-14" })}
                </div>
                <h3 className="font-bold text-lg sm:text-2xl">{ROUTE_LABELS[route]}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{descriptions[route]}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
