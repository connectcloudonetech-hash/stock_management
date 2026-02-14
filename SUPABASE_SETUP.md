
# Supabase Backend Setup - SR INFOTECH Stock Manager

Follow these steps to integrate the backend with this frontend.

## 1. Environment Variables
Create a `.env` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 2. SQL Schema
Run this script in the Supabase SQL Editor:

```sql
-- Create custom enum for movement types
CREATE TYPE movement_type AS ENUM ('IN', 'OUT');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');

-- Profiles table (linked to Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  current_stock NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements table
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  type movement_type NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  customer_id UUID REFERENCES customers(id), -- Only for IN
  qty NUMERIC NOT NULL CHECK (qty > 0),
  nos INTEGER NOT NULL CHECK (nos > 0),
  weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Function to update product stock automatically
CREATE OR REPLACE FUNCTION update_stock_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'IN' THEN
    UPDATE products 
    SET current_stock = current_stock + NEW.qty
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'OUT' THEN
    UPDATE products 
    SET current_stock = current_stock - NEW.qty
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock updates
CREATE TRIGGER after_movement_insert
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_stock_level();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read products
CREATE POLICY "All authenticated users can view products"
ON products FOR SELECT
TO authenticated
USING (true);

-- Allow admins/managers to CRUD products
CREATE POLICY "Admins/Managers can manage products"
ON products FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (role = 'admin' OR role = 'manager')
));
```

## 3. Realtime Enablement
Go to the Supabase Dashboard > Database > Replication and enable the `stock_movements` and `products` tables for the `supabase_realtime` publication.

## 4. Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Add the environment variables in the Vercel Project Settings.
3. Deploy!
