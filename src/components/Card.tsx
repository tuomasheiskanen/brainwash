import type { ReactNode } from "react";

/** White rounded card matching the design's section containers. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card bg-surface shadow-card ${className}`}>
      {children}
    </div>
  );
}
