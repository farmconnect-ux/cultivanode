import { Card } from "@/components/ui";

/** Feature cards labelled "In the pilot" or "Coming soon", exactly as on the home page. */
export function FeatureList({
  items,
  inPilotLabel,
  soonLabel,
}: {
  items: readonly { title: string; body: string; soon: boolean }[];
  inPilotLabel: string;
  soonLabel: string;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((f) => (
        <li key={f.title}>
          <Card className="flex h-full flex-col gap-3">
            <h3 className="text-lg font-bold">{f.title}</h3>
            <p className="text-on-surface-variant">{f.body}</p>
            <span
              className={`mt-auto self-start rounded-full px-3 py-1 text-sm font-semibold ${
                f.soon ? "bg-harvest-100 text-harvest-700" : "bg-leaf-100 text-leaf-800"
              }`}
            >
              {f.soon ? soonLabel : inPilotLabel}
            </span>
          </Card>
        </li>
      ))}
    </ul>
  );
}
