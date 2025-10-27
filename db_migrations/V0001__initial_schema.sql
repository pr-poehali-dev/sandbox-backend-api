-- Create API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key_value VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    request_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id VARCHAR(50) PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_delivery_at TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0
);

-- Create API Logs table
CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL,
    method VARCHAR(10) NOT NULL,
    endpoint TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    message TEXT,
    duration_ms INTEGER,
    ip_address VARCHAR(50)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_level ON api_logs(level);
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(is_enabled);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);