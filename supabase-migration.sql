-- Create portfolio table with Row Level Security (RLS)
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    quantity NUMERIC NOT NULL,
    buy_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);

-- Enable Row Level Security
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own portfolio
CREATE POLICY "Users can view own portfolio" 
ON portfolio FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy: Users can insert their own portfolio
CREATE POLICY "Users can insert own portfolio" 
ON portfolio FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own portfolio
CREATE POLICY "Users can update own portfolio" 
ON portfolio FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy: Users can delete their own portfolio
CREATE POLICY "Users can delete own portfolio" 
ON portfolio FOR DELETE 
USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_portfolio_updated_at
BEFORE UPDATE ON portfolio
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
