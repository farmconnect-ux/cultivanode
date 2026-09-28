// Yorùbá copy for the audience, crops, partners, waitlist and legal pages.
// DRAFT TRANSLATION: a native Yorùbá speaker must review every string before launch, and the
// legal pages must also be checked by our lawyers in Yorùbá.
import { brand } from "@cultivanode/shared/brand";

import type { PagesDictionary } from "./en-pages";

const yoPages: PagesDictionary = {
  howPage: {
    title: `Bí ${brand.name} ṣe ń ṣiṣẹ́`,
    intro: "Áàpù kan fún gbogbo ènìyàn lórí oko. Yan ipa rẹ láti rí àwọn ìgbésẹ̀.",
    moneyTitle: "Bí ìsanwó ṣe ń ṣiṣẹ́ nígbà ìdánwò",
    moneyIntro: `Nígbà ìdánwò, ${brand.name} kò ní mú tàbí gbé owó. Áàpù náà ń tọ́jú àkọsílẹ̀ tó ṣe kedere kí ẹ̀gbẹ́ méjèèjì lè mọ ohun tí a fẹnu kò lé lórí.`,
    money: [
      { title: "Wá", body: "Yan olùpèsè iṣẹ́ tí a ti ṣàyẹ̀wò nítòsí oko rẹ, kí o sì wo iye owó wọn." },
      { title: "Fẹnu kò", body: "Fẹnu kò lórí iṣẹ́ náà, ọjọ́ àti iye owó. Gbígba iṣẹ́ nínú áàpù yóò ṣí nígbà ìdánwò." },
      { title: "A ṣe iṣẹ́ náà", body: "Olùpèsè iṣẹ́ yóò ṣe iṣẹ́ náà. Ìforúkọwọlé àti ẹ̀rí fọ́tò nínú áàpù yóò dé pẹ̀lú gbígba iṣẹ́." },
      { title: "Sanwó ní tààràtà", body: "Ìwọ yóò san owó fún olùpèsè iṣẹ́ ní tààràtà, ní ọwọ́ tàbí nípasẹ̀ báńkì. San fún iṣẹ́ tí a ṣe nìkan." },
      { title: "Ẹ̀yin méjèèjì fìdí rẹ̀ múlẹ̀", body: "Ẹ̀yin méjèèjì yóò sàmì sí i pé a ti sanwó, ẹ ó sì fún ara yín ní ìdíyelé. Ìṣòro wà? Sọ fún wa, ẹgbẹ́ wa yóò ràn ọ́ lọ́wọ́." },
    ],
    moneyNote: "Ìsanwó tó ní ààbò, tí alábàáṣiṣẹ́ ìsanwó tí ó ní ìwé-àṣẹ yóò mú dúró títí o fi fìdí iṣẹ́ múlẹ̀, ń bọ̀ lẹ́yìn àyẹ̀wò òfin. A ó sọ fún ọ kí ó tó bẹ̀rẹ̀.",
  },
  farmersPage: {
    badge: "Fún àwọn àgbẹ̀",
    title: "Ṣọ̀gbìn pẹ̀lú ètò, gba ìrànlọ́wọ́ láìbẹ̀rù",
    intro: "Mọ ohun tí o máa ṣe lórí oko rẹ àti ìgbà tí o máa ṣe é, rí ìrànlọ́wọ́ nítòsí, kí o sì mọ èrè gidi ọ̀gbìn kọ̀ọ̀kan.",
    benefitsTitle: "Ohun tí o máa rí",
    benefits: [
      { soon: true, title: "Ètò àsìkò fún irúgbìn kọ̀ọ̀kan", body: "Láti ìmúrasílẹ̀ ilẹ̀ títí dé ìkórè, tí a ṣírò láti ọjọ́ tí o gbìn, agbègbè rẹ àti àsìkò." },
      { soon: true, title: "Iye ajílẹ̀ àti oògùn fífọ́n", body: "Iye tí o máa rà àti tí o máa lò fún ìwọ̀n oko rẹ, láti inú ìlànà tí àwọn onímọ̀ ọ̀gbìn ṣàyẹ̀wò." },
      { soon: true, title: "Ojú ọjọ́ fún oko rẹ", body: "Àsọtẹ́lẹ̀ ọjọ́ 14 àti ìkìlọ̀ fún òjò ńlá, ọ̀gbẹlẹ̀, ooru àti ìjì líle." },
      { soon: true, title: "Ilé ìpamọ́ rẹ", body: "Irúgbìn, ajílẹ̀ àti oògùn tó wà lọ́wọ́, pẹ̀lú ìkìlọ̀ kí wọ́n tó tán tàbí kí wọ́n tó bàjẹ́." },
      { soon: true, title: "Ìwé owó oko", body: "Ìnáwó àti owó títà fún ọ̀gbìn kọ̀ọ̀kan, kí o lè mọ iye owó fún hẹ́kítà kan àti èrè rẹ." },
      { soon: true, title: "Olùrànlọ́wọ́ oko", body: "Béèrè ní èdè Gẹ̀ẹ́sì, Pidgin tàbí Yorùbá, tàbí fi fọ́tò ohun ọ̀gbìn tí ń ṣàìsàn ránṣẹ́." },
    ],
    stepsTitle: "Bí o ṣe máa bẹ̀rẹ̀",
    helpTitle: "O kò ní fóònù olóye? Kò burú.",
    helpBody: `Aṣojú ${brand.name} lórí pápá lè forúkọ ìwọ àti oko rẹ sílẹ̀. Ìwọ yóò fìdí rẹ̀ múlẹ̀ pẹ̀lú kóòdù tí a fi ránṣẹ́ sí fóònù rẹ, àwọn ìkìlọ̀ pàtàkì yóò sì wá nípasẹ̀ SMS.`,
  },
  machineryPage: {
    badge: "Fún àwọn tó ní ẹ̀rọ oko",
    title: "Jẹ́ kí ẹ̀rọ rẹ máa ṣiṣẹ́",
    intro: "Fi tírákítọ̀ àti àwọn ohun èlò rẹ sórí áàpù pẹ̀lú iye owó rẹ, kí àwọn oko nítòsí rẹ lè rí ọ.",
    typesTitle: "Ẹ̀rọ tí o lè fi sórí áàpù",
    types: [
      "Tírákítọ̀", "Ẹ̀rọ ìtúlẹ̀ (plough)", "Harrow", "Ẹ̀rọ ìgbìn (planter)", "Ẹ̀rọ ìkórè (harvester)", "Ẹ̀rọ ìfọ́n oògùn (sprayer)",
      "Ẹ̀rọ ebè (ridger)", "Tiller", "Ohun èlò ìbomirin", "Ọkọ̀ ìkẹ́rù", "Ẹ̀rọ mìíràn",
    ],
    benefitsTitle: "Ìdí tí o fi máa darapọ̀ mọ́ wa",
    benefits: [
      { soon: false, title: "Iṣẹ́ nítòsí rẹ", body: "Àwọn àgbẹ̀ yóò rí ọ nìkan tí oko wọn bá wà láàárín ìjìnnà tí o fẹ́ rìn." },
      { soon: true, title: "Mọ ibi tí iṣẹ́ pọ̀ sí", body: "Mọ ìgbà tí ọ̀pọ̀ oko nítòsí nílò iṣẹ́ kan náà ní ọ̀sẹ̀ kan náà, kí o sì ṣètò ìrìn-àjò rẹ." },
      { soon: false, title: "Iye owó tó yé", body: "Fi iye owó rẹ fún wákàtí, ọjọ́, hẹ́kítà tàbí iṣẹ́ kan. Kò sí kọ́míṣọ̀n nígbà ìdánwò." },
      { soon: true, title: "Ìsanwó tó ní ààbò", body: "Lẹ́yìn náà, àgbẹ̀ yóò sanwó kí iṣẹ́ tó bẹ̀rẹ̀, a ó sì san fún ọ nígbà tí a bá fìdí iṣẹ́ múlẹ̀. Nínú ìdánwò, àgbẹ̀ yóò san fún ọ ní tààràtà." },
    ],
    stepsTitle: "Bí o ṣe máa bẹ̀rẹ̀",
    requirementsTitle: "Ohun tí o nílò",
    requirements: [
      "Nọ́ńbà fóònù fún wíwọlé",
      "NIN, BVN àti àkáǹtì báńkì ní orúkọ rẹ (a máa ṣàyẹ̀wò wọn kí o tó lè fi ẹ̀rọ sórí áàpù)",
      "Ẹ̀rí pé ìwọ ni o ni ẹ̀rọ náà tàbí pé ìwọ ni ò ń bójú tó o",
    ],
  },
  providersPage: {
    badge: "Fún àwọn olùpèsè iṣẹ́",
    title: "Rí iṣẹ́ oko nítòsí rẹ",
    intro: "Òṣìṣẹ́ oko, awakọ̀ ẹ̀rọ, afọ́n oògùn, mẹkáníìkì, onímọ̀ ọ̀gbìn àti aṣojú ìmọ̀ ọ̀gbìn: kọ́ orúkọ rere pẹ̀lú iṣẹ́ kọ̀ọ̀kan.",
    typesTitle: "Iṣẹ́ tí o lè ṣe",
    types: [
      "Òṣìṣẹ́ oko", "Awakọ̀ ẹ̀rọ", "Mẹkáníìkì", "Iṣẹ́ fífọ́n oògùn", "Onímọ̀ ọ̀gbìn", "Aṣojú ìmọ̀ ọ̀gbìn", "Dókítà ẹranko", "Olùṣe ohun ọ̀gbìn",
    ],
    benefitsTitle: "Ìdí tí o fi máa darapọ̀",
    benefits: [
      { soon: false, title: "Iṣẹ́ nítòsí ilé", body: "Sọ bí o ṣe lè rìn jìnnà tó. Àwọn oko tí ó wà láàárín ìjìnnà yẹn nìkan ló lè pè ọ́." },
      { soon: true, title: "Kọ́ ìdíyelé rẹ", body: "A lè fún iṣẹ́ kọ̀ọ̀kan tí a parí ní ìdíyelé. Ìdíyelé rere ń mú iṣẹ́ púpọ̀ wá, àti àmì ìgbẹ́kẹ̀lé lẹ́yìn náà." },
      { soon: true, title: "Ìsanwó tó ní ààbò", body: "Lẹ́yìn náà, a ó mú owó dúró kí o tó bẹ̀rẹ̀, a ó sì tú u sílẹ̀ nígbà tí a bá fìdí iṣẹ́ múlẹ̀. Nínú ìdánwò, àgbẹ̀ yóò san fún ọ ní tààràtà." },
    ],
    stepsTitle: "Bí o ṣe máa bẹ̀rẹ̀",
    requirementsTitle: "Ohun tí o nílò",
    requirements: [
      "Nọ́ńbà fóònù fún wíwọlé",
      "NIN, BVN àti àkáǹtì báńkì ní orúkọ rẹ",
      "Ìwé-ẹ̀rí tàbí ìwé-àṣẹ tí iṣẹ́ rẹ bá nílò rẹ̀ (fún àpẹẹrẹ fífọ́n oògùn tàbí iṣẹ́ dókítà ẹranko)",
    ],
  },
  cropsPage: {
    title: "Irúgbìn àti àsìkò",
    intro: `${brand.name} bẹ̀rẹ̀ pẹ̀lú irúgbìn 15 tí a ń gbìn káàkiri Gúúsù-Ìwọ̀ Oòrùn, fún àsìkò òjò méjèèjì àti ẹ̀fọ́ ìgbà ẹ̀rùn.`,
    listTitle: "Irúgbìn tí a fi bẹ̀rẹ̀",
    seasonsTitle: "Àsìkò mẹ́ta",
    seasons: [
      { title: "Àsìkò òjò àkọ́kọ́", body: "Ọ̀gbìn àkọ́kọ́ láti ìgbà tí òjò bá bẹ̀rẹ̀ dáadáa, láti bí oṣù Ẹrẹ̀nà (March) sí Agẹmọ (July)." },
      { title: "Àsìkò òjò ìkẹyìn", body: "Ọ̀gbìn kejì láti bí oṣù Ògún (August) sí Bélú (November)." },
      { title: "Ìgbà ẹ̀rùn (pẹ̀lú ìbomirin)", body: "Ẹ̀fọ́ àti àwọn irúgbìn mìíràn tí a ń bomi rin láti bí oṣù Bélú (November) sí Ẹrẹ̀nà (March)." },
    ],
    zonesTitle: "Agbègbè ọ̀gbìn méjì",
    zones: [
      { title: "Agbègbè igbó", body: "Agbègbè igbó tí ó tutù: ọ̀pọ̀ nínú Ògùn, Oǹdó, Ọ̀ṣun, Èkìtì, gúúsù Ọ̀yọ́ àti Èkó." },
      { title: "Agbègbè ọ̀dàn (derived savanna)", body: "Agbègbè ààlà tí ó gbẹ díẹ̀: àríwá Ọ̀yọ́, àríwá Ògùn àti apá kan Ọ̀ṣun àti Èkìtì." },
    ],
    standardsTitle: "Ìmọ̀ràn tí o lè tọpinpin",
    standardsBody:
      "Gbogbo ètò àti iye ajílẹ̀ tàbí oògùn wá láti inú ìlànà tí a kọ sílẹ̀ fún irúgbìn, agbègbè àti àsìkò yẹn, tí àwọn onímọ̀ ọ̀gbìn ṣàyẹ̀wò tí wọ́n sì fọwọ́ sí. Áàpù máa ń fi ìlànà tí ó lò hàn, kí ìwọ àti aṣojú ìmọ̀ ọ̀gbìn rẹ lè ṣàyẹ̀wò rẹ̀.",
  },
  partnersPage: {
    title: "Bá wa ṣiṣẹ́ pọ̀",
    intro: "A ń bá àwọn àjọ tí ń sin àgbẹ̀ ṣiṣẹ́. Papọ̀, a lè dé ọ̀pọ̀ oko pẹ̀lú ìmọ̀ràn rere, gbígba iṣẹ́ lọ́nà tó tọ́ àti àkọsílẹ̀ tó dára.",
    typesTitle: "Àwọn tí a ń bá ṣiṣẹ́",
    types: [
      { title: "Àwọn ẹgbẹ́ àjùmọ̀ṣe àti ẹgbẹ́ àgbẹ̀", body: "Forúkọ àwọn ọmọ ẹgbẹ́ sílẹ̀, ṣètò papọ̀, kí ẹ sì gba ẹ̀rọ fún ẹgbẹ́." },
      { title: "Ìjọba àti ADP", body: "Ìrànlọ́wọ́ ìmọ̀ ọ̀gbìn, ìforúkọsílẹ̀ àgbẹ̀ àti ṣíṣe àwọn ètò ìjọba." },
      { title: "Ilé ìwádìí àti ilé ẹ̀kọ́", body: "Ìlànà ọ̀gbìn, kàlẹ́ńdà irúgbìn àti ẹ̀kọ́." },
      { title: "Ilé iṣẹ́ ohun èlò àti ẹ̀rọ oko", body: "Ọjà àti iṣẹ́ tí a lè gbẹ́kẹ̀lé fún àwọn àgbẹ̀ ní agbègbè ìdánwò." },
      { title: "Àwọn alábàáṣiṣẹ́ ìdàgbàsókè àti NGO", body: "Àwọn ètò tí ó ń dé ọ̀dọ̀ àwọn àgbẹ̀ kéékèèké." },
    ],
    currentTitle: "Àwọn alábàáṣiṣẹ́ wa",
    noneYet: "A máa kọ orúkọ àwọn alábàáṣiṣẹ́ síbí lẹ́yìn tí a bá fọwọ́ sí àdéhùn.",
    ctaTitle: "Ṣé o fẹ́ bá wa ṣiṣẹ́?",
    ctaBody: "Sọ fún wa nípa àjọ rẹ àti àwọn àgbẹ̀ tí ẹ ń sìn.",
    cta: "Kàn sí wa",
  },
  waitlistPage: {
    title: "Darapọ̀ mọ́ àkọsílẹ̀ ìdúró",
    intro: `Jẹ́ ẹni àkọ́kọ́ tí yóò gbọ́ nígbà tí Ọjà ${brand.name} bá ṣí sílẹ̀ fún rírà àti títà èso oko, irúgbìn àti ohun èlò oko.`,
  },
  legal: {
    draftNotice: "Àkọsílẹ̀ fún ìdánwò àkọ́kọ́ (pilot). Àwọn agbẹjọ́rò wa ń ṣàyẹ̀wò ìwé yìí, ó sì lè yípadà kí a tó ṣí sílẹ̀ fún gbogbo ènìyàn.",
    versionLabel: "Ẹ̀dà",
    updatedLabel: "Àtúnṣe ìkẹyìn",
    contactLine: "Ìbéèrè nípa ìwé yìí? Kàn sí wa láti ojú-ìwé ìkànsí.",
    privacy: {
      title: "Ìlànà àṣírí",
      intro: `Bí ${brand.name} ṣe ń gba, ń lò, tí ó sì ń dáàbò bo àlàyé rẹ, ní ìbámu pẹ̀lú Òfin Ìdáàbòbò Dátà Nàìjíríà 2023.`,
      sections: [
        {
          heading: "Ta ni wá",
          body: [
            `${brand.name} jẹ́ ìkànnì ìṣàkóso oko àti gbígba iṣẹ́ tí a ń dánwò ní Gúúsù-Ìwọ̀ Oòrùn Nàìjíríà. A máa kọ orúkọ ilé iṣẹ́ tí ó ní ojúṣe fún dátà rẹ síbí kí a tó ṣí sílẹ̀.`,
          ],
        },
        {
          heading: "Ohun tí a ń gbà",
          body: [
            "Àlàyé àkáǹtì: nọ́ńbà fóònù rẹ, orúkọ, èdè tí o fẹ́, ìpínlẹ̀ àti ìjọba ìbílẹ̀, àti ímeèlì tí o bá fún wa.",
            "Àkọsílẹ̀ oko: ibi tí oko wà àti ààlà rẹ̀, àwọn ìpín oko, àyẹ̀wò ilẹ̀, ọ̀gbìn, iṣẹ́ tí a ṣe, ọjà ní ìpamọ́, ìnáwó àti owó títà.",
            "Ìjẹ́rìí: èsì àyẹ̀wò NIN, BVN àti CAC. A máa ń tọ́jú nọ́ńbà tí a ti bò nìkan (fún àpẹẹrẹ *******4417), kì í ṣe gbogbo nọ́ńbà. Fún ìsanwó, a máa ń tọ́jú orúkọ báńkì, orúkọ àkáǹtì àti nọ́ńbà mẹ́rin ìkẹyìn àkáǹtì.",
            "Ìwé àti fọ́tò tí o fi ránṣẹ́, bí ẹ̀rí pé o ni ẹ̀rọ tàbí fọ́tò irúgbìn àti iṣẹ́ tí a parí.",
            "Àwọn ìfiránṣẹ́ tí o fi ránṣẹ́ sí wa, àti dátà ìmọ̀-ẹ̀rọ bí irú ẹ̀rọ tí o ń lò àti ìjábọ̀ àṣìṣe.",
          ],
        },
        {
          heading: "Ìdí tí a fi ń lò ó",
          body: [
            "Láti pèsè iṣẹ́ tí o forúkọ sílẹ̀ fún: ètò, ìránnilétí, ojú ọjọ́, àkọsílẹ̀, gbígba iṣẹ́ àti ìsanwó.",
            "Láti ṣàyẹ̀wò ìdánimọ̀ àti láti dènà jìbìtì, àti láti tẹ̀lé òfin àti ohun tí alábàáṣiṣẹ́ ìsanwó béèrè.",
            "Láti mú áàpù dára sí i àti láti tún àwọn ìṣòro ṣe.",
            "Láti fi ìròyìn tàbí àǹfààní ránṣẹ́ sí ọ, tí o bá gbà nìkan. O lè yí ọkàn rẹ padà nígbàkúgbà.",
          ],
        },
        {
          heading: "Àwọn tí a ń pín in pẹ̀lú",
          body: [
            "Àwọn ilé iṣẹ́ tí ó ń ràn wá lọ́wọ́ láti ṣiṣẹ́, lábẹ́ àdéhùn: ibi ìpamọ́ dátà lórí ayélujára, fífi SMS ránṣẹ́, àyẹ̀wò ìdánimọ̀ àti, nígbà tí ìsanwó bá bẹ̀rẹ̀, àwọn alábàáṣiṣẹ́ ìsanwó tí ó ní ìwé-àṣẹ.",
            "Ẹnìkejì nínú iṣẹ́ kan yóò rí ohun tí iṣẹ́ náà nílò nìkan, bí orúkọ rẹ, ibi tí oko wà àti ọjọ́.",
            "A kì yóò pín àkọsílẹ̀ oko rẹ pẹ̀lú àwọn ayánilówó, olùrà, olùdókòwò tàbí alábàáṣiṣẹ́ láìsí àṣẹ tí ó ṣe kedere láti ọ̀dọ̀ rẹ, o sì lè gba àṣẹ yẹn padà nígbàkúgbà.",
            "Àwọn aláṣẹ ìjọba, nígbà tí òfin bá béèrè nìkan.",
          ],
        },
        {
          heading: "Ibi tí a ń tọ́jú rẹ̀ àti fún ìgbà tí ó pẹ́ tó",
          body: [
            "Olùpèsè ìpamọ́ dátà wa ń tọ́jú ibi ìpamọ́ dátà wa ní Ìṣọ̀kan Yúróòpù (Ireland), pẹ̀lú ààbò tí òfin Nàìjíríà béèrè fún gbígbé dátà lọ sí òkèèrè.",
            "A máa ń tọ́jú àkáǹtì àti àkọsílẹ̀ oko rẹ nígbà tí àkáǹtì rẹ bá wà ní ṣíṣí. A máa ń tọ́jú àkọsílẹ̀ ìsanwó àti ìṣirò owó fún ìgbà tí òfin béèrè, a kò sì lè pa wọ́n rẹ́ ṣáájú ìgbà náà.",
          ],
        },
        {
          heading: "Ẹ̀tọ́ rẹ",
          body: [
            "O lè béèrè láti rí, ṣàtúnṣe, gbà sílẹ̀ tàbí pa àlàyé rẹ rẹ́, gba àṣẹ padà, tàbí takò bí a ṣe ń lò ó. Kàn sí wa, a ó sì dáhùn láàárín àkókò tí òfin fàyè gbà.",
            "O tún lè fi ẹ̀sùn sùn Àjọ Ìdáàbòbò Dátà Nàìjíríà (NDPC).",
          ],
        },
        {
          heading: "Pípa á mọ́ láìséwu",
          body: [
            "A máa ń fi kóòdù àṣírí bo dátà nígbà tí a bá ń fi ránṣẹ́ àti nígbà tí ó wà ní ìpamọ́. Ipa iṣẹ́ ló ń pinnu ẹni tí ó lè wọlé, a máa ń kọ gbogbo ìgbésẹ̀ òṣìṣẹ́ lórí àkáǹtì rẹ sílẹ̀, a sì máa ń tọ́jú ìwé ìdánimọ̀ ní ìkọ̀kọ̀.",
          ],
        },
        {
          heading: "Àwọn ọmọdé",
          body: [`Àkáǹtì ${brand.name} wà fún àwọn tí ọjọ́ orí wọn jẹ́ ọdún 18 sókè.`],
        },
        {
          heading: "Àwọn àyípadà",
          body: ["Tí a bá yí ìlànà yìí padà, a máa sọ fún ọ nínú áàpù kí àyípadà náà tó bẹ̀rẹ̀ iṣẹ́."],
        },
      ],
    },
    terms: {
      title: "Àwọn òfin lílò",
      intro: `Àwọn òfin fún lílo ${brand.name} nígbà ìdánwò àkọ́kọ́.`,
      sections: [
        {
          heading: "Nípa àwọn òfin yìí",
          body: [
            `Nípa ṣíṣí àkáǹtì, o gbà láti tẹ̀lé àwọn òfin yìí. Iṣẹ́ náà wà ní ìdánwò, nítorí náà àwọn ẹ̀yà rẹ̀ lè yípadà.`,
          ],
        },
        {
          heading: "Àkáǹtì rẹ",
          body: [
            "Wọlé pẹ̀lú nọ́ńbà fóònù tìrẹ, kí o sì pa àwọn kóòdù ìgbà-kan mọ́ ní àṣírí. Ènìyàn kan tàbí ilé iṣẹ́ kan ní àkáǹtì kan.",
            "Òṣìṣẹ́ ilé iṣẹ́ kọ̀ọ̀kan máa ń lo ìwọlé tirẹ̀; má ṣe pín ìwọlé.",
            "Fún wa ní àlàyé òtítọ́. A máa ń fọwọ́ sí ipa bí olùní ẹ̀rọ tàbí olùpèsè iṣẹ́ lẹ́yìn àyẹ̀wò nìkan.",
          ],
        },
        {
          heading: "Ìmọ̀ràn oko",
          body: [
            "Àwọn ètò àti iye ajílẹ̀ tàbí oògùn wá láti inú ìlànà fún irúgbìn, agbègbè àti àsìkò rẹ, ṣùgbọ́n oko kọ̀ọ̀kan yàtọ̀. Lò wọ́n gẹ́gẹ́ bí ìtọ́sọ́nà, kí o sì bá onímọ̀ ọ̀gbìn tàbí aṣojú ìmọ̀ ọ̀gbìn sọ̀rọ̀ nígbà tí o kò bá dá ọ lójú.",
            "Máa tẹ̀lé ìtọ́ni orí àpò ọjà àti ìlànà ààbò nígbà gbogbo tí o bá ń lo oògùn oko.",
            "Olùrànlọ́wọ́ oko lè ṣàṣìṣe. Ìdámọ̀ àìsàn láti fọ́tò máa ń fi bí ó ṣe dá a lójú tó hàn, kì í sì í ṣe ìdámọ̀ ọ̀jọ̀gbọ́n.",
          ],
        },
        {
          heading: "Gbígba iṣẹ́ àti ìsanwó",
          body: [
            `Nígbà ìdánwò, ${brand.name} kò ní gba, mú tàbí san owó kankan. Àgbẹ̀ yóò san owó fún olùpèsè iṣẹ́ ní tààràtà, àwọn méjèèjì yóò sì sàmì sí i nínú áàpù pé a ti sanwó. ${brand.name} kò sí nínú ìsanwó náà.`,
            "Kò sí kọ́míṣọ̀n nígbà ìdánwò. A ó fi kọ́míṣọ̀n àti owó ìfagilé tó bá wà lọ́jọ́ iwájú hàn kí o tó gba iṣẹ́ tàbí kí o tó gba ẹni.",
            "Ìsanwó tó ní ààbò nípasẹ̀ alábàáṣiṣẹ́ ìsanwó tí ó ní ìwé-àṣẹ ń bọ̀ lẹ́yìn àyẹ̀wò òfin. A ó ṣe àtúnṣe àwọn òfin yìí, a ó sì sọ fún ọ kí ó tó bẹ̀rẹ̀.",
          ],
        },
        {
          heading: "Lílò tó tọ́",
          body: [
            "Má ṣe fún wa ní àlàyé èké, má ṣe ṣẹ̀dá iṣẹ́ tàbí ìdíyelé èké, má ṣe dààmú àwọn olùlò mìíràn, má sì ṣe gbìyànjú láti yẹra fún ìsanwó tàbí ààbò.",
            "A lè dá àkáǹtì tí ó bá rú àwọn òfin yìí dúró tàbí pa á, a ó sì sọ ìdí rẹ̀ fún ọ.",
          ],
        },
        {
          heading: "Ojúṣe wa",
          body: [
            "A ń ṣiṣẹ́ takuntakun láti jẹ́ kí iṣẹ́ wa péye kí ó sì wà ní àrọ́wọ́tó, ṣùgbọ́n a kò lè ṣèlérí ìkórè, àsọtẹ́lẹ̀ ojú ọjọ́ tàbí iṣẹ́ àwọn olùpèsè iṣẹ́ aládàáṣe. Kò sí ohun kan nínú àwọn òfin yìí tí ó dín ẹ̀tọ́ rẹ lábẹ́ òfin ààbò oníbàárà Nàìjíríà kù.",
          ],
        },
        {
          heading: "Òfin àti ìkànsí",
          body: ["Òfin Orílẹ̀-èdè Olómìnira Àpapọ̀ Nàìjíríà ló ń darí àwọn òfin yìí."],
        },
      ],
    },
  },
};

export default yoPages;
