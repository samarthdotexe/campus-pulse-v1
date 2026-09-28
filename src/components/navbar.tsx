"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";
import { Calendar, Users, CalendarDays } from "lucide-react";

const navLinks = [
  { href: "/", label: "Events", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/clubs", label: "Clubs", icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/campus-pulse-icon.png"
            alt="Campus Pulse"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-white">
            Campus Pulse
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}

          <div className="ml-3 flex items-center gap-2 border-l border-white/10 pl-3">
            {user ? (
              <>
                <span className="text-sm text-white/70">{user.name}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    user.role === "committee"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/10 text-white/50"
                  )}
                >
                  {user.role === "committee" ? "Committee" : "Participant"}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
