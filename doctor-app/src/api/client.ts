import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TABLET_ID } from '../config/constants';
import { getFreshIdToken, setSessionToken } from '../services/firebaseAuth';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;
  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Session expired or invalid. Please sign in again.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

let customBaseUrl: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function getBaseUrl(): Promise<string> {
  if (customBaseUrl) return customBaseUrl;
  try {
    const stored = await AsyncStorage.getItem('breastcare_custom_api_url');
    if (stored && stored.trim()) {
      customBaseUrl = stored.trim();
      return customBaseUrl;
    }
  } catch (err) {
    console.warn('[ApiClient] Failed to read stored base URL:', err);
  }
  return API_URL;
}

export async function setBaseUrl(url: string | null): Promise<void> {
  customBaseUrl = url && url.trim() ? url.trim() : null;
  if (customBaseUrl) {
    await AsyncStorage.setItem('breastcare_custom_api_url', customBaseUrl);
  } else {
    await AsyncStorage.removeItem('breastcare_custom_api_url');
  }
}

export async function checkHealth(targetUrl?: string): Promise<{ success: boolean; version?: string; status?: string }> {
  try {
    const base = targetUrl ? targetUrl.trim() : await getBaseUrl();
    const res = await fetch(`${base}/health`, { method: 'GET' });
    const data = await res.json();
    return { success: res.ok, version: data.version, status: data.status };
  } catch (err: any) {
    return { success: false, status: err.message };
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Single centralized authenticated HTTP client.
 * Automatically fetches fresh Firebase ID token, attaches Authorization header,
 * handles token refresh, and triggers session expiration on 401/403.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers: customHeaders, ...restOptions } = options;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tablet-id': TABLET_ID,
  };

  if (requiresAuth) {
    // 1. Obtain a fresh or cached ID token
    const token = await getFreshIdToken();
    if (!token) {
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
      throw new UnauthorizedError('No authentication token found. Please sign in.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge any custom headers
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((val, key) => {
        headers[key] = val;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, val]) => {
        headers[key] = val;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  // Set reasonable timeout (45s to accommodate Render cold start and image upload)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  let res: Response;
  try {
    res = await fetch(url, {
      ...restOptions,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (netErr: any) {
    if (netErr.name === 'AbortError' || netErr.message?.includes('aborted')) {
      throw new ApiError(
        'Server request timed out. If the server was sleeping, please wait a moment and try again.',
        0,
        'TIMEOUT'
      );
    }
    throw new ApiError(
      netErr.message || 'Unable to connect to clinical server. Please check your network connection.',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle 401 Unauthorized (Expired or invalid token)
  if (res.status === 401) {
    if (requiresAuth) {
      try {
        const refreshedToken = await getFreshIdToken(true);
        if (refreshedToken && refreshedToken !== headers['Authorization']?.replace('Bearer ', '')) {
          headers['Authorization'] = `Bearer ${refreshedToken}`;
          const retryRes = await fetch(url, { ...restOptions, headers });
          if (retryRes.ok) {
            return await retryRes.json();
          }
        }
      } catch (refreshErr) {
        console.warn('[ApiClient] Token retry failed:', refreshErr);
      }
    }

    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || 'Session expired. Please sign in again.';
    throw new UnauthorizedError(message);
  }

  // Handle 403 Forbidden (Role/permission denial - do not log out)
  if (res.status === 403) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || 'Access denied: You do not have permission for this clinical action.';
    throw new ApiError(message, 403, 'FORBIDDEN');
  }

  let data: any;
  try {
    data = await res.json();
  } catch (parseErr) {
    if (!res.ok) {
      throw new ApiError(`Request failed with status ${res.status}`, res.status);
    }
    return {} as T;
  }

  if (!res.ok) {
    let errorMsg = data?.error?.message || data?.message || `Request failed with status ${res.status}`;
    if (data?.error?.details && Array.isArray(data.error.details)) {
      const detailedText = data.error.details.map((d: any) => d.message).filter(Boolean).join('. ');
      if (detailedText) {
        errorMsg = `${errorMsg}: ${detailedText}`;
      }
    }
    throw new ApiError(errorMsg, res.status, data?.error?.code, data?.error?.details);
  }

  return data as T;
}
