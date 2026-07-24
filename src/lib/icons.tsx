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

// A friendly tusked boar — the demo's Stormbristle Boar, used as the hero
// illustration on the empty state so the tool's purpose reads instantly.
export function BoarIllustration({ className = "h-24 w-24" }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.4} className={className}>
      {/* body */}
      <path d="M3.5 14c0-2.5 2-4.2 4.5-4.4 1-1.2 2.6-1.9 4.3-1.9 2.8 0 5.2 1.7 5.9 4.1.9.3 1.8.9 1.8 1.9 0 .7-.5 1.2-1.1 1.4l-.6 2.2h-1.6l-.4-1.5c-.7.2-1.5.3-2.3.3H9.2l-.4 1.2H7.2l-.3-1.5C5 15.9 3.5 15.1 3.5 14z" />
      {/* snout + tusks */}
      <path d="M3.5 13.9l-1.3.3M4.2 15.3c-.5.2-.9.7-.7 1.2M5.3 12.4c-.6-.5-1.4-.4-1.8.2" />
      {/* ear + eye */}
      <path d="M9.6 9.9l1-1.8 1.2 1.4" />
      <circle cx="6.7" cy="12.7" r="0.4" fill="currentColor" />
      {/* little storm sparks, nodding at "Stormbristle" */}
      <path d="M15 6.5l-1 1.7h1.3l-1 1.6" />
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
