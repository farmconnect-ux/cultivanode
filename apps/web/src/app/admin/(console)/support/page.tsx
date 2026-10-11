import type { Metadata } from "next";
import { LiveStrip } from "@/components/ds/live-strip";
import { SupportDesk } from "@/components/screens/support-desk";

export const metadata: Metadata = { title: "Support & SLA desk" };

export default function Page() {
  return (
    <>
      <LiveStrip tone="preview">Sample figures from the design until this console is connected to ledger data.</LiveStrip>
      <SupportDesk lang="en" />
    </>
  );
}
