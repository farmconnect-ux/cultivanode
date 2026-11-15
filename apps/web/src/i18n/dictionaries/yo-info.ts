// Yorùbá copy for the plain information pages (see en-info.ts; same keys, TypeScript enforces it).
// DRAFT TRANSLATION, machine-drafted: a native Yorùbá speaker must review every new string here before
// launch. Where possible the wording reuses phrases already in yo.ts and yo-pages.ts.
import { brand } from "@cultivanode/shared/brand";

import type { InfoDictionary } from "./en-info";

const yoInfo: InfoDictionary = {
  aboutPage: {
    inPilotTitle: "Ohun tí o lè lò nínú ìdánwò",
    soonTitle: "Ó ń bọ̀ láìpẹ́",
  },
  platformPage: {
    title: `Ohun tó wà nínú ${brand.name}`,
    intro: "Áàpù kan fún gbogbo àsìkò. Àkójọ yìí kan náà ló wà lójú-ìwé àkọ́kọ́ wa.",
    trustTitle: "Bí a ṣe ń jẹ́ kí gbígba òṣìṣẹ́ wà láìléwu",
    appsTitle: "Lórí wẹ́ẹ̀bù àti lórí Android",
    appsBody: "Lo ojú-òpó wẹ́ẹ̀bù tàbí áàpù Android. Àkọọ́lẹ̀ kan náà ni méjèèjì ń lò.",
    appsCta: "Gba áàpù Android",
  },
  solutionsPage: {
    title: "Ohun tí o lè ṣe, gẹ́gẹ́ bí ipa rẹ",
    intro: "Yan ipa tí ó bá ọ mu. Àkọọ́lẹ̀ kan lè ní ju ipa kan lọ.",
    roles: [
      {
        title: "Àwọn àgbẹ̀",
        body: "Gba ètò àsìkò fún ohun ọ̀gbìn rẹ, wo àsọtẹ́lẹ̀ ojú ọjọ́ mẹ́wàá fún oko rẹ, kí o sì máa tọ́jú ìṣúra àti ìwé owó oko rẹ. Béèrè lọ́wọ́ olùrànlọ́wọ́ oko ní èdè Gẹ̀ẹ́sì, Pidgin tàbí Yorùbá. Rí tírákítọ̀ àti òṣìṣẹ́ oko tí a ti ṣàyẹ̀wò nítòsí oko rẹ; nínú ìdánwò, ìwọ yóò san owó fún wọn ní tààràtà.",
      },
      {
        title: "Àwọn onímọ́tò ẹ̀rọ oko",
        body: "Ṣe àkọsílẹ̀ tírákítọ̀ àti ẹ̀rọ oko rẹ pẹ̀lú iye owó tìrẹ fún wákàtí, ọjọ́, hẹ́kítà tàbí iṣẹ́ kan. Àwọn àgbẹ̀ nítòsí rẹ yóò fi ìbéèrè iṣẹ́ ránṣẹ́, ìwọ yóò sì gbà á tàbí kọ̀ ọ́ nínú áàpù. Nínú ìdánwò, àgbẹ̀ yóò san owó fún ọ ní tààràtà.",
      },
      {
        title: "Àwọn olùpèsè iṣẹ́",
        body: "Àwọn òṣìṣẹ́ oko, awakọ̀ ẹ̀rọ, afín-oògùn, mẹkáníìkì àti òṣìṣẹ́ ìgbaniníyànjú àgbẹ̀: ṣètò iṣẹ́ rẹ, iye owó rẹ àti bí o ṣe lè rìn jìnnà tó, kí o sì gba ìbéèrè iṣẹ́ láti ọ̀dọ̀ àwọn àgbẹ̀ tó wà nítòsí.",
      },
      {
        title: "Àwọn olùrà àti olùtà",
        body: "Àwọn oko àti olùpèsè nínú ìdánwò ń fi irè oko, irúgbìn àti ohun èlò oko sí ọjà. Àwọn olùrà lè wo ohun tó wà lọ́jà fún títà.",
      },
    ],
    more: "Kà sí i",
    checksNote: "A ń ṣàyẹ̀wò NIN, BVN àti àkọọ́lẹ̀ báńkì gbogbo ẹni tí ó bá ń ṣe àkọsílẹ̀ ẹ̀rọ tàbí tí ó ń gba owó.",
  },
  resourcesPage: {
    title: "Ìtọ́sọ́nà àti ìrànlọ́wọ́",
    intro: "Ìrànlọ́wọ́ tó wúlò fún iṣẹ́ oko ní Gúúsù-Ìwọ̀ Oòrùn. A ó máa fi ìtọ́sọ́nà sí i kún un níbí bí wọ́n bá ṣe ń ṣetán.",
    items: [
      {
        title: "Irúgbìn àti àsìkò",
        body: "Ohun ọ̀gbìn mẹ́ẹ̀ẹ́dógún tó wà nínú ìdánwò, àsìkò mẹ́ta, àti agbègbè oko méjì ní Gúúsù-Ìwọ̀ Oòrùn.",
        cta: "Wo irúgbìn àti àsìkò",
      },
      {
        title: "Ìbéèrè àti ìdáhùn",
        body: "Bí ìdánwò ṣe ń ṣiṣẹ́, iye tí ó máa ná ọ, bí ìsanwó ṣe ń lọ àti bí a ṣe ń tọ́jú àkọsílẹ̀ rẹ.",
        cta: "Ka àwọn ìbéèrè",
      },
      {
        title: "Olùrànlọ́wọ́ oko",
        body: "Béèrè ìbéèrè nípa iṣẹ́ oko ní èdè Gẹ̀ẹ́sì, Pidgin tàbí Yorùbá lẹ́yìn tí o bá wọlé. Olùrànlọ́wọ́ náà lè ṣàṣìṣe, nítorí náà bi òṣìṣẹ́ ìgbaniníyànjú àgbẹ̀ léèrè tí o kò bá dá ọ lójú.",
        cta: "Ṣí olùrànlọ́wọ́ oko",
      },
    ],
  },
  techPage: {
    title: `Bí a ṣe kọ́ ${brand.name}`,
    intro: "Àlàyé kúkúrú, tó rọrùn, nípa ìmọ̀ ẹ̀rọ tó wà lẹ́yìn áàpù náà.",
    items: [
      {
        title: "Wẹ́ẹ̀bù àti áàpù Android",
        body: "O lè lo ojú-òpó wẹ́ẹ̀bù tàbí áàpù Android. Àkọọ́lẹ̀ kan náà àti àkọsílẹ̀ kan náà ni méjèèjì ń lò.",
      },
      {
        title: "Ibi ìpamọ́ àkọsílẹ̀",
        body: "A ń pa àkọsílẹ̀ mọ́ sínú ibi ìpamọ́ Postgres tí Supabase ń ṣiṣẹ́. A ń tọ́jú ibi tí oko wà gẹ́gẹ́ bí àmì lórí máàpù pẹ̀lú PostGIS, kí áàpù lè rí olùpèsè iṣẹ́ nítòsí oko rẹ.",
      },
      {
        title: "Oko tìrẹ nìkan ni o máa rí",
        body: "Ààbò ìlà-sí-ìlà (row-level security) nínú ibi ìpamọ́ túmọ̀ sí pé àkọọ́lẹ̀ kọ̀ọ̀kan lè ka àti yí oko àti àkọsílẹ̀ tirẹ̀ nìkan padà. Iṣẹ́ òṣìṣẹ́ wa ní ààlà gẹ́gẹ́ bí ipa wọn, a sì ń kọ gbogbo ohun tí òṣìṣẹ́ bá ṣe lórí àkọọ́lẹ̀ rẹ sílẹ̀.",
      },
      {
        title: "A ń bo nọ́ńbà ìdánimọ̀ mọ́lẹ̀",
        body: "Tí a bá ṣàyẹ̀wò NIN, BVN tàbí àkọọ́lẹ̀ báńkì, nọ́ńbà tí a ti bò mọ́lẹ̀ nìkan ni a ń tọ́jú, kì í ṣe gbogbo nọ́ńbà náà.",
      },
      {
        title: "Ìsanwó fún iṣẹ́ tí o gbà",
        body: "Nígbà tí o bá gba ẹnìkan síṣẹ́ nínú ìdánwò, ìwọ yóò san owó fún olùpèsè iṣẹ́ ní tààràtà; pèpéle kò mú owó náà dúró. Ìsanwó tí a ó mú dúró títí o fi fìdí iṣẹ́ múlẹ̀ ń bọ̀, lẹ́yìn tí a bá ti fọwọ́ sí àdéhùn pẹ̀lú alábàáṣiṣẹ́ ìsanwó tó ní ìwé-àṣẹ.",
      },
      {
        title: "Ibi tí a ń tọ́jú àkọsílẹ̀ sí",
        body: "Ilé-iṣẹ́ ìkùukùu (cloud) wa ló ń gbé ibi ìpamọ́ wa sí Ìsọ̀kan Yúróòpù (Ireland). Ìlànà àṣírí ṣàlàyé ohun tí a ń gbà àti ìdí rẹ̀.",
      },
    ],
    privacyCta: "Ka ìlànà àṣírí",
  },
  legalPage: {
    title: "Àwọn ìwé òfin",
    intro: `Àwọn ìwé tí ó kan ọ́ nígbà tí o bá ń lo ${brand.name} nígbà ìdánwò.`,
    open: "Kà á",
    dataTitle: "Àkọsílẹ̀ rẹ",
    dataBody:
      "A ń tẹ̀lé Òfin Ìdáàbòbò Àkọsílẹ̀ ti Nàìjíríà 2023 (NDPA). A ó béèrè àṣẹ rẹ kí a tó ṣàyẹ̀wò ìdánimọ̀ rẹ, nọ́ńbà ìdánimọ̀ tí a ti bò mọ́lẹ̀ nìkan ni a ń tọ́jú, o sì lè ní kí a fún ọ ní àkọsílẹ̀ rẹ tàbí kí a pa á rẹ́.",
  },
  waitlistExtra: {
    note: "A ó kàn sí ọ lórí fóònù tàbí ímeèlì nígbà tí ọjà bá ṣí nítòsí rẹ. O ti lè lo àwọn irinṣẹ́ oko nínú ìdánwò báyìí.",
    pilotCta: "Darapọ̀ mọ́ ìdánwò",
  },
};

export default yoInfo;
