"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";
import { Calendar, Users, CalendarDays, Plus, LayoutDashboard, Settings2 } from "lucide-react";
import { motion } from "motion/react";

const navLinks = [
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/clubs", label: "Clubs", icon: Users },
];

export function AllEventsButton() {
  return (
    <Link
      href="/"
      className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
    >
      <Calendar className="h-4 w-4" />
      <motion.span
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2"
      >
        All Events
      </motion.span>
    </Link>
  );
}

export function SignUpButton() {
  return (
    <Link
      href="/signup"
      className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
    >
      Sign Up
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl"
    >
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
                  "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white/90"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-white/10"
                    transition={{ type: "spring", bounce: 0.2, visualDuration: 0.4 }}
                  />
                )}
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative z-10 flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </motion.span>
              </Link>
            );
          })}

          <div className="ml-3 flex items-center gap-2 border-l border-white/10 pl-3">
            {(user?.role === "committee" || user?.role === "admin") && (
              <Link
                href="/events/new"
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
              >
                <Plus className="h-3.5 w-3.5" />
                Create event
              </Link>
            )}
            {(user?.role === "committee" || user?.role === "admin") && (
              <Link href="/dashboard" className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/clubs/manage" className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <Settings2 className="h-3.5 w-3.5" /> Manage Clubs
              </Link>
            )}
            {!user && <SignUpButton />}
            {user ? (
              <>
                <span className="text-sm text-white/70">{user.name}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    user.role === "committee" || user.role === "admin"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/10 text-white/50"
                  )}
                >
                  {user.role === "admin" ? "Faculty / Admin" : user.role === "committee" ? "Club Member" : "Participant"}
                </span>
                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/login"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  Login
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
