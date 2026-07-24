// Hand-drawn SVG icon set — stroke style, inherits currentColor.
// No emoji, no icon library: consistent weight, sized via className.

interface IconProps {
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function CompassIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function D20Icon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" />
      <path d="M12 2v7.5M3.5 7l8.5 2.5L20.5 7M12 22l-4.5-8 4.5-4.5 4.5 4.5z" />
    </svg>
  );
}

export function SmileIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      <circle cx="9" cy="9.5" r="0.5" fill="currentColor" />
      <circle cx="15" cy="9.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function EyeIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function BoltIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M13 2L5 13.5h5.5L11 22l8-11.5h-5.5z" />
    </svg>
  );
}

export function MasksIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 4h8v6a4 4 0 01-8 0z" />
      <path d="M12 10h8v6a4 4 0 01-8 0z" />
      <path d="M6.5 7c.4.4 1 .4 1.4 0M9.5 7c.4.4 1 .4 1.4 0" />
      <path d="M15.9 14.6c-.4-.4-1-.4-1.4 0M19.4 14.6c-.4-.4-1-.4-1.4 0" />
    </svg>
  );
}

export function BookIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 6c-1.5-1.5-3.5-2-6.5-2H4v14h2c2.5 0 4.5.5 6 2 1.5-1.5 3.5-2 6-2h2V4h-1.5c-3 0-5 .5-6.5 2z" />
      <path d="M12 6v14" />
    </svg>
  );
}

export function ScrollIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4h11a2 2 0 012 2v1h-4" />
      <path d="M16 20H6a2 2 0 01-2-2V6a2 2 0 012-2 2 2 0 012 2v12a2 2 0 002 2z" />
      <path d="M16 20a2 2 0 002-2V7M10 9h4M10 13h4" />
    </svg>
  );
}

export function RewindIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M11 19l-7-7 7-7M20 19l-7-7 7-7" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function PencilIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M17 3l4 4L8 20l-5 1 1-5z" />
    </svg>
  );
}

export function XIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SoundOnIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
    </svg>
  );
}

export function SoundOffIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 9l6 6M22 9l-6 6" />
    </svg>
  );
}

export function MusicOnIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </svg>
  );
}

export function MusicOffIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18V9M9 5l11-2v10" opacity="0.5" />
      <circle cx="6.5" cy="18" r="2.5" opacity="0.5" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function toneIcon(tone: string) {
  switch (tone) {
    case "playful":
      return <SmileIcon />;
    case "mystery":
    case "intrigue":
      return <EyeIcon />;
    case "high-stakes":
      return <BoltIcon />;
    default:
      return <SmileIcon />;
  }
}

// ---------- Spot illustrations (same hand-drawn line style) ----------

// A quest emblem — a compass-star medallion in the icon line-style. Symmetric
// geometry reads as "designed" (unlike a hand-coded animal), and the compass
// echoes the app's "your players went off the map" theme. Used on the empty
// state so the tool's purpose reads instantly.
export function QuestEmblem({ className = "h-24 w-24" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* outer + inner medallion rings */}
      <circle cx="32" cy="32" r="27" strokeWidth={1.6} />
      <circle cx="32" cy="32" r="22" strokeWidth={1} opacity={0.5} />
      {/* tick marks around the ring, N/E/S/W longer */}
      <g strokeWidth={1.4}>
        <path d="M32 5v4M32 55v4M5 32h4M55 32h4" />
      </g>
      <g strokeWidth={1} opacity={0.6}>
        <path d="M46.9 12.6l-1.8 2.4M17.1 51.4l1.8-2.4M51.4 46.9l-2.4-1.8M12.6 17.1l2.4 1.8M46.9 51.4l-1.8-2.4M17.1 12.6l1.8 2.4M51.4 17.1l-2.4 1.8M12.6 46.9l2.4-1.8" />
      </g>
      {/* four-point compass star */}
      <path
        d="M32 15l4.5 12.5L49 32l-12.5 4.5L32 49l-4.5-12.5L15 32l12.5-4.5z"
        strokeWidth={1.6}
      />
      {/* secondary diagonal star, lighter, for a filled-out compass rose */}
      <path
        d="M32 22l2 8 8 2-8 2-2 8-2-8-8-2 8-2z"
        strokeWidth={1}
        opacity={0.55}
      />
      <circle cx="32" cy="32" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A simple chapter divider: a centered diamond flanked by rules. Purely
// decorative — echoes a printed adventure book's section breaks.
export function Divider({ className = "" }: IconProps) {
  return (
    <div
      className={`flex items-center gap-3 text-border ${className}`}
      aria-hidden
    >
      <span className="h-px flex-1 bg-current" />
      <svg
        viewBox="0 0 24 24"
        className="h-2.5 w-2.5 text-gold"
        fill="currentColor"
      >
        <path d="M12 2l4 10-4 10-4-10z" />
      </svg>
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}
