/**
 * Tiny HTTP client that auto-attaches the signed-in user's Firebase ID token.
 *
 * Backend URL comes from `expo.extra.apiUrl` in app.json.
 */
import Constants from "expo-constants";

import { firebaseAuth } from "./firebase";

const API_URL = ((Constants.expoConfig?.extra?.apiUrl as string | undefined) || "").replace(
  /\/$/,
  ""
);

if (!API_URL) {
  // Don't throw at import time; some screens (onboarding) work without API.
  // Will surface a clearer error when an actual API call is made.
  // eslint-disable-next-line no-console
  console.warn(
    "expo.extra.apiUrl is not set. API calls will fail until you set it in app.json."
  );
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const user = firebaseAuth().currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!API_URL) {
    throw new ApiError("Backend URL not configured", 0);
  }
  const headers = new Headers(init.headers);
  const auth = await authHeader();
  for (const [k, v] of Object.entries(auth)) headers.set(k, v);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const detail =
      (data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ||
      text ||
      `HTTP ${res.status}`;
    throw new ApiError(detail, res.status);
  }
  return data as T;
}

export type Me = {
  uid: string;
  email: string | null;
  name: string | null;
  auth_method: "google" | "email" | "pollinations";
  daily_limit: number;
  used_today: number;
  dismissed_pollinations_upsell: boolean;
  has_pollinations_key: boolean;
};

export async function fetchMe(): Promise<Me> {
  return apiJson<Me>("/api/v2/me");
}

export async function dismissUpsell(): Promise<void> {
  await apiJson("/api/v2/me/dismiss-upsell", { method: "POST" });
}

export async function setupPollinationsKey(key: string): Promise<void> {
  await apiJson("/api/v2/me/setup-pollinations", {
    method: "POST",
    body: JSON.stringify({ pollinations_key: key }),
  });
}

export async function upgradeToPollinations(key: string): Promise<void> {
  await apiJson("/api/v2/me/upgrade-pollinations", {
    method: "POST",
    body: JSON.stringify({ pollinations_key: key }),
  });
}

export type GeneratePayload = {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  model?: string;
};

/** Returns image bytes as a base64 data URL. */
export async function generateImage(payload: GeneratePayload): Promise<string> {
  const res = await apiFetch("/api/v2/generate-image", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(detail || `HTTP ${res.status}`, res.status);
  }
  const blob = await res.blob();
  return await blobToDataUrl(blob);
}

export type CaptionPayload = {
  image_data_url: string;
  instruction?: string;
  model?: string;
};

export async function captionImage(payload: CaptionPayload): Promise<string> {
  const data = await apiJson<{ caption: string; model: string }>("/api/v2/caption", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.caption;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("blob read failed"));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}
