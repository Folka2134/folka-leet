import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// Create a single supabase client for the browser
export const supabase = createClientComponentClient<Database>();
