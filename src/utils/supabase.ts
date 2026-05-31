import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // método de leitura do cookie
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // método de escrita do cookie (Login/Server Actions)
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // evita erros em Server Components de leitura estática
          }
        },
        // método de remoção do cookie (Logout)
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // evita erros em Server Components de leitura estática
          }
        },
      },
    }
  )
}