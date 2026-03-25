import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info.tsx";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  publicAnonKey;

const supabaseFunctionName =
  import.meta.env.VITE_SUPABASE_FUNCTION_NAME ?? "hyper-responder";
const supabaseApiPrefix =
  import.meta.env.VITE_SUPABASE_API_PREFIX ?? "make-server-34100c2d";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseFunctionsBaseUrl = `${supabaseUrl}/functions/v1/${supabaseFunctionName}`;
export const supabaseAdminApiBaseUrl = `${supabaseFunctionsBaseUrl}/${supabaseApiPrefix}`;
export const supabaseAdminApiBaseUrls = [
  supabaseAdminApiBaseUrl,
  supabaseFunctionsBaseUrl,
].filter((url, index, arr) => arr.indexOf(url) === index);
