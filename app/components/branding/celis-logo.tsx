import { cn } from "~/lib/utils";

export type CelisLogoVariant = "primary" | "reversed" | "mark-only" | "auto";

export interface CelisLogoProps {
  /** Visual variant. `auto` adapts to light/dark via tokens (recommended). */
  variant?: CelisLogoVariant;
  /** Master height in px. Default 48 for header visibility. */
  size?: number;
  /** Additional classes applied to the root element. */
  className?: string;
  /** Whether to wrap the mark in a high-contrast badge. */
  badge?: boolean;
}

/**
 * Celis — Geometric dual-interlocking exchange mark.
 *
 * The mark is a single-stroke construction of two mirrored C-shaped arcs
 * interlocking at a shared central node. It renders from a 40×40px master
 * coordinate system and scales cleanly across sizes.
 *
 * Default header size is 48px so the brand is immediately readable on mobile.
 */
export function CelisLogo({
  variant = "auto",
  size = 48,
  className,
  badge = true,
}: CelisLogoProps) {
  const showType = variant !== "mark-only";
  const strokeWidth = Math.max(2.5, size * 0.055);
  const markWrapperSize = size * 1.2;

  const markColor =
    variant === "reversed"
      ? "text-white"
      : variant === "primary"
      ? "text-celis-primary"
      : badge
      ? "text-white"
      : "text-celis-primary";

  const typeColor =
    variant === "reversed"
      ? "text-white"
      : variant === "primary"
      ? "text-celis-ink"
      : "text-celis-ink dark:text-celis-ink";

  const badgeClass =
    "flex items-center justify-center rounded-2xl bg-celis-primary shadow-sm ring-1 ring-celis-primary/30";

  return (
    <div
      className={cn("inline-flex items-center", className)}
      style={{ gap: size * 0.35 }}
      role="img"
      aria-label="Celis"
    >
      <div
        className={cn(badge && badgeClass)}
        style={{
          width: badge ? markWrapperSize : size,
          height: badge ? markWrapperSize : size,
        }}
      >
        <svg
          viewBox="0 0 40 40"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          className={cn("shrink-0", markColor)}
          aria-hidden="true"
        >
          <path
            d="M 22 8 A 12 12 0 1 0 22 32"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 18 8 A 12 12 0 1 1 18 32"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="18"
            y1="20"
            x2="22"
            y2="20"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showType && (
        <span
          className={cn(
            "select-none whitespace-nowrap font-extrabold leading-none",
            typeColor
          )}
          style={{
            fontSize: size * 0.8,
            letterSpacing: "-0.02em",
          }}
        >
          Celis
        </span>
      )}
    </div>
  );
}

export default CelisLogo;
