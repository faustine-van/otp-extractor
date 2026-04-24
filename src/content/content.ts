import type { Detection } from "../types";

const OTP_SELECTORS = [
  'input[name*="otp"]',
  'input[name*="code"]',
  'input[name*="token"]',
  'input[name*="verify"]',
  'input[name*="pin"]',
  'input[placeholder*="OTP" i]',
  'input[placeholder*="code" i]',
  'input[placeholder*="verify" i]',
  'input[placeholder*="one-time" i]',
  'input[autocomplete="one-time-code"]',
  'input[type="number"]',
];

function findOTPInput(): HTMLInputElement | null {
  for (const selector of OTP_SELECTORS) {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (el) return el;
  }
  return null;
}

function findSplitOTPInputs(): HTMLInputElement[] {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
  const single = inputs.filter(input => {
    const isDigitType =
      input.type === "number" ||
      input.type === "text"   ||
      input.inputMode === "numeric";
    return input.maxLength === 1 && isDigitType;
  });
  return single.length >= 4 && single.length <= 8 ? single : [];
}

function fillInput(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, "value"
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input",  { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function autoFill(otp: string): void {
  const splitInputs = findSplitOTPInputs();
  if (splitInputs.length > 0) {
    otp.split("").forEach((digit, i) => {
      if (splitInputs[i]) fillInput(splitInputs[i], digit);
    });
    return;
  }
  const single = findOTPInput();
  if (single) {
    fillInput(single, otp);
    single.focus();
  }
}

async function copyToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard unavailable
  }
}

chrome.runtime.onMessage.addListener((
  message: { type: string; detection: Detection },
  _sender,
  sendResponse
) => {
  if (message.type !== "OTP_DETECTED") return;

  const { detection } = message;

  copyToClipboard(detection.value);

  if (detection.type === "otp") {
    autoFill(detection.value);
  }

  sendResponse({ success: true });
});