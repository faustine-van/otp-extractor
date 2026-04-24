import { RadarIllustration } from "./RadarIllustration";

type Props = { onConnect: () => void };

export function AuthScreen({ onConnect }: Props) {
  return (
    <div className="auth-screen">
      <div className="auth-radar">
        <RadarIllustration scanning={false} />
      </div>
      <p className="auth-desc">
        Connect Gmail to start extracting OTPs automatically
      </p>
      <button className="btn-connect" onClick={onConnect}>
        Connect Gmail
      </button>
      <p className="auth-note">Read-only access only</p>
    </div>
  );
}