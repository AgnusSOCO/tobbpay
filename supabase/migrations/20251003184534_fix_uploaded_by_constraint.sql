/*
  # Fix uploaded_by foreign key constraint issue

  1. Changes
    - Drop the foreign key constraint on scheduled_charges.uploaded_by
    - The uploaded_by field will remain nullable but without foreign key enforcement
    - This allows users to upload files without needing a separate users table
  
  2. Security
    - No RLS changes needed
    - Field remains for audit purposes but is optional
*/

-- Drop the foreign key constraint
ALTER TABLE scheduled_charges 
DROP CONSTRAINT IF EXISTS scheduled_charges_uploaded_by_fkey;