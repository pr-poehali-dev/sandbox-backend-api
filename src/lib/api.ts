const API_KEYS_URL = 'https://functions.poehali.dev/21383e33-8a5e-495e-8e39-5c28ac94e111';
const WEBHOOKS_URL = 'https://functions.poehali.dev/4a402120-006c-4aa5-9ae4-b741eb2140e0';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  requests: number;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  lastDelivery: string;
  successRate: number;
}

export const apiKeysService = {
  async getAll(): Promise<ApiKey[]> {
    const response = await fetch(API_KEYS_URL);
    const data = await response.json();
    return data.keys || [];
  },

  async create(name: string): Promise<ApiKey> {
    const response = await fetch(API_KEYS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await fetch(`${API_KEYS_URL}?id=${id}`, {
      method: 'DELETE',
    });
  },
};

export const webhooksService = {
  async getAll(): Promise<Webhook[]> {
    const response = await fetch(WEBHOOKS_URL);
    const data = await response.json();
    return data.webhooks || [];
  },

  async create(url: string, events: string[]): Promise<Webhook> {
    const response = await fetch(WEBHOOKS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, events }),
    });
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await fetch(`${WEBHOOKS_URL}?id=${id}`, {
      method: 'DELETE',
    });
  },

  async test(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${WEBHOOKS_URL}?action=test&id=${id}`);
    return response.json();
  },
};
