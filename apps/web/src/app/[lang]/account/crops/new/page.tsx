import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { nowMs } from "@/lib/format";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { CropPlanner } from "@/components/account/crop-planner";
import { cropChoices } from "@/lib/crop-plan";

export const metadata: Metadata = { title: "Start New Crop Cycle" };


interface Props {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ error?: string }>;
}

export default async function NewCropCyclePage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const sp = searchParams ? await searchParams : {};

  const today = new Date(nowMs()).toISOString().slice(0, 10);
  const errorMessage = sp?.error ? decodeURIComponent(sp.error) : null;
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga")
    .or(scope.join(","))
    .order("name");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: plots } = farmIds.length
    ? await supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farmIds).order("name")
    : { data: [] };

  const plotList = plots ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3 shadow-sm">
          <Icon name="error" className="text-2xl text-red-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Unable to launch crop cycle</p>
            <p className="text-xs mt-0.5 text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/${lang}/account/crops`}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            <Icon name="arrow_back" className="text-base" /> Back to Crop Management
          </Link>
          <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
            Start New Crop Cycle
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Pick the crop and planting day. We suggest the growth stages and the field operations to plan; keep, edit or drop each one.
          </p>
        </div>
      </div>

      {farmList.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
          <Icon name="add_location_alt" className="mx-auto text-4xl text-secondary" />
          <h2 className="mt-4 font-headline-sm text-headline-sm text-on-surface font-semibold">
            No farms registered yet
          </h2>
          <p className="mt-2 text-body-sm text-on-surface-variant max-w-md mx-auto">
            You must register a farm and at least one plot before launching a crop cycle.
          </p>
          <div className="mt-6">
            <Link
              href={`/${lang}/account/farms/new`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 font-label-md text-label-md text-on-primary hover:bg-primary transition-all font-semibold"
            >
              <Icon name="add" className="text-base" /> Register Farm First
            </Link>
          </div>
        </div>
      ) : (
        <CropPlanner
          lang={lang}
          farms={farmList.map((f) => ({ id: f.id, name: f.name }))}
          plots={plotList.map((p) => ({ id: p.id, farm_id: p.farm_id, name: p.name, area_ha: p.area_ha == null ? null : Number(p.area_ha) }))}
          crops={cropChoices()}
          today={today}
        />
      )}
    </div>
  );
}
