import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { Logger } from '../utils/logger';

// Initialize Supabase client with service role key for admin operations
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database schema types
export interface BearLink {
  id: string; // UUID primary key
  slack_user_id: string; // Slack user ID
  slack_team_id: string; // Slack team/workspace ID
  slack_team_name: string; // Slack team/workspace name
  bear_id: string; // Bear AI user ID
  created_at: string; // ISO timestamp
  last_accessed: string; // ISO timestamp
  is_active: boolean; // Whether the link is active
  company_id?: string; // Bear AI company ID (optional)
}

// Database operations
export class BearLinkStorage {
  private static readonly TABLE_NAME = 'bear_links';

  /**
   * Initialize the database table if it doesn't exist
   */
  static async initializeTable(): Promise<void> {
    try {
      // Test if the table exists by trying to query it
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') { // Table doesn't exist
        Logger.error('Bear links table does not exist. Please run the SQL migration in your Supabase dashboard.');
        Logger.error('Migration file: supabase/migrations/001_create_bear_links_table.sql');
        throw new Error('Database table not found. Please run the migration first.');
      }
      
      Logger.info('✅ Bear links table ready');
    } catch (error) {
      Logger.error('Error initializing database table:', error);
      throw error;
    }
  }

  /**
   * Create a new Bear link
   */
  static async createLink(
    slackUserId: string,
    slackTeamId: string,
    slackTeamName: string,
    bearId: string,
    companyId?: string
  ): Promise<BearLink> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert({
        slack_user_id: slackUserId,
        slack_team_id: slackTeamId,
        slack_team_name: slackTeamName,
        bear_id: bearId,
        created_at: now,
        last_accessed: now,
        is_active: true,
        company_id: companyId
      })
      .select()
      .single();

    if (error) {
      Logger.error('Failed to create Bear link:', error);
      throw error;
    }

    Logger.info(`✅ Created Bear link for Slack user ${slackUserId}`);
    return data;
  }

  /**
   * Get Bear link by Slack user ID
   */
  static async getLinkBySlackUser(slackUserId: string): Promise<BearLink | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('slack_user_id', slackUserId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        Logger.error('Failed to get Bear link:', error);
        return null;
      }

      return data;
    } catch (err) {
      Logger.error('Exception in getLinkBySlackUser:', err);
      return null;
    }
  }

  /**
   * Get all Bear links for a team
   */
  static async getLinksByTeam(slackTeamId: string): Promise<BearLink[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('slack_team_id', slackTeamId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.error('Failed to get team Bear links:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      Logger.error('Exception in getLinksByTeam:', err);
      return [];
    }
  }

  /**
   * Update last accessed timestamp
   */
  static async updateLastAccessed(slackUserId: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ last_accessed: new Date().toISOString() })
      .eq('slack_user_id', slackUserId)
      .eq('is_active', true);

    if (error) {
      Logger.error('Failed to update last accessed:', error);
      throw error;
    }
  }

  /**
   * Deactivate a Bear link (soft delete)
   */
  static async deactivateLink(slackUserId: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .update({ is_active: false })
      .eq('slack_user_id', slackUserId);

    if (error) {
      Logger.error('Failed to deactivate Bear link:', error);
      throw error;
    }

    Logger.info(`✅ Deactivated Bear link for Slack user ${slackUserId}`);
  }

  /**
   * Check if a Bear link exists
   */
  static async linkExists(slackUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('id')
      .eq('slack_user_id', slackUserId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      Logger.error('Failed to check if link exists:', error);
      throw error;
    }

    return !!data;
  }
} 