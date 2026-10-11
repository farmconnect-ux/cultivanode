"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/shadcn/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/tooltip";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { BrandLockup } from "./brand";
import { Icon } from "./icon";
import { LocaleSwitch } from "./locale-switch";
import { ScreenToasts } from "./screen-dialog";
import type { NavGroup, NavItem } from "./nav-config";

export type ShellUser = { name: string; subtitle: string; initials: string };
export type ShellContext = { eyebrow: string; title: string; meta: string; status?: string; href?: string };
export type ShellWorkspace = { id: string; name: string; description: string };

type AppShellProps = {
  /** Prefix for nav hrefs: "/en" for the account area, "" for the admin console. */
  basePath: string;
  lang?: Locale;
  groups: NavGroup[];
  user: ShellUser;
  context?: ShellContext;
  workspaces?: ShellWorkspace[];
  activeWorkspace?: string;
  unreadCount?: number;
  notificationsHref?: string;
  profileHref?: string;
  settingsHref?: string;
  supportHref?: string;
  signOutAction: (form: FormData) => void | Promise<void>;
  signOutLabel?: string;
  brandTagline?: string;
  consoleBadge?: string;
  children: React.ReactNode;
};

/** Season names for the South-West growing calendar, derived from today's date. */
function currentSeason(d = new Date()) {
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 2 && m <= 6) return `Early Rains ${y}`;
  if (m >= 7 && m <= 10) return `Late Rains ${y}`;
  return `Dry Season ${m === 11 ? `${y}/${String(y + 1).slice(2)}` : `${y - 1}/${String(y).slice(2)}`}`;
}

