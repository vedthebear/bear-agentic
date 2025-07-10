-- Create bear_links table
CREATE TABLE IF NOT EXISTS bear_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slack_user_id TEXT NOT NULL,
    slack_team_id TEXT NOT NULL,
    bear_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_accessed TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Partial unique index for active links
CREATE UNIQUE INDEX unique_active_slack_user
  ON bear_links(slack_user_id)
  WHERE is_active = TRUE;

-- Indexes for performance
CREATE INDEX idx_bear_links_slack_team_id ON bear_links(slack_team_id);
CREATE INDEX idx_bear_links_bear_id ON bear_links(bear_id);
CREATE INDEX idx_bear_links_is_active ON bear_links(is_active);
CREATE INDEX idx_bear_links_created_at ON bear_links(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE bear_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own links
CREATE POLICY "Users can view own links" ON bear_links
    FOR SELECT USING (slack_user_id = current_user);

-- Policy: Users can insert their own links
CREATE POLICY "Users can insert own links" ON bear_links
    FOR INSERT WITH CHECK (slack_user_id = current_user);

-- Policy: Users can update their own links
CREATE POLICY "Users can update own links" ON bear_links
    FOR UPDATE USING (slack_user_id = current_user);

-- Note: For service role operations, RLS is bypassed when using service role key 