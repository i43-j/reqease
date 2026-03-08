import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Inbox, CalendarDays, Clock, Mail, MapPin, FileText, Hash } from "lucide-react";
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

function ReceiptCard({ tx }: { tx: TxWithItems }) {
  const roomName = ROOMS.find(r => r.code === tx.lab)?.name;
  const txId = tx[DB.txCols.id as keyof TransactionLog];

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

    const { data: txData, error: txError } = await supabase
      .from(DB.tables.transactionLog)
      .select("*")
      .eq(DB.txCols.userEmail, email)
      .order(DB.txCols.id, { ascending: false });

    if (txError || !txData) {
      setLoading(false);
      return;
    }

    const txList = txData as TransactionLog[];
    const txIds = txList.map(t => t.transaction_log);

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
    <div className="container max-w-3xl py-6 sm:py-8 px-4 space-y-5">
      <div>
        <h2 className="text-2xl font-bold">My Requests</h2>
        <p className="text-sm text-muted-foreground mt-1">Track the status of your bookings</p>
      </div>
      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1 text-xs sm:text-sm">Pending</TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1 text-xs sm:text-sm">Resolved</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 text-xs sm:text-sm">Completed</TabsTrigger>
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
