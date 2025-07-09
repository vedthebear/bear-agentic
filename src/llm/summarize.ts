import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config/env';
import { BearDashboardData } from '../api/types';
import { Logger } from '../utils/logger';

const llm = new ChatOpenAI({
  openAIApiKey: config.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini',
  temperature: 0.3,
});

export async function generateDailySummary(dashboardData: BearDashboardData): Promise<string> {
  try {
    const prompt = createSummaryPrompt(dashboardData);
    
    const response = await llm.invoke(prompt);
    
    Logger.info('Daily summary generated successfully');
    return response.content as string;
  } catch (error) {
    Logger.error('Error generating daily summary:', error);
    throw error;
  }
}

function createSummaryPrompt(data: BearDashboardData): string {
  const { user, organization, documents, recent_activity, analytics } = data;
  
  return `You are a helpful AI assistant that creates daily summaries for Bear AI users.

Please create a concise, friendly daily summary for ${user.name} from ${organization.name} based on the following data:

**User Activity:**
- User: ${user.name} (${user.email})
- Organization: ${organization.name}

**Recent Documents:** ${documents.length} documents
${documents.slice(0, 5).map(doc => `- ${doc.title} (${doc.type})`).join('\n')}

**Recent Activity:** ${recent_activity.length} activities
${recent_activity.slice(0, 5).map(activity => `- ${activity.type} at ${new Date(activity.created_at).toLocaleDateString()}`).join('\n')}

**Analytics:**
${analytics ? `
- Total documents: ${analytics.total_documents}
- Active users: ${analytics.active_users}
- Documents this week: ${analytics.documents_this_week}
- Popular tags: ${analytics.popular_tags.join(', ')}
` : 'No analytics available'}

Please create a friendly, informative summary that:
1. Highlights key activities and document changes
2. Mentions any notable trends or patterns
3. Keeps it concise (2-3 paragraphs max)
4. Uses a warm, encouraging tone
5. Ends with a helpful suggestion or insight

Format the response as plain text suitable for a Slack message.`;
} 