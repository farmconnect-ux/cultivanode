"use client";

import { useState, useTransition, useRef } from "react";
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
  imagePreview?: string;
  language?: AppLanguage | "pcm";
  providerUsed?: "claude" | "gemini" | "openai" | "rule-engine";
  sources?: GroundedKnowledgeSnippet[];
  safetyAppendices?: string[];
  passedSafetyGuardrail?: boolean;
  timestamp: string;
}

// Message ids for list keys; a counter keeps rendering pure (no clock reads).
let messageSeq = 0;
const newMessageId = (prefix: string) => `${prefix}-${++messageSeq}`;

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
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (file.size > 8 * 1024 * 1024) {
      alert("Image is larger than 8MB. Please choose a smaller photo.");
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
    if ((!text && !currentImg) || isPending) return;

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
        const res: AssistantResponse = await askFarmAssistantAction({
          query: text || "Please examine this crop image and identify potential disease or nutrient issues with verified treatments.",
          context: {
            farmerId: selectedFarm?.id ?? "farmer-1",
            cropId: selectedCropId,
            zone: farmZone,
            stageName: "Vegetative",
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

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-primary">Associated Plots</label>
            <div className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-on-surface-variant">
              {plots.filter((p) => p.farm_id === selectedFarmId).length > 0
                ? `${plots.filter((p) => p.farm_id === selectedFarmId).length} plot(s) registered`
                : "Whole farm context active"}
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mr-1">
            Quick Inquiries:
          </span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
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
                <div className="whitespace-pre-wrap">{m.text}</div>

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
              disabled={isPending}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-xs text-on-surface focus:border-primary-container focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isPending || (!inputQuery.trim() && !selectedImage)}
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
