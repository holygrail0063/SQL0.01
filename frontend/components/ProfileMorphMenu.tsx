"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleHelp, LogOut, Moon, SlidersHorizontal, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getProfile, profileDisplayName, type Profile } from "@/lib/progress";
import { requireSupabase } from "@/lib/supabase";

const ease = [0.22, 1, 0.36, 1] as const;

const menuItems = [
  { href: "/account", label: "Account", icon: UserRound },
  { href: "/account/preferences", label: "Learning Preferences", icon: SlidersHorizontal },
  { href: "/account/appearance", label: "Appearance", icon: Moon },
  { href: "/account/help", label: "Help", icon: CircleHelp },
];

export function ProfileMorphMenu({ user, currentPath }: { user: User | null; currentPath: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [openSize, setOpenSize] = useState({ width: 288, height: 340 });

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    getProfile(user).then(setProfile).catch(() => setProfile(null));
  }, [user]);

  useEffect(() => {
    function updateOpenSize() {
      setOpenSize({
        width: Math.max(240, Math.min(288, window.innerWidth - 24)),
        height: Math.max(280, Math.min(300, window.innerHeight - 80)),
      });
    }

    updateOpenSize();
    window.addEventListener("resize", updateOpenSize);
    return () => window.removeEventListener("resize", updateOpenSize);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutside(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      window.setTimeout(() => triggerRef.current?.focus(), reduceMotion ? 0 : 160);
    }

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, reduceMotion]);

  async function logout() {
    setIsOpen(false);
    await requireSupabase().auth.signOut();
    router.replace("/");
  }

  const displayName = profileDisplayName(profile, user) || user?.email || "Account";
  const initials = accountInitials(profile, user);
  const pathLabel = profile?.selected_role ? `${profile.selected_role} Path` : user?.email ? user.email : "QueryRight";

  return (
    <div ref={rootRef} className="relative h-10 w-10 shrink-0">
      <motion.div
        animate={{
          width: isOpen ? openSize.width : 40,
          height: isOpen ? openSize.height : 40,
          borderRadius: isOpen ? "1.375rem" : "999px",
        }}
        className="absolute right-0 top-0 z-50 overflow-hidden border border-line bg-elevated shadow-2xl shadow-slate-950/35"
        initial={false}
        transition={reduceMotion ? { duration: 0.12 } : { duration: 0.58, ease }}
      >
        <motion.div
          aria-hidden="true"
          animate={{
            opacity: isOpen ? 1 : 0,
            scale: isOpen ? 8.8 : 0.2,
            x: isOpen ? -92 : 0,
            y: isOpen ? 84 : 0,
          }}
          className="absolute right-2 top-2 h-10 w-10 rounded-full bg-brand/10"
          initial={false}
          transition={reduceMotion ? { duration: 0.08 } : { duration: 0.48, ease }}
        />
        <motion.div
          aria-hidden="true"
          animate={{ opacity: isOpen ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-transparent to-cyan/5"
          initial={false}
          transition={{ duration: reduceMotion ? 0.08 : 0.28 }}
        />

        <button
          ref={triggerRef}
          aria-controls="profile-morph-menu"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={isOpen ? "Close account menu" : "Open account menu"}
          className="absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-sm font-bold text-slate-50 outline-none transition hover:border-brand/40 hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {!isOpen && initials}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              animate={{ opacity: 1 }}
              className="relative z-0 flex h-full flex-col overflow-hidden px-4 pb-3 pt-6"
              exit={{ opacity: 0 }}
              id="profile-morph-menu"
              initial={{ opacity: 0 }}
              role="menu"
              transition={{ duration: reduceMotion ? 0.08 : 0.2, delay: reduceMotion ? 0 : 0.08 }}
            >
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="pb-3"
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                transition={{ duration: reduceMotion ? 0.08 : 0.24, ease }}
              >
                <p className="truncate text-sm font-semibold text-slate-50">{displayName}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{pathLabel}</p>
              </motion.div>

              <div className="h-px bg-line" />
              <div className="py-1">
                {menuItems.map((item, index) => (
                  <MorphMenuLink
                    active={isActiveAccountPath(currentPath, item.href)}
                    delay={0.12 + index * 0.045}
                    href={item.href}
                    icon={item.icon}
                    key={item.href}
                    label={item.label}
                    onSelect={() => setIsOpen(false)}
                    reduceMotion={Boolean(reduceMotion)}
                  />
                ))}
              </div>
              <div className="h-px bg-line" />
              <motion.button
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 flex min-h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-300 outline-none transition hover:bg-red-950/30 hover:text-red-100 focus-visible:ring-2 focus-visible:ring-brand"
                exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                onClick={logout}
                role="menuitem"
                transition={{ duration: reduceMotion ? 0.08 : 0.24, delay: reduceMotion ? 0 : 0.3, ease }}
                type="button"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                <LogOut size={17} className="text-slate-500" />
                <span>Log out</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MorphMenuLink({
  active,
  delay,
  href,
  icon: Icon,
  label,
  onSelect,
  reduceMotion,
}: {
  active: boolean;
  delay: number;
  href: string;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
      transition={{ duration: reduceMotion ? 0.08 : 0.24, delay: reduceMotion ? 0 : delay, ease }}
    >
      <Link
        className={`group relative flex min-h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
          active ? "bg-brand/10 text-slate-50" : "text-slate-300 hover:bg-brand/10 hover:text-slate-50"
        }`}
        href={href}
        onClick={onSelect}
        role="menuitem"
      >
        <span className={`h-1.5 w-1.5 rounded-full transition ${active ? "bg-brand" : "bg-transparent group-hover:bg-brand/70"}`} />
        <Icon size={17} className={`transition ${active ? "text-brand" : "text-slate-500 group-hover:text-brand"}`} />
        <RollingText label={label} reduceMotion={reduceMotion} />
      </Link>
    </motion.div>
  );
}

function RollingText({ label, reduceMotion }: { label: string; reduceMotion: boolean }) {
  if (reduceMotion) return <span>{label}</span>;

  return (
    <span className="relative inline-flex h-5 overflow-hidden" aria-label={label}>
      <span className="transition-transform duration-300 ease-out group-hover:-translate-y-5" aria-hidden="true">
        {label}
      </span>
      <span className="absolute left-0 top-5 text-slate-50 transition-transform duration-300 ease-out group-hover:-translate-y-5" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}

function isActiveAccountPath(pathname: string, href: string) {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function accountInitials(profile: Profile | null, user: User | null) {
  const first = profile?.first_name?.trim()[0] ?? stringMetadata(user, "first_name")?.[0] ?? stringMetadata(user, "given_name")?.[0] ?? "";
  const last = profile?.last_name?.trim()[0] ?? stringMetadata(user, "last_name")?.[0] ?? stringMetadata(user, "family_name")?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  if (initials) return initials;
  return (user?.email?.slice(0, 2) || "QR").toUpperCase();
}

function stringMetadata(user: User | null, key: string) {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}
