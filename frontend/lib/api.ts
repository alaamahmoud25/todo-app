// API base URL from .env.local, with a local default
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api';

// ===== Types (must match the Django serializers) =====

export type Category = {
  id: number;
  name: string;
  color: string;
  pending_count?: number;
};

export type Priority = 'high' | 'medium' | 'low';
export type Repeat = 'none' | 'daily' | 'weekly';
export type View = 'all' | 'today' | 'overdue' | 'upcoming' | 'done';

export type Task = {
  id: number;
  title: string;
  description: string;
  category: number | null;
  category_detail: Category | null;
  priority: Priority;
  due_at: string | null; // e.g. "2026-11-01T18:00:00+02:00"
  remind_before_minutes: number | null;
  remind_at: string | null;
  repeat: Repeat;
  is_done: boolean;
  is_overdue: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Payload for creating or updating a task
export type TaskInput = {
  title: string;
  description: string;
  category: number | null;
  priority: Priority;
  due_at: string | null; // Format "2026-11-01T18:00" (interpreted as Cairo time)
  remind_before_minutes: number | null;
  repeat: Repeat;
};

export type Summary = {
  today: number;
  overdue: number;
  pending: number;
  done_today: number;
};

export type Stats = {
  last_7_days: { date: string; done: number; due: number }[];
  by_category: { name: string; color: string; count: number }[];
  uncategorized: number;
  by_priority: Record<Priority, number>;
  completion_rate: number;
};

export type TaskFilters = {
  view?: View;
  category?: number | null;
  priority?: Priority | null;
  search?: string;
};

// Error carrying Django's response body (e.g. field errors)
export class ApiError extends Error {
  constructor(public status: number, public data: unknown) {
    super(`Request failed: ${status}`);
  }
}

// ===== Auth token =====
// Stored in the browser so the user stays logged in between visits
const TOKEN_KEY = 'token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // If saving fails, the user stays logged in only until the page closes
  }
}

// Event dispatched when the server rejects the token (401)
// AuthProvider listens for it and sends the user to the login page
export const LOGOUT_EVENT = 'auth:logout';

// Request helper: sends the request and checks the response
// <T> is the response type, chosen at the call site
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Attach the token to every request so Django knows who is calling
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
  });
  // 401 = not logged in or token revoked: log the user out
  if (res.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event(LOGOUT_EVENT));
  }
  if (!res.ok) {
    // Try to read the error body from Django
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data);
  }
  // DELETE returns 204 with no body
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ===== API calls =====

export const getSummary = () => request<Summary>('/tasks/summary/');
export const getStats = () => request<Stats>('/tasks/stats/');
export const getCategories = () => request<Category[]>('/categories/');
export const getReminders = () => request<Task[]>('/tasks/reminders/');

export function getTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  if (filters.view && filters.view !== 'all') params.set('view', filters.view);
  if (filters.category) params.set('category', String(filters.category));
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  const query = params.toString();
  return request<Task[]>(`/tasks/${query ? `?${query}` : ''}`);
}

export const createTask = (data: TaskInput) =>
  request<Task>('/tasks/', { method: 'POST', body: JSON.stringify(data) });

export const updateTask = (id: number, data: TaskInput) =>
  request<Task>(`/tasks/${id}/`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteTask = (id: number) =>
  request<void>(`/tasks/${id}/`, { method: 'DELETE' });

export const toggleTask = (id: number) =>
  request<Task>(`/tasks/${id}/toggle/`, { method: 'POST' });

export const markReminded = (id: number) =>
  request<{ ok: boolean }>(`/tasks/${id}/mark_reminded/`, { method: 'POST' });

// ===== Authentication =====

export type User = { id: number; username: string };
export type AuthResponse = { token: string; user: User };

export const login = (username: string, password: string) =>
  request<AuthResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const register = (username: string, password: string) =>
  request<AuthResponse>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const getMe = () => request<User>('/auth/me/');

export const logout = () => request<void>('/auth/logout/', { method: 'POST' });
