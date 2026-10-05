"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";
import { Calendar, Users, CalendarDays, Plus, LayoutDashboard, Settings2, ClipboardCheck, Menu, UserRound, X, ChevronDown } from "lucide-react";
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
  const { user, logout, canApproveRoleRequests } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOrganizer = user?.role === "committee" || user?.role === "admin";

  const closeMenu = () => setMenuOpen(false);
  const actionLinks = [
    ...(isOrganizer ? [
      { href: "/events/new", label: "Create event", icon: Plus, primary: true },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ] : []),
    ...(user?.role === "admin" ? [{ href: "/clubs/manage", label: "Manage Clubs", icon: Settings2 }] : []),
    ...(canApproveRoleRequests ? [{ href: "/member-requests", label: "Member requests", icon: ClipboardCheck }] : []),
  ];

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl"
    >
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" onClick={closeMenu} className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/campus-pulse-icon.png"
            alt="Campus Pulse"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="truncate text-lg font-semibold tracking-tight text-white">
            Campus Pulse
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
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
            {!user && <SignUpButton />}
            {user ? (
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white [&::-webkit-details-marker]:hidden">
                  <UserRound className="h-4 w-4" />
                  <span className="max-w-28 truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
                  <p className={cn("px-3 py-2 text-[10px] font-medium uppercase tracking-wide", user.role === "committee" || user.role === "admin" ? "text-emerald-400" : "text-white/45")}>
                    {user.role === "admin" ? "Faculty / Admin" : user.role === "committee" ? "Club Member" : "Participant"}
                  </p>
                  {actionLinks.map((link) => { const Icon = link.icon; return <Link key={link.href} href={link.href} className={cn("flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors", link.primary ? "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25" : "text-white/70 hover:bg-white/10 hover:text-white")}><Icon className="h-4 w-4" />{link.label}</Link>; })}
                  <Link href="/account" className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"><UserRound className="h-4 w-4" />Account</Link>
                  <div className="my-1 border-t border-white/10" />
                  <button type="button" onClick={() => void logout()} className="flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-red-200 transition-colors hover:bg-red-500/10">Log out</button>
                </div>
              </details>
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
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white md:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {menuOpen && <div id="mobile-navigation" className="border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl md:hidden"><div className="mx-auto grid max-w-6xl gap-1">{navLinks.map((link) => { const Icon = link.icon; const active = pathname === link.href || pathname.startsWith(`${link.href}/`); return <Link key={link.href} href={link.href} onClick={closeMenu} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white")}><Icon className="h-4 w-4" />{link.label}</Link>; })}{actionLinks.map((link) => { const Icon = link.icon; return <Link key={link.href} href={link.href} onClick={closeMenu} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", link.primary ? "bg-emerald-500/15 text-emerald-200" : "text-white/65 hover:bg-white/5 hover:text-white")}><Icon className="h-4 w-4" />{link.label}</Link>; })}<div className="mt-2 border-t border-white/10 pt-2">{user ? <><Link href="/account" onClick={closeMenu} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/5 hover:text-white"><UserRound className="h-4 w-4" /> Account</Link><button type="button" onClick={() => { closeMenu(); void logout(); }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-200 hover:bg-red-500/10">Log out</button></> : <div className="grid grid-cols-2 gap-2"><Link href="/login" onClick={closeMenu} className="flex min-h-11 items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white">Login</Link><Link href="/signup" onClick={closeMenu} className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300">Sign up</Link></div>}</div></div></div>}
    </motion.nav>
  );
}
