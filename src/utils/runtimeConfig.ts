import { getApiBaseUrl } from './url';

let cached: any | null = null;

export async function fetchRuntimeConfig(): Promise<any> {
  if (cached) return cached;
  try {
    const res = await fetch(`${getApiBaseUrl()}/config`);
    cached = await res.json();
    return cached;
  } catch {
    return {};
  }
}


