// This is a test

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Bear AI App Runner API
  BEAR_API_BASE_URL: process.env.BEAR_API_BASE_URL!,
  BEAR_API_KEY: process.env.BEAR_API_KEY!,
  
  // Slack Configuration
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
  
  // OpenAI/LangChain
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  
  // Pinecone Vector Database
  PINECONE_API_KEY: process.env.PINECONE_API_KEY!,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME!,
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT!,
  
  // Server Configuration
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Optional: For development
  SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN,
  
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
}; 