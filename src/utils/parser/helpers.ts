export function stripHTML(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/&shy;/g, "")
    .replace(/&#8203;/g, "")
    .replace(/&zwj;/g, "")
    .replace(/&zwnj;/g, "")
    .replace(/&#x200[0-9A-Fa-f];/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function isYear(n: string): boolean {
  const num = parseInt(n, 10);
  return num >= 1900 && num <= 2099;
}

export function isPhoneFragment(n: string, context: string, numIdx: number): boolean {
  const before = context[numIdx - 1];
  const after  = context[numIdx + n.length];
  return before === "-" || before === "." || after === "-" || after === ".";
}

export function isInsideURL(n: string, text: string): boolean {
  const urlRegex = /https?:\/\/[^\s"<>]+/gi;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match[0].includes(n)) return true;
  }
  return false;
}