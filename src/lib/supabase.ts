import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Transaction = {
  id: string;
  customer_name: string;
  amount: number;
  currency: string;
  card_number: string | null;
  bin_code: string | null;
  bank_name: string | null;
  status: 'APPROVED' | 'DECLINED' | 'INITIALIZED';
  iso_code: string | null;
  iso_message: string | null;
  kushki_token: string | null;
  kushki_transaction_id: string | null;
  merchant_id: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

export type ScheduledCharge = {
  id: string;
  batch_name: string;
  customer_name: string;
  amount: number;
  currency: string;
  card_number: string;
  card_expiry_month: string;
  card_expiry_year: string;
  cvv: string;
  retry_attempts: number;
  retry_interval_minutes: number;
  current_attempt: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  uploaded_by: string;
};
