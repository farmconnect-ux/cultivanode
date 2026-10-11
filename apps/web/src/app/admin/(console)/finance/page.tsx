import type { Metadata } from "next";
import { LiveStrip } from "@/components/ds/live-strip";
import { PlatformFinance } from "@/components/screens/platform-finance";

export const metadata: Metadata = { title: "Platform finance" };

export default function Page() {
  return (
    <>
      <LiveStrip tone="preview">Sample figures from the design until this console is connected to ledger data.</LiveStrip>
      <PlatformFinance lang="en" />
    </>
  );
}
