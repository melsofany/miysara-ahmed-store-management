export const API_URL = 'https://miysara-ahmed-store.onrender.com/api';

export const apiClient = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth-error'));
  }

  if (!res.ok) {
    let message = 'حدث خطأ ما';
    try {
      const errorData = await res.json();
      message = errorData.message || message;
    } catch (e) {
      // Ignore json parse error
    }
    throw new Error(message);
  }

  // If response is 204 No Content, return null
  if (res.status === 204) return null;
  
  return res.json();
};