function useOnline() {
  return React.useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

function isActive(pathname: string, full: string, exact?: boolean) {
  const clean = full.split("?")[0]!;
  if (exact) return pathname === clean;
  return pathname === clean || pathname.startsWith(clean + "/");
}

/** The longest matching nav href wins, so "/account/farms/map" doesn't also light up "/account/farms". */
function useActiveHref(groups: NavGroup[], basePath: string) {
  const pathname = usePathname() ?? "";
  return React.useMemo(() => {
    let best: string | null = null;
    for (const g of groups)
      for (const it of g.items) {
        const full = basePath + it.href;
        if (isActive(pathname, full, it.exact) && (!best || full.length > best.length)) best = full;
      }
    return best;
  }, [groups, basePath, pathname]);
}

function withWorkspace(href: string, ws: string | null) {
  if (!ws) return href;
  return href + (href.includes("?") ? "&" : "?") + `ws=${ws}`;
}

function NavLink({ item, href, active, onNavigate }: { item: NavItem; href: string; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm transition-all duration-150",
        active
          ? "bg-primary-container font-semibold text-white shadow-card"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
      )}
    >
      <Icon
        name={item.icon}
        filled={active}
        className={cn("text-[1.2rem] transition-colors", active ? "text-secondary-fixed-dim" : "text-secondary group-hover:text-primary-container")}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span
          className={cn(
            "rounded-full px-1.5 py-px font-label-sm text-[0.625rem] uppercase",
            active ? "bg-white/15 text-white" : "bg-secondary-container/60 text-on-secondary-container",
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavGroups({
  groups,
  basePath,
  ws,
  onNavigate,
}: {
  groups: NavGroup[];
  basePath: string;
  ws: string | null;
  onNavigate?: () => void;
}) {
  const activeHref = useActiveHref(groups, basePath);
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-5">
      {groups.map((g) => {
        const containsActive = g.items.some((it) => basePath + it.href === activeHref);
        const list = (
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const full = basePath + it.href;
              return (
                <li key={g.id + it.href}>
                  <NavLink item={it} href={withWorkspace(full, ws)} active={full === activeHref} onNavigate={onNavigate} />
                </li>
              );
            })}
          </ul>
        );
        if (g.collapsible) {
          return (
            <details key={g.id} className="group/details" open={containsActive || undefined}>
              <summary className="flex list-none items-center justify-between rounded-lg px-3 pb-1.5 font-label-sm text-label-sm uppercase text-outline transition-colors hover:text-on-surface [&::-webkit-details-marker]:hidden">
                {g.label}
                <Icon name="expand_more" className="text-base transition-transform duration-200 group-open/details:rotate-180" />
              </summary>
              {list}
            </details>
          );
        }
        return (
          <div key={g.id}>
            <p className="px-3 pb-1.5 font-label-sm text-label-sm uppercase text-outline">{g.label}</p>
            {list}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  props,
  ws,
  onNavigate,
}: {
  props: AppShellProps;
  ws: string | null;
  onNavigate?: () => void;
}) {
  const online = useOnline();
  const { context, workspaces, activeWorkspace, basePath } = props;
  const searchParams = useSearchParams();
  const current = workspaces?.find((w) => w.id === activeWorkspace);

  const workspaceHref = (id: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("ws", id);
    // Workspace home is the account root; switching from a deep page lands there.
    return `${basePath}/account?${params.toString()}`;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href={basePath + (props.consoleBadge ? "/admin" : "/account")} className="min-w-0 rounded-lg" onClick={onNavigate}>
          <BrandLockup tagline={props.brandTagline} />
        </Link>
        {props.consoleBadge && (
          <span className="ml-auto rounded-full bg-primary-container px-2 py-0.5 font-label-sm text-[0.625rem] uppercase text-secondary-fixed-dim">
            {props.consoleBadge}
          </span>
        )}
      </div>

      {(context || (workspaces && workspaces.length > 0)) && (
        <div className="px-4 pb-3">
          <div className="rounded-xl border border-border bg-surface-container-lowest p-3 shadow-card">
            {current && workspaces && workspaces.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="min-w-0">
                    <span className="block font-label-sm text-label-sm uppercase text-outline">Workspace</span>
                    <span className="block truncate font-label-lg text-label-lg text-on-surface">{current.name}</span>
                  </span>
                  <Icon name="unfold_more" className="text-lg text-on-surface-variant transition-colors group-hover:text-on-surface" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                  {workspaces.map((w) => (
                    <DropdownMenuItem key={w.id} asChild>
                      <Link href={workspaceHref(w.id)} onClick={onNavigate}>
                        <Icon name={w.id === activeWorkspace ? "radio_button_checked" : "radio_button_unchecked"} />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-semibold">{w.name}</span>
                          <span className="truncate text-label-sm text-on-surface-variant">{w.description}</span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : current ? (
              <div>
                <span className="block font-label-sm text-label-sm uppercase text-outline">Workspace</span>
                <span className="block truncate font-label-lg text-label-lg text-on-surface">{current.name}</span>
              </div>
            ) : null}
            {context && (
              <Link
                href={context.href ?? "#"}
                onClick={onNavigate}
                className={cn("block rounded-lg", current && "mt-2.5 border-t border-[#f1f5f9] pt-2.5")}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm uppercase text-outline">{context.eyebrow}</span>
                  {context.status && (
                    <span className="rounded-full bg-secondary-container px-1.5 py-px font-label-sm text-[0.625rem] text-on-secondary-container">
                      {context.status}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate font-label-md text-label-md text-on-surface">{context.title}</span>
                <span className="block truncate text-body-sm text-on-surface-variant">{context.meta}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1">
        <NavGroups groups={props.groups} basePath={basePath} ws={ws} onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 space-y-2 border-t border-border bg-surface-container-low p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-surface-container-lowest px-3 py-2 shadow-card" aria-live="polite">
          <span className={cn("size-2 rounded-full", online ? "bg-secondary animate-pulse-dot" : "bg-caution")} />
          <span className="min-w-0 flex-1">
            <span className="block font-label-md text-label-md text-on-surface">{online ? "Online · live sync" : "Offline"}</span>
            <span className="block truncate text-label-sm font-normal text-on-surface-variant">
              {online ? "Records save as you work" : "Changes resume when you reconnect"}
            </span>
          </span>
          <Icon name={online ? "cloud_done" : "cloud_off"} className={online ? "text-secondary" : "text-caution"} />
        </div>
        {props.supportHref && (
          <a
            href={props.supportHref}
            target={props.supportHref.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-secondary font-label-md text-label-md text-white transition-colors hover:bg-primary-container"
          >
            <Icon name="support_agent" className="text-lg" />
            Emergency Agronomist
          </a>
        )}
      </div>
    </div>
  );
}

/** Quick navigation: type to jump to any page in the sidebar. "/" focuses it. */
function QuickSearch({ groups, basePath, ws }: { groups: NavGroup[]; basePath: string; ws: string | null }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const items = React.useMemo(() => groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label }))), [groups]);
  const results = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return items.filter((it) => (it.label + " " + it.group).toLowerCase().includes(s)).slice(0, 7);
  }, [q, items]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setQ("");
    setOpen(false);
    router.push(withWorkspace(basePath + href, ws));
  };

  return (
    <div className="relative w-full max-w-md">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setCursor(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === "Enter" && results[cursor]) {
            go(results[cursor]!.href);
          } else if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="Search farms, operations, records…"
        aria-label="Search pages"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="quick-search-results"
        className="h-9 w-full rounded-lg border border-border bg-surface-container-lowest pl-9 pr-10 text-body-sm text-on-surface shadow-card outline-none transition-[border-color,box-shadow] placeholder:text-outline focus:border-primary-container focus:ring-[3px] focus:ring-primary-container/10"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface-container-low px-1.5 font-label-sm text-[0.625rem] text-outline sm:block">
        /
      </kbd>
      {open && results.length > 0 && (
        <ul
          id="quick-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-overlay animate-in fade-in-0 zoom-in-95"
        >
          {results.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.href)}
                onMouseEnter={() => setCursor(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-body-sm transition-colors",
                  i === cursor ? "bg-surface-container-low text-on-surface" : "text-on-surface-variant",
                )}
              >
                <Icon name={r.icon} className="text-lg text-secondary" />
                <span className="flex-1 truncate">{r.label}</span>
                <span className="text-label-sm text-outline">{r.group}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  const { basePath, lang, user, unreadCount = 0, children } = props;
  const searchParams = useSearchParams();
  const ws = searchParams?.get("ws") ?? null;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const season = React.useMemo(() => currentSeason(), []);

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-surface-container-lowest focus:px-4 focus:py-2 focus:shadow-overlay"
        >
          Skip to content
        </a>

        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-surface-container-low lg:block">
          <SidebarBody props={props} ws={ws} />
        </aside>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-border bg-surface/95">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
                    <Icon name="menu" className="text-xl" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SidebarBody props={props} ws={ws} onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="hidden min-w-0 flex-1 md:block">
                <QuickSearch groups={props.groups} basePath={basePath} ws={ws} />
              </div>
              <div className="min-w-0 flex-1 md:hidden">
                <BrandLockup compact tagline={null} />
              </div>

              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                <div className="hidden items-center gap-1.5 rounded-lg border border-surface-container bg-surface-container-lowest px-3 py-1.5 shadow-card xl:flex">
                  <Icon name="routine" className="text-base text-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Season</span>
                  <span className="font-label-sm text-label-sm font-bold text-primary">{season}</span>
                </div>
                {lang && <LocaleSwitch current={lang} className="hidden sm:flex" />}
                {props.supportHref && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a href={props.supportHref} target={props.supportHref.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" aria-label="Help & support">
                          <Icon name="help" className="text-xl" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Help & SOP support</TooltipContent>
                  </Tooltip>
                )}
                {props.notificationsHref && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" asChild className="relative">
                        <Link href={props.notificationsHref} aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}>
                          <Icon name="notifications" className="text-xl" filled={unreadCount > 0} />
                          {unreadCount > 0 && (
                            <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[0.625rem] font-bold leading-4 text-white ring-2 ring-surface">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Notifications</TooltipContent>
                  </Tooltip>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-full border border-border bg-surface-container-lowest py-1 pl-1 pr-1 shadow-card outline-none transition-colors hover:border-[#cbd5e1] focus-visible:ring-2 focus-visible:ring-ring sm:pr-3">
                    <Avatar className="size-7 ring-0">
                      <AvatarFallback className="text-[0.6875rem]">{user.initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-40 flex-col text-left leading-tight sm:flex">
                      <span className="truncate font-label-md text-label-md text-on-surface">{user.name}</span>
                      <span className="truncate text-[0.6875rem] text-on-surface-variant">{user.subtitle}</span>
                    </span>
                    <Icon name="expand_more" className="hidden text-base text-on-surface-variant sm:block" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="normal-case">
                      <span className="block text-body-sm font-semibold text-on-surface">{user.name}</span>
                      <span className="block text-label-sm font-normal text-on-surface-variant">{user.subtitle}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {props.profileHref && (
                      <DropdownMenuItem asChild>
                        <Link href={props.profileHref}>
                          <Icon name="person" /> Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {props.settingsHref && (
                      <DropdownMenuItem asChild>
                        <Link href={props.settingsHref}>
                          <Icon name="settings" /> Settings & roles
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <form action={props.signOutAction}>
                      {lang && <input type="hidden" name="lang" value={lang} />}
                      <DropdownMenuItem asChild variant="destructive">
                        <button type="submit" className="w-full">
                          <Icon name="logout" className="!text-critical" /> {props.signOutLabel ?? "Sign out"}
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
          {basePath === "" && <ScreenToasts />}
        </div>
      </div>
    </TooltipProvider>
  );
}
