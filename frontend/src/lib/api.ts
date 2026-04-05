const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface TokenResponse {
  access_token: string;
  token_type: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  async signup(email: string, password: string, companyName: string) {
    return this.request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, companyName }),
    });
  }

  async signin(email: string, password: string): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  signout() {
    this.clearToken();
  }
}

export const api = new ApiClient();
