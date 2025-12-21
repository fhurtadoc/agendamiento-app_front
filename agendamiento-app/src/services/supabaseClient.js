import { createClient } from '@supabase/supabase-js';

// 1. Leemos las variables de entorno (Vite usa import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Validamos que existan (para evitar errores silenciosos)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase en el archivo .env');
}

// 3. Exportamos la instancia única
export const supabase = createClient(supabaseUrl, supabaseAnonKey);