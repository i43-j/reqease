/**
 * RequestsPage — User's view of their own booking requests.
 * Displays transactions grouped by status tabs (Pending / Resolved / Completed).
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { fetchTransactionsWithItems, STATUS_GROUPS, type TxWithItems } from "@/lib/transactions";
import { EmptyState, TransactionCard } from "@/components/shared/TransactionCard";

const TAB_EMPTY: Record<string, string> = {
  pending: "No pending requests. Start by booking a room or equipment!",
  resolved: "No approved or rejected requests yet.",
  completed: "No completed bookings yet.",
};

export function RequestsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TxWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTransactionsWithItems(user?.email).then((data) => {
      setTransactions(data);
      setLoading(false);
    });
  }, [user]);

  const filter = (statuses: string[]) => transactions.filter((t) => statuses.includes(t.status));

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
          {(["pending", "resolved", "completed"] as const).map((key) => (
            <TabsTrigger key={key} value={key} className="flex-1 text-xs sm:text-sm capitalize">
              {key}
            </TabsTrigger>
          ))}
        </TabsList>
        {(["pending", "resolved", "completed"] as const).map((key) => (
          <TabsContent key={key} value={key} className="space-y-4 mt-4">
            {filter(STATUS_GROUPS[key]).length === 0 ? (
              <EmptyState message={TAB_EMPTY[key]} />
            ) : (
              filter(STATUS_GROUPS[key]).map((tx) => (
                <TransactionCard key={tx.transaction_log} tx={tx} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
