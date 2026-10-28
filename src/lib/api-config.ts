/**
 * Base URL del gold API.
 * En alta: NEXT_PUBLIC_API_URL=http(s)://{slug}.api.aurixerp.com (upstream).
 * En el browser usamos /aurix-api (rewrite same-origin) para no romper HTTPS→HTTP.
 * Local sin env → modo memoria (demo).
 */

function upstreamApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
}

export function isApiMode(): boolean {
  return Boolean(upstreamApiUrl());
}

export function getApiBaseUrl(): string {
  const upstream = upstreamApiUrl();
  if (!upstream) return "";

  // Cliente (browser): mismo origen HTTPS → rewrite en next.config
  if (typeof window !== "undefined") {
    return "/aurix-api";
  }

  // Server en Vercel: pegarle al propio host (pasa por rewrite)
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}/aurix-api`;
  }

  // Server local / build: puede hablar directo al upstream (HTTP ok)
  return upstream;
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p.startsWith("/api") ? p : `/api${p}`}`;
}
