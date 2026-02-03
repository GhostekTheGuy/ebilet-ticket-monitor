-- Create alebilet_snapshots table
CREATE TABLE IF NOT EXISTS alebilet_snapshots (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(16) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_tickets INTEGER NOT NULL,
    raw_data JSONB NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_alebilet_snapshots_event_timestamp ON alebilet_snapshots(event_id, timestamp DESC);

-- Create alebilet_sold table for tracking sold tickets
CREATE TABLE IF NOT EXISTS alebilet_sold (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(16) NOT NULL,
    ticket_id VARCHAR(64) NOT NULL,
    category VARCHAR(16) NOT NULL,
    category_name VARCHAR(64) NOT NULL,
    sector VARCHAR(32) NOT NULL,
    row_info VARCHAR(32),
    quantity_sold INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    sold_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_alebilet_sold_event_sold_at ON alebilet_sold(event_id, sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_alebilet_sold_sold_at ON alebilet_sold(sold_at DESC);
