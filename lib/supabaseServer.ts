import { createServerClient as ssrCreateServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const getSupabaseCredentials = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return { url, key };
};

// Server Client (used in Route Handlers and Server Actions)
export async function createServerClient() {
  const { url, key } = getSupabaseCredentials();
  const cookieStore = await cookies();

  return ssrCreateServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if handled by middleware
          }
        },
      },
    }
  );
}

// Middleware Client (used to refresh session cookies in nextjs middleware)
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  let res = response;
  const { url, key } = getSupabaseCredentials();
  
  const client = ssrCreateServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            res = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach((c) => res.cookies.set(c.name, c.value, c.options));
          });
        },
      },
    }
  );
  return { client, response: res };
}
