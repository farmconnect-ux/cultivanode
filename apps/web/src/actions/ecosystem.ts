"use server";

// Actions for the ecosystem hubs: off-take contracts, processing, messaging, support, credit,
// insurance, grants, investment, impact programmes, research trials and cooperative aggregation.
// Each table's row level security limits who may write; these actions validate and shape input.
import type { FormResult } from "@/components/live/action-form";
import { actor, date, dbFail, fail, id, kobo, num, ok, oneOf, optText, refreshPages, text, today } from "@/lib/account/act";

type R = Promise<FormResult>;
const stamp = () => Date.now().toString(36).toUpperCase().slice(-6);

// ── Off-take contracts ──────────────────────────────────────────────────────────────────────

export async function createOfftakeContract(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const grower = id(form, "grower_id");
  const commodity = text(form, "commodity", 80);
  const qty = num(form, "contracted_kg");
  const price = kobo(form, "price_per_kg");
  const start = date(form, "delivery_start");
  const end = date(form, "delivery_end");
  if (!grower || !commodity || !qty || qty <= 0 || !price || price <= 0) return fail("Choose the grower and enter the commodity, quantity and price.");
  if (!start || !end || end < start) return fail("Delivery window end must be on or after its start.");
  if (grower === uid) return fail("You can't contract with yourself.");
  const { data: me } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
  const { error } = await supabase.from("offtake_contracts").insert({
    contract_number: `OT-${new Date().getFullYear()}-${stamp()}`,
    buyer_id: uid,
    buyer_name: text(form, "buyer_name", 120) || me?.full_name || "Buyer",
    grower_id: grower,
    commodity,
    grade: optText(form, "grade", 40),
    contracted_kg: qty,
    price_per_kg_kobo: price,
    advance_paid_kobo: kobo(form, "advance_paid") ?? 0,
    delivery_start: start,
    delivery_end: end,
    delivery_point: optText(form, "delivery_point", 160),
    status: "offered",
    terms: optText(form, "terms", 2000),
  });
  if (error) return dbFail(error, "create_offtake_contract");
  refreshPages("/contracts", "/buyer");
  return ok("Contract offered to the grower.");
}

export async function setContractStatus(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const contractId = id(form, "id");
  const status = oneOf(form, "status", ["signed", "active", "delivering", "completed", "cancelled"] as const);
  if (!contractId || !status) return fail("Contract not found.");
  const { error } = await supabase
    .from("offtake_contracts")
    .update({ status, ...(status === "signed" ? { signed_at: new Date().toISOString() } : {}) })
    .eq("id", contractId);
  if (error) return dbFail(error, "set_contract_status");
  refreshPages("/contracts", "/buyer");
  return ok(status === "signed" ? "Contract signed." : "Contract updated.");
}

export async function recordContractDelivery(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const contractId = id(form, "contract_id");
  const qty = num(form, "quantity_kg");
  if (!contractId || !qty || qty <= 0) return fail("Choose the contract and enter the delivered quantity.");
  const { error } = await supabase.from("contract_deliveries").insert({
    contract_id: contractId,
    delivered_on: date(form, "delivered_on") ?? today(),
    quantity_kg: qty,
    grade: optText(form, "grade", 40),
    moisture_pct: num(form, "moisture_pct"),
    weighbridge_ref: optText(form, "weighbridge_ref", 60),
    accepted: text(form, "accepted", 5) !== "no",
    notes: optText(form, "notes"),
  });
  if (error) return dbFail(error, "record_contract_delivery");
  refreshPages("/contracts", "/buyer");
  return ok("Delivery recorded against the contract.");
}

// ── Processing ──────────────────────────────────────────────────────────────────────────────

const STAGES = ["received", "cleaning", "drying", "milling", "packaging", "quality_check", "dispatched"] as const;

export async function createProcessingBatch(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const facility = text(form, "facility_name", 120);
  const input = text(form, "input_commodity", 80);
  const output = text(form, "output_product", 80);
  const kg = num(form, "input_kg");
  if (!facility || !input || !output || !kg || kg <= 0) return fail("Enter the facility, input, output product and input weight.");
  const { error } = await supabase.from("processing_batches").insert({
    owner_id: uid,
    batch_code: text(form, "batch_code", 40) || `PB-${stamp()}`,
    facility_name: facility,
    input_commodity: input,
    input_kg: kg,
    output_product: output,
    source_farm_id: id(form, "source_farm_id"),
    stage: "received",
    moisture_pct: num(form, "moisture_pct"),
    started_at: new Date().toISOString(),
    notes: optText(form, "notes"),
  });
  if (error) return dbFail(error, "create_processing_batch");
  refreshPages("/processing");
  return ok("Batch received.");
}

