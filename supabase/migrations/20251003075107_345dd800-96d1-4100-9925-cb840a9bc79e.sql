-- Create enum types
CREATE TYPE public.transaction_status AS ENUM ('approved', 'pending', 'rejected');
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.schedule_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE public.user_role AS ENUM ('admin', 'operator', 'viewer');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  kushki_token TEXT,
  bin TEXT,
  last4 TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create collection_jobs table
CREATE TABLE public.collection_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  filename TEXT NOT NULL,
  total_entries INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  status public.job_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_job_id UUID REFERENCES public.collection_jobs(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  request_payload JSONB,
  kushki_ticket TEXT,
  iso_code TEXT,
  processor_error TEXT,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create schedules table
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  collection_job_id UUID REFERENCES public.collection_jobs(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  cardHolder_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  time_of_day TIME,
  frequency TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 3,
  attempt_interval_minutes INTEGER NOT NULL DEFAULT 30,
  reference TEXT,
  status public.schedule_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create iso_codes lookup table
CREATE TABLE public.iso_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  details TEXT
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for customers (authenticated users can manage)
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" ON public.customers
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for collection_jobs
CREATE POLICY "Authenticated users can view jobs" ON public.collection_jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create jobs" ON public.collection_jobs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update jobs" ON public.collection_jobs
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for transactions
CREATE POLICY "Authenticated users can view transactions" ON public.transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions" ON public.transactions
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for schedules
CREATE POLICY "Authenticated users can view schedules" ON public.schedules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert schedules" ON public.schedules
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedules" ON public.schedules
  FOR UPDATE TO authenticated USING (true);

-- RLS Policy for iso_codes (public read)
CREATE POLICY "Anyone can view ISO codes" ON public.iso_codes
  FOR SELECT TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.collection_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    'operator'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some common ISO codes
INSERT INTO public.iso_codes (code, description, details) VALUES
  ('00', 'Approved', 'Transaction approved successfully'),
  ('05', 'Do not honor', 'Card issuer declined transaction'),
  ('14', 'Invalid card number', 'Card number is invalid'),
  ('51', 'Insufficient funds', 'Not enough funds in account'),
  ('54', 'Expired card', 'Card has expired'),
  ('61', 'Exceeds withdrawal limit', 'Transaction exceeds limit'),
  ('65', 'Activity limit exceeded', 'Card has exceeded activity limit'),
  ('91', 'Issuer unavailable', 'Card issuer system unavailable')
ON CONFLICT (code) DO NOTHING;