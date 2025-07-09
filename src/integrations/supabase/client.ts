/**
 * Supabase Client Configuration
 * 
 * This file creates and exports a configured Supabase client instance
 * that connects to our Bear AI backend database.
 * 
 * The client is used for:
 * - User authentication (email/password)
 * - Retrieving Bear user IDs from user_profiles table
 * - Future data operations for RAG and vectorization
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/env';

/**
 * Supabase client instance configured with environment variables
 * 
 * Usage:
 * import { supabase } from "@/integrations/supabase/client";
 * 
 * This client connects to the Bear AI Supabase instance and provides
 * access to authentication and database operations.
 */
export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY); 