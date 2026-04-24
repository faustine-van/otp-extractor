import type { Detection } from "../../types";
import { OTPCard } from "./OTPCard";
import { LinkCard } from "./LinkCard";

type Props = {
  detections: Detection[];
  copiedId: string | null;
  onCopy: (id: string, value: string) => void;
};

const cardClass = (i: number) => `card-enter-${Math.min(i + 1, 5)}`;

export function DetectionList({ detections, copiedId, onCopy }: Props) {
  return (
    <div className="detection-list">
      {detections.map((d, i) =>
        d.type === "otp" ? (
          <OTPCard
            key={d.id}
            detection={d}
            onCopy={onCopy}
            copied={copiedId === d.id}
            className={cardClass(i)}
          />
        ) : (
          <LinkCard
            key={d.id}
            detection={d}
            onCopy={onCopy}
            copied={copiedId === d.id}
            className={cardClass(i)}
          />
        )
      )}
    </div>
  );
}