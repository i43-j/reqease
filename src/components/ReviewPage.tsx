import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Inbox } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <Inbox className="h-12 w-12 opacity-40" />
      <p>{message}</p>
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
    <div className="rounded-xl overflow-hidden border border-border shadow-sm">
      <div className="bg-primary text-primary-foreground px-5 py-4">
        <h3 className="font-bold text-lg">{APP_NAME} Booking Receipt</h3>
        <p className="text-sm opacity-80">Transaction #{txId}</p>
      </div>

      <div className="bg-card px-5 py-4 space-y-3 text-sm">
        {tx.lab && (
          <div>
            <span className="text-muted-foreground">Room:</span>{" "}
            <span className="font-medium">{roomName ?? tx.lab}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Date:</span>{" "}
          <span className="font-medium">
            {tx.booking_date ? format(new Date(tx.booking_date), "PPPP") : "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Time:</span>{" "}
          <span className="font-medium">
            {tx.start_time} – {tx.end_time}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Email:</span>{" "}
          <span className="font-medium">{tx.user_email}</span>
        </div>

        {tx.reason && (
          <div>
            <span className="text-muted-foreground">Reason:</span>{" "}
            <span className="font-medium">{tx.reason}</span>
          </div>
        )}

        <div>
          <span className="text-muted-foreground">Submitted:</span>{" "}
          <span className="font-medium">
            {format(new Date(tx.timestamp), "PPp")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <Select
            value={tx.status}
            onValueChange={(val) => onStatusChange(txId, val)}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs">
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
              <p className="font-medium mb-2">Items ({tx.items.length})</p>
              <div className="space-y-1.5">
                {tx.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>{item.stock_description}</span>
                    <Badge variant="secondary">
                      {item.qty} {item.uom}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ReviewPage() {
  const [transactions, setTransactions] = useState<TxWithItems[]>([]);
  const [loading, setLoading] = useState(true);

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

  const updateStatus = async (txId: number, newStatus: string) => {
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

    // Send webhook when approved
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
    <div className="container max-w-3xl py-8 space-y-6">
      <h2 className="text-2xl font-bold">Review Requests</h2>
      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">Due for Approval</TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1">Approved / Rejected</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
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
                  onStatusChange={updateStatus}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