export async function advanceBatch(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const batchId = id(form, "id");
  const stage = oneOf(form, "stage", STAGES);
  if (!batchId || !stage) return fail("Choose the next stage.");
  const out = num(form, "output_kg");
  const { error } = await supabase
    .from("processing_batches")
    .update({
      stage,
      ...(out !== null ? { output_kg: out } : {}),
      ...(optText(form, "quality_grade", 10) ? { quality_grade: optText(form, "quality_grade", 10) } : {}),
      ...(stage === "dispatched" ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", batchId);
  if (error) return dbFail(error, "advance_batch");
  refreshPages("/processing");
  return ok("Batch moved to the next stage.");
}

// ── Messages & support ──────────────────────────────────────────────────────────────────────

export async function sendMessage(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const threadId = id(form, "thread_id");
  const body = text(form, "body", 4000);
  if (!threadId || !body) return fail("Write a message first.");
  const { error } = await supabase.from("messages").insert({ thread_id: threadId, sender_id: uid, body });
  if (error) return dbFail(error, "send_message");
  await supabase.from("message_participants").update({ last_read_at: new Date().toISOString() }).eq("thread_id", threadId).eq("profile_id", uid);
  refreshPages("/messages");
  return ok("Message sent.");
}

export async function startThread(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const to = id(form, "recipient_id");
  const subject = text(form, "subject", 160);
  const body = text(form, "body", 4000);
  if (!to || subject.length < 2 || !body) return fail("Choose who to message, add a subject and write your message.");
  if (to === uid) return fail("Choose someone else to message.");
  const { data: thread, error } = await supabase
    .from("message_threads")
    .insert({ subject, created_by: uid, context_type: oneOf(form, "context_type", ["booking", "order", "contract", "support", "general"] as const, "general") })
    .select("id")
    .single();
  if (error || !thread) return dbFail(error, "start_thread");
  const { error: pErr } = await supabase.from("message_participants").insert([
    { thread_id: thread.id, profile_id: uid, last_read_at: new Date().toISOString() },
    { thread_id: thread.id, profile_id: to },
  ]);
  if (pErr) return dbFail(pErr, "thread_participants");
  const { error: mErr } = await supabase.from("messages").insert({ thread_id: thread.id, sender_id: uid, body });
  if (mErr) return dbFail(mErr, "first_message");
  refreshPages("/messages");
  return ok("Conversation started.");
}

const TICKET_CATEGORY = ["account", "booking", "payment", "marketplace", "verification", "technical", "agronomy", "other"] as const;

export async function createSupportTicket(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const subject = text(form, "subject", 160);
  const category = oneOf(form, "category", TICKET_CATEGORY, "other")!;
  const body = text(form, "body", 4000);
  if (subject.length < 3 || !body) return fail("Add a subject and describe the problem.");
  const priority = oneOf(form, "priority", ["low", "normal", "high", "urgent"] as const, "normal")!;
  const hours = { low: 72, normal: 24, high: 8, urgent: 2 }[priority];
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      ticket_number: `TCK-${stamp()}`,
      requester_id: uid,
      subject,
      category,
      priority,
      status: "open",
      channel: "web",
      sla_due_at: new Date(Date.now() + hours * 3_600_000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !ticket) return dbFail(error, "create_ticket");
  await supabase.from("support_ticket_messages").insert({ ticket_id: ticket.id, author_id: uid, body });
  refreshPages("/settings", "/messages");
  return ok("Ticket opened. Our support team will reply here.");
}

// ── Credit ──────────────────────────────────────────────────────────────────────────────────

export async function applyForLoan(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const amount = kobo(form, "amount");
  const tenor = num(form, "tenor_months");
  const purpose = text(form, "purpose", 500);
  const product = text(form, "product", 80);
  if (!amount || amount <= 0 || !tenor || tenor < 1 || tenor > 120 || !purpose || !product) return fail("Enter the product, amount, tenor (1–120 months) and purpose.");
  const lender = id(form, "lender_id");
  let lenderName = text(form, "lender_name", 120);
  if (lender && !lenderName) {
    const { data } = await supabase.from("profiles").select("full_name").eq("id", lender).maybeSingle();
    lenderName = data?.full_name ?? "Lender";
  }
  const { error } = await supabase.from("loan_applications").insert({
    reference: `LN-${stamp()}`,
    applicant_id: uid,
    lender_id: lender,
    lender_name: lenderName || "Open market",
    farm_id: id(form, "farm_id"),
    product,
    purpose,
    amount_kobo: amount,
    tenor_months: Math.round(tenor),
    status: "submitted",
    submitted_at: new Date().toISOString(),
  });
  if (error) return dbFail(error, "apply_loan");
  refreshPages("/lender", "/reports");
  return ok("Application submitted.");
}

export async function decideLoan(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const loanId = id(form, "id");
  const status = oneOf(form, "status", ["under_review", "approved", "declined", "disbursed", "repaying", "repaid"] as const);
  if (!loanId || !status) return fail("Choose a decision.");
  const { data: loan } = await supabase.from("loan_applications").select("amount_kobo").eq("id", loanId).maybeSingle();
  if (!loan) return fail("Application not found.");
  const rate = num(form, "interest_rate_pct");
  const { error } = await supabase
    .from("loan_applications")
    .update({
      status,
      ...(rate !== null ? { interest_rate_pct: rate } : {}),
      ...(status === "approved" || status === "declined" ? { decided_at: new Date().toISOString() } : {}),
      ...(status === "disbursed" ? { disbursed_kobo: loan.amount_kobo } : {}),
    })
    .eq("id", loanId);
  if (error) return dbFail(error, "decide_loan");
  refreshPages("/lender");
  return ok("Decision saved.");
}

// ── Insurance ───────────────────────────────────────────────────────────────────────────────

export async function submitClaim(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const policy = id(form, "policy_id");
  const amount = kobo(form, "amount_claimed");
  const cause = text(form, "cause", 120);
  const incident = date(form, "incident_date");
  if (!policy || !amount || amount <= 0 || !cause || !incident) return fail("Choose the policy and enter the incident date, cause and amount.");
  const { error } = await supabase.from("insurance_claims").insert({
    claim_number: `CLM-${stamp()}`,
    policy_id: policy,
    holder_id: uid,
    incident_date: incident,
    cause,
    description: optText(form, "description", 2000),
    amount_claimed_kobo: amount,
    status: "submitted",
  });
  if (error) return dbFail(error, "submit_claim");
  refreshPages("/insurance");
  return ok("Claim submitted.");
}

export async function requestPolicyQuote(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const cover = oneOf(form, "cover_type", ["weather_index", "multi_peril", "livestock", "equipment", "area_yield"] as const);
  const insured = kobo(form, "sum_insured");
  const start = date(form, "start_date");
  const end = date(form, "end_date");
  const insurer = text(form, "insurer_name", 120);
  if (!cover || !insured || insured <= 0 || !start || !end || end <= start || !insurer) return fail("Choose the cover, insurer, sum insured and a valid period.");
  const rate = { weather_index: 0.028, multi_peril: 0.045, livestock: 0.03, equipment: 0.02, area_yield: 0.035 }[cover];
  const { error } = await supabase.from("insurance_policies").insert({
    policy_number: `Q-${stamp()}`,
    holder_id: uid,
    farm_id: id(form, "farm_id"),
    insurer_name: insurer,
    product: text(form, "product", 120) || cover.replace(/_/g, " "),
    cover_type: cover,
    crop_or_asset: optText(form, "crop_or_asset", 120),
    sum_insured_kobo: insured,
    premium_kobo: Math.round(insured * rate),
    start_date: start,
    end_date: end,
    status: "quoted",
  });
  if (error) return dbFail(error, "request_quote");
  refreshPages("/insurance");
  return ok("Quote requested — indicative premium calculated.");
}

export async function decideClaim(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const claimId = id(form, "id");
  const status = oneOf(form, "status", ["assessing", "approved", "paid", "rejected"] as const);
  if (!claimId || !status) return fail("Choose a decision.");
  const paid = kobo(form, "amount_paid");
  const { error } = await supabase
    .from("insurance_claims")
    .update({ status, ...(paid !== null ? { amount_paid_kobo: paid } : {}) })
    .eq("id", claimId);
  if (error) return dbFail(error, "decide_claim");
  refreshPages("/insurance");
  return ok("Claim updated.");
}

// ── Grants ──────────────────────────────────────────────────────────────────────────────────

export async function createGrantProgramme(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const title = text(form, "title", 160);
  const funder = text(form, "funder", 120);
  const focus = text(form, "focus_area", 80);
  const max = kobo(form, "max_award");
  const opens = date(form, "opens_on");
  const closes = date(form, "closes_on");
  if (!title || !funder || !focus || !max || max <= 0 || !opens || !closes || closes < opens) return fail("Fill in the title, funder, focus, maximum award and a valid window.");
  const states = text(form, "states", 200).split(",").map((s) => s.trim()).filter(Boolean);
  const { error } = await supabase.from("grant_programmes").insert({
    owner_id: uid,
    title,
    funder,
    focus_area: focus,
    description: optText(form, "description", 2000),
    max_award_kobo: max,
    total_pool_kobo: kobo(form, "total_pool"),
    eligibility: optText(form, "eligibility", 1000),
    states: states.length ? states : undefined,
    opens_on: opens,
    closes_on: closes,
    status: "open",
  });
  if (error) return dbFail(error, "create_grant_programme");
  refreshPages("/grants");
  return ok("Programme published.");
}

export async function applyForGrant(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const programme = id(form, "programme_id");
  const amount = kobo(form, "amount_requested");
  const proposal = text(form, "proposal", 3000);
  if (!programme || !amount || amount <= 0 || proposal.length < 10) return fail("Choose the programme, the amount and write a short proposal.");
  const { error } = await supabase.from("grant_applications").insert({
    programme_id: programme,
    applicant_id: uid,
    farm_id: id(form, "farm_id"),
    amount_requested_kobo: amount,
    proposal,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  });
  if (error) return dbFail(error, "apply_grant");
  refreshPages("/grants");
  return ok("Application submitted.");
}

export async function reviewGrantApplication(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const appId = id(form, "id");
  const status = oneOf(form, "status", ["shortlisted", "awarded", "declined"] as const);
  const score = num(form, "score");
  if (!appId || !status) return fail("Choose a decision.");
  if (score !== null && (score < 0 || score > 100)) return fail("Score must be between 0 and 100.");
  const { error } = await supabase
    .from("grant_applications")
    .update({ status, ...(score !== null ? { score: Math.round(score) } : {}), ...(status === "awarded" ? { amount_awarded_kobo: kobo(form, "amount_awarded") } : {}) })
    .eq("id", appId);
  if (error) return dbFail(error, "review_grant");
  refreshPages("/grants");
  return ok("Application reviewed.");
}

// ── Investment ──────────────────────────────────────────────────────────────────────────────

const STRUCTURE = ["crop_finance", "equipment_lease", "processing_equity", "warehouse_receipt", "offtake_backed"] as const;

export async function createOffering(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const title = text(form, "title", 160);
  const structure = oneOf(form, "structure", STRUCTURE);
  const target = kobo(form, "target_raise");
  const ticket = kobo(form, "min_ticket");
  const ret = num(form, "expected_return_pct");
  const tenor = num(form, "tenor_months");
  const closes = date(form, "closes_on");
  if (!title || !structure || !target || target <= 0 || !ticket || ticket <= 0 || ret === null || !tenor || !closes) return fail("Fill in every field to publish the offering.");
  const { error } = await supabase.from("investment_offerings").insert({
    sponsor_id: uid,
    title,
    commodity: text(form, "commodity", 80) || "Mixed",
    structure,
    target_raise_kobo: target,
    min_ticket_kobo: ticket,
    expected_return_pct: ret,
    tenor_months: Math.round(tenor),
    risk_rating: oneOf(form, "risk_rating", ["low", "medium", "high"] as const, "medium") ?? undefined,
    closes_on: closes,
    status: "open",
  });
  if (error) return dbFail(error, "create_offering");
  refreshPages("/investor");
  return ok("Offering published.");
}

export async function commitInvestment(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const offering = id(form, "offering_id");
  const amount = kobo(form, "amount");
  if (!offering || !amount || amount <= 0) return fail("Choose the offering and an amount.");
  const { data: o } = await supabase.from("investment_offerings").select("min_ticket_kobo, sponsor_id, status").eq("id", offering).maybeSingle();
  if (!o || o.status !== "open") return fail("That offering isn't open.");
  if (o.sponsor_id === uid) return fail("You can't invest in your own offering.");
  if (amount < o.min_ticket_kobo) return fail("Below the minimum ticket for this offering.");
  const { error } = await supabase.from("investment_commitments").insert({ offering_id: offering, investor_id: uid, amount_kobo: amount, status: "committed" });
  if (error) return dbFail(error, "commit_investment");
  refreshPages("/investor");
  return ok("Commitment recorded. The sponsor will send funding instructions.");
}

// ── Impact programmes & research ────────────────────────────────────────────────────────────

export async function createImpactProgramme(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const name = text(form, "name", 160);
  const org = text(form, "organisation", 120);
  const focus = text(form, "focus", 200);
  const start = date(form, "start_date");
  if (!name || !org || !focus || !start) return fail("Enter the programme name, organisation, focus and start date.");
  const states = text(form, "states", 200).split(",").map((s) => s.trim()).filter(Boolean);
  const { error } = await supabase.from("impact_programmes").insert({
    owner_id: uid,
    name,
    organisation: org,
    focus,
    states: states.length ? states : undefined,
    budget_kobo: kobo(form, "budget") ?? 0,
    target_farmers: num(form, "target_farmers") ?? undefined,
    start_date: start,
    end_date: date(form, "end_date"),
    status: "active",
  });
  if (error) return dbFail(error, "create_impact_programme");
  refreshPages("/ngo");
  return ok("Programme created.");
}

export async function addBeneficiary(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const programme = id(form, "programme_id");
  const name = text(form, "farmer_name", 120);
  const support = text(form, "support_type", 120);
  if (!programme || name.length < 2 || !support) return fail("Choose the programme and enter the farmer and support given.");
  const { error } = await supabase.from("programme_beneficiaries").insert({
    programme_id: programme,
    farmer_name: name,
    state: optText(form, "state", 60),
    lga: optText(form, "lga", 60),
    gender: oneOf(form, "gender", ["female", "male", "other"] as const),
    support_type: support,
    value_kobo: kobo(form, "value") ?? 0,
    yield_before_kg_ha: num(form, "yield_before_kg_ha"),
    enrolled_on: date(form, "enrolled_on") ?? today(),
    status: "enrolled",
  });
  if (error) return dbFail(error, "add_beneficiary");
  refreshPages("/ngo");
  return ok("Beneficiary enrolled.");
}

export async function createResearchTrial(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const title = text(form, "title", 200);
  const inst = text(form, "institution", 120);
  const crop = text(form, "crop", 60);
  const design = text(form, "design", 60);
  const start = date(form, "start_date");
  if (!title || !inst || !crop || !design || !start) return fail("Enter the title, institution, crop, design and start date.");
  const treatments = text(form, "treatments", 400).split(",").map((t) => t.trim()).filter(Boolean).map((code) => ({ code }));
  const { error } = await supabase.from("research_trials").insert({
    owner_id: uid,
    title,
    institution: inst,
    crop,
    design,
    treatments,
    farm_id: id(form, "farm_id"),
    replicates: num(form, "replicates") ?? undefined,
    start_date: start,
    end_date: date(form, "end_date"),
    status: "planned",
  });
  if (error) return dbFail(error, "create_trial");
  refreshPages("/research");
  return ok("Trial registered.");
}

export async function updateTrial(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const trialId = id(form, "id");
  const status = oneOf(form, "status", ["planned", "running", "harvested", "analysing", "published"] as const);
  if (!trialId || !status) return fail("Choose a status.");
  const findings = optText(form, "findings", 3000);
  const { error } = await supabase.from("research_trials").update({ status, ...(findings ? { findings } : {}) }).eq("id", trialId);
  if (error) return dbFail(error, "update_trial");
  refreshPages("/research");
  return ok("Trial updated.");
}

// ── Cooperatives ────────────────────────────────────────────────────────────────────────────

export async function createAggregation(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const org = id(form, "organization_id");
  const commodity = text(form, "commodity", 80);
  const target = num(form, "target_kg");
  if (!org || !commodity || !target || target <= 0) return fail("Choose the cooperative, commodity and target volume.");
  const { error } = await supabase.from("cooperative_aggregations").insert({
    organization_id: org,
    commodity,
    target_kg: target,
    price_per_kg_kobo: kobo(form, "price_per_kg"),
    buyer_name: optText(form, "buyer_name", 120),
    collection_point: optText(form, "collection_point", 120),
    closes_on: date(form, "closes_on"),
    status: "open",
  });
  if (error) return dbFail(error, "create_aggregation");
  refreshPages("/cooperative");
  return ok("Aggregation drive opened.");
}

export async function recordAggregationVolume(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const aggId = id(form, "id");
  if (!aggId) return fail("Drive not found.");
  const { data: a } = await supabase.from("cooperative_aggregations").select("pledged_kg, delivered_kg").eq("id", aggId).maybeSingle();
  if (!a) return fail("Drive not found.");
  const pledged = num(form, "pledged_kg") ?? 0;
  const delivered = num(form, "delivered_kg") ?? 0;
  if (pledged < 0 || delivered < 0) return fail("Volumes can't be negative.");
  const { error } = await supabase
    .from("cooperative_aggregations")
    .update({ pledged_kg: Number(a.pledged_kg ?? 0) + pledged, delivered_kg: Number(a.delivered_kg ?? 0) + delivered, status: "collecting" })
    .eq("id", aggId);
  if (error) return dbFail(error, "aggregation_volume");
  refreshPages("/cooperative");
  return ok("Volumes added.");
}

// ── Requests for quotation ──────────────────────────────────────────────────────────────────

const UNITS = ["kg", "tonne", "bag", "crate", "basket", "piece", "litre", "hectare", "day", "job"] as const;
const GRADES = ["grade_a", "grade_b", "grade_c", "processing_grade"] as const;

export async function createRfq(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const title = text(form, "title", 140);
  const category = id(form, "category_id");
  const commodity = text(form, "target_crop_or_commodity", 100);
  const qty = num(form, "required_quantity");
  const unit = oneOf(form, "unit", UNITS);
  const where = text(form, "delivery_location", 200);
  const deadline = date(form, "deadline_date");
  if (title.length < 3 || !category || commodity.length < 2 || !qty || qty <= 0 || !unit || where.length < 2 || !deadline) return fail("Fill in the title, category, commodity, quantity, unit, delivery point and deadline.");
  const { error } = await supabase.from("buyer_requests").insert({
    buyer_id: uid,
    request_number: `RFQ-${stamp()}`,
    title,
    category_id: category,
    target_crop_or_commodity: commodity,
    required_quantity: qty,
    unit,
    target_grade: oneOf(form, "target_grade", GRADES),
    delivery_location: where,
    deadline_date: deadline,
    target_budget_kobo: kobo(form, "target_budget"),
    status: "open",
    notes: optText(form, "notes", 2000),
  });
  if (error) return dbFail(error, "create_rfq");
  refreshPages("/buyer", "/supplier");
  return ok("Request published to sellers.");
}

export async function respondToRfq(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const request = id(form, "request_id");
  const qty = num(form, "offered_quantity");
  const price = kobo(form, "unit_price");
  const deliveryDate = date(form, "estimated_delivery_date");
  if (!request || !qty || qty <= 0 || !price || price <= 0 || !deliveryDate) return fail("Enter the quantity, unit price and delivery date.");
  const { data: seller } = await supabase.from("marketplace_sellers").select("id").eq("profile_id", uid).maybeSingle();
  if (!seller) return fail("Set up a seller profile on the marketplace first.");
  const fee = kobo(form, "delivery_fee") ?? 0;
  const { error } = await supabase.from("buyer_request_responses").insert({
    request_id: request,
    seller_id: seller.id,
    offered_quantity: qty,
    unit_price_kobo: price,
    delivery_fee_kobo: fee,
    total_quote_kobo: Math.round(qty * price + fee),
    offered_grade: oneOf(form, "offered_grade", GRADES),
    estimated_delivery_date: deliveryDate,
    valid_until: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    status: "submitted",
    seller_notes: optText(form, "seller_notes", 1500),
  });
  if (error) return dbFail(error, "respond_rfq");
  refreshPages("/supplier", "/buyer");
  return ok("Quote sent to the buyer.");
}

export async function setQuoteStatus(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const quote = id(form, "id");
  const status = oneOf(form, "status", ["shortlisted", "accepted", "rejected"] as const);
  if (!quote || !status) return fail("Quote not found.");
  const { error } = await supabase.from("buyer_request_responses").update({ status }).eq("id", quote);
  if (error) return dbFail(error, "quote_status");
  refreshPages("/buyer");
  return ok(`Quote ${status}.`);
}
