import { createClient } from '@supabase/supabase-js';

// 1. Read env variables
// Exporting them so authService can create a Ghost Client
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Validate
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in .env file');
}

// 3. Export global instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);