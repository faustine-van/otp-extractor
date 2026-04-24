import type { ParseResult } from "./index";
import { isYear, isPhoneFragment, isInsideURL } from "./helpers";

const OTP_KEYWORDS = [
  "otp", "one-time", "one time", "passcode", "pass code",
  "verification code", "verify code", "your code", "your pin",
  "confirmation code", "security code", "login code",
  "access code", "auth code", "authentication code",
  "enter code", "use code", "use this code",
  "2fa", "two-factor", "two factor",
];

function score(num: string, numIdx: number, text: string, kwIdx: number): number {
  if (isYear(num))                        return -1;
  if (isInsideURL(num, text))             return -1;
  if (isPhoneFragment(num, text))         return -1;

  const around = text.slice(Math.max(0, numIdx - 1), numIdx + num.length + 1);
  if (/\d{9,}/.test(around))             return -1;

  let s = 0;

  if      (num.length === 6) s += 40;
  else if (num.length === 4) s += 20;
  else if (num.length === 5) s += 15;
  else if (num.length === 7) s += 10;
  else                       s += 5;

  const dist = Math.abs(numIdx - kwIdx);
  if      (dist < 20)  s += 40;
  else if (dist < 50)  s += 30;
  else if (dist < 100) s += 20;
  else if (dist < 200) s += 10;

  const before = text.slice(Math.max(0, numIdx - 10), numIdx).toLowerCase();
  if (/[:,\-]\s*$/.test(before)) s += 15;
  if (/\bis\s+$/.test(before))   s += 15;
  if (/\bcode\s+$/.test(before)) s += 10;

  return s;
}

export function detectOTP(text: string): ParseResult | null {
  const lower = text.toLowerCase();
  const candidates: { value: string; score: number }[] = [];

  for (const keyword of OTP_KEYWORDS) {
    let kwIdx = lower.indexOf(keyword);
    while (kwIdx !== -1) {
      const winStart = Math.max(0, kwIdx - 50);
      const winEnd   = Math.min(text.length, kwIdx + keyword.length + 200);
      const window   = text.slice(winStart, winEnd);
      const numRe    = /\b(\d{4,8})\b/g;
      let m;
      while ((m = numRe.exec(window)) !== null) {
        const s = score(m[1], winStart + m.index, text, kwIdx);
        if (s > 0) candidates.push({ value: m[1], score: s });
      }
      kwIdx = lower.indexOf(keyword, kwIdx + 1);
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (best.score < 25) return null;

  return { type: "otp", value: best.value, confidence: Math.min(100, best.score) };
}