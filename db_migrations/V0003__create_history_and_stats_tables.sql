-- Create request_history table for storing API request logs
CREATE TABLE IF NOT EXISTS request_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    model VARCHAR(100),
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    duration_ms INTEGER,
    status_code INTEGER,
    user_message TEXT,
    ai_response TEXT,
    error_message TEXT
);

-- Create token_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS token_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    model VARCHAR(100) NOT NULL,
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    UNIQUE(date, model)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_request_history_timestamp ON request_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_token_stats_date ON token_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_token_stats_model ON token_stats(model);