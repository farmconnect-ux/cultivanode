"use client";

import * as React from "react";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { setConsent } from "@/actions/account";
import { Badge, Button, Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import type { AppLanguage, GroundedAiAssistantResponse, GroundedKnowledgeSnippet } from "@cultivanode/shared";

/**
 * Batch 03.4: the web assistant calls the single audited entry point `POST /api/ai/assistant`
 * (Bearer JWT, active account, farm RLS, `ai_intelligence` consent, Live Farm Context, AI audit).
 * The old `askFarmAssistantAction` server action, which skipped consent, farm context and audit,
 * has been removed. The client never sends a zone or growth stage: the server derives both from
 * the farm and the selected crop-cycle records.
 */
type AssistantApiResponse = GroundedAiAssistantResponse & { traceId?: string; auditStatus?: string };

type AssistantApiError = { error?: string; code?: string; traceId?: string };

async function askAuditedAssistant(body: {
  query: string;
  language: AppLanguage | "pcm";
  imageBase64?: string;
  imageMimeType?: string;
  context: { farmId: string; plotId?: string; cycleId?: string; cropId?: string };
}): Promise<AssistantApiResponse> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has ended. Please sign in again.");

  const res = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const err = (payload ?? {}) as AssistantApiError;
    const ref = err.traceId ? ` (ref ${err.traceId.slice(0, 8)})` : "";
    throw new Error(`${err.error ?? "The assistant could not answer right now."}${ref}`);
  }
  return payload as AssistantApiResponse;
}

type FeedbackOutcome = "accepted" | "rejected" | "modified";

/**
 * UI-AC-04: every audited answer can carry feedback. `record_ai_feedback` checks that the caller
 * can view the farm the answer was about and stores one feedback row per person per answer.
 */
async function recordAnswerFeedback(traceId: string, outcome: FeedbackOutcome, note?: string): Promise<"saved" | "already"> {
  const supabase = createClient();
  const { error } = await supabase.rpc("record_ai_feedback", {
    p_trace_id: traceId,
    p_outcome: outcome,
    ...(note && note.trim() ? { p_note: note.trim().slice(0, 1000) } : {}),
  });
  if (!error) return "saved";
  if (error.code === "23505") return "already";
  throw new Error("Could not save your feedback. Please try again.");
}

function AnswerFeedback({ traceId }: { traceId: string }) {
  const [state, setState] = useState<"idle" | "note" | "saving" | "done" | "error">("idle");
  const [choice, setChoice] = useState<FeedbackOutcome | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (outcome: FeedbackOutcome, withNote?: string) => {
    setChoice(outcome);
    setState("saving");
    try {
      const result = await recordAnswerFeedback(traceId, outcome, withNote);
      setMessage(result === "already" ? "You already rated this answer." : "Thanks, your feedback was saved.");
      setState("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save your feedback.");
      setState("error");
    }
  };

  if (state === "done") {
    return <p className="mt-2 text-[10px] text-on-surface-variant" role="status">{message}</p>;
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5 text-[11px]" data-testid="answer-feedback">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-on-surface-variant">Was this helpful?</span>
        <button
          type="button"
          disabled={state === "saving"}
          aria-pressed={choice === "accepted"}
          onClick={() => submit("accepted")}
          className="rounded-full border border-border bg-surface px-2 py-0.5 hover:border-primary disabled:opacity-50"
        >
          👍 Yes
        </button>
        <button
          type="button"
          disabled={state === "saving"}
          aria-pressed={choice === "rejected"}
          onClick={() => {
            setChoice("rejected");
            setState("note");
          }}
          className="rounded-full border border-border bg-surface px-2 py-0.5 hover:border-primary disabled:opacity-50"
        >
          👎 No
        </button>
        <button
          type="button"
          disabled={state === "saving"}
          aria-pressed={choice === "modified"}
          onClick={() => {
            setChoice("modified");
            setState("note");
          }}
          className="rounded-full border border-border bg-surface px-2 py-0.5 hover:border-primary disabled:opacity-50"
        >
          ✏️ I changed it
        </button>
      </div>
      {(state === "note" || (state === "saving" && choice !== "accepted") || (state === "error" && choice !== "accepted")) && (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (choice) void submit(choice, note);
          }}
        >
          <input
            type="text"
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            placeholder={choice === "modified" ? "What did you do instead? (optional)" : "What was wrong? (optional)"}
            className="flex-1 rounded border border-border bg-surface px-2 py-1 text-[11px] text-on-surface focus:border-primary-container focus:outline-none"
          />
          <Button type="submit" variant="primary" size="sm" className="text-[11px]" disabled={state === "saving"}>
            {state === "saving" ? "Saving..." : "Send"}
          </Button>
        </form>
      )}
      {state === "error" && <p className="text-[10px] text-error" role="alert">{message}</p>}
    </div>
  );
}

