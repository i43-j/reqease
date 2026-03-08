import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Inbox } from "lucide-react";
import { format } from "date-fns";
import { ROUTE_LABELS, ROOMS, DB } from "@/config/constants";
import type { TransactionLog } from "@/types/booking";

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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <Inbox className="h-12 w-12 opacity-40" />
      <p>{message}</p>
    </div>
  );
}

function RequestCard({ tx }: { tx: TransactionLog }) {
  const roomName = ROOMS.find(r => r.code === tx.lab)?.name;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">#{tx.transaction_log}</span>
              <Badge className={STATUS_COLORS[tx.status] ?? "bg-muted"}>
                {tx.status}
              </Badge>
            </div>
            {tx.lab && (
              <p className="text-sm text-muted-foreground">{roomName ?? tx.lab}</p>
            )}
            <p className="text-sm">
              {tx.booking_date ? format(new Date(tx.booking_date), "PPP") : "—"} · {tx.start_time} – {tx.end_time}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(tx.timestamp), "PPp")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transaction_log")
      .select("*")
      .eq("user_email", user!.email!)
      .order("timestamp", { ascending: false });
    if (!error && data) setTransactions(data as TransactionLog[]);
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
          <TabsContent key={key} value={key} className="space-y-3 mt-4">
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
              filter(STATUS_GROUPS[key]).map(tx => <RequestCard key={tx.transaction_log} tx={tx} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
