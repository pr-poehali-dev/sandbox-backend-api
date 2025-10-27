-- Create request history table for tracking all API requests
CREATE TABLE IF NOT EXISTS request_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    endpoint TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
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

-- Create token usage statistics table
CREATE TABLE IF NOT EXISTS token_stats (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    model VARCHAR(100),
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    UNIQUE(date, model)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_request_history_timestamp ON request_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_request_history_model ON request_history(model);
CREATE INDEX IF NOT EXISTS idx_token_stats_date ON token_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_token_stats_model ON token_stats(model);
