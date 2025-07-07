export interface BearDashboardData {
  brand_visibility_percentage: string | null;
  prompt_count: string | null;
  extraction_method: string;
  timestamp: string;
  url: string;
}

export interface ScrapingResult {
  status: 'success' | 'error';
  data: BearDashboardData;
  message?: string;
} 