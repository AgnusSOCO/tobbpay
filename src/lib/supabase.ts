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
  customer_id: string;
  amount: number;
  currency: string;
  start_date: string;
  frequency: string;
  attempts: number;
  status: 'active' | 'inactive';
  subscriptionId?: string | null;
  customers: {
    name: string;
    email: string;
    kushki_token?: string;
  } | null;
  address: string;
  first_name: string;
  last_name: string;
  bin: string;
  brand: string;
  city: string;
  country: string;
  email: string;
  kushki_token: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholder_name: string;
  card_number: string;
};