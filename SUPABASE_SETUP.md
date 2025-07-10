# Supabase Integration Setup

This guide will help you set up the Supabase database for storing Bear AI account links.

## 1. Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://qfwwebwnmmwnqwhlsxzoo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2Vid25tbXducXdobHN4em9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY0NDYxMiwiZXhwIjoyMDU0MjIwNjEyfQ.HLVODqh0MPzeC_YrqqPLrDAFza9DPQ7cHEWwezQLOQE
```

## 2. Database Setup

### Step 1: Go to Supabase Dashboard
1. Navigate to your Supabase project: https://supabase.com/dashboard/project/qfwwebwnmmwnqwhlsxzoo
2. Go to the **SQL Editor** section

### Step 2: Run the Migration
Copy and paste the contents of `supabase/migrations/001_create_bear_links_table.sql` into the SQL editor and run it.

This will create:
- `bear_links` table with proper schema
- Indexes for performance
- Row Level Security (RLS) policies
- Unique constraints to prevent duplicate links

### Step 3: Verify the Table
After running the migration, you should see the `bear_links` table in your **Table Editor**.

## 3. Schema Overview

The `bear_links` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `slack_user_id` | TEXT | Slack user ID |
| `slack_team_id` | TEXT | Slack team/workspace ID |
| `bear_id` | TEXT | Bear AI user ID |
| `created_at` | TIMESTAMPTZ | When the link was created |
| `last_accessed` | TIMESTAMPTZ | When the link was last used |
| `is_active` | BOOLEAN | Whether the link is active (soft delete) |

## 4. Features

- **User-level linking**: Each Slack user can link their own Bear AI account
- **Duplicate prevention**: Only one active link per user
- **Soft deletes**: Links are deactivated rather than deleted
- **Audit trail**: Tracks creation and last access times
- **Team grouping**: Links are organized by Slack team
- **Performance optimized**: Proper indexes for fast queries

## 5. Testing

Once setup is complete, you can test the integration:

1. Start your server: `npm run dev`
2. Use ngrok: `npx ngrok http 3000`
3. Test the `/bear-link` command in Slack
4. Check the database to see the created records

## 6. Troubleshooting

### Table Not Found Error
If you get "Database table not found", make sure you've run the SQL migration in your Supabase dashboard.

### Permission Errors
The service role key should have full access to the database. If you get permission errors, check that the key is correct and has the right permissions.

### Connection Issues
Verify your `SUPABASE_URL` is correct and the project is active. 