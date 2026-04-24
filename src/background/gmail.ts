interface GmailHeader  { name: string; value: string; }
interface GmailPart    { mimeType: string; body?: { data?: string }; parts?: GmailPart[]; }
export interface GmailMessage {
  payload?: {
    headers?: GmailHeader[];
    body?: { data?: string };
    parts?: GmailPart[];
  };
}

export function extractHeader(headers: GmailHeader[], name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function decodeBase64(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
}

function extractBodyFromParts(parts: GmailPart[]): string {
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data)
      return decodeBase64(part.body.data);
  }
  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data)
      return decodeBase64(part.body.data);
  }
  for (const part of parts) {
    if (part.parts) {
      const nested = extractBodyFromParts(part.parts);
      if (nested) return nested;
    }
  }
  return "";
}

export function extractBody(payload: GmailMessage["payload"]): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts)      return extractBodyFromParts(payload.parts);
  return "";
}

async function gmailFetch<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}

export async function fetchUnreadEmails(token: string): Promise<{ id: string }[]> {
  const data = await gmailFetch<{ messages?: { id: string }[] }>(
    token,
    "https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10"
  );
  return data.messages ?? [];
}

interface GmailMetadata {
  id: string;
  internalDate: string;
  payload?: { headers?: GmailHeader[] };
}

const OTP_SUBJECT_KEYWORDS = [
  "otp", "code", "verify", "verification", "confirm",
  "confirmation", "password", "authenticate", "login",
  "sign in", "security", "token", "access",
];

function subjectLooksRelevant(subject: string): boolean {
  const lower = subject.toLowerCase();
  return OTP_SUBJECT_KEYWORDS.some(kw => lower.includes(kw));
}

export async function fetchRelevantEmails(
  token: string,
  ids: { id: string }[]
): Promise<{ id: string; message: GmailMessage }[]> {
  const metaResults = await Promise.all(
    ids.map(({ id }) =>
      gmailFetch<GmailMetadata>(
        token,
        `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=subject&metadataHeaders=from`
      )
    )
  );

  const sorted = metaResults.sort(
    (a, b) => parseInt(b.internalDate) - parseInt(a.internalDate)
  );

  const relevant = sorted.filter(meta => {
    const subject = extractHeader(meta.payload?.headers ?? [], "subject");
    return subjectLooksRelevant(subject);
  });

  const fullMessages = await Promise.all(
    relevant.map(async meta => {
      const message = await gmailFetch<GmailMessage>(
        token,
        `https://www.googleapis.com/gmail/v1/users/me/messages/${meta.id}?format=full`
      );
      return { id: meta.id, message };
    })
  );

  return fullMessages;
}