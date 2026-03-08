import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Inbox } from "lucide-react";
import { format } from "date-fns";
import { ROOMS, DB, APP_NAME } from "@/config/constants";
import type { TransactionLog, TransactionItemLog, InventoryItem } from "@/types/booking";

const STATUS_GROUPS: Record<string, string[]> = {
  pending: [DB.statuses.dueForApproval],
  resolved: [DB.statuses.approved, DB.statuses.rejected],
  completed: [DB.statuses.completed],
};

const STATUS_COLORS: Record<string, string> = {
  [DB.statuses.dueForApproval]: "bg-warning text-warning-foreground",
  [DB.statuses.approved]: "bg-success text-success-foreground",
  [DB.statuses.rejected]: "bg-urgent text-urgent-foreground",
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

function ReceiptCard({ tx }: { tx: TxWithItems }) {
  const roomName = ROOMS.find(r => r.code === tx.lab)?.name;
  const txId = tx[DB.txCols.id as keyof TransactionLog];

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 py-4">
        <h3 className="font-bold text-lg">{APP_NAME} Booking Receipt</h3>
        <p className="text-sm opacity-80">Transaction #{txId}</p>
      </div>

      {/* Body */}
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
          <span className="font-medium">{tx.start_time} – {tx.end_time}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Email:</span>{" "}
          <span className="font-medium">{tx.user_email}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Status:</span>{" "}
          <Badge className={STATUS_COLORS[tx.status] ?? "bg-muted"}>{tx.status}</Badge>
        </div>
        <div>
          <span className="text-muted-foreground">Submitted:</span>{" "}
          <span className="font-medium">{format(new Date(tx.timestamp), "PPp")}</span>
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

export function RequestsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TxWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const email = user?.email ?? "guest@shap.edu.ph";

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);

    // 1. Fetch all transactions
    const { data: txData, error: txError } = await supabase
      .from(DB.tables.transactionLog)
      .select("*")
      .eq(DB.txCols.userEmail, email)
      .order(DB.txCols.timestamp, { ascending: false });

    if (txError || !txData) {
      setLoading(false);
      return;
    }

    const txList = txData as TransactionLog[];
    const txIds = txList.map(t => t.transaction_log);

    // 2. Fetch all transaction items for those IDs
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

    // 3. Fetch all unique item details
    const allItemIds = [...new Set(Object.values(txItemsMap).flat().map(i => i.item_id))];
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

    // 4. Merge
    const merged: TxWithItems[] = txList.map(tx => ({
      ...tx,
      items: (txItemsMap[tx.transaction_log] ?? []).map(ti => {
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

  const filter = (statuses: string[]) =>
    transactions.filter(t => statuses.includes(t.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <h2 className="text-2xl font-bold">My Requests</h2>
      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1">Approved / Rejected</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
        </TabsList>
        {(["pending", "resolved", "completed"] as const).map(key => (
          <TabsContent key={key} value={key} className="space-y-4 mt-4">
            {filter(STATUS_GROUPS[key]).length === 0 ? (
              <EmptyState
                message={
                  key === "pending"
                    ? "No pending requests. Start by booking a room or equipment!"
                    : key === "resolved"
                    ? "No approved or rejected requests yet."
                    : "No completed bookings yet."
                }
              />
            ) : (
              filter(STATUS_GROUPS[key]).map(tx => (
                <ReceiptCard key={tx.transaction_log} tx={tx} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
