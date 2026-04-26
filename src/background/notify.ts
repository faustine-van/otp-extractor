import type { Detection } from "../types";


const SKIP_PREFIXES = ["chrome://", "edge://", "chrome-extension://"];

export function showNotification(detection: Detection): void {
  const ICON_URL = chrome.runtime.getURL("icons/icon48.png");
  chrome.notifications.create({
    type: "basic",
    iconUrl: ICON_URL,
    title: detection.type === "otp" ? "OTP Detected" : "Verification Link Detected",
    message: detection.type === "otp"
      ? `Code: ${detection.value}`
      : `From: ${detection.sender}`,
    priority: 2,
  });
}

export function sendToActiveTab(detection: Detection): void {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab?.id) return;
    if (SKIP_PREFIXES.some(p => (tab.url ?? "").startsWith(p))) return;
    chrome.tabs
      .sendMessage(tab.id, { type: "OTP_DETECTED", detection })
      .catch(() => {});
  });
}