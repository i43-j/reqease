import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/constants";

/** Shared Supabase client instance used across the app. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
