import { createClient } from '@supabase/supabase-js'

// Only the public anon key is used here. Row Level Security protects all data.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key',
)
export const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
