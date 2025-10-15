/*
  # Initial Schema for TOBB Payment Platform

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `created_at` (timestamptz)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `customer_name` (text) - Combined first and last name
      - `amount` (decimal)
      - `currency` (text)
      - `card_number` (text) - Last 4 digits only
      - `bin_code` (text) - Bank identification number
      - `bank_name` (text)
      - `status` (text) - approved, rejected, pending
      - `iso_code` (text) - ISO error code
      - `iso_message` (text) - Human readable error message
      - `kushki_token` (text)
      - `kushki_transaction_id` (text)
      - `merchant_id` (text)
      - `transaction_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `scheduled_charges`
      - `id` (uuid, primary key)
      - `batch_name` (text)
      - `customer_name` (text)
      - `amount` (decimal)
      - `currency` (text)
      - `card_number` (text)
      - `card_expiry_month` (text)
      - `card_expiry_year` (text)
      - `cvv` (text)
      - `retry_attempts` (integer) - Number of times to retry
      - `retry_interval_minutes` (integer) - Minutes between retries
      - `current_attempt` (integer) - Current attempt number
      - `last_attempt_at` (timestamptz)
      - `next_attempt_at` (timestamptz)
      - `status` (text) - pending, processing, completed, failed
      - `created_at` (timestamptz)
      - `uploaded_by` (uuid, foreign key to users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  card_number text,
  bin_code text,
  bank_name text,
  status text NOT NULL DEFAULT 'pending',
  iso_code text,
  iso_message text,
  kushki_token text,
  kushki_transaction_id text,
  merchant_id text,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Scheduled charges table
CREATE TABLE IF NOT EXISTS scheduled_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  customer_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  card_number text NOT NULL,
  card_expiry_month text NOT NULL,
  card_expiry_year text NOT NULL,
  cvv text NOT NULL,
  retry_attempts integer DEFAULT 1,
  retry_interval_minutes integer DEFAULT 30,
  current_attempt integer DEFAULT 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES users(id)
);

ALTER TABLE scheduled_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all scheduled charges"
  ON scheduled_charges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert scheduled charges"
  ON scheduled_charges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update scheduled charges"
  ON scheduled_charges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete scheduled charges"
  ON scheduled_charges FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_name);
CREATE INDEX IF NOT EXISTS idx_scheduled_charges_status ON scheduled_charges(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_charges_next_attempt ON scheduled_charges(next_attempt_at);