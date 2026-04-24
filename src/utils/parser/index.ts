import { stripHTML } from "./helpers";
import { detectOTP }  from "./otp";
import { detectLink } from "./link";

export interface ParseResult {
  type: "otp" | "link";
  value: string;
  confidence: number;
}

export function parseEmailBody(rawBody: string): ParseResult | null {
  const link = detectLink(rawBody);
  if (link && link.confidence >= 40) return link;

  const otp = detectOTP(stripHTML(rawBody));
  if (otp && otp.confidence >= 25) return otp;

  return link ?? null;
}