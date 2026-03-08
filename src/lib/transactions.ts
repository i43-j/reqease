/**
 * Shared transaction fetching logic, types, and status constants.
 * Used by both RequestsPage (user view) and ReviewPage (admin view).
 */
import { supabase } from "@/lib/supabase";
import { DB } from "@/config/constants";
import type { TransactionLog, TransactionItemLog, InventoryItem } from "@/types/booking";

/** A transaction with its resolved item details. */
export interface TxWithItems extends TransactionLog {
  items: { stock_description: string; qty: number; uom: string }[];
}

/** Tab-to-status mapping for filtering transactions. */
export const STATUS_GROUPS: Record<string, string[]> = {
  all: [DB.statuses.dueForApproval, DB.statuses.approved, DB.statuses.rejected, DB.statuses.completed],
  pending: [DB.statuses.dueForApproval],
  resolved: [DB.statuses.approved, DB.statuses.rejected],
  completed: [DB.statuses.completed],
};

/** Badge color classes keyed by status value. */
export const STATUS_COLORS: Record<string, string> = {
  [DB.statuses.dueForApproval]: "bg-warning text-warning-foreground",
  [DB.statuses.approved]: "bg-success text-success-foreground",
  [DB.statuses.rejected]: "bg-destructive text-destructive-foreground",
  [DB.statuses.completed]: "bg-primary text-primary-foreground",
};

/**
 * Fetch transactions with resolved item details.
 * @param email - If provided, filters by user email (user view). Omit for admin view (all).
 */
export async function fetchTransactionsWithItems(email?: string): Promise<TxWithItems[]> {
  let query = supabase
    .from(DB.tables.transactionLog)
    .select("*")
    .order(DB.txCols.id, { ascending: false });

  if (email) {
    query = query.eq(DB.txCols.userEmail, email);
  }

  const { data: txData, error } = await query;
  if (error || !txData) return [];

  const txList = txData as TransactionLog[];
  const txIds = txList.map((t) => t.transaction_log);

  // Fetch transaction items
  const txItemsMap: Record<number, { item_id: string; qty: number }[]> = {};
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

  // Fetch inventory details
  const allItemIds = [...new Set(Object.values(txItemsMap).flat().map((i) => i.item_id))];
  const itemDetailsMap: Record<string, InventoryItem> = {};
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

  // Merge
  return txList.map((tx) => ({
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
}
