/**
 * Confirmation — Final step before submitting a booking.
 * Shows a summary and handles DB insert + n8n webhook.
 */
import { useState } from "react";
import { useBooking } from "@/hooks/useBooking";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { N8N_WEBHOOK_URL, ROUTE_LABELS, ROOMS, DB, APP_NAME } from "@/config/constants";
import { buildReceiptHTML } from "@/lib/receipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function Confirmation() {
  const { state, setStep } = useBooking();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const roomName = ROOMS.find((r) => r.code === state.room)?.name;
  const prevStep = state.route === "C" ? 3 : 2;
  const successStep = state.route === "C" ? 5 : 4;

  const handleSubmit = async () => {
    const email = user?.email ?? "";
    setSubmitting(true);

    try {
      // 1. Insert transaction
      const { data: txData, error: txError } = await supabase
        .from(DB.tables.transactionLog)
        .insert({
          [DB.txCols.timestamp]: new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
          [DB.txCols.lab]: state.room ?? null,
          [DB.txCols.userEmail]: email,
          [DB.txCols.status]: DB.statuses.dueForApproval,
          [DB.txCols.bookingDate]: state.bookingDate ? format(state.bookingDate, "yyyy-MM-dd") : null,
          [DB.txCols.startTime]: state.startTime,
          [DB.txCols.endTime]: state.endTime,
          [DB.txCols.reason]: state.roomReason || null,
        })
        .select(DB.txCols.id)
        .single();

      if (txError) throw txError;
      const txId = txData[DB.txCols.id];

      // 2. Insert items
      if (state.cart.length > 0) {
        const rows = state.cart.map((c) => ({
          [DB.txItemsCols.transactionId]: txId,
          [DB.txItemsCols.itemId]: c.item.id,
          [DB.txItemsCols.qty]: c.quantity,
        }));
        const { error: itemsError } = await supabase.from(DB.tables.transactionItems).insert(rows);
        if (itemsError) throw itemsError;
      }

      // 3. Fire webhook with receipt
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: `${APP_NAME} Booking Receipt — Transaction #${txId}`,
            html: buildReceiptHTML(state, email, txId),
            transaction_id: txId,
          }),
        });
      } catch { console.warn("n8n webhook failed, booking was saved."); }

      toast.success("Booking submitted successfully!");
      setStep(successStep);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep(prevStep)} disabled={submitting}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
          <p className="text-muted-foreground">Review the details below before submitting</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Booking Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Booking Type</p>
              <p className="font-medium">{state.route ? ROUTE_LABELS[state.route] : ""}</p>
            </div>
            {state.room && (
              <div>
                <p className="text-muted-foreground">Room</p>
                <p className="font-medium">{roomName}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{state.bookingDate ? format(state.bookingDate, "PPPP") : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-medium">{state.startTime} – {state.endTime}</p>
            </div>
          </div>

          {state.roomReason && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{state.roomReason}</p>
              </div>
            </>
          )}

          {state.cart.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Items ({state.cart.length})</p>
                <div className="space-y-2">
                  {state.cart.map((c) => {
                    const isToggle = c.item.category === DB.chemicalCategory || c.item.category === DB.consumableCategory;
                    return (
                      <div key={c.item.id} className="flex items-center justify-between text-sm">
                        <span>{c.item.stock_description}</span>
                        {!isToggle && <Badge variant="secondary">{c.quantity} {c.item.uom}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gap-2">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : <><Send className="h-4 w-4" />Submit Request</>}
        </Button>
      </div>
    </div>
  );
}
