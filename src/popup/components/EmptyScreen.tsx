import { RadarIllustration } from "./RadarIllustration";

export function EmptyScreen() {
  return (
    <div className="empty-screen">
      <div style={{ marginBottom: 18 }}>
        <RadarIllustration scanning={true} />
      </div>
      <p className="empty-title">Waiting for new emails...</p>
      <p className="empty-sub">OTPs and links will appear here</p>
    </div>
  );
}