import type { Metadata } from "next";
import { APP_NAME } from "@tillmate/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Farm management, equipment and labour hire for Nigerian farmers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
