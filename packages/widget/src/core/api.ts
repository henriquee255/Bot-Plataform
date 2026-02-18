export class WidgetAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async initSession(params: {
    widgetKey: string;
    sessionToken?: string | null;
    domain?: string;
    url?: string;
    referrer?: string;
    userAgent?: string;
  }) {
    return this.request<{ sessionToken: string; contactId: string | null; config: any }>(
      '/widget/session',
      { method: 'POST', body: JSON.stringify(params) },
    );
  }

  async identify(sessionToken: string, email: string, fullName?: string) {
    return this.request<{ contactId: string; contact: any }>(
      '/widget/identify',
      { method: 'POST', body: JSON.stringify({ sessionToken, email, fullName }) },
    );
  }

  async getConversation(sessionToken: string) {
    return this.request<{ conversation: any }>(`/widget/conversation?sessionToken=${sessionToken}`);
  }

  async getMessages(conversationId: string, sessionToken: string) {
    return this.request<any[]>(
      `/widget/conversations/${conversationId}/messages?sessionToken=${sessionToken}`,
    );
  }

  async sendMessage(conversationId: string, sessionToken: string, content: string) {
    return this.request<any>(
      `/widget/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify({ sessionToken, content }) },
    );
  }

  async getArticles(widgetKey: string, query?: string) {
    const qs = query ? `&q=${encodeURIComponent(query)}` : '';
    return this.request<any[]>(`/knowledge-base/public?widgetKey=${widgetKey}${qs}`).catch(() => []);
  }
}
