import type { ParseResult } from "./index";

const LINK_KEYWORDS  = [
  "/verify", "/confirm", "/activate", "/validate", "/auth",
  "/token", "/magic-link", "/magic_link", "?token=", "?code=",
  "?key=", "?otp=", "/verify/", "/confirm/",
];

const LINK_BLACKLIST = [
  "unsubscribe", "unsub", "optout", "opt-out",
  "privacy", "terms", "help", "support",
  "track", "pixel", "open.php", "click.php",
];

export function detectLink(rawHtml: string): ParseResult | null {
  const urlRe = /https?:\/\/[^\s"<>]+/gi;
  const candidates: { url: string; score: number }[] = [];
  let match;

  while ((match = urlRe.exec(rawHtml)) !== null) {
    const url   = match[0];
    const lower = url.toLowerCase();

    if (LINK_BLACKLIST.some(b => lower.includes(b))) continue;
    if (!LINK_KEYWORDS.some(k => lower.includes(k)))  continue;

    let s = 0;
    if (lower.includes("?token="))     s += 40;
    if (lower.includes("?code="))      s += 40;
    if (lower.includes("?key="))       s += 35;
    if (lower.includes("/verify/"))    s += 30;
    if (lower.includes("/confirm/"))   s += 30;
    if (lower.includes("/activate/"))  s += 30;
    if (lower.includes("/magic-link")) s += 35;
    if (lower.includes("/auth"))       s += 20;
    if (/[=\/][a-zA-Z0-9]{16,}/.test(url)) s += 20;
    if (url.length < 40) s -= 10;

    if (s > 0) candidates.push({ url, score: s });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return { type: "link", value: best.url, confidence: Math.min(100, best.score) };
}