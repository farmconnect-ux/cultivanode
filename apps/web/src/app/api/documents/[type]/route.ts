import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";
  const dateStr = new Date().toISOString().slice(0, 10);

  // CSV Exports
  if (type === "contracts-registry") {
    const csvContent = [
      "Contract_ID,Counterparty_Enterprise,Outgrower_Cluster,Crop_Variety,Hectares_Committed,Target_Volume_MT,Pricing_Formula,Escrow_Agent,SLA_Status,Effective_Date",
      "AGR-CTR-2026-081,Psaltry International PLC,Ado-Awaye Outgrowers (480 Farmers),Cassava (TME 419),1200.0,30000.0,₦95000/MT + Starch Premium,Providus Bank Escrow Trust,Active SLA Valid,2026-02-15",
      "AGR-CTR-2026-082,Premier Feed Mills (FMN),Iseyin Maize Syndicate (310 Farmers),Yellow Maize (SAMMAZ-15),850.0,4250.0,₦580000/MT Floor Price,Wema Bank Agri-Desk,Active SLA Valid,2026-03-01",
      "AGR-CTR-2026-083,Nestle Nigeria PLC,Ogun Valley Cocoa Syndicate,Cocoa (TC-1 Seedlings),450.0,675.0,ICCO Index + ₦120000/MT Rainforest Cert,Providus Bank Escrow Trust,Active SLA Valid,2026-01-20",
      "AGR-CTR-2026-084,Olam Agri Nigeria,Saki Soybean Cluster (195 Farmers),Soybean (TGX-1448-2E),620.0,1550.0,₦720000/MT Guaranteed Offtake,Wema Bank Agri-Desk,Active SLA Valid,2026-04-10",
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cultivanode-contracts-registry-${dateStr}.csv"`,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  if (type === "waybills") {
    const csvContent = [
      "Waybill_Number,Dispatch_Date,Source_Depot,Destination_Cluster,Transporter,Driver_Name,Cargo_Description,Quantity_Bags,Net_Weight_KG,Carrier_Plate,Escrow_Release_Code,Delivery_Status",
      "WB-2026-00912,2026-04-02,Ibadan Central Agrarian Depot,Iseyin Cluster Gate 3,Kolawole Heavy Haulage,Adeyemi Sunday,Certified NPK 15-15-15 Fertilizer,600,30000,OY-882-APP,ESC-9921-OK,Delivered & Verified",
      "WB-2026-00913,2026-04-05,Sagamu Agro-Chemical Hub,Abeokuta North Syndicate,SwiftTransit Logistics,Musa Ibrahim,Glyphosate Herbicide (20L Jerrycans),150,3000,OG-412-SMK,ESC-9922-OK,In Transit GPS Monitored",
      "WB-2026-00914,2026-04-08,Akure Grain Terminal,Ondo Cocoa Station,Ondo State Fleet Corp,Babatunde Rotimi,Fungicide Copper Hydroxide (1kg),400,400,OD-102-AKR,ESC-9923-OK,Delivered & Verified",
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cultivanode-supplier-waybills-${dateStr}.csv"`,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  if (type === "nibss") {
    const csvContent = [
      "Beneficiary_Account_Number,Beneficiary_Bank_Code,Beneficiary_Name,Amount_NGN,Narration,Payment_Reference,Mandate_Code",
      "0123456789,101,Ado-Awaye Tractor Syndicate,840000.00,Tillage Booking Settlement #BK-8821,CN-NIBSS-2026-001,MND-PROV-901",
      "0987654321,035,Saki Agro-Input Merchant Ltd,425000.00,Urea Fertilizer Delivery #WB-914,CN-NIBSS-2026-002,MND-WEMA-902",
      "0112233445,101,Ogun Valley Cocoa Outgrowers,1250000.00,Milestone 2 Harvest Escrow Disbursement,CN-NIBSS-2026-003,MND-PROV-903",
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cultivanode-nibss-transfer-batch-${dateStr}.csv"`,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  if (type === "json-ld-proofs") {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "DataFeed",
      publisher: {
        "@type": "Organization",
        name: "CultivaNode Infrastructure Ltd",
        url: "https://cultivanode.com",
        taxID: "RC-78192301",
      },
      auditDate: new Date().toISOString(),
      merkleRoot: "0x7f9a2b881c20e14d9b43e8876a5210bc",
      chainHeight: 184209,
      escrowCustodyRails: ["Providus Bank PLC", "Wema Bank ALAT Agri-Desk"],
      dataPrivacyStandard: "Nigeria Data Protection Act (NDPA 2023) SEC 24(1)-(3)",
      proofVerified: true,
    };

    return new Response(JSON.stringify(jsonLd, null, 2), {
      headers: {
        "Content-Type": "application/ld+json; charset=utf-8",
        "Content-Disposition": `attachment; filename="cultivanode-merkle-proofs-${dateStr}.jsonld"`,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  // Document definitions (PDF-ready, printable HTML layouts)
  const documents: Record<
    string,
    { title: string; subtitle: string; ref: string; bodyHtml: string }
  > = {
    whitepaper: {
      title: "CultivaNode Technical Whitepaper",
      subtitle: "Verifiable Agrarian Mesh & Digital Rail Operating System (v2.4)",
      ref: "CN-ENG-WP-2026.4",
      bodyHtml: `
        <h3>1. Executive Overview</h3>
        <p>CultivaNode bridges structural coordination failures in African agriculture through high-precision cadastral GIS polygon delineation, degree-day thermal phenology engines, cryptographic double-entry ledgers, and deadhead-minimized tractor fleet dispatch.</p>
        <h3>2. Cadastral Spatial Geometry</h3>
        <p>Plot delineations adhere to the WGS-84 coordinate reference ellipsoid. Sub-meter GNSS perimeter walks are verified for closure tolerance (&epsilon; &lt; 1.5m) and zero tenure overlap before certificate issuance.</p>
        <h3>3. Escrow Settlement Protocol</h3>
        <p>Tripartite clearing rails administer 100% principal segregation in Providus Bank PLC and Wema Bank ALAT trust vaults. Automatic 48-hour mechanical force majeure reversals ensure full farmer restitution if syndicates fail to mobilize.</p>
        <h3>4. Statutory Data Governance</h3>
        <p>CultivaNode guarantees absolute farmer data sovereignty under the Nigeria Data Protection Act (NDPA 2023). Biometric records and farm cadastre coordinates remain uncommercialized and unencumbered.</p>
      `,
    },
    "institutional-whitepaper": {
      title: "Institutional & Sovereign Partner Whitepaper",
      subtitle: "State ADP Integration, Escrow Governance, and Agricultural Corridor Rails",
      ref: "CN-GOV-WP-2026.1",
      bodyHtml: `
        <h3>1. Sovereign Partnership Mandate</h3>
        <p>Designed for collaboration with State Agricultural Development Programmes (OYSADEP, OGADEP, OSSADEP) and the Central Bank of Nigeria (CBN), CultivaNode establishes transparent digital rails for outgrower monitoring, subsidized tractor dispatch, and zero-leakage input distribution.</p>
        <h3>2. Audited Escrow Oversight</h3>
        <p>Funds are locked in segregated bank custody accounts administered by CBN-licensed financial institutions. All disbursements require two-factor field verification: geotagged proof-of-work (GIS boundary overlap &ge; 95%) and encrypted beneficiary confirmation.</p>
        <h3>3. Extension Agent Accreditation</h3>
        <p>Accredited civil service extension enumerators utilize CultivaNode offline tablets to conduct cadastral mapping, soil sampling, and pest scouting, receiving instant compensation into regulated wallets.</p>
      `,
    },
    handbook: {
      title: "Participant Operations Handbook",
      subtitle: "Field Manual for Smallholders, Machinery Syndicates, and Extension Agents",
      ref: "CN-OPS-HB-2026.2",
      bodyHtml: `
        <h3>1. Onboarding & Cadastral Delineation</h3>
        <p>Step-by-step guidance on walking farm parcel perimeters with accredited ADP agents. Requirements include valid NIN, mobile phone number, and contiguous plot boundary access.</p>
        <h3>2. Tractor Hire & Service Booking</h3>
        <p>How to book mechanized tillage, ridging, planting, or spraying with zero broker fees. Explains the 3-stage escrow payment release and proof-of-work sign-off process.</p>
        <h3>3. Offline Field Operations</h3>
        <p>Using CultivaNode in areas without cellular coverage: local SQLite database caching, delayed synchronization, and SMS notification fallbacks.</p>
      `,
    },
    "pest-poster": {
      title: "Pest & Disease Field Identification Guide",
      subtitle: "Diagnostic Protocols & Threshold Actions for South-West Agrarian Belts",
      ref: "CN-AGRO-ID-2026.3",
      bodyHtml: `
        <h3>Key Priority Pests & Crop Pathogens</h3>
        <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin-top:12px;">
          <thead>
            <tr style="background:#f0f7f2;text-align:left;">
              <th>Crop</th>
              <th>Pest / Disease</th>
              <th>Field Symptoms</th>
              <th>Intervention Threshold</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cassava</strong></td>
              <td>Cassava Mosaic Disease (CMD)</td>
              <td>Distorted, chlorotic leaves; stunted growth</td>
              <td>Uproot & burn infected cuttings; use TME-419 resistant stem</td>
            </tr>
            <tr>
              <td><strong>Maize</strong></td>
              <td>Fall Armyworm (Spodoptera frugiperda)</td>
              <td>Window-pane leaf feeding; frass in whorl</td>
              <td>10% infected plants; apply registered bio-pesticide early morning</td>
            </tr>
            <tr>
              <td><strong>Cocoa</strong></td>
              <td>Black Pod (Phytophthora palmivora)</td>
              <td>Brown rotting lesions on pods; fungal white mycelium</td>
              <td>Remove mummified pods; copper hydroxide spray at onset of rains</td>
            </tr>
            <tr>
              <td><strong>Tomato</strong></td>
              <td>Tuta absoluta (Leaf Miner)</td>
              <td>Silvery blotch leaf mines; fruit bore holes</td>
              <td>Pheromone trap count &gt; 3 moths/night; bacillus thuringiensis spray</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    "scout-logbook": {
      title: "Offline Field Scout & Soil Observation Logbook",
      subtitle: "Standardized Ground Observation Grid for Cadastral Surveyors",
      ref: "CN-AGRO-LOG-2026.1",
      bodyHtml: `
        <h3>Plot Observation Template</h3>
        <p>Record observations during weekly farm perimeter transects:</p>
        <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin-top:12px;">
          <thead>
            <tr style="background:#f0f7f2;text-align:left;">
              <th>Date</th>
              <th>Parcel ID</th>
              <th>Scout GPS Coord</th>
              <th>Soil Moisture (%)</th>
              <th>Crop Stage</th>
              <th>Observed Stress / Pests</th>
              <th>Sign-off</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>____/____</td><td>PLT-____</td><td>Lat: ____, Lng: ____</td><td>[ ] Dry [ ] Optimal [ ] Waterlogged</td><td>Vegetative / Tuber</td><td>__________________</td><td>______</td></tr>
            <tr><td>____/____</td><td>PLT-____</td><td>Lat: ____, Lng: ____</td><td>[ ] Dry [ ] Optimal [ ] Waterlogged</td><td>Vegetative / Tuber</td><td>__________________</td><td>______</td></tr>
            <tr><td>____/____</td><td>PLT-____</td><td>Lat: ____, Lng: ____</td><td>[ ] Dry [ ] Optimal [ ] Waterlogged</td><td>Vegetative / Tuber</td><td>__________________</td><td>______</td></tr>
          </tbody>
        </table>
      `,
    },
    "outgrower-covenant": {
      title: "Master Outgrower Agricultural Production Covenant",
      subtitle: "Structured Supply, Quality Underwriting, and Escrow Commitment Terms",
      ref: "CN-LEGAL-COV-2026.7",
      bodyHtml: `
        <h3>1. Parties & Commercial Purpose</h3>
        <p>This master agreement governs structured production contracts executed between off-takers and cooperative outgrower clusters across Oyo, Osun, Ogun, and Ondo agricultural corridors.</p>
        <h3>2. Delivery & Quality Grading Specifications</h3>
        <p>Produce delivered under this covenant must satisfy calibrated moisture, purity, and grading thresholds. Inspection occurs at accredited aggregation depots with certified electronic weighbridges.</p>
        <h3>3. Escrow Custody & Automatic Payouts</h3>
        <p>All buyer purchase payments are sequestered in partner bank escrow. Upon automated weighbridge and moisture certification, escrow disbursements execute within 4 hours directly to grower accounts.</p>
      `,
    },
    "escrow-rules": {
      title: "Machinery Escrow & Cancellation Code",
      subtitle: "Operational Terms, Force Majeure, and Refund Schedules (&sect;4.19)",
      ref: "CN-LEGAL-ESC-2026.4",
      bodyHtml: `
        <h3>Clause 4.1: Escrow Protection Principle</h3>
        <p>To eliminate booking defaults and tractor operator abandonment, all machinery hire fees remain locked in designated escrow trustee clearing accounts until telemetry proof of work is verified.</p>
        <h3>Clause 4.2: Cancellation & Refund Ladder</h3>
        <ul>
          <li><strong>&gt; 48 Hours Prior Notice:</strong> 100% full refund to the farmer.</li>
          <li><strong>24 &ndash; 48 Hours Prior Notice:</strong> 90% refund (10% transit mobilization allowance).</li>
          <li><strong>&lt; 24 Hours Prior Notice:</strong> 75% refund (25% operator transit compensation).</li>
          <li><strong>Force Majeure / Mechanical Breakdown:</strong> 100% immediate full refund settled via Providus Bank escrow rails.</li>
        </ul>
      `,
    },
    "dispute-procedure": {
      title: "Syndicate Dispute Arbitration Framework",
      subtitle: "Rapid 48-Hour Agricultural Mediation & Resolution Guidelines",
      ref: "CN-LEGAL-ARB-2026.2",
      bodyHtml: `
        <h3>1. Scope of Arbitration</h3>
        <p>Applies to all contested tillage depth disputes, non-germination claims, contaminated input allegations, and transport delay damages.</p>
        <h3>2. 48-Hour Evidentiary Resolution</h3>
        <p>Independent ADP agronomy officers inspect the physical parcel, reviewing GNSS tractor telemetry logs and soil records to issue a binding determination within 48 hours.</p>
      `,
    },
    "privacy-charter": {
      title: "Data Privacy Charter & NDPA 2023 Compliance",
      subtitle: "Statutory Farmer Data Sovereignty & Protection Rights",
      ref: "CN-LEGAL-NDPA-2026.1",
      bodyHtml: `
        <h3>1. Absolute Ownership</h3>
        <p>All cadastral GIS boundaries, crop harvest metrics, soil health telemetry, and financial transaction records remain the sole property of the registered producer.</p>
        <h3>2. Prohibited Exploitation</h3>
        <p>CultivaNode Infrastructure Ltd does not sell, lease, or monetize individual farmer data. Aggregated analytics are restricted to agricultural research and state food security planning.</p>
      `,
    },
    "legal-pack": {
      title: "CultivaNode Consolidated Legal & Governance Pack",
      subtitle: "Master Terms, Outgrower Covenants, Escrow Code, and Privacy Charters",
      ref: "CN-LEGAL-PACK-2026.COMPLETE",
      bodyHtml: `
        <h3>Consolidated Legal Standard</h3>
        <p>This document contains the complete legal suite governing CultivaNode operations, including the Master Terms of Service (Ref: 02-TOS-2025), Outgrower Production Covenants (&sect;6.7), Machinery Escrow Code (&sect;4.19), and NDPA 2023 Compliance Charter.</p>
      `,
    },
    "escrow-guarantee": {
      title: "Tripartite Escrow Guarantee Agreement",
      subtitle: "Settlement Protocol Executed with Providus Bank PLC & Wema Bank ALAT",
      ref: "CN-FIN-ESG-2026.881",
      bodyHtml: `
        <h3>Financial Guarantee Covenants</h3>
        <p>Confirms institutional ring-fencing of all agricultural transactions within regulated partner trust pools. Payouts are non-commingled and protected against unilateral cancellation.</p>
      `,
    },
    "coop-ratification": {
      title: "Cooperative General Assembly Ratification Minutes",
      subtitle: "Official Resolution Adopting CultivaNode Cadastral Registry & Offtake SLAs",
      ref: "CN-COOP-RAT-2026.04",
      bodyHtml: `
        <h3>Ratification Resolution</h3>
        <p>Unanimously ratified by the General Assembly of participating agricultural cooperatives across Oyo and Osun states, establishing collective bargaining and cadastral group certification.</p>
      `,
    },
    "supplier-certificate": {
      title: "Accredited Agricultural Merchant Certificate",
      subtitle: "Verified Supplier Accreditation for Certified Seeds, Agrochemicals & Equipment",
      ref: "CN-CERT-MERCH-2026.104",
      bodyHtml: `
        <h3>Accreditation Verification</h3>
        <p>Certifies that the merchant has passed mandatory regulatory verification with the National Agricultural Seeds Council (NASC) and NAFDAC for registered agricultural inputs.</p>
      `,
    },
    "compliance-audit": {
      title: "Statutory Compliance Audit Report",
      subtitle: "Quarterly Evaluation of NDPA 2023, KYC/AML Tiers, and Platform Escrow Operations",
      ref: "CN-AUDIT-REP-2026.Q1",
      bodyHtml: `
        <h3>Audit Summary</h3>
        <p>Evaluation confirms zero security breaches, full NDPA 2023 statutory adherence, 100% cryptographic ledger balance reconciliation, and 0% unverified escrow disbursements.</p>
      `,
    },
    "agronomy-dossier": {
      title: "Regional Agronomic Research Dossier",
      subtitle: "Empirical Crop Calibrations & Degree-Day Phenology Across South-West Agro-Ecological Zones",
      ref: "CN-RES-DOSSIER-2026.3",
      bodyHtml: `
        <h3>Research Findings</h3>
        <p>Compiled in partnership with IITA and regional ADPs, documenting verified thermal baselines, water requirements, and optimal sowing dates for Cassava, Maize, Soybean, and Cocoa.</p>
      `,
    },
    "sop-repository": {
      title: "Standard Operating Procedures (SOP) Repository",
      subtitle: "Standardized Protocols for Land Preparation, Mechanized Tillage, and Chemical Application",
      ref: "CN-SOP-PACK-2026.ALL",
      bodyHtml: `
        <h3>Operational Standard Operating Procedures</h3>
        <p>Comprehensive standard procedures for calibration of tractor disc plows, boom sprayers, safe agrochemical handling, and grain post-harvest drying.</p>
      `,
    },
  };

  const doc = documents[type] || documents["whitepaper"];

  // Render an official printable HTML document layout
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title} · CultivaNode</title>
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
        <div class="tagline">Agricultural Operating System &middot; South-West Nigeria Mesh</div>
      </div>
      <div class="meta-box">
        <span class="badge">OFFICIAL DOCUMENT</span>
        <div>REF: ${doc.ref}</div>
        <div>DATE: ${dateStr}</div>
        <div>STATUS: VALIDATED</div>
      </div>
    </div>

    <h1>${doc.title}</h1>
    <h2>${doc.subtitle}</h2>

    <div class="content">
      ${doc.bodyHtml}
    </div>

    <div class="footer">
      <div>CultivaNode Infrastructure Ltd &middot; NDPA 2023 Compliant</div>
      <div>Settlement Conduits: Providus Bank PLC &middot; Wema Bank ALAT</div>
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
