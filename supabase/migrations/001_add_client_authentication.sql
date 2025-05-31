-- Migration: Add Client Authentication System
-- This migration adds support for client-side authentication and links loyalty programs to authenticated clients

-- Create a client_accounts table for client authentication
CREATE TABLE IF NOT EXISTS public.client_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on client_accounts
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for client_accounts (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own client account" ON public.client_accounts;
CREATE POLICY "Users can view their own client account" 
  ON public.client_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own client account" ON public.client_accounts;
CREATE POLICY "Users can create their own client account" 
  ON public.client_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own client account" ON public.client_accounts;
CREATE POLICY "Users can update their own client account" 
  ON public.client_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add a client_account_id to the clients table to link loyalty programs to authenticated clients
-- Check if column already exists before adding
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'client_account_id'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN client_account_id UUID REFERENCES public.client_accounts(id);
  END IF;
END $$;

-- Create index for better performance (drop if exists to avoid conflicts)
DROP INDEX IF EXISTS idx_clients_client_account_id;
CREATE INDEX idx_clients_client_account_id ON public.clients(client_account_id);

-- Update user_roles enum to include 'client' role (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'client' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'app_role'
    )
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'client';
  END IF;
END $$;

-- Create or replace trigger function to create client account on user signup
CREATE OR REPLACE FUNCTION public.handle_new_client_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check if this is a client signup (you can customize this logic)
  IF NEW.raw_user_meta_data ->> 'user_type' = 'client' THEN
    INSERT INTO public.client_accounts (user_id, name, email, phone)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data ->> 'phone'
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger for new client users
DROP TRIGGER IF EXISTS on_auth_client_user_created ON auth.users;
CREATE TRIGGER on_auth_client_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_client_user();

-- Create RLS policies for clients table to allow client account access
DROP POLICY IF EXISTS "Client accounts can view their own loyalty programs" ON public.clients;
CREATE POLICY "Client accounts can view their own loyalty programs" 
  ON public.clients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_accounts 
      WHERE client_accounts.id = clients.client_account_id 
      AND client_accounts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Client accounts can update their own loyalty programs" ON public.clients;
CREATE POLICY "Client accounts can update their own loyalty programs" 
  ON public.clients 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_accounts 
      WHERE client_accounts.id = clients.client_account_id 
      AND client_accounts.user_id = auth.uid()
    )
  );

-- Add helpful comments
COMMENT ON TABLE public.client_accounts IS 'Stores authenticated client user accounts for the loyalty program';
COMMENT ON COLUMN public.clients.client_account_id IS 'Links loyalty program clients to authenticated user accounts'; 