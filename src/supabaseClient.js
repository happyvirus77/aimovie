import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingEnvVars = [
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean);

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isReady: missingEnvVars.length === 0,
  missingEnvVars,
};

export const supabaseSetupMessage =
  missingEnvVars.length > 0
    ? `Supabase environment variables are missing: ${missingEnvVars.join(
        ', ',
      )}. Add them to .env to connect the video_prompts table.`
    : '';

export const supabase = supabaseConfig.isReady
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
