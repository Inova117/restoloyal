// Type declarations for Deno modules used in Supabase Edge Functions

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}

// Deno global namespace
declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
} 