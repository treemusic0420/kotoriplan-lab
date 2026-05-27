import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseEnvErrorMessage =
  'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'

export const getSupabaseClient = () => {
  if (!hasSupabaseEnv) {
    throw new Error(supabaseEnvErrorMessage)
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
