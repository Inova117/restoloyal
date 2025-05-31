// Global type declarations for Deno Edge Functions

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
  }
  
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: ServeOptions
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
  }

  export interface SupabaseClient {
    auth: {
      getUser(): Promise<{ data: { user: any }, error: any }>;
      getSession(): Promise<{ data: { session: any }, error: any }>;
    };
    from(table: string): any;
  }

  export function createClient(
    url: string, 
    key: string, 
    options?: SupabaseClientOptions
  ): SupabaseClient;
}

// Deno global namespace
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

export {}; 