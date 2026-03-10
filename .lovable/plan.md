

## Adding `item_name` to `transaction_items_log`

### What needs to change

You need to add a new column `item_name` (text) to the `transaction_items_log` table in Supabase, then update the insert logic to include it.

### Steps

**1. Add column via Supabase Dashboard (or migration)**
- Go to your Supabase dashboard → Table Editor → `transaction_items_log`
- Add a new column: `item_name` of type `text`, nullable

**2. Update `src/config/constants.ts`**
- Add `itemName: "item_name"` to `DB.txItemsCols`

**3. Update `src/components/wizard/Confirmation.tsx`**
- In the cart insert logic (~line 52), add the item name to each row:
```ts
const rows = state.cart.map((c) => ({
  [DB.txItemsCols.transactionId]: txId,
  [DB.txItemsCols.itemId]: c.item.id,
  [DB.txItemsCols.itemName]: c.item.stock_description,
  [DB.txItemsCols.qty]: c.quantity,
}));
```

**4. Update `src/types/booking.ts`**
- Add `item_name?: string` to `TransactionItemLog`

These are the only files that insert into `transaction_items_log`. The read side (`src/lib/transactions.ts`) already resolves item names from the `items` table, so no changes needed there — but having `item_name` denormalized in the log provides a snapshot of the name at booking time.

