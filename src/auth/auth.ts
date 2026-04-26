const SCOPES        = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_CACHE_MS = 5 * 60 * 1000;

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

async function getFlag(key: string): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get(key, (result: Record<string, boolean>) => {
      resolve(result[key] ?? false);
    });
  });
}

async function setFlag(key: string, value: boolean): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

async function getCachedToken(): Promise<{ token: string; expiresAt: number } | null> {
  return new Promise(resolve => {
    chrome.storage.local.get("authCache", (result: Record<string, { token: string; expiresAt: number }>) => {
      resolve(result["authCache"] ?? null);
    });
  });
}

async function setCachedToken(token: string): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({
      authCache: { token, expiresAt: Date.now() + TOKEN_CACHE_MS }
    }, resolve);
  });
}

async function clearCachedToken(): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.remove("authCache", resolve);
  });
}

async function updateStorageToken(token: string | null): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.get("otp_extractor", (result: Record<string, Record<string, unknown>>) => {
      const existing = result["otp_extractor"] ?? { detections: [], isAuthenticated: false, accessToken: null };
      chrome.storage.local.set({
        otp_extractor: {
          ...existing,
          isAuthenticated: token !== null,
          accessToken: token,
        }
      }, resolve);
    });
  });
}

export async function login(): Promise<string> {
  await setFlag("userLoggedOut", false);

  const cached = await getCachedToken();
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const existing = await fetchToken(false);
  if (existing) {
    const valid = await validateToken(existing);
    if (valid) {
      await setCachedToken(existing);
      await updateStorageToken(existing);
      return existing;
    }
    await revokeToken(existing);
  }

  const fresh = await fetchToken(true);
  if (!fresh) throw new Error("Auth failed");

  await setCachedToken(fresh);
  await updateStorageToken(fresh);
  return fresh;
}

export async function removeAuthToken(): Promise<void> {
  await setFlag("userLoggedOut", true);
  await clearCachedToken();
  await updateStorageToken(null);

  const token = await fetchToken(false);
  if (token) await revokeToken(token);
}

export async function getAuthToken(): Promise<string> {
  const loggedOut = await getFlag("userLoggedOut");
  if (loggedOut) throw new Error("User logged out");

  const cached = await getCachedToken();
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const existing = await fetchToken(false);
  if (existing) {
    const valid = await validateToken(existing);
    if (valid) {
      await setCachedToken(existing);
      return existing;
    }
    await revokeToken(existing);
  }

  const fresh = await fetchToken(true);
  if (!fresh) throw new Error("Auth failed");

  await setCachedToken(fresh);
  return fresh;
}

export async function isAuthenticated(): Promise<boolean> {
  const loggedOut = await getFlag("userLoggedOut");
  if (loggedOut) return false;

  const cached = await getCachedToken();
  if (cached && Date.now() < cached.expiresAt) return true;

  const token = await fetchToken(false);
  if (!token) return false;

  const valid = await validateToken(token);
  if (!valid) { await revokeToken(token); return false; }

  await setCachedToken(token);
  return true;
}