import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Card, Container, LinkButton, Section } from "@/components/ui";
import { site } from "@/config/site";
import { hasLocale } from "@/i18n/config";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/download">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const isYo = lang === "yo";
  return pageMetadata(
    lang,
    "/download",
    isYo ? "Gba Àpù CultivaNode fún Android (APK)" : "Download CultivaNode Android App (APK)",
    isYo
      ? "Gba àpù alágbèéká CultivaNode fún foonu Android rẹ. Ṣe àkọsílẹ̀ iṣẹ́ oko, ya ààlà oko pẹ̀lú GPS, kí o sì béèrè lọ́wọ́ olùrànlọ́wọ́ oko."
      : "Download the CultivaNode Android app (APK) to record your farm work, map your farm with GPS, ask the farm assistant and find equipment for hire."
  );
}

export default async function DownloadPage({ params }: PageProps<"/[lang]/download">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const isYo = lang === "yo";

  return (
    <>
      {/* Hero Section */}
      <Container className="flex flex-col items-start gap-6 py-12 sm:py-16">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{isYo ? "ÀPÙ ALÁGBÈÉKÁ ANDROID" : "ANDROID MOBILE APP"}</Badge>
          <span className="rounded-full bg-secondary-container/40 px-3 py-0.5 text-xs font-bold text-primary">
            v0.1.0 • ARM64 / ARMv7
          </span>
        </div>

        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          {isYo ? "Gba CultivaNode fún Foonu Android" : "Download CultivaNode for Android"}
        </h1>

        <p className="max-w-2xl text-lg text-on-surface-variant sm:text-xl">
          {isYo
            ? "Ṣe àkọsílẹ̀ iṣẹ́ ogbin, ya ààlà oko pẹ̀lú GPS, kí o sì béèrè lọ́wọ́ olùrànlọ́wọ́ oko nípa ohun ọ̀gbìn tó ń ṣàìsàn, tààrà lórí foonu rẹ."
            : "Record your farm work, map your farm with GPS, and ask the farm assistant about sick crops, directly on your phone."}
        </p>

        {/* Primary Download Call to Action Card */}
        <Card className="mt-2 flex w-full max-w-xl flex-col gap-5 border-2 border-primary/20 bg-surface-container-low/40 p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {isYo ? "ÌGBÀSÍLẸ̀ TÀÀRÀ (DIRECT APK)" : "DIRECT APK DOWNLOAD"}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-on-surface">cultivanode.apk</span>
              <span className="text-sm font-semibold text-on-surface-variant">~45 MB</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              {isYo ? "Fún foonu Android 8.0 sí òkè." : "Works on Android 8.0 and higher."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the proxy redirects this to the APK file; it isn't a page */}
            <a
              href="/download/android"
              className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-primary-container px-6 py-4 text-center text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="size-6 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
              </svg>
              <span>{isYo ? "Gba Àpù Náà Nísinsìnyí" : "Download APK Now"}</span>
            </a>

            {site.contact.whatsappUrl && (
              <a
                href={site.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                <span>💬 {isYo ? "Atilẹyin WhatsApp" : "Help via WhatsApp"}</span>
              </a>
            )}
          </div>

          <div className="border-t border-border/80 pt-3 text-[11px] text-on-surface-variant">
            <span>
              {isYo ? "Àjọṣepọ̀ pẹ̀lú Google Play Store:" : "Google Play Store Note:"}{" "}
            </span>
            <span className="font-medium text-on-surface">
              {isYo
                ? "À ń gbé àpù yí sí Google Play Store láìpẹ́. Nígbà tí ó bá jáde, àpù tí ẹ fi sí foonu nísinsìnyí yóò gba àtúnṣe tààrà láìsí pàdánù àkọsílẹ̀ oko rẹ."
                : "Google Play Store publishing is in progress. Sideloaded installations use the same package key and will update automatically once live on the Play Store."}
            </span>
          </div>
        </Card>
      </Container>

      {/* 3-Step Visual Installation Guide */}
      <Section
        tone="white"
        title={isYo ? "Bí Ẹ Ṣe Lè Fi Àpù Náà Sí Foonu Rẹ (Ìgbésẹ̀ 3)" : "How to Install the APK on Your Android Phone (3 Easy Steps)"}
        intro={
          isYo
            ? "Tẹ̀lé àwọn ìgbésẹ̀ wọ̀nyí láti fi àpù náà sí foonu rẹ láàárín ìṣẹ́jú méjì:"
            : "Follow these simple steps to install CultivaNode directly on your Android phone in under 2 minutes:"
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <Card className="flex flex-col gap-3 p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-container text-xl font-black text-white">
              1
            </div>
            <h3 className="text-lg font-bold text-primary">
              {isYo ? "Gba Fáìlì APK Náà" : "Download the APK File"}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {isYo
                ? "Tẹ bọ́tìnnì ìgbàsílẹ̀ lókè. Bí foonu rẹ bá sọ pé 'File might be harmful' (fáìlì lè léwu), tẹ 'Download anyway' (tẹ̀síwájú láti gba á). Èyí jẹ́ ohun tí Android máa ń sọ fún gbogbo àpù tí a kò gba láti Play Store."
                : "Tap the download button above. If Chrome shows 'File might be harmful', tap 'Download anyway'. This standard Android safety alert appears for all apps downloaded outside the Play Store."}
            </p>
          </Card>

          {/* Step 2 */}
          <Card className="flex flex-col gap-3 p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-xl font-black text-primary">
              2
            </div>
            <h3 className="text-lg font-bold text-primary">
              {isYo ? "Gbà Láàyè Láti Fi Sí Foonu" : "Allow Unknown Apps"}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {isYo
                ? "Ṣí fáìlì tí o gba náà láti ibi àkíyèsí (notifications) rẹ. Bí foonu bá bi ọ léèrè, tẹ 'Settings' (Ètò), kí o sì tẹ 'Allow from this source' (Gbà láàyè láti ibí)."
                : "Open the downloaded file from your notification bar or Downloads folder. If prompted by Android, tap 'Settings' and switch ON 'Allow from this source' for your browser or file manager."}
            </p>
          </Card>

          {/* Step 3 */}
          <Card className="flex flex-col gap-3 p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-black text-white">
              3
            </div>
            <h3 className="text-lg font-bold text-primary">
              {isYo ? "Tẹ 'Install' Kí O Sí Wọlé" : "Tap Install & Sign In"}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {/* Phone sign-in is switched off until an SMS provider is set up (feature switch phone_sign_in). */}
              {isYo
                ? "Tẹ 'Install' (Fi sí foonu). Nígbà tí ó bá parí, ṣí CultivaNode kí o sì wọlé pẹ̀lú àdírẹ́sì ímeèlì rẹ. Wíwọlé pẹ̀lú nọ́mbà foonu ń bọ̀ láìpẹ́."
                : "Tap 'Install'. Once completed, tap 'Open' and sign in with your email address. Signing in with a phone number is coming soon."}
            </p>
          </Card>
        </div>
      </Section>

      {/* Field Features Highlight */}
      <Section
        title={isYo ? "Àwọn Àǹfààní Àpù Alágbèéká CultivaNode" : "What You Can Do in the Mobile App"}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <span className="text-3xl">📡</span>
            <h4 className="mt-3 font-bold text-primary">
              {isYo ? "Ṣiṣẹ́ Níbi Tí Nẹtiwọ́ọ̀kì Kò Ti Dára" : "Save Work Without Signal"}
            </h4>
            <p className="mt-1 text-xs text-on-surface-variant">
              {isYo
                ? "Kọ iṣẹ́ oko rẹ sílẹ̀ lórí oko níbi tí nẹtiwọ́ọ̀kì kò sí. Yóò wọ inú àkọọ́lẹ̀ rẹ nígbà tí nẹtiwọ́ọ̀kì bá padà."
                : "Record scouting, farm work and expenses where there is no signal. They are sent to your account when you are back in signal."}
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-3xl">📍</span>
            <h4 className="mt-3 font-bold text-primary">
              {isYo ? "Wíwọ̀n Oko Pẹ̀lú GPS" : "GPS Boundary Walking"}
            </h4>
            <p className="mt-1 text-xs text-on-surface-variant">
              {isYo
                ? "Rìn yíká oko rẹ láti mọ ààlà rẹ̀ àti iye hektari rẹ̀ pẹ̀lú GPS foonu rẹ."
                : "Walk around your farm to map its boundary and estimate its size with your phone's GPS."}
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-3xl">📸</span>
            <h4 className="mt-3 font-bold text-primary">
              {isYo ? "Fi Àwòrán Ohun Ọ̀gbìn Ránṣẹ́" : "Crop Photo Check"}
            </h4>
            <p className="mt-1 text-xs text-on-surface-variant">
              {isYo
                ? "Ya àwòrán ewé tàbí kòkòrò tí ó ń jẹ ohun ọ̀gbìn rẹ kí olùrànlọ́wọ́ oko fún ọ ní ìmọ̀ràn. Ó lè ṣàṣìṣe, nítorí náà bi òṣìṣẹ́ ìgbaniníyànjú àgbẹ̀ léèrè tí o kò bá dá ọ lójú."
                : "Take a photo of damaged leaves or pests and get advice from the farm assistant. It can be wrong, so check with an extension agent when you are unsure."}
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-3xl">🚜</span>
            <h4 className="mt-3 font-bold text-primary">
              {isYo ? "Yíyá Ẹ̀rọ Tirakito" : "Tractor & Service Booking"}
            </h4>
            <p className="mt-1 text-xs text-on-surface-variant">
              {isYo
                ? "Bá àwọn olùpèsè tirakito, ridger, àti afọ́n-oògùn sọ̀rọ̀ láti wá ṣiṣẹ́ lórí oko rẹ ní àkókò tó tọ́. Nínú ìdánwò, ìwọ yóò san owó fún olùpèsè iṣẹ́ ní tààràtà."
                : "Request tractors, ridgers and spraying operators near your farm. In the pilot you pay the provider directly."}
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
