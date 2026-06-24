/**
 * Skeleton shimmer block — standardized replacement for ad-hoc animate-pulse divs.
 *
 * @param {string|number} width       — CSS width (default 'auto')
 * @param {string|number} height      — CSS height (e.g. '16px', '2rem')
 * @param {boolean}       circle      — Makes it a circle (w === h, border-radius 50%)
 * @param {boolean}       pill        — Full border-radius pill
 * @param {string}        className   — Additional Tailwind classes
 */
export default function Skeleton({
  width,
  height,
  circle = false,
  pill = false,
  className = "",
  style = {},
}) {
  const borderRadius = circle ? "50%" : pill ? "9999px" : undefined;

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: circle ? height : width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/** Convenience: a row of label + value skeleton */
export function SkeletonRow({ widthLabel = "30%", widthValue = "60%" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton height="10px" width={widthLabel} />
      <Skeleton height="14px" width={widthValue} />
    </div>
  );
}

/** Convenience: avatar + two text lines */
export function SkeletonUser({ size = 36 }) {
  return (
    <div className="flex items-center gap-3">
      <Skeleton circle height={`${size}px`} />
      <div className="flex-1 space-y-2">
        <Skeleton height="13px" width="55%" />
        <Skeleton height="11px" width="40%" />
      </div>
    </div>
  );
}

/** Convenience: full table row */
export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr className="border-b border-slate-800/40">
      <td className="py-4 px-4">
        <SkeletonUser />
      </td>
      {Array.from({ length: columns - 2 }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton height="13px" width={`${50 + (i % 3) * 15}%`} />
        </td>
      ))}
      <td className="py-4 px-4">
        <div className="flex items-center justify-end gap-2">
          <Skeleton height="30px" width="30px" style={{ borderRadius: "8px" }} />
          <Skeleton height="30px" width="30px" style={{ borderRadius: "8px" }} />
        </div>
      </td>
    </tr>
  );
}
