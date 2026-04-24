type Props = { scanning?: boolean };

export function RadarIllustration({ scanning = false }: Props) {
  const cx = 50, cy = 50, r = 42;
  const color = scanning ? "#00e676" : "#6c63ff";

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: "block" }}>
      <defs>
        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </radialGradient>
        <clipPath id="radarClip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={r + 8} fill="url(#radarGlow)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={1} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
      <circle cx={cx} cy={cy} r={r * 0.33} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={0.6} />
      <circle cx={cx} cy={cy} r={r * 0.66} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={0.6} />

      {scanning ? (
        <g clipPath="url(#radarClip)">
          <g className="sweep-arm" style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#00e676" strokeOpacity={0.9} strokeWidth={1.2} />
          </g>
          <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="#00e676" strokeOpacity={0.6} strokeWidth={1} className="radar-ring"   />
          <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="#00e676" strokeOpacity={0.5} strokeWidth={1} className="radar-ring-2" />
          <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="#00e676" strokeOpacity={0.4} strokeWidth={1} className="radar-ring-3" />
        </g>
      ) : (
        <>
          <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="#6c63ff" strokeOpacity={0.4} strokeWidth={1} className="radar-ring"   />
          <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="#6c63ff" strokeOpacity={0.3} strokeWidth={1} className="radar-ring-2" />
        </>
      )}

      <circle cx={cx} cy={cy} r={2.5} fill={color} opacity={0.9} />
    </svg>
  );
}