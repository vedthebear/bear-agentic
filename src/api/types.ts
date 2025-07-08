// Bear AI App Runner API Types

export interface BearApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BearUser {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface BearOrganization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface BearDocument {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'document' | 'page';
  created_at: string;
  updated_at: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface BearDashboardData {
  user: BearUser;
  organization: BearOrganization;
  documents: BearDocument[];
  recent_activity: BearActivity[];
  analytics?: BearAnalytics;
}

export interface BearActivity {
  id: string;
  type: 'document_created' | 'document_updated' | 'document_deleted' | 'user_joined' | 'user_left';
  user_id: string;
  document_id?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface BearAnalytics {
  total_documents: number;
  active_users: number;
  documents_this_week: number;
  popular_tags: string[];
}

// API Request Types
export interface BearApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  params?: Record<string, string>;
} 