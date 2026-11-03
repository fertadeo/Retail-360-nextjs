const DEVICE_KEY = "aurix_presence_device_id";

export function getPresenceDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `d_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return `d_${Date.now()}`;
  }
}

export function presenceActorFromSession(): {
  actorKey: string;
  displayName: string;
  role?: string | null;
  email?: string | null;
} {
  // Cuando exista login de operador, leer sesión aquí.
  const deviceId = getPresenceDeviceId();
  return {
    actorKey: `anon:${deviceId}`,
    displayName: "Operador (navegador)",
    role: null,
    email: null,
  };
}
