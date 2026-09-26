import type { Metadata, Viewport } from "next";
import "../globals.css";
import { site } from "@/config/site";

// The admin console is a separate root layout: English only, never indexed, always dynamic.
export const metadata: Metadata = {
  title: { default: `Admin · ${site.name}`, template: `%s · ${site.name} admin` },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#236639",
  width: "device-width",
  initialScale: 1,
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en-NG" className="h-full antialiased">
      <body className="min-h-full bg-cream">{children}</body>
    </html>
  );
}
