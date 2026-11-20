import { API_BASE_URL } from '@/config/appConfig';

interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = localStorage.getItem('silposetu_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('silposetu_token', token);
    } else {
      localStorage.removeItem('silposetu_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, token, ...customConfig } = options;
    const rawPath = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    const baseOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://127.0.0.1:8000';
    const url = new URL(rawPath, baseOrigin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const effectiveToken = token || this.token;
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (effectiveToken) {
      defaultHeaders['Authorization'] = `Bearer ${effectiveToken}`;
    }

    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
      if (match && match[1]) {
        defaultHeaders['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
      }
    }

    const config: RequestInit = {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
    };

    try {
      const response = await fetch(url.toString(), config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.message || data?.error || `HTTP error ${response.status}`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      console.warn(`[ApiClient] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

