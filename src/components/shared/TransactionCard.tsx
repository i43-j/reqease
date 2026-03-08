/**
 * Shared UI components for transaction display.
 * Used by RequestsPage and ReviewPage.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Inbox, CalendarDays, Clock, Mail, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";
import { ROOMS, DB } from "@/config/constants";
import { STATUS_COLORS, type TxWithItems } from "@/lib/transactions";
import type { TransactionLog } from "@/types/booking";

/** Empty state placeholder with icon and message. */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
      <div className="rounded-full bg-muted p-4">
        <Inbox className="h-10 w-10 opacity-40" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/** Labeled icon + value row for transaction details. */
export function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-muted-foreground text-xs">{label}</span>
        <div className="font-medium text-sm">{children}</div>
      </div>
    </div>
  );
}

interface TransactionCardProps {
  tx: TxWithItems;
  /** Optional extra content rendered between info rows and items (e.g. status dropdown). */
  actions?: React.ReactNode;
}

/** Receipt-style card displaying a single transaction. */
export function TransactionCard({ tx, actions }: TransactionCardProps) {
  const roomName = ROOMS.find((r) => r.code === tx.lab)?.name;
  const txId = tx[DB.txCols.id as keyof TransactionLog];

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
        <div>
          <p className="text-xs opacity-70 uppercase tracking-wider">Transaction</p>
          <p className="font-bold text-lg">#{txId}</p>
        </div>
        <Badge className={`${STATUS_COLORS[tx.status] ?? "bg-muted"} text-xs px-2.5 py-1`}>
          {tx.status}
        </Badge>
      </div>

      {/* Body */}
      <div className="bg-card px-4 sm:px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tx.lab && <InfoRow icon={MapPin} label="Room">{roomName ?? tx.lab}</InfoRow>}
          <InfoRow icon={CalendarDays} label="Date">
            {tx.booking_date ? format(new Date(tx.booking_date), "PPP") : "—"}
          </InfoRow>
          <InfoRow icon={Clock} label="Time">{tx.start_time} – {tx.end_time}</InfoRow>
          <InfoRow icon={Mail} label="Email">{tx.user_email}</InfoRow>
        </div>

        {tx.reason && <InfoRow icon={FileText} label="Reason">{tx.reason}</InfoRow>}

        {actions}

        {tx.items.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Items ({tx.items.length})
              </p>
              <div className="space-y-1.5">
                {tx.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/40">
                    <span className="text-sm">{item.stock_description}</span>
                    <Badge variant="secondary" className="text-xs">{item.qty} {item.uom}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="text-[11px] text-muted-foreground pt-1">
          Submitted {tx.timestamp ? format(new Date(tx.timestamp), "PPp") : "—"}
        </div>
      </div>
    </div>
  );
}
