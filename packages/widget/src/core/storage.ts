const SESSION_COOKIE = '_csw_session';
const CONTACT_KEY = '_csw_contact';

export function getSessionToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionToken(token: string): void {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function getContactId(): string | null {
  return sessionStorage.getItem(CONTACT_KEY);
}

export function setContactId(id: string): void {
  sessionStorage.setItem(CONTACT_KEY, id);
}

export function clearSession(): void {
  document.cookie = `${SESSION_COOKIE}=; max-age=0; path=/;`;
  sessionStorage.removeItem(CONTACT_KEY);
}
