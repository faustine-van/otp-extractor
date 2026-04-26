const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_CACHE_MS = 5 * 60 * 1000;

let cachedToken: string | null = null;
let cacheExpiresAt = 0;

async function fetchToken(interactive: boolean): Promise<string | null> {
  return new Promise(resolve => {
    chrome.identity.getAuthToken({ interactive, scopes: SCOPES }, result => {
      if (chrome.runtime.lastError) { resolve(null); return; }
      const token = typeof result === "string" ? result : result?.token;
      resolve(token ?? null);
    });
  });
}

async function revokeToken(token: string): Promise<void> {
  cachedToken    = null;
  cacheExpiresAt = 0;
  return new Promise(resolve => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function getLoggedOutFlag(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get("userLoggedOut", (result: Record<string, boolean>) => {
      resolve(result["userLoggedOut"] ?? false);
    });
  });
}

async function setLoggedOutFlag(value: boolean): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ userLoggedOut: value }, resolve);
  });
}

export async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < cacheExpiresAt) {
    return cachedToken;
  }

  const existing = await fetchToken(false);
  if (existing) {
    const valid = await validateToken(existing);
    if (valid) {
      cachedToken    = existing;
      cacheExpiresAt = Date.now() + TOKEN_CACHE_MS;
      return existing;
    }
    await revokeToken(existing);
  }

  const fresh = await fetchToken(true);
  if (!fresh) throw new Error("Auth failed");

  cachedToken    = fresh;
  cacheExpiresAt = Date.now() + TOKEN_CACHE_MS;
  return fresh;
}

export async function removeAuthToken(token: string): Promise<void> {
  cachedToken    = null;
  cacheExpiresAt = 0;
  await setLoggedOutFlag(true);
  await revokeToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  // Respect explicit logout — don't silently re-auth
  const loggedOut = await getLoggedOutFlag();
  if (loggedOut) return false;

  if (cachedToken && Date.now() < cacheExpiresAt) return true;

  const token = await fetchToken(false);
  if (!token) return false;

  const valid = await validateToken(token);
  if (!valid) { await revokeToken(token); return false; }

  cachedToken    = token;
  cacheExpiresAt = Date.now() + TOKEN_CACHE_MS;
  return true;
}

export async function login(): Promise<string> {
  await setLoggedOutFlag(false);
  return getAuthToken();
}