interface FarmOption {
  id: string;
  name: string;
  state: string | null;
  zone: string | null;
}

interface PlotOption {
  id: string;
  farm_id: string;
  name: string;
  area_ha: number | null;
}

interface CycleOption {
  id: string;
  farm_id: string;
  plot_id: string | null;
  crop_id: string;
  current_stage: string;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
  language?: AppLanguage | "pcm";
  providerUsed?: "claude" | "gemini" | "openai" | "rule-engine";
  sources?: GroundedKnowledgeSnippet[];
  safetyAppendices?: string[];
  passedSafetyGuardrail?: boolean;
  traceId?: string;
  timestamp: string;
}

const pretty = (v: string) => v.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

// Message ids for list keys; a counter keeps rendering pure (no clock reads).
let messageSeq = 0;
const newMessageId = (prefix: string) => `${prefix}-${++messageSeq}`;

/** Shows the AI's light Markdown (**bold**, "- " bullets, "### " headings) as text, never as HTML. */
function renderAnswer(text: string): React.ReactNode {
  const bold = (line: string, key: number) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong> : part,
    );
  return text.split("\n").map((raw, i) => {
    const heading = raw.match(/^#{1,4}\s+(.*)$/);
    const bullet = raw.match(/^\s*[-*•]\s+(.*)$/);
    const line = heading ? heading[1]! : bullet ? `• ${bullet[1]}` : raw;
    return (
      <React.Fragment key={i}>
        {heading ? <strong>{bold(line, i)}</strong> : bold(line, i)}
        {"\n"}
      </React.Fragment>
    );
  });
}

