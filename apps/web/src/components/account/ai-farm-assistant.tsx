"use client";

import { useState, useTransition } from "react";
import { askFarmAssistantAction, type AssistantResponse } from "@/actions/ai-assistant";
import { Badge, Button, Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { FarmZone, AppLanguage, GroundedKnowledgeSnippet } from "@cultivanode/shared";

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

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  language?: AppLanguage | "pcm";
  sources?: GroundedKnowledgeSnippet[];
  safetyAppendices?: string[];
  passedSafetyGuardrail?: boolean;
  timestamp: string;
}

export function AiFarmAssistant({
  farms,
  plots,
  lang,
}: {
  farms: FarmOption[];
  plots: PlotOption[];
  lang: Locale;
}) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id ?? "");
  const [selectedCropId, setSelectedCropId] = useState<string>("maize");
  const [assistantLang, setAssistantLang] = useState<AppLanguage | "pcm">(
    lang === "yo" ? "yo" : "en"
  );
  const [inputQuery, setInputQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? farms[0];
  const farmZone: FarmZone =
    selectedFarm?.zone === "rainforest" ||
    selectedFarm?.zone === "derived_savanna" ||
    selectedFarm?.zone === "southern_guinea"
      ? (selectedFarm.zone as FarmZone)
      : "rainforest";

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "intro-1",
      role: "assistant",
      text:
        lang === "yo"
          ? "Ẹ n lẹ́ o! Mo jẹ́ Olùrànlọ́wọ́ Oko CultivaNode. Mo le ran yín lọ́wọ́ pẹlu imọran ogbin, iwọn ajilẹ (fertiliser), itọju kokoro (pests), ati aṣẹ aabo oogun ogbin NAFDAC. Kí ni ohun ti ẹ fẹ́ bèèrè lónìí?"
          : "Welcome! I am the CultivaNode AI Farm Assistant. I provide vetted agricultural advisory grounded in IITA and NIHORT GAP standards, tailored for South-West Nigeria with strict NAFDAC pesticide safety guardrails. How can I support your farm today?",
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

  const handleSend = (queryToSend?: string) => {
    const text = (queryToSend ?? inputQuery).trim();
    if (!text || isPending) return;

    const userMsg: MessageItem = {
      // eslint-disable-next-line react-hooks/purity -- Client component: ID generation in event handler
      id: `usr-${Date.now()}`,
      role: "user",
      text,
      language: assistantLang,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery("");

    startTransition(async () => {
      try {
        const res: AssistantResponse = await askFarmAssistantAction({
          query: text,
          context: {
            farmerId: selectedFarm?.id ?? "farmer-1",
            cropId: selectedCropId,
            zone: farmZone,
            stageName: "Vegetative",
          },
          language: assistantLang,
        });

        const botMsg: MessageItem = {
          // eslint-disable-next-line react-hooks/purity -- Client component: ID generation in async callback
          id: `bot-${Date.now()}`,
          role: "assistant",
          text: res.answer,
          language: res.language,
          sources: res.sources,
          safetyAppendices: res.safetyAppendices,
          passedSafetyGuardrail: res.passedSafetyGuardrail,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to retrieve guidance.";
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
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
              <Badge className="bg-secondary-container/40 text-primary text-[10px]">NAFDAC &amp; IITA Grounded</Badge>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Agricultural intelligence for South-West Nigeria with chemical safety guardrails and multi-lingual support.
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
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.state} • {f.zone ?? "Rainforest"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-primary">Active Crop Focus</label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
            >
              <optgroup label="Field Crops">
                <option value="maize">Maize (Àgbàdo)</option>
                <option value="cassava">Cassava (Gbaágùdá)</option>
                <option value="yam">Yam (Iṣu)</option>
                <option value="rice">Rice (Ìrẹsì)</option>
                <option value="cowpea">Cowpea (Ẹwà)</option>
                <option value="sweet_potato">Sweet Potato</option>
              </optgroup>
              <optgroup label="Vegetables">
                <option value="tomato">Tomato (Tòmátì)</option>
                <option value="pepper">Pepper (Ata)</option>
                <option value="okra">Okra (Ilá)</option>
                <option value="amaranth">Amaranth (Tẹtẹ)</option>
                <option value="ewedu">Ewedu</option>
                <option value="cucumber">Cucumber</option>
                <option value="watermelon">Watermelon</option>
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-[11px] text-on-surface-variant">
              🔒 Banned substances (Paraquat, Carbofuran, DDT) are automatically blocked per NAFDAC gazette.
            </p>
          </div>
        </div>
      </Card>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-on-surface-variant">Quick queries:</span>
        {quickPrompts.map((qp) => (
          <button
            key={qp.label}
            type="button"
            onClick={() => {
              if (qp.langTarget) setAssistantLang(qp.langTarget);
              handleSend(qp.text);
            }}
            className="rounded-full border border-secondary/30 bg-surface px-3 py-1 text-xs text-primary transition hover:bg-surface-container-low hover:border-secondary"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Chat Conversation History */}
      <Card className="flex min-h-[420px] flex-col justify-between p-4">
        <div className="space-y-4 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary-container text-white rounded-br-none"
                    : m.passedSafetyGuardrail === false
                      ? "bg-accent-50 border border-accent-300 text-accent-950 rounded-bl-none"
                      : "bg-surface border border-border text-on-surface rounded-bl-none shadow-sm"
                }`}
              >
                {/* Role and Time header */}
                <div className="flex items-center justify-between gap-4 mb-2 text-[10px] opacity-75">
                  <span className="font-bold">
                    {m.role === "user" ? "You (Farmer)" : "CultivaNode Advisor"}
                  </span>
                  <span>{m.timestamp}</span>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Citations & Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 border-t border-border/60 pt-2 text-[11px] text-on-surface-variant space-y-1">
                    <p className="font-semibold text-primary">Verified Knowledge Grounding:</p>
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
                Analyzing against GAP standards &amp; NAFDAC regulations...
              </div>
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <div className="mt-4 border-t border-border pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                assistantLang === "yo"
                  ? "Bèèrè ìbéèrè lori oko rẹ, ajilẹ, tabi oogun kokoro..."
                  : assistantLang === "pcm"
                    ? "Ask question about your farm, fertilizer, or chemical..."
                    : "Ask about your farm, fertiliser dosage, pest management, or chemicals..."
              }
              disabled={isPending}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isPending || !inputQuery.trim()}
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
