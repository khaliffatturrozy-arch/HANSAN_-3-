import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export interface AuthUser { id: string; email?: string; }

export async function getSupabaseUser(req: NextRequest): Promise<AuthUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email ?? undefined };
  } catch {
    return null;
  }
}
