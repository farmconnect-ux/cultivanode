import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";
  const dateStr = new Date().toISOString().slice(0, 10);

  // Every file this route serves is a draft for the pilot. Earlier versions carried invented contracts,
  // bank partners, registrations and stamps; those were removed on 15 Nov 2026 (see the claims register).
  const COMPANY_LINE =
    "CultivaNode is run by Excel Palace Global Concept (BN 7455859), a business name registered with the Corporate Affairs Commission.";
  const DRAFT = "Draft — not a signed or certified document";

  // CSV exports (kept so existing links work; they hold no records yet)
  const csv = (rows: string[], filename: string) =>
    new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}-${dateStr}.csv"`,
        "Cache-Control": "private, no-cache",
      },
    });

  if (type === "contracts-registry") {
    return csv(
      [
        "Status,Note",
        `"${DRAFT}","No supply or offtake contracts have been signed. This register will list them once agreements exist."`,
      ],
      "cultivanode-contracts-registry",
    );
  }

  if (type === "waybills") {
    return csv(
      [
        "Status,Note",
        `"${DRAFT}","CultivaNode does not track deliveries or waybills yet. This export will hold real records once that feature is built."`,
      ],
      "cultivanode-supplier-waybills",
    );
  }

  if (type === "nibss") {
    return csv(
      [
        "Status,Note",
        `"${DRAFT}","CultivaNode does not make bank transfers during the pilot. When you hire, you pay the provider directly."`,
      ],
      "cultivanode-transfer-batch",
    );
  }

  if (type === "json-ld-proofs") {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "DataFeed",
      name: "CultivaNode records feed",
      description: `${DRAFT}. This feed is a placeholder and holds no records yet.`,
      publisher: {
        "@type": "Organization",
        name: "Excel Palace Global Concept",
        brand: "CultivaNode",
        url: "https://cultivanode.com",
        description: COMPANY_LINE,
      },
      dateModified: new Date().toISOString(),
      dataFeedElement: [],
    };

    return new Response(JSON.stringify(jsonLd, null, 2), {
      headers: {
        "Content-Type": "application/ld+json; charset=utf-8",
        "Content-Disposition": `attachment; filename="cultivanode-records-feed-${dateStr}.jsonld"`,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  // Shown on documents that cannot exist honestly yet.
  const notYet = (what: string) => `
        <h3>Not published yet</h3>
        <p>${what}</p>
        <p>We will publish this document here when it exists. Until then, nothing on this page is a signed agreement, certificate or report.</p>
        <p>Questions? Use the contact page on cultivanode.com.</p>
      `;

  // Document definitions (printable HTML layouts)
  const documents: Record<string, { title: string; subtitle: string; bodyHtml: string }> = {
    whitepaper: {
      title: "CultivaNode Technical Overview",
      subtitle: "How the pilot app works and what is still being built",
      bodyHtml: `
        <h3>1. What CultivaNode is</h3>
        <p>CultivaNode is a farm management and hiring app, in a pilot with farmers in South-West Nigeria (Oyo, Ogun, Osun, Ondo, Ekiti and Lagos). ${COMPANY_LINE}</p>
        <p>In the pilot you can use: a crop calendar for 15 common South-West crops; hiring of verified machinery owners and farm hands near your farm; a 10-day weather forecast for your farm; store and inventory; farm books; and a farm assistant in English, Pidgin or Yorùbá (photo diagnosis is coming).</p>
        <h3>2. Farms and records</h3>
        <p>You add your farm by dropping a pin with your phone. Walking the boundary comes later. Records are kept in a Postgres database (Supabase) with PostGIS for farm locations, and row-level security so each account can only reach its own records.</p>
        <h3>3. Payments</h3>
        <p>When you hire in the pilot, you pay the tractor owner or farm hand directly. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed. On the marketplace, buyers pay at checkout by card, bank transfer or USSD through a licensed payment provider.</p>
        <h3>4. Your data</h3>
        <p>We follow the Nigeria Data Protection Act 2023: we ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data.</p>
        <h3>5. Coming soon</h3>
        <ul>
          <li>Fertiliser and spray planner</li>
          <li>Offline mode</li>
          <li>Proof of work (check-in and photos with location and time)</li>
          <li>Ratings on completed jobs</li>
          <li>Boundary walking</li>
        </ul>
      `,
    },
    "institutional-whitepaper": {
      title: "Information for Partners",
      subtitle: "For organisations that want to work with the CultivaNode pilot",
      bodyHtml: `
        <h3>1. Who we are</h3>
        <p>${COMPANY_LINE} We are running a pilot with farmers in South-West Nigeria.</p>
        <h3>2. What the pilot does</h3>
        <p>Farmers plan their crops, hire verified machinery owners and farm hands near their farm, check a 10-day weather forecast and keep their store and farm books. Everyone who lists equipment or receives payments is checked with their NIN, BVN and bank account.</p>
        <h3>3. Partners</h3>
        <p>We will list partners here once agreements are signed. If your organisation would like to talk to us, use the contact page on cultivanode.com.</p>
      `,
    },
    handbook: {
      title: "Participant Handbook",
      subtitle: "Getting started in the pilot: farmers, machinery owners and farm hands",
      bodyHtml: `
        <h3>1. Sign up and add your farm</h3>
        <p>Sign up with your email address. Phone sign-in is coming soon. Add your farm by dropping a pin with your phone; walking the boundary comes later. Choose your crops and the app builds your season plan.</p>
        <h3>2. Hiring a tractor or farm hands</h3>
        <p>Find verified machinery owners and farm hands near your farm, with their price shown before you hire. In the pilot you pay the provider directly, and there is no platform fee on hires. Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed.</p>
        <h3>3. Listing equipment or services</h3>
        <p>Everyone who lists equipment or receives payments is checked with their NIN, BVN and bank account, through a licensed verification provider. We ask for your consent before the check and store only masked ID numbers.</p>
        <h3>4. Poor network</h3>
        <p>Offline mode is coming soon. For now the app needs a network connection to save your work.</p>
      `,
    },
    "pest-poster": {
      title: "Pest & Disease Field Guide",
      subtitle: "Common problems in South-West farms: what to look for and what to do",
      bodyHtml: `
        <p>General guidance only. Ask an extension worker if you are unsure, and always follow the product label.</p>
        <h3>Common pests and diseases</h3>
        <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin-top:12px;">
          <thead>
            <tr style="background:#f0f7f2;text-align:left;">
              <th>Crop</th>
              <th>Pest / Disease</th>
              <th>What you see</th>
              <th>What to do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cassava</strong></td>
              <td>Cassava Mosaic Disease (CMD)</td>
              <td>Distorted, yellow-patched leaves; stunted growth</td>
              <td>Uproot and burn infected plants; plant clean stems of a resistant variety</td>
            </tr>
            <tr>
              <td><strong>Maize</strong></td>
              <td>Fall Armyworm (Spodoptera frugiperda)</td>
              <td>Window-pane holes in leaves; sawdust-like droppings in the whorl</td>
              <td>Check your field every week; act early with a registered product, sprayed in the early morning</td>
            </tr>
            <tr>
              <td><strong>Cocoa</strong></td>
              <td>Black Pod (Phytophthora palmivora)</td>
              <td>Brown rotting patches on pods; white fungal growth</td>
              <td>Remove infected and dried pods; copper-based spray as the rains start</td>
            </tr>
            <tr>
              <td><strong>Tomato</strong></td>
              <td>Tuta absoluta (leaf miner)</td>
              <td>Silvery blotches in leaves; holes in fruit</td>
              <td>Use pheromone traps to watch numbers; remove damaged leaves and fruit; use a registered product</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    "scout-logbook": {
      title: "Field Scouting Logbook",
      subtitle: "A blank sheet to print for your weekly farm walk",
      bodyHtml: `
        <h3>Farm walk record</h3>
        <p>Write down what you see each time you walk your farm:</p>
        <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin-top:12px;">
          <thead>
            <tr style="background:#f0f7f2;text-align:left;">
              <th>Date</th>
              <th>Farm / plot</th>
              <th>Location (optional)</th>
              <th>Soil</th>
              <th>Crop stage</th>
              <th>Pests or problems seen</th>
              <th>Checked by</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>____/____</td><td>__________</td><td>Lat: ____, Lng: ____</td><td>[ ] Dry [ ] Moist [ ] Waterlogged</td><td>__________</td><td>__________________</td><td>______</td></tr>
            <tr><td>____/____</td><td>__________</td><td>Lat: ____, Lng: ____</td><td>[ ] Dry [ ] Moist [ ] Waterlogged</td><td>__________</td><td>__________________</td><td>______</td></tr>
            <tr><td>____/____</td><td>__________</td><td>Lat: ____, Lng: ____</td><td>[ ] Dry [ ] Moist [ ] Waterlogged</td><td>__________</td><td>__________________</td><td>______</td></tr>
          </tbody>
        </table>
      `,
    },
    "outgrower-covenant": {
      title: "Outgrower Agreement",
      subtitle: "Not available yet",
      bodyHtml: notYet("CultivaNode does not run outgrower or offtake contracts during the pilot, so there is no outgrower agreement."),
    },
    "escrow-rules": {
      title: "Escrow & Cancellation Rules",
      subtitle: "Not in force: escrow has not started",
      bodyHtml: `
        <h3>How paying works in the pilot</h3>
        <p>When you hire in the pilot, you pay the tractor owner or farm hand directly. CultivaNode does not collect, hold or pay out money for hires, so there is no escrow and no refund schedule yet.</p>
        <h3>Cancelling</h3>
        <p>Agree any cancellation with the provider directly. If something goes wrong, tell us in the app and our team will help.</p>
        <h3>When escrow comes</h3>
        <p>Escrow (money held until you confirm the job) is coming once a licensed payment partner is signed. The rules, including cancellation and refunds, will be published here before it starts.</p>
      `,
    },
    "dispute-procedure": {
      title: "If Something Goes Wrong with a Job",
      subtitle: "How we help during the pilot",
      bodyHtml: `
        <h3>1. Tell us</h3>
        <p>If a job was not done, was done badly or was not paid, tell us in the app or through the contact page. Give the job, the date and what happened.</p>
        <h3>2. What we do</h3>
        <p>Our team will listen to both sides and help you reach an agreement. Because you pay the provider directly in the pilot, we cannot move or refund money.</p>
        <h3>3. Later</h3>
        <p>A fuller dispute process will be published when escrow and proof of work are live.</p>
      `,
    },
    "privacy-charter": {
      title: "Data Privacy Summary",
      subtitle: "How we handle your information in the pilot",
      bodyHtml: `
        <h3>1. Who is responsible</h3>
        <p>${COMPANY_LINE}</p>
        <h3>2. How we protect your data</h3>
        <p>We follow the Nigeria Data Protection Act 2023: we ask for consent before ID checks, store only masked ID numbers, and you can ask to download or delete your data.</p>
        <h3>3. Your farm records are yours</h3>
        <p>We never share your farm records with lenders, buyers or investors without your permission. The full privacy policy is on the Privacy page of cultivanode.com.</p>
      `,
    },
    "legal-pack": {
      title: "CultivaNode Legal Documents",
      subtitle: "What exists today and what is still to come",
      bodyHtml: `
        <h3>Available now</h3>
        <ul>
          <li>Terms of use: the Terms page on cultivanode.com</li>
          <li>Privacy policy: the Privacy page on cultivanode.com</li>
        </ul>
        <h3>Not written yet</h3>
        <p>Escrow rules, outgrower agreements and other contracts do not exist yet. They will be added here when they do.</p>
        <p>${COMPANY_LINE}</p>
      `,
    },
    "escrow-guarantee": {
      title: "Escrow Agreement",
      subtitle: "Not available yet",
      bodyHtml: notYet("No escrow agreement has been signed. Escrow is coming once a licensed payment partner is signed; we will name the partner here then."),
    },
    "coop-ratification": {
      title: "Cooperative Resolutions",
      subtitle: "Not available yet",
      bodyHtml: notYet("No cooperative has passed a resolution about CultivaNode."),
    },
    "supplier-certificate": {
      title: "Supplier Certificate",
      subtitle: "Not available yet",
      bodyHtml: notYet("CultivaNode does not issue supplier certificates or accreditation. Sellers of seed and farm inputs are responsible for their own approvals."),
    },
    "compliance-audit": {
      title: "Compliance Audit Report",
      subtitle: "Not available yet",
      bodyHtml: notYet("No compliance audit of CultivaNode has been carried out."),
    },
    "agronomy-dossier": {
      title: "Crop Calendar Notes",
      subtitle: "Not available yet",
      bodyHtml: notYet("We have not published a research dossier. The crop calendar in the app covers 15 common South-West crops, for both rainy seasons and dry-season vegetables; when we publish the sources behind it, they will appear here."),
    },
    "sop-repository": {
      title: "Standard Operating Procedures",
      subtitle: "Not available yet",
      bodyHtml: notYet("Standard operating procedures for land preparation, tillage and spraying have not been written yet."),
    },
  };

  const doc = documents[type] || documents["whitepaper"];

  // Render an official printable HTML document layout
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title} · CultivaNode (${DRAFT})</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1a2e22;
      background: #f8faf8;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e1e8e2;
    }
    .header {
      border-bottom: 2px solid #1b5e20;
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #1b5e20;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 12px;
      color: #4a6b55;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #617366;
      font-family: monospace;
    }
    .badge {
      display: inline-block;
      background: #e8f5e9;
      color: #1b5e20;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    h1 {
      font-size: 26px;
      color: #1b5e20;
      margin: 0 0 8px 0;
      line-height: 1.25;
    }
    h2 {
      font-size: 16px;
      color: #4a6b55;
      font-weight: 500;
      margin: 0 0 24px 0;
    }
    h3 {
      font-size: 18px;
      color: #1b5e20;
      margin-top: 24px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e8ede9;
      padding-bottom: 4px;
    }
    p {
      margin: 0 0 16px 0;
      color: #334438;
      font-size: 14px;
    }
    ul, ol {
      margin: 0 0 16px 0;
      padding-left: 20px;
      font-size: 14px;
      color: #334438;
    }
    li {
      margin-bottom: 6px;
    }
    .footer {
      border-top: 1px solid #e1e8e2;
      padding-top: 24px;
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #718276;
    }
    .actions-bar {
      margin-bottom: 24px;
      text-align: right;
    }
    .btn {
      display: inline-block;
      padding: 10px 18px;
      background: #1b5e20;
      color: #ffffff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      border: none;
      cursor: pointer;
    }
    .btn:hover {
      background: #144718;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; }
      .actions-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions-bar">
    <button class="btn" onclick="window.print()">Print Document / Save as PDF</button>
  </div>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">CultivaNode</div>
        <div class="tagline">Farm management and hiring &middot; Pilot in South-West Nigeria</div>
      </div>
      <div class="meta-box">
        <span class="badge">DRAFT &mdash; NOT SIGNED OR CERTIFIED</span>
        <div>DATE: ${dateStr}</div>
        <div>STATUS: Draft for the pilot</div>
      </div>
    </div>

    <h1>${doc.title}</h1>
    <h2>${doc.subtitle}</h2>

    <div class="content">
      ${doc.bodyHtml}
    </div>

    <div class="footer">
      <div>${COMPANY_LINE}</div>
      <div>${DRAFT}</div>
    </div>
  </div>
  ${download ? "<script>window.addEventListener('load', () => window.print());</script>" : ""}
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
