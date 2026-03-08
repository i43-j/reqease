/**
 * ReviewPage — Admin view for managing all booking requests.
 * Adds a status-change dropdown to each transaction card.
 * Fires n8n webhook on approval.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { DB, N8N_WEBHOOK_URL } from "@/config/constants";
import { fetchTransactionsWithItems, STATUS_GROUPS, STATUS_COLORS, type TxWithItems } from "@/lib/transactions";
import { EmptyState, TransactionCard } from "@/components/shared/TransactionCard";
import { toast } from "sonner";
import type { TransactionLog } from "@/types/booking";

const STATUS_OPTIONS = [
  DB.statuses.dueForApproval,
  DB.statuses.approved,
  DB.statuses.rejected,
  DB.statuses.completed,
];

export function ReviewPage() {
  const [transactions, setTransactions] = useState<TxWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChange, setPendingChange] = useState<{ txId: number; newStatus: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchTransactionsWithItems().then((data) => {
      setTransactions(data);
      setLoading(false);
    });
  }, []);

  const confirmStatusChange = async () => {
    if (!pendingChange) return;
    const { txId, newStatus } = pendingChange;
    setPendingChange(null);

    const { error } = await supabase
      .from(DB.tables.transactionLog)
      .update({ [DB.txCols.status]: newStatus })
      .eq(DB.txCols.id, txId);

    if (error) { toast.error("Failed to update status"); return; }

    toast.success(`Status updated to ${newStatus}`);
    setTransactions((prev) =>
      prev.map((tx) =>
        (tx[DB.txCols.id as keyof TransactionLog] as number) === txId
          ? { ...tx, status: newStatus } : tx
      )
    );

    if (newStatus === DB.statuses.approved) {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: txId }),
        });
      } catch (e) { console.error("Webhook failed:", e); }
    }
  };

  const filter = (statuses: string[]) => transactions.filter((t) => statuses.includes(t.status));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
            {(["all", "pending", "resolved", "completed"] as const).map((key) => (
              <TabsTrigger key={key} value={key} className="flex-1 text-xs sm:text-sm capitalize">{key}</TabsTrigger>
            ))}
          </TabsList>
          {(["all", "pending", "resolved", "completed"] as const).map((key) => (
            <TabsContent key={key} value={key} className="space-y-4 mt-4">
              {filter(STATUS_GROUPS[key]).length === 0 ? (
                <EmptyState message="No requests in this category." />
              ) : (
                filter(STATUS_GROUPS[key]).map((tx) => (
                  <TransactionCard
                    key={tx.transaction_log}
                    tx={tx}
                    actions={
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">Update status:</span>
                        <Select value={tx.status} onValueChange={(val) => setPendingChange({ txId: tx[DB.txCols.id as keyof TransactionLog] as number, newStatus: val })}>
                          <SelectTrigger className="w-[190px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                <Badge className={`${STATUS_COLORS[s] ?? "bg-muted"} text-xs`}>{s}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    }
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
              Change Transaction #{pendingChange?.txId} to <span className="font-semibold">{pendingChange?.newStatus}</span>?
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
