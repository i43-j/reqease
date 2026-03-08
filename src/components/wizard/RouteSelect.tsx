import { useBooking } from "@/hooks/useBooking";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTE_LABELS, type BookingRoute } from "@/config/constants";
import { DoorOpen, Package, Layers } from "lucide-react";
import { motion } from "framer-motion";

const icons: Record<BookingRoute, React.ReactNode> = {
  A: <DoorOpen className="h-10 w-10" />,
  B: <Package className="h-10 w-10" />,
  C: <Layers className="h-10 w-10" />,
};

const descriptions: Record<BookingRoute, string> = {
  A: "Reserve a science lab room for your class or activity.",
  B: "Borrow equipment, chemicals, or materials from the inventory.",
  C: "Reserve a room and borrow items from that room's inventory.",
};

export function RouteSelect() {
  const { setRoute, setStep } = useBooking();

  const handleSelect = (route: BookingRoute) => {
    setRoute(route);
    setStep(1);
  };

  return (
    <div className="space-y-10 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">What would you like to do?</h2>
        <p className="text-lg text-muted-foreground">Select a request type to get started</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        {(["A", "B", "C"] as BookingRoute[]).map((route, i) => (
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
              onClick={() => handleSelect(route)}
            >
              <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {icons[route]}
                </div>
                <h3 className="font-semibold text-xl">{ROUTE_LABELS[route]}</h3>
                <p className="text-sm text-muted-foreground">{descriptions[route]}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
