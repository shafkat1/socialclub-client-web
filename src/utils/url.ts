export function getApiBaseUrl(): string {
  if (import.meta.env?.PROD) {
    return `${window.location.origin}/api`;
  }
  return import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
}


