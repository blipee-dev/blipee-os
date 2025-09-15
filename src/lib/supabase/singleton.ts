// Re-export the global instance to ensure true singleton
export { getGlobalSupabaseClient as getSupabase, getGlobalSupabaseClient as supabase } from './global-instance';