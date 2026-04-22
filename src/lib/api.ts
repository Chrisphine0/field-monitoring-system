const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  console.log(`API Request: ${options.method || 'GET'} ${path}`);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    console.log(`API Response Status: ${response.status} for ${path}`);
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
      console.error(`API Error for ${path}:`, data.error);
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`Request failed for ${path}:`, error);
    throw error;
  }
}

export const api = {
  auth: {
    login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
  },
  fields: {
    list: () => request('/fields'),
    get: (id: number) => request(`/fields/${id}`),
    create: (data: any) => request('/fields', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/fields/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/fields/${id}`, { method: 'DELETE' }),
    assign: (id: number, agentId: number) => request(`/fields/${id}/assign`, { method: 'POST', body: JSON.stringify({ agent_id: agentId }) }),
    addUpdate: (fieldId: number, data: any) => request(`/fields/${fieldId}/updates`, { method: 'POST', body: JSON.stringify(data) }),
    getUpdates: (fieldId: number) => request(`/fields/${fieldId}/updates`),
    getAvailableAgents: () => request('/fields/agents/available'),
  },
  dashboard: {
    get: () => request('/dashboard'),
    archive: () => request('/dashboard/archive'),
  },
};
