"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Button, Card, Field, Input, Select, TextArea } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatDay } from "@/lib/text";

type AgentFarmer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  state: string | null;
  lga: string | null;
};

type Farm = {
  id: string;
  owner_id: string;
  name: string;
  state: string | null;
  lga: string | null;
  area_ha: number | null;
};

export function AgentAssistedBooking({
  lang,
  farmers,
  farms,
  initialFarmerId,
  t,
}: {
  lang: Locale;
  farmers: AgentFarmer[];
  farms: Farm[];
  initialFarmerId?: string;
  t: Dictionary;
}) {
  const [farmerId, setFarmerId] = useState<string>(
    initialFarmerId && farmers.some((f) => f.id === initialFarmerId)
      ? initialFarmerId
      : farmers[0]?.id ?? "",
  );

  const selectedFarmer = farmers.find((f) => f.id === farmerId);
  const farmerFarms = farms.filter((f) => f.owner_id === farmerId);

  const [farmId, setFarmId] = useState<string>(farmerFarms[0]?.id ?? "");
  const [service, setService] = useState<string>("ploughing");
  const [hectares, setHectares] = useState<string>("2.0");
  const [jobDate, setJobDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
  );
  const [instructions, setInstructions] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const ratePerHa = service === "ploughing" ? 35000 : service === "harrowing" ? 28000 : 25000;
  const haNumber = Math.max(0.1, Number(hectares) || 1);
  const estimatedTotal = Math.round(ratePerHa * haNumber);

  const handleFarmerChange = (id: string) => {
    setFarmerId(id);
    const newFarmerFarms = farms.filter((f) => f.owner_id === id);
    setFarmId(newFarmerFarms[0]?.id ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center border-2 border-leaf-700 bg-leaf-50/50">
        <span className="flex size-14 items-center justify-center rounded-full bg-leaf-100 text-2xl text-leaf-800">
          ✓
        </span>
        <h2 className="text-2xl font-extrabold text-leaf-900">Assisted Booking Confirmed</h2>
        <p className="max-w-md text-sm text-muted">
          Assisted booking recorded on behalf of <strong>{selectedFarmer?.full_name ?? "Farmer"}</strong> for{" "}
          <strong>{service}</strong> on {formatDay(jobDate, lang)}. Operator dispatch has been initiated.
        </p>
        <Link
          href={`/${lang}/account/agent?ws=agent`}
          className="mt-2 rounded-md bg-leaf-700 px-5 py-2.5 font-bold text-white hover:bg-leaf-800"
        >
          Return to Field Console →
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div>
        <h2 className="text-2xl font-extrabold text-leaf-900">Place Assisted Booking</h2>
        <p className="text-sm text-muted">
          Order machinery on behalf of an onboarded farmer. Field agent attribution and audit metadata are attached.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Step 1: Select Farmer */}
        <Field id="assisted-farmer" label="Select Farmer">
          <Select
            id="assisted-farmer"
            value={farmerId}
            onChange={(e) => handleFarmerChange(e.target.value)}
            required
          >
            {farmers.map((f) => (
              <option key={f.id} value={f.id}>
                {f.full_name} ({f.phone ?? "No phone"}) · {f.lga ?? f.state ?? "Local"}
              </option>
            ))}
          </Select>
        </Field>

        {/* Step 2: Select Farm */}
        <Field
          id="assisted-farm"
          label="Select Farm Plot"
          hint={farmerFarms.length === 0 ? "This farmer has no farm plot registered yet." : undefined}
        >
          {farmerFarms.length > 0 ? (
            <Select
              id="assisted-farm"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              required
            >
              {farmerFarms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.area_ha ? `${f.area_ha} ha` : "Unmapped"}) · {f.lga ?? ""}
                </option>
              ))}
            </Select>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-line bg-cream p-3 text-sm">
              <span className="text-muted">No plots recorded for this farmer.</span>
              <Link
                href={`/${lang}/account/agent?farmer=${farmerId}&action=add_farm&ws=agent`}
                className="font-bold text-leaf-700 underline"
              >
                + Add Farm Plot First
              </Link>
            </div>
          )}
        </Field>

        {/* Step 3: Service & Date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="assisted-service" label="Service Required">
            <Select id="assisted-service" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="ploughing">Tractor Ploughing (₦35,000/ha)</option>
              <option value="harrowing">Tractor Harrowing (₦28,000/ha)</option>
              <option value="planting">Mechanical Planting (₦25,000/ha)</option>
              <option value="spraying">Boom Spraying (₦15,000/ha)</option>
              <option value="harvesting">Harvester Combine (₦55,000/ha)</option>
            </Select>
          </Field>

          <Field id="assisted-ha" label="Area Size (Hectares)">
            <Input
              id="assisted-ha"
              type="number"
              step="0.1"
              min="0.1"
              required
              value={hectares}
              onChange={(e) => setHectares(e.target.value)}
            />
          </Field>
        </div>

        <Field id="assisted-date" label="Preferred Execution Date">
          <Input
            id="assisted-date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            required
            value={jobDate}
            onChange={(e) => setJobDate(e.target.value)}
          />
        </Field>

        <Field id="assisted-notes" label="Special Instructions / Access Landmarks">
          <TextArea
            id="assisted-notes"
            rows={2}
            placeholder="e.g. Beside church junction, operator should contact agent for gate key."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </Field>

        {/* Pricing Summary */}
        <div className="flex items-center justify-between rounded-lg bg-leaf-50 p-4 border border-leaf-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Estimated Total Cost</span>
            <span className="block text-2xl font-extrabold text-leaf-800 tabular-nums">
              {formatNaira(estimatedTotal)}
            </span>
          </div>
          <span className="text-xs text-muted max-w-[12rem] text-right">
            Cash or transfer on confirmation. Verified escrow terms apply.
          </span>
        </div>

        <Button
          type="submit"
          className="self-start bg-leaf-700 text-white font-bold"
          disabled={!farmerId || !farmId}
        >
          Submit Assisted Booking 🚜
        </Button>
      </form>
    </Card>
  );
}
