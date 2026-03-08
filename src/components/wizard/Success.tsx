import { useBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

/** Final wizard step showing a success message with a "Book Another" button that resets the wizard. */
export function Success() {
  const { reset } = useBooking();

  return (
    <div className="flex items-center justify-center py-16">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <Card className="max-w-md text-center">
          <CardContent className="p-10 space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Booking Submitted!</h2>
              <p className="text-muted-foreground">
                Your request has been sent for approval. You'll receive an email
                confirmation shortly. You can track the status in the Requests tab.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={reset} size="lg">
                Book Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
