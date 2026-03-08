import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Inbox, CalendarDays, Clock, Mail, MapPin, FileText, Hash } from "lucide-react";
import { format } from "date-fns";
import { ROOMS, DB, APP_NAME, N8N_WEBHOOK_URL } from "@/config/constants";
import type { TransactionLog, TransactionItemLog, InventoryItem } from "@/types/booking";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  DB.statuses.dueForApproval,
  DB.statuses.approved,
  DB.statuses.rejected,
  DB.statuses.completed,
];

const STATUS_GROUPS: Record<string, string[]> = {
  all: STATUS_OPTIONS,
  pending: [DB.statuses.dueForApproval],
  resolved: [DB.statuses.approved, DB.statuses.rejected],
  completed: [DB.statuses.completed],
};

const STATUS_COLORS: Record<string, string> = {
  [DB.statuses.dueForApproval]: "bg-warning text-warning-foreground",
  [DB.statuses.approved]: "bg-success text-success-foreground",
  [DB.statuses.rejected]: "bg-destructive text-destructive-foreground",
  [DB.statuses.completed]: "bg-primary text-primary-foreground",
};

interface TxWithItems extends TransactionLog {
  items: { stock_description: string; qty: number; uom: string }[];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
      <div className="rounded-full bg-muted p-4">
        <Inbox className="h-10 w-10 opacity-40" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
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

function ReviewCard({
  tx,
  onStatusChange,
}: {
  tx: TxWithItems;
  onStatusChange: (txId: number, status: string) => void;
}) {
  const roomName = ROOMS.find((r) => r.code === tx.lab)?.name;
  const txId = tx[DB.txCols.id as keyof TransactionLog] as number;

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-primary text-primary-foreground px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
        <div>
          <p className="text-xs opacity-70 uppercase tracking-wider">Transaction</p>
          <p className="font-bold text-lg">#{txId}</p>
        </div>
        <Badge className={`${STATUS_COLORS[tx.status] ?? "bg-muted"} text-xs px-2.5 py-1`}>
          {tx.status}
        </Badge>
      </div>

      <div className="bg-card px-4 sm:px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tx.lab && (
            <InfoRow icon={MapPin} label="Room">
              {roomName ?? tx.lab}
            </InfoRow>
          )}
          <InfoRow icon={CalendarDays} label="Date">
            {tx.booking_date ? format(new Date(tx.booking_date), "PPP") : "—"}
          </InfoRow>
          <InfoRow icon={Clock} label="Time">
            {tx.start_time} – {tx.end_time}
          </InfoRow>
          <InfoRow icon={Mail} label="Email">
            {tx.user_email}
          </InfoRow>
        </div>

        {tx.reason && (
          <InfoRow icon={FileText} label="Reason">
            {tx.reason}
          </InfoRow>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Update status:</span>
          <Select
            value={tx.status}
            onValueChange={(val) => onStatusChange(txId, val)}
          >
            <SelectTrigger className="w-[190px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  <Badge className={`${STATUS_COLORS[s] ?? "bg-muted"} text-xs`}>
                    {s}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                    <Badge variant="secondary" className="text-xs">
                      {item.qty} {item.uom}
                    </Badge>
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

export function ReviewPage() {
  const [transactions, setTransactions] = useState<TxWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChange, setPendingChange] = useState<{ txId: number; newStatus: string } | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);

    const { data: txData, error: txError } = await supabase
      .from(DB.tables.transactionLog)
      .select("*")
      .order(DB.txCols.id, { ascending: false });

    if (txError || !txData) {
      setLoading(false);
      return;
    }

    const txList = txData as TransactionLog[];
    const txIds = txList.map((t) => t.transaction_log);

    let txItemsMap: Record<number, { item_id: string; qty: number }[]> = {};
    if (txIds.length > 0) {
      const { data: itemsData } = await supabase
        .from(DB.tables.transactionItems)
        .select("*")
        .in(DB.txItemsCols.transactionId, txIds);

      if (itemsData) {
        for (const row of itemsData as TransactionItemLog[]) {
          if (!txItemsMap[row.transaction_id]) txItemsMap[row.transaction_id] = [];
          txItemsMap[row.transaction_id].push({ item_id: row.item_id, qty: row.qty });
        }
      }
    }

    const allItemIds = [
      ...new Set(Object.values(txItemsMap).flat().map((i) => i.item_id)),
    ];
    let itemDetailsMap: Record<string, InventoryItem> = {};
    if (allItemIds.length > 0) {
      const { data: itemDetails } = await supabase
        .from(DB.tables.items)
        .select("*")
        .in(DB.itemsCols.id, allItemIds);

      if (itemDetails) {
        for (const item of itemDetails as InventoryItem[]) {
          itemDetailsMap[item.id] = item;
        }
      }
    }

    const merged: TxWithItems[] = txList.map((tx) => ({
      ...tx,
      items: (txItemsMap[tx.transaction_log] ?? []).map((ti) => {
        const detail = itemDetailsMap[ti.item_id];
        return {
          stock_description: detail?.stock_description ?? ti.item_id,
          qty: ti.qty,
          uom: detail?.uom ?? "",
        };
      }),
    }));

    setTransactions(merged);
    setLoading(false);
  };

  const handleStatusChange = (txId: number, newStatus: string) => {
    setPendingChange({ txId, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!pendingChange) return;
    const { txId, newStatus } = pendingChange;
    setPendingChange(null);

    const { error } = await supabase
      .from(DB.tables.transactionLog)
      .update({ [DB.txCols.status]: newStatus })
      .eq(DB.txCols.id, txId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`Status updated to ${newStatus}`);
    setTransactions((prev) =>
      prev.map((tx) =>
        (tx[DB.txCols.id as keyof TransactionLog] as number) === txId
          ? { ...tx, status: newStatus }
          : tx
      )
    );

    if (newStatus === DB.statuses.approved) {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: txId }),
        });
      } catch (e) {
        console.error("Webhook failed:", e);
      }
    }
  };

  const filter = (statuses: string[]) =>
    transactions.filter((t) => statuses.includes(t.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-3xl py-6 sm:py-8 px-4 space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Review Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and update booking statuses</p>
        </div>
        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 text-xs sm:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="resolved" className="flex-1 text-xs sm:text-sm">Resolved</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-xs sm:text-sm">Completed</TabsTrigger>
          </TabsList>
          {(["all", "pending", "resolved", "completed"] as const).map((key) => (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              {filter(STATUS_GROUPS[key]).length === 0 ? (
                <EmptyState message="No requests in this category." />
              ) : (
                filter(STATUS_GROUPS[key]).map((tx) => (
                  <ReviewCard
                    key={tx.transaction_log}
                    tx={tx}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <AlertDialog open={!!pendingChange} onOpenChange={() => setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change Transaction #{pendingChange?.txId} to{" "}
              <span className="font-semibold">{pendingChange?.newStatus}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
