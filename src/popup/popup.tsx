import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import type { Detection } from "../types";
import "./styles/animations.css";
import "./styles/layout.css";
import "./styles/buttons.css";
import { getStorage, clearDetections } from "../utils/storage";
import { getAuthToken, removeAuthToken, isAuthenticated } from "../auth/auth";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import "./styles/animations.css";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/cards.css";
import "./styles/screens.css";
import { AuthScreen } from "./components/AuthScreen";
import { EmptyScreen } from "./components/EmptyScreen";
import { DetectionList } from "./components/DetectionList";
import "./styles/base.css";


function Popup() {
  const [authenticated, setAuthenticated] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

useEffect(() => {
  async function load() {
    const auth = await isAuthenticated();
    setAuthenticated(auth);
    if (auth) {
      const storage = await getStorage();
      setDetections(storage.detections);
    }
    setLoading(false);
  }
  load();

  const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
    if (changes["otp_extractor"]) {
      const newVal = changes["otp_extractor"].newValue as { detections: Detection[] } | undefined;
      if (newVal?.detections) setDetections(newVal.detections);
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}, []);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    try {
      await getAuthToken();
      setAuthenticated(true);
      const storage = await getStorage();
      setDetections(storage.detections);
    } catch (err) {
      console.error("Login failed:", err);
    }
    setLoading(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      const storage = await getStorage();
      if (storage.accessToken) await removeAuthToken(storage.accessToken);
      setAuthenticated(false);
      setDetections([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setLoading(false);
  }, []);

  const handleCopy = useCallback((id: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => { });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  }, []);

  const handleClear = useCallback(async () => {
    await clearDetections();
    setDetections([]);
  }, []);

  if (loading) {
    return (
      <div className="container popup-enter">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container popup-enter">
      <Header authenticated={authenticated} onLogout={handleLogout} />

      {authenticated && (
        <StatusBar
          showClear={detections.length > 0}
          onClear={handleClear}
        />
      )}

      {!authenticated ? (
        <AuthScreen onConnect={handleLogin} />
      ) : detections.length === 0 ? (
        <EmptyScreen />
      ) : (
        <DetectionList
          detections={detections}
          copiedId={copiedId}
          onCopy={handleCopy}
        />
      )}

      <div className="footer-line" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);