import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config/env';
import { 
  BearApiResponse, 
  BearDashboardData, 
  BearDocument, 
  BearUser, 
  BearOrganization,
  BearApiRequest 
} from './types';
import { Logger } from '../utils/logger';

export class BearApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.BEAR_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${config.BEAR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        Logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        Logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        Logger.info(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        Logger.error('API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  private async makeRequest<T>(request: BearApiRequest): Promise<BearApiResponse<T>> {
    try {
      const response = await this.client.request({
        method: request.method,
        url: request.endpoint,
        data: request.data,
        params: request.params,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Bear API request failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
      };
    }
  }

  // Get dashboard data for a user
  async getDashboardData(userId: string): Promise<BearApiResponse<BearDashboardData>> {
    return this.makeRequest<BearDashboardData>({
      method: 'GET',
      endpoint: `/users/${userId}/dashboard`,
    });
  }

  // Get user profile
  async getUser(userId: string): Promise<BearApiResponse<BearUser>> {
    return this.makeRequest<BearUser>({
      method: 'GET',
      endpoint: `/users/${userId}`,
    });
  }

  // Get organization data
  async getOrganization(orgId: string): Promise<BearApiResponse<BearOrganization>> {
    return this.makeRequest<BearOrganization>({
      method: 'GET',
      endpoint: `/organizations/${orgId}`,
    });
  }

  // Get documents for a user or organization
  async getDocuments(userId?: string, orgId?: string): Promise<BearApiResponse<BearDocument[]>> {
    const params: Record<string, string> = {};
    if (userId) params.user_id = userId;
    if (orgId) params.organization_id = orgId;

    return this.makeRequest<BearDocument[]>({
      method: 'GET',
      endpoint: '/documents',
      params,
    });
  }

  // Search documents
  async searchDocuments(query: string, userId?: string): Promise<BearApiResponse<BearDocument[]>> {
    const params: Record<string, string> = { q: query };
    if (userId) params.user_id = userId;

    return this.makeRequest<BearDocument[]>({
      method: 'GET',
      endpoint: '/documents/search',
      params,
    });
  }

  // Get a specific document
  async getDocument(documentId: string): Promise<BearApiResponse<BearDocument>> {
    return this.makeRequest<BearDocument>({
      method: 'GET',
      endpoint: `/documents/${documentId}`,
    });
  }

  // Health check
  async healthCheck(): Promise<BearApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>({
      method: 'GET',
      endpoint: '/health',
    });
  }
}

// Export singleton instance
export const bearApiClient = new BearApiClient(); 