import type { Detection } from "../../types";

type Props = {
  detection: Detection;
  onCopy: (id: string, value: string) => void;
  copied: boolean;
  className: string;
};

function shortenUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const path = u.pathname.slice(0, 22);
    return u.hostname + path + (u.pathname.length > 22 ? "…" : "");
  } catch {
    return raw.slice(0, 36) + "…";
  }
}

export function LinkCard({ detection, onCopy, copied, className }: Props) {
  const time = new Date(detection.detectedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`detection-card link ${className}`}>
      <div className="card-top">
        <span className="card-badge link">Link</span>
        <span className="card-time">{time}</span>
      </div>
      <div className="card-link-value">{shortenUrl(detection.value)}</div>
      <div className="card-bottom">
        <span className="card-sender link">{detection.sender}</span>
        <div className="card-actions">
          <button
            className={`btn-copy-cyan${copied ? " copied" : ""}`}
            onClick={() => onCopy(detection.id, detection.value)}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            className="btn-open"
            onClick={() => chrome.tabs.create({ url: detection.value })}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}