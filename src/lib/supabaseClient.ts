import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn(
		'Supabase env vars missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Running in offline mode.'
	);
}

export const supabase = supabaseUrl && supabaseAnonKey
	? createClient(supabaseUrl, supabaseAnonKey)
	: null;

/** Check if Supabase is configured and available */
export function isSupabaseConfigured(): boolean {
	return supabase !== null;
}
