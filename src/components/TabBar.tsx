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

function GlassIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3 L7.5 21 H16.5 L18 3 Z" />
      <path d="M6.6 9 H17.4" />
    </svg>
  );
}

function ExerciseIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 H7 L9.5 5 L14 19 L16 12 H21" />
    </svg>
  );
}

function TrendIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 V19 H20" />
      <path d="M6 15 L10 10 L13.5 13 L19 6" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/alcohol", label: "Alcohol", Icon: GlassIcon },
  { href: "/exercise", label: "Exercise", Icon: ExerciseIcon },
  { href: "/history", label: "Trends", Icon: TrendIcon },
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
