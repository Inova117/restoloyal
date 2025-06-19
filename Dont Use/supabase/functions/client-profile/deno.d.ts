/// <reference types="https://deno.land/x/supabase_functions@v0.10.0/types.d.ts" />

declare global {
  interface Window {
    Deno: typeof Deno;
  }
}

export {}; 