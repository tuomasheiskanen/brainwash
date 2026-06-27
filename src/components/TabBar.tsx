"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path d="M4 11 L12 4 L20 11 V20 H4 Z" />
    </svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M4 9 H20 M8 3 V7 M16 3 V7" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/history", label: "History", Icon: CalendarIcon },
];

/** Bottom navigation, fixed to the phone column, frosted like the design. */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="absolute inset-x-0 bottom-0 z-10 flex h-[76px] items-start justify-around border-t border-divider bg-white/90 pt-3 backdrop-blur-md">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const color = active ? "#14b8a6" : "#b6bcc4";
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1"
            style={{ color }}
            aria-current={active ? "page" : undefined}
          >
            <Icon color={color} />
            <span className={`text-[10.5px] ${active ? "font-bold" : "font-semibold"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
