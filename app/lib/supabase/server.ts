import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeader,
} from "@tanstack/react-start/server";
import { env } from "../env";
import type { Database } from "./database.types";

function parseCookieHeader(header: string) {
  return header.split(/;\s*/).flatMap((part) => {
    const eq = part.indexOf("=");
    if (eq === -1) return [];
    return {
      name: decodeURIComponent(part.slice(0, eq)),
      value: decodeURIComponent(part.slice(eq + 1)),
    };
  });
}

export function getSupabaseServerClient() {
  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(getRequestHeader("cookie") ?? "");
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, {
              ...options,
              sameSite: options?.sameSite ?? "lax",
            });
          }
        } catch {
          // ignore if called outside a response context
        }
      },
      get(name: string) {
        return getCookie(name) ?? undefined;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          setCookie(name, value, {
            ...options,
            sameSite: options.sameSite ?? "lax",
          });
        } catch {
          // ignore if called outside a response context
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          deleteCookie(name, {
            ...options,
            sameSite: options.sameSite ?? "lax",
          });
        } catch {
          // ignore if called outside a response context
        }
      },
    },
  });
}

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function getServiceSupabase() {
  if (!serviceClient) {
    serviceClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return serviceClient;
}
