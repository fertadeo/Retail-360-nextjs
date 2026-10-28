/**
 * Base URL del gold API.
 * En alta/provisioner: NEXT_PUBLIC_API_URL=https://api-{slug}.aurixerp.com
 * Local sin env → modo memoria (demo).
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  return raw.replace(/\/$/, "");
}

export function isApiMode(): boolean {
  return Boolean(getApiBaseUrl());
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p.startsWith("/api") ? p : `/api${p}`}`;
}
