import { getAuthToken } from "../auth/auth";
import { parseEmailBody } from "../utils/parser";
import { addDetection } from "../utils/storage";
import type { Detection } from "../types";
import { fetchUnreadEmails, fetchRelevantEmails, extractBody, extractHeader } from "./gmail";
import { showNotification, sendToActiveTab } from "./notify";

const ALARM_NAME = "poll-gmail";

async function getProcessedIds(): Promise<Set<string>> {
  return new Promise(resolve => {
    chrome.storage.local.get("processedIds", (result: Record<string, string[]>) => {
      const ids = result["processedIds"];
      resolve(new Set(Array.isArray(ids) ? ids : []));
    });
  });
}

async function saveProcessedIds(ids: Set<string>): Promise<void> {
  const trimmed = [...ids].slice(-100);
  return new Promise(resolve => {
    chrome.storage.local.set({ processedIds: trimmed }, resolve);
  });
}

export async function pollGmail(): Promise<void> {
  let token: string;
  try {
    token = await getAuthToken();
  } catch {
    return;
  }

  try {
    const [unread, processedIds] = await Promise.all([
      fetchUnreadEmails(token),
      getProcessedIds(),
    ]);

    const newMessages = unread.filter(m => !processedIds.has(m.id));
    if (!newMessages.length) return;

    const relevant = await fetchRelevantEmails(token, newMessages);
    let hasNew = false;

    for (const { id, message } of relevant) {
      const body   = extractBody(message.payload);
      const result = parseEmailBody(body);

      processedIds.add(id);
      hasNew = true;

      if (!result) continue;

      const headers = message.payload?.headers ?? [];
      const detection: Detection = {
        id,
        type: result.type,
        value: result.value,
        sender: extractHeader(headers, "from"),
        subject: extractHeader(headers, "subject"),
        detectedAt: Date.now(),
      };

      await addDetection(detection);
      showNotification(detection);
      sendToActiveTab(detection);
    }

    if (hasNew) await saveProcessedIds(processedIds);

  } catch (err) {
    console.error("Poll error:", err);
  }
}

export function setupAlarm(): void {
  chrome.alarms.get(ALARM_NAME, existing => {
    if (!existing) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    }
  });
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === ALARM_NAME) pollGmail();
  });
}