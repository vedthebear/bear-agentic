/**
 * Bear AI Authentication Module
 * 
 * This module handles the authentication flow for linking Slack workspaces
 * to Bear AI accounts. It authenticates users with their Bear AI credentials
 * and retrieves their Bear user ID for team-level linking.
 */

import { supabase } from './client';
import { Logger } from '../../utils/logger';

/**
 * Authenticates a user with Bear AI credentials and retrieves their Bear user ID
 * 
 * This function is the core of the linking process:
 * 1. Authenticates the user with email/password against Supabase
 * 2. Retrieves the user's Bear user ID from the user_profiles table
 * 3. Returns the Bear user ID for team-level linking
 * 
 * @param email - The user's Bear AI email address
 * @param password - The user's Bear AI password
 * @returns Promise<string> - The Bear user ID for this account
 * @throws Error - If authentication fails or Bear ID cannot be retrieved
 * 
 * @example
 * const bearUserId = await authenticateAndGetBearId('user@example.com', 'password123');
 * // Returns: "bear_user_123" or throws an error
 */
export async function authenticateAndGetBearId(email: string, password: string): Promise<string> {
  try {
    Logger.info(`Attempting to authenticate user with email: ${email}`);
    
    // Step 1: Authenticate with Supabase using Bear AI credentials
    // This validates that the user has a valid Bear AI account
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (authError) {
      Logger.error('Authentication failed:', authError);
      throw new Error(`Login failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No user data returned from authentication');
    }

    const userId = authData.user.id;
    Logger.info(`User authenticated successfully, user ID: ${userId}`);

    // Step 2: Retrieve the Bear user ID from the user_profiles table
    // This Bear user ID is what we'll use to link the Slack workspace
    // and access the correct Bear AI data for this account
    const { data: userData, error: dbError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (dbError) {
      Logger.error('Database query failed:', dbError);
      throw new Error(`Could not fetch Bear ID: ${dbError.message}`);
    }

    if (!userData) {
      throw new Error('User profile not found in database');
    }

    const bearUserId = userData.id;
    Logger.info(`Successfully retrieved Bear user ID: ${bearUserId}`);
    
    return bearUserId;
    
  } catch (error) {
    Logger.error('Authentication and Bear ID retrieval failed:', error);
    throw error;
  }
} 

/**
 * Authenticates a user with Bear AI credentials and retrieves their Bear user ID and company ID
 * 
 * This function is the core of the linking process:
 * 1. Authenticates the user with email/password against Supabase
 * 2. Retrieves the user's Bear user ID and company ID from the user_profiles table
 * 3. Returns both for team-level linking
 * 
 * @param email - The user's Bear AI email address
 * @param password - The user's Bear AI password
 * @returns Promise<{ bearUserId: string, companyId: string }> - The Bear user ID and company ID for this account
 * @throws Error - If authentication fails or Bear ID cannot be retrieved
 * 
 * @example
 * const { bearUserId, companyId } = await authenticateAndGetBearIdAndCompanyId('user@example.com', 'password123');
 * // Returns: { bearUserId: "bear_user_123", companyId: "company_456" } or throws an error
 */
export async function authenticateAndGetBearIdAndCompanyId(email: string, password: string): Promise<{ bearUserId: string, companyId: string }> {
  try {
    Logger.info(`Attempting to authenticate user with email: ${email}`);
    
    // Step 1: Authenticate with Supabase using Bear AI credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (authError) {
      Logger.error('Authentication failed:', authError);
      throw new Error(`Login failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No user data returned from authentication');
    }

    const userId = authData.user.id;
    Logger.info(`User authenticated successfully, user ID: ${userId}`);

    // Step 2: Retrieve the Bear user ID and company ID from the user_profiles table
    const { data: userData, error: dbError } = await supabase
      .from('user_profiles')
      .select('id, company_id')
      .eq('id', userId)
      .single();

    if (dbError) {
      Logger.error('Database query failed:', dbError);
      throw new Error(`Could not fetch Bear ID and company ID: ${dbError.message}`);
    }

    if (!userData) {
      throw new Error('User profile not found in database');
    }

    const bearUserId = userData.id;
    const companyId = userData.company_id;
    Logger.info(`Successfully retrieved Bear user ID: ${bearUserId} and company ID: ${companyId}`);
    
    return { bearUserId, companyId };
    
  } catch (error) {
    Logger.error('Authentication and Bear ID/company ID retrieval failed:', error);
    throw error;
  }
} 