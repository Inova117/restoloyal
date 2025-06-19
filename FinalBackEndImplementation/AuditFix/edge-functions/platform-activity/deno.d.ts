// Deno type definitions for Supabase Edge Functions
// This file provides type definitions for the Deno runtime environment

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

export {}; 