-- Migration to convert category name from enum to string
-- This preserves existing data while allowing custom category names

-- First, add a temporary column
ALTER TABLE categories ADD COLUMN name_temp VARCHAR(255);

-- Copy existing enum values to the temporary string column
UPDATE categories SET name_temp = name::text;

-- Drop the old column and rename the temporary one
ALTER TABLE categories DROP COLUMN name;
ALTER TABLE categories RENAME COLUMN name_temp TO name;

-- Add the unique constraint back
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);

-- Drop the enum type (only if no other tables use it)
-- DROP TYPE "TicketCategory";
