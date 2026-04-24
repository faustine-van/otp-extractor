import type { Detection } from "../../types";

type Props = {
  detection: Detection;
  onCopy: (id: string, value: string) => void;
  copied: boolean;
  className: string;
};

export function OTPCard({ detection, onCopy, copied, className }: Props) {
  const formatted = detection.value.replace(/(\d{3})(\d{3})/, "$1 $2");
  const time = new Date(detection.detectedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`detection-card otp ${className}`}>
      <div className="card-top">
        <span className="card-badge otp">OTP</span>
        <span className="card-time">{time}</span>
      </div>
      <div className="card-otp-value">{formatted}</div>
      <div className="card-bottom">
        <span className="card-sender">{detection.sender}</span>
        <button
          className={`btn-copy${copied ? " copied" : ""}`}
          onClick={() => onCopy(detection.id, detection.value)}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}