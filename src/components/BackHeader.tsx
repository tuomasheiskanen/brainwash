import Link from "next/link";

/** Back arrow + title for the exercise sub-flows (no bottom tab bar). */
export function BackHeader({
  title,
  href,
  big = false,
}: {
  title: string;
  href: string;
  big?: boolean;
}) {
  return (
    <div className="mb-5 flex items-center gap-3.5">
      <Link
        href={href}
        aria-label="Back"
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white text-[18px] text-faint shadow-chip"
      >
        ‹
      </Link>
      <div
        className={`${big ? "text-[22px]" : "text-[20px]"} font-extrabold tracking-[-0.02em]`}
      >
        {title}
      </div>
    </div>
  );
}
