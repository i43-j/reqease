

## Problem

`@supabase/supabase-js` is **not listed in `package.json` dependencies**. The code in `src/lib/supabase.ts` imports it, and `EquipmentPicker.tsx` uses it to query the `items` table, but the package was never installed. This means the Supabase client silently fails or throws an import error, so no network request to the database ever fires.

## Fix

1. **Add `@supabase/supabase-js`** to `package.json` dependencies (latest v2).

That single change should make the existing query in `EquipmentPicker.tsx` work. If RLS on the `items` table blocks anonymous reads, we'd also need to verify that a `SELECT` policy exists for the `anon` role — but the first step is getting the package installed.

### Optional: Add error handling

Currently `fetchItems` silently swallows errors (`if (!error && data)`). We could add a toast or console error on failure to make debugging easier in the future.

