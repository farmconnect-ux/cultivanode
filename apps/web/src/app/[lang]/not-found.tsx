import Link from "next/link";
import { Container, buttonClass } from "@/components/ui";

// Rendered inside the [lang] layout. The text is bilingual because not-found does not receive params.
export default function NotFound() {
  return (
    <Container className="flex flex-col items-start gap-4 py-24">
      <p className="text-sm font-bold uppercase tracking-wider text-harvest-700">404</p>
      <h1 className="text-4xl font-extrabold">Page not found · A kò rí ojú-ìwé yìí</h1>
      <p className="text-lg text-muted">We couldn&apos;t find that page. · A kò rí ojú-ìwé tí o ń wá.</p>
      <Link href="/" className={buttonClass("primary", "lg")}>
        Home · Ilé
      </Link>
    </Container>
  );
}
