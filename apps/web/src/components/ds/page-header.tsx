import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

/** Page title block used across account and admin pages: optional crumb, eyebrow pills, title, lede, actions. */
export function PageHeader({
  title,
  description,
  eyebrow,
  back,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary-container"
          >
            <Icon name="arrow_back" className="text-base" />
            {back.label}
          </Link>
        )}
        {eyebrow && <div className="mb-2 flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-primary sm:text-headline-xl">{title}</h1>
        {description && <p className="mt-1.5 text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
