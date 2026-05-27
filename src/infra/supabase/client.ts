import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseEnvErrorMessage =
  'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'

let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!hasSupabaseEnv) {
    console.error('[supabase] configuration error', {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    })
    throw new Error(supabaseEnvErrorMessage)
  }

  if (!supabaseClient) {
    console.info('[supabase] initializing client', {
      hasSupabaseUrl: true,
      hasSupabaseAnonKey: true,
    })
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}
