export type AuthMode = "real" | "none";

const STORAGE_KEY = "nc_auth_mode";

export function getAuthMode(): AuthMode {
  if (typeof window === "undefined") return "none";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "real") return raw;
  return "none";
}

export function setAuthMode(mode: AuthMode) {
  if (typeof window === "undefined") return;
  if (mode === "none") {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
}

export function clearAuthMode() {
  setAuthMode("none");
}
