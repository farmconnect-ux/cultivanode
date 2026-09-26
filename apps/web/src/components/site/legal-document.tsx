import { LEGAL_UPDATED, LEGAL_VERSION } from "@cultivanode/shared";
import { Container } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";


type Doc = Dictionary["legal"]["privacy"];

/** Privacy policy / terms layout. The version string is also stored with each user's consent. */
export function LegalDocument({ doc, labels }: { doc: Doc; labels: Dictionary["legal"] }) {
  return (
    <Container className="max-w-3xl py-14 sm:py-20">
      <h1 className="text-4xl font-extrabold text-leaf-800 sm:text-5xl">{doc.title}</h1>
      <p className="mt-5 text-xl text-muted">{doc.intro}</p>
      <p role="note" className="mt-6 rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-4">{labels.draftNotice}</p>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <div className="flex gap-1"><dt>{labels.versionLabel}:</dt><dd>{LEGAL_VERSION}</dd></div>
        <div className="flex gap-1"><dt>{labels.updatedLabel}:</dt><dd><time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED}</time></dd></div>
      </dl>
      <div className="mt-10 flex flex-col gap-10">
        {doc.sections.map((s, i) => (
          <section key={s.heading} aria-labelledby={`legal-${i}`}>
            <h2 id={`legal-${i}`} className="text-2xl font-bold">{i + 1}. {s.heading}</h2>
            <div className="mt-3 flex flex-col gap-3 text-lg">
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-12 text-muted">{labels.contactLine}</p>
    </Container>
  );
}
