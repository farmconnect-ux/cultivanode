import { APP_NAME, ROLE_LABELS, formatNaira } from "@tillmate/shared";

// M0 placeholder. The real landing page and design system arrive in M1.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
      <p>
        Development build. This page only proves the web app, the shared package and the build pipeline
        work together.
      </p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Shared package check</h2>
        <p>Roles loaded: {Object.values(ROLE_LABELS).join(", ")}.</p>
        <p>Money formatting: {formatNaira(2_500_000)} per hectare.</p>
      </section>
    </main>
  );
}
