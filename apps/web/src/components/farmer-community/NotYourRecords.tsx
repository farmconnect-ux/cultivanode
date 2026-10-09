import Link from "next/link";

/** Replaces sample boards that were showing someone else's invented farm. */
export function NotYourRecords({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-leaf-700">This account</p>
      <h2 className="mt-1 text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-leaf-800 px-4 text-sm font-semibold text-white hover:bg-leaf-900"
      >
        {cta}
      </Link>
    </section>
  );
}