export function AiFarmAssistant({
  farms,
  plots,
  cycles,
  aiConsentGranted,
  lang,
}: {
  farms: FarmOption[];
  plots: PlotOption[];
  cycles: CycleOption[];
  aiConsentGranted: boolean;
  lang: Locale;
}) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id ?? "");
  // "" means the whole farm with no specific crop. No crop is ever assumed.
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [assistantLang, setAssistantLang] = useState<AppLanguage | "pcm">(
    lang === "yo" ? "yo" : "en"
  );
  const [inputQuery, setInputQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? farms[0];
  const farmCycles = cycles.filter((c) => c.farm_id === selectedFarm?.id);
  const selectedCycle = farmCycles.find((c) => c.id === selectedCycleId);
  const plotName = (plotId: string | null) => plots.find((p) => p.id === plotId)?.name;
  const canAsk = aiConsentGranted && Boolean(selectedFarm);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "intro-1",
      role: "assistant",
      text:
        lang === "yo"
          ? "Ẹ n lẹ́ o! Mo jẹ́ Olùrànlọ́wọ́ Oko CultivaNode. Mo le ran yín lọ́wọ́ pẹlu imọran ogbin, iwọn ajilẹ (fertiliser), itọju kokoro (pests), ati aṣẹ aabo oogun ogbin NAFDAC. Ẹ le kọ ìbéèrè tàbí ki ẹ ya àwòrán ohun ọ̀gbìn yín fún ìwádìí àrùn."
          : "Welcome! I am the CultivaNode AI Farm Assistant powered by grounded agronomy intelligence and NAFDAC safety guardrails. Ask questions or upload crop photos to diagnose symptoms, calculate fertiliser rates, or check pesticide safety.",
      language: lang === "yo" ? "yo" : "en",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const quickPrompts = [
    {
      label: "Fall Armyworm (Àgbàdo)",
      text: "How do I control Fall Armyworm on my maize farm?",
    },
    {
      label: "Fertiliser Dosage",
      text: "How much NPK fertiliser does 2 hectares of maize require?",
    },
    {
      label: "Livestock Drug Withdrawal",
      text: "What is the veterinary withdrawal period before selling meat or milk after antibiotic treatment?",
    },
    {
      label: "Tractor Fuel Benchmarks",
      text: "What is the expected diesel fuel consumption for tractor plowing per hectare?",
    },
    {
      label: "Banned Pesticide Test",
      text: "Can I use Paraquat to clear weeds before planting cassava?",
    },
    {
      label: "Yorùbá: Itọju Kokoro",
      text: "Bawo ni mo se le toju igbado mi kuro lowo kokoro (Armyworm)?",
      langTarget: "yo" as const,
    },
    {
      label: "Pidgin: Beans Pod Borer",
      text: "Which chemical I fit spray make beans pod borer no chop am?",
      langTarget: "pcm" as const,
    },
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // The assistant API accepts up to 8,000,000 base64 characters, which is about 5.7 MB of image.
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is larger than 5MB. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage({
        base64: result,
        mimeType: file.type || "image/jpeg",
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = (queryToSend?: string) => {
    const text = (queryToSend ?? inputQuery).trim();
    const currentImg = selectedImage;
    if ((!text && !currentImg) || isPending || !canAsk || !selectedFarm) return;

    const userMsg: MessageItem = {
      id: newMessageId('usr'),
      role: "user",
      text: text || "Diagnose this crop issue from the attached photo.",
      imagePreview: currentImg?.preview,
      language: assistantLang,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    startTransition(async () => {
      try {
        const res = await askAuditedAssistant({
          query: text || "Please examine this crop image and identify potential disease or nutrient issues with verified treatments.",
          context: {
            farmId: selectedFarm.id,
            ...(selectedCycle
              ? {
                  cycleId: selectedCycle.id,
                  cropId: selectedCycle.crop_id,
                  ...(selectedCycle.plot_id ? { plotId: selectedCycle.plot_id } : {}),
                }
              : {}),
          },
          language: assistantLang,
          imageBase64: currentImg?.base64,
          imageMimeType: currentImg?.mimeType,
        });

        const botMsg: MessageItem = {
          id: newMessageId('bot'),
          role: "assistant",
          text: res.answer,
          language: res.language,
          providerUsed: res.providerUsed,
          sources: res.sources,
          safetyAppendices: res.safetyAppendices,
          passedSafetyGuardrail: res.passedSafetyGuardrail,
          traceId: res.traceId,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to retrieve guidance.";
        setMessages((prev) => [
          ...prev,
          {
            id: newMessageId('err'),
            role: "assistant",
            text: `Error connecting to advisor: ${errorMsg}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Header Card */}
      <Card className="flex flex-col gap-4 border-secondary/30 bg-surface-container-low/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h2 className="text-lg font-black text-primary">AI Farm Assistant</h2>
              <Badge className="bg-amber-100 text-amber-800 text-[10px]">Draft Reference Guidance · Not Agronomist-Approved</Badge>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Agricultural intelligence for Nigeria with multimodal crop photo diagnosis, chemical safety guardrails, and multilingual support.
            </p>
          </div>

          {/* Language selector toggle */}
          <div className="flex items-center gap-1 rounded border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setAssistantLang("en")}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                assistantLang === "en" ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setAssistantLang("yo")}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                assistantLang === "yo" ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Yorùbá
            </button>
            <button
              type="button"
              onClick={() => setAssistantLang("pcm")}
              className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                assistantLang === "pcm" ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Pidgin
            </button>
          </div>
        </div>

        {/* Farm & Crop grounding context selector */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-primary">Farm Location &amp; Zone</label>
            <select
              value={selectedFarmId}
              onChange={(e) => {
                setSelectedFarmId(e.target.value);
                setSelectedCycleId("");
              }}
              disabled={farms.length === 0}
              className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.state ?? "State not set"} • {f.zone ? pretty(f.zone) : "Zone not set"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-primary">Crop</label>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              disabled={farmCycles.length === 0}
              className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
            >
              <option value="">Whole farm (no specific crop)</option>
              {farmCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {pretty(c.crop_id)} · {plotName(c.plot_id) ?? "No plot"} · {pretty(c.current_stage)}
                </option>
              ))}
            </select>
            {farmCycles.length === 0 && selectedFarm && (
              <span className="text-[11px] text-on-surface-variant">
                No active crop on this farm.{" "}
                <Link href={`/${lang}/account/crops`} className="underline">
                  Record a crop
                </Link>{" "}
                for crop-specific advice.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-primary">Associated Plots</label>
            <div className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-on-surface-variant">
              {plots.filter((p) => p.farm_id === selectedFarmId).length > 0
                ? `${plots.filter((p) => p.farm_id === selectedFarmId).length} plot(s) registered`
                : "Whole farm context active"}
            </div>
          </div>
        </div>

        {farms.length === 0 && (
          <div className="rounded-lg border border-caution/40 bg-caution-soft p-3 text-xs text-on-surface">
            <p className="font-semibold">Add a farm to use the assistant.</p>
            <p className="mt-0.5 text-on-surface-variant">
              Every answer is checked against your farm records and kept in an audit log, so the assistant needs a farm.{" "}
              <Link href={`/${lang}/account/farms`} className="font-semibold underline">
                Add a farm
              </Link>
            </p>
          </div>
        )}

        {farms.length > 0 && !aiConsentGranted && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-secondary/40 bg-surface p-3 text-xs">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-primary">Allow the AI assistant to use your farm records?</p>
              <p className="mt-0.5 text-on-surface-variant">
                It reads the farm, crops, soil tests, stock and work records you pick to answer you. You can turn this off
                any time in{" "}
                <Link href={`/${lang}/account/privacy`} className="underline">
                  Privacy
                </Link>
                .
              </p>
            </div>
            <form action={setConsent}>
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="consent_type" value="ai_intelligence" />
              <input type="hidden" name="granted" value="true" />
              <Button type="submit" variant="primary" size="sm" className="text-xs">
                Allow
              </Button>
            </form>
          </div>
        )}

        {/* Quick Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mr-1">
            Quick Inquiries:
          </span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              disabled={!canAsk || isPending}
              onClick={() => {
                if (p.langTarget) setAssistantLang(p.langTarget);
                handleSend(p.text);
              }}
              className="rounded-full border border-secondary/40 bg-surface px-2.5 py-1 text-[11px] font-medium text-primary hover:border-primary hover:bg-surface-container transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Chat Messages Log */}
      <Card className="flex flex-col border-border bg-surface p-4 sm:p-6 min-h-[460px]">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.role === "user"
                    ? "bg-primary-container text-white"
                    : "bg-secondary text-primary"
                }`}
              >
                {m.role === "user" ? "ME" : "AI"}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "rounded-tr-none bg-primary-container text-white"
                    : "rounded-tl-none bg-surface-container-low/40 border border-border text-on-surface"
                }`}
              >
                {/* Meta header */}
                <div
                  className={`mb-1 flex items-center justify-between gap-3 text-[10px] ${
                    m.role === "user" ? "text-white/80" : "text-on-surface-variant"
                  }`}
                >
                  <span className="font-bold">
                    {m.role === "user" ? "You (Farmer)" : "CultivaNode Advisor"}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.providerUsed && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${m.providerUsed === "rule-engine" ? "bg-caution-soft text-[#92400e]" : "bg-secondary-container/40 text-secondary"}`}>
                        {m.providerUsed === "rule-engine" ? "Basic advice · AI unavailable" : "AI"}
                      </span>
                    )}
                    <span>{m.timestamp}</span>
                  </div>
                </div>

                {/* Attached image if any */}
                {m.imagePreview && (
                  <div className="my-2 overflow-hidden rounded-lg border border-white/20">
                    <img
                      src={m.imagePreview}
                      alt="Crop condition preview"
                      className="max-h-56 w-auto object-cover rounded"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="whitespace-pre-wrap">{renderAnswer(m.text)}</div>

                {m.traceId && (
                  <p className="mt-2 text-[10px] text-on-surface-variant">Ref {m.traceId.slice(0, 8)}</p>
                )}
                {m.role === "assistant" && m.traceId && <AnswerFeedback traceId={m.traceId} />}

                {/* Citations & Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 border-t border-border/60 pt-2 text-[11px] text-on-surface-variant space-y-1">
                    <p className="font-semibold text-primary">Reference Knowledge (Draft / Unapproved):</p>
                    {m.sources.map((src, i) => (
                      <p key={i}>
                        • <strong>{src.sourceTitle}</strong> (v{src.sourceVersion}, {src.approvedBy})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex items-start">
              <div className="rounded-xl rounded-bl-none bg-surface border border-border p-3 text-xs text-on-surface-variant shadow-sm flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary-container animate-ping" />
                Analyzing against reference agronomic guidelines...
              </div>
            </div>
          )}
        </div>

        {/* Preview of attached photo before sending */}
        {selectedImage && (
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-secondary/40 bg-surface-container-low/50 p-2">
            <img
              src={selectedImage.preview}
              alt="Preview"
              className="h-12 w-12 rounded object-cover border border-border"
            />
            <div className="flex-1 text-[11px] text-on-surface">
              <p className="font-semibold text-primary">Crop Photo Attached</p>
              <p className="text-on-surface-variant">AI will inspect pest damage, discoloration, and disease symptoms.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded p-1 text-xs text-error hover:bg-error-container/20"
            >
              ✕ Remove
            </button>
          </div>
        )}

        {/* Query Input Box */}
        <div className="mt-4 border-t border-border pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden file input for image upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="crop-photo-upload"
            />
            <label
              htmlFor="crop-photo-upload"
              title="Attach photo of crop or leaf symptoms"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-base hover:bg-surface-container transition-colors"
            >
              📸
            </label>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                selectedImage
                  ? "Describe crop context or leave blank for full diagnosis..."
                  : assistantLang === "yo"
                  ? "Bèèrè ìbéèrè lori oko rẹ, ajilẹ, tabi oogun kokoro..."
                  : assistantLang === "pcm"
                  ? "Ask question about your farm, fertilizer, or chemical..."
                  : "Ask about your farm, fertiliser dosage, pest management, or chemicals..."
              }
              disabled={isPending || !canAsk}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-xs text-on-surface focus:border-primary-container focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isPending || !canAsk || (!inputQuery.trim() && !selectedImage)}
              className="text-xs px-4"
            >
              {isPending ? "Consulting..." : "Send"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
