import { useState } from "react";
import { useBooking } from "@/hooks/useBooking";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { N8N_WEBHOOK_URL, ROUTE_LABELS, ROOMS, DB, APP_NAME } from "@/config/constants";
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

  const roomName = ROOMS.find(r => r.code === state.room)?.name;

  const getPrevStep = () => {
    if (state.route === "A") return 2;
    if (state.route === "B") return 2;
    return 3; // Route C
  };

  const getSuccessStep = () => {
    if (state.route === "A") return 4;
    if (state.route === "B") return 4;
    return 5; // Route C
  };

  const buildReceiptHTML = (txId: number) => {
    const itemsHtml = state.cart
      .map(
        c =>
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
          <p><strong>Email:</strong> ${user?.email}</p>
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
  };

  const handleSubmit = async () => {
    const email = user?.email ?? "guest@shap.edu.ph";
    setSubmitting(true);

    try {
      // 1. Insert transaction_log
      const { data: txData, error: txError } = await supabase
        .from(DB.tables.transactionLog)
        .insert({
          [DB.txCols.lab]: state.room ?? null,
          [DB.txCols.userEmail]: email,
          [DB.txCols.status]: DB.statuses.dueForApproval,
          [DB.txCols.bookingDate]: state.bookingDate ? format(state.bookingDate, "yyyy-MM-dd") : null,
          [DB.txCols.startTime]: state.startTime,
          [DB.txCols.endTime]: state.endTime,
        })
        .select(DB.txCols.id)
        .single();

      if (txError) throw txError;
      const txId = txData[DB.txCols.id];

      // 2. Insert transaction_items_log
      if (state.cart.length > 0) {
        const itemRows = state.cart.map(c => ({
          [DB.txItemsCols.transactionId]: txId,
          [DB.txItemsCols.itemId]: c.item.id,
          [DB.txItemsCols.qty]: c.quantity,
        }));
        const { error: itemsError } = await supabase
          .from(DB.tables.transactionItems)
          .insert(itemRows);
        if (itemsError) throw itemsError;
      }

      // 3. Build receipt
      const receiptHTML = buildReceiptHTML(txId);

      // 4. Fire n8n webhook
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.email,
            subject: `${APP_NAME} Booking Receipt — Transaction #${txId}`,
            html: receiptHTML,
            transaction_id: txId,
          }),
        });
      } catch {
        // Webhook failure is non-blocking
        console.warn("n8n webhook failed, but booking was saved.");
      }

      toast.success("Booking submitted successfully!");
      setStep(getSuccessStep());
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep(getPrevStep())} disabled={submitting}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
          <p className="text-muted-foreground">Review the details below before submitting</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Summary</CardTitle>
        </CardHeader>
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
              <p className="font-medium">
                {state.bookingDate ? format(state.bookingDate, "PPPP") : "—"}
              </p>
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
                  {state.cart.map(c => {
                    const isToggleItem = c.item.category === DB.chemicalCategory || c.item.category === DB.consumableCategory;
                    return (
                      <div key={c.item.id} className="flex items-center justify-between text-sm">
                        <span>{c.item.stock_description}</span>
                        {!isToggleItem && (
                          <Badge variant="secondary">
                            {c.quantity} {c.item.uom}
                          </Badge>
                        )}
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
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
