import type { Detection, ExtensionStorage } from "../types";

const STORAGE_KEY = "otp_extractor";

const DEFAULT_STORAGE: ExtensionStorage = {
  detections: [],
  isAuthenticated: false,
  accessToken: null,
};

export async function getStorage(): Promise<ExtensionStorage> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result: Record<string, ExtensionStorage>) => {
      resolve(result[STORAGE_KEY] ?? DEFAULT_STORAGE);
    });
  });
}

export async function saveStorage(data: ExtensionStorage): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, resolve);
  });
}

export async function addDetection(detection: Detection): Promise<void> {
  const storage = await getStorage();
  const updated = [detection, ...storage.detections].slice(0, 10);
  await saveStorage({ ...storage, detections: updated });
}

export async function clearDetections(): Promise<void> {
  const storage = await getStorage();
  await saveStorage({ ...storage, detections: [] });
}