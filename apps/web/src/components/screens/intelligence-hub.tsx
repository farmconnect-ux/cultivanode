// Ported from the "cultivanode_intelligence_ai_farm_manager" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type IntelligenceHubSlot = "chat";

export function IntelligenceHub({ slots }: ScreenProps<IntelligenceHubSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full space-y-space-xl pb-16">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs max-w-3xl">
            <div className="flex flex-wrap items-center gap-space-sm mb-1">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> AI Engine: Connected to Local Knowledge Base v2.4 (Oyo Savanna Protocol)</span>
              <span className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm"><Icon name="verified_user" className="text-sm text-secondary" /> Guardrail §8.1.E Active</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">CultivaNode Intelligence &amp; AI Farm Manager</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Context-aware agronomical reasoning, real-time farm telemetry synthesis, multi-lingual voice &amp; diagnostic assistant</p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <button className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md flex items-center gap-1.5" id="btn-export-brief" type="button"><Icon name="file_download" className="text-base" /> Export Briefing</button>
            <button className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md flex items-center gap-1.5" id="btn-run-diag" type="button"><Icon name="published_with_changes" className="text-base" /> Run System Diagnostic</button>
            <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-label-md flex items-center gap-1.5 shadow-sm" id="btn-new-query" type="button"><Icon name="add_comment" className="text-base" /> New Agronomic Query</button>
          </div>
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Synthesized Daily Briefing</span>
              <span className="p-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
                <Icon name="priority_high" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-primary">Optimal</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">1 Critical Action Required today</p>
            </div>
            <div className="flex items-center gap-1.5 text-tertiary font-label-sm text-label-sm">
              <Icon name="schedule" className="text-sm" />
              <span>Generated 06:15 WAT • Refreshes in 42m</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Diagnostic Confidence</span>
              <span className="p-1.5 rounded-lg bg-secondary-container text-on-secondary-container">
                <Icon name="psychology" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-num text-metric-num text-primary">94.2%</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">Mean Acc.</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Trained on 1,400+ SW Nigeria pest/soil cases</p>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="model_training" className="text-sm text-secondary" />
              <span>Loss 0.041 • ResNet-Savanna v2</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Cross-Module Telemetry</span>
              <span className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <Icon name="hub" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-metric-num text-metric-num text-primary">6 Modules</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Live Stream</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Phenology, NiMet, Soil, Silo, Broiler, Fleet</p>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="wifi_tethering" className="text-sm text-secondary" />
              <span>Local Mesh Node: Iseyin-Tower-04</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Standard Benchmark</span>
              <span className="p-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed">
                <Icon name="library_books" className="text-lg" />
              </span>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-sm text-headline-sm text-primary font-bold">IITA &amp; NIHORT</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Savanna Extension Protocol v2026.1</p>
            </div>
            <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
              <Icon name="fact_check" className="text-sm" />
              <span>Peer-reviewed for Sub-humid Ecozone</span>
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          <div className="lg:col-span-7 space-y-space-lg">
            {slot(slots, "chat", (
              <section className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-space-md bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                      <Icon name="smart_toy" className="text-xl" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-headline-sm text-headline-sm text-primary font-bold">CultivaNode Core AI</h2>
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Agronomic reasoning grounded in local soil chemistry &amp; NiMet forecast</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg shadow-sm" id="lang-switch-group">
                    <button className="lang-btn px-2.5 py-1 rounded font-label-sm text-label-sm bg-primary text-on-primary font-semibold transition-colors" data-lang="en" type="button">English</button>
                    <button className="lang-btn px-2.5 py-1 rounded font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" data-lang="yo" type="button">Yorùbá</button>
                    <button className="lang-btn px-2.5 py-1 rounded font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" data-lang="pcm" type="button">Nigerian Pidgin</button>
                  </div>
                </div>
                <div className="px-space-md py-2 bg-primary-container text-on-primary-container flex items-center justify-between">
                  <div className="flex items-center gap-space-xs font-label-sm text-label-sm"><Icon name="mic" className="text-secondary-fixed text-base" /> <span className="font-semibold">Voice Reasoning Active:</span> Yorùbá, Nigerian Pidgin, English dialect models synchronized.</div>
                  <button className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-sm text-label-sm flex items-center gap-1 transition-colors" id="btn-toggle-mic" type="button"><Icon name="settings_voice" className="text-sm" /> Tap to Speak</button>
                </div>
                <div className="p-space-lg space-y-space-md max-h-[540px] overflow-y-auto">
                  <div className="flex gap-space-sm items-start justify-end">
                    <div className="max-w-xl bg-surface-container-high p-space-md rounded-2xl rounded-tr-xs text-on-surface shadow-sm">
                      <div className="flex items-center justify-between gap-space-md mb-1 font-label-sm text-label-sm text-on-surface-variant">
                        <span className="font-semibold text-primary">Quadri Olapade (Farm Manager)</span>
                        <span>08:41 WAT</span>
                      </div>
                      <p className="font-body-md text-body-md">How will the Friday 42mm rain affect our scheduled Split-N Urea application on Plot A1 Maize?</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                      <Icon name="person" className="text-on-surface-variant text-base" />
                    </div>
                  </div>
                  <div className="flex gap-space-sm items-start justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary">
                      <Icon name="psychology" className="text-base" />
                    </div>
                    <div className="max-w-2xl bg-surface-container-lowest p-space-md rounded-2xl rounded-tl-xs shadow-sm space-y-space-sm">
                      <div className="flex items-center justify-between gap-space-md font-label-sm text-label-sm">
                        <div className="flex items-center gap-1.5 text-secondary font-semibold">
                          <Icon name="verified" className="text-sm" />
                          <span>CultivaNode Agronomist Engine v2.4</span>
                        </div>
                        <span className="text-on-surface-variant">08:42 WAT • Latency 142ms</span>
                      </div>
                      <div className="p-space-sm rounded-lg bg-error-container text-on-error-container flex items-start gap-2">
                        <Icon name="warning" className="text-lg shrink-0 mt-0.5" />
                        <div className="text-body-sm font-body-sm"><strong className="font-bold">Warning: Wash-off &amp; Leaching Risk High.</strong> Applying 12 bags Urea 46% directly prior to a 42mm torrential storm creates up to 38% surface run-off and nitrate leaching into lower furrows.</div>
                      </div>
                      <div className="text-body-md font-body-md text-on-surface space-y-1">
                        <p><strong>Recommendation:</strong> Hold application until <strong>Saturday 07:00 WAT</strong>. Soil moisture saturation will peak Friday evening (~94% field capacity); applying granular Urea on moist, aerating soil Saturday morning maximizes root uptake without nitrogen volatilization or stream contamination.</p>
                      </div>
                      <div className="p-space-xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Icon name="menu_book" className="text-sm text-secondary" />
                          <span>Source: IITA Savanna Maize Agronomy Guide §4.2 · Verified against NiMet Radar Feed</span>
                        </div>
                        <span className="text-secondary font-semibold">97.8% Confidence</span>
                      </div>
                      <div className="pt-space-xs flex flex-wrap items-center gap-space-xs">
                        <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-label-sm font-label-sm flex items-center gap-1 transition-colors" type="button"><Icon name="event_repeat" className="text-sm" /> Reschedule Operation #OP-2026-104 to Sat 07:00</button>
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant text-label-sm font-label-sm flex items-center gap-1 transition-colors" type="button"><Icon name="send" className="text-sm" /> Notify Field Lead Adeleke O.</button>
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant text-label-sm font-label-sm flex items-center gap-1 transition-colors" type="button"><Icon name="show_chart" className="text-sm" /> View Soil Saturation Curve</button>
                      </div>
                    </div>
                  </div>
                  <div className="ml-10 bg-surface-container-low p-space-md rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1"><Icon name="water_drop" className="text-sm text-secondary" /> Plot A1 Moisture Simulation (Rain Horizon: Thu-Sun)</span>
                      <span className="font-label-sm text-label-sm text-error font-medium">Critical Saturation Zone: Fri 16:00 - 23:00</span>
                    </div>
                    <div className="h-28 w-full">
                      <svg className="w-full h-full text-secondary" preserveAspectRatio="none" viewBox="0 0 600 100">
                        <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.1" x1="0" x2="600" y1="20" y2="20" />
                        <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.1" x1="0" x2="600" y1="50" y2="50" />
                        <line stroke="currentColor" strokeDasharray="4" strokeOpacity="0.1" x1="0" x2="600" y1="80" y2="80" />
                        <line stroke="#ba1a1a" strokeDasharray="6" strokeWidth="1.5" x1="0" x2="600" y1="35" y2="35" />
                        <text fill="#ba1a1a" fontFamily="Inter" fontSize="10" fontWeight="600" x="10" y="30">Runoff Danger Threshold (38% Leaching Risk)</text>
                        <path d="M 0,85 C 80,82 150,75 220,70 C 270,68 300,45 350,15 C 390,10 430,30 480,55 C 530,68 570,72 600,74" fill="none" stroke="#006c49" strokeWidth="3" />
                        <path d="M 0,85 C 80,82 150,75 220,70 C 270,68 300,45 350,15 C 390,10 430,30 480,55 C 530,68 570,72 600,74 L 600,100 L 0,100 Z" fill="#6cf8bb" fillOpacity="0.25" />
                        <circle cx="480" cy="55" fill="#134e33" r="5" />
                        <circle cx="480" cy="55" fill="#134e33" fillOpacity="0.3" r="9" />
                        <text fill="#134e33" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700" x="440" y="80">Sat 07:00 (Optimal)</text>
                      </svg>
                    </div>
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>Thu 12:00 (Current)</span>
                      <span>Fri 06:00</span>
                      <span className="text-error font-semibold">Fri 18:00 (42mm Storm)</span>
                      <span className="text-secondary font-semibold">Sat 07:00 (Target)</span>
                      <span>Sun 12:00</span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md bg-surface-container-low space-y-space-sm">
                  <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">Quick Queries:</span>
                    <button className="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-label-sm font-label-sm hover:bg-surface-container-high transition-colors whitespace-nowrap" type="button">What is my current broiler feed runway?</button>
                    <button className="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-label-sm font-label-sm hover:bg-surface-container-high transition-colors whitespace-nowrap" type="button">Simulate 2-week cassava yield impact of delayed weeding</button>
                    <button className="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-label-sm font-label-sm hover:bg-surface-container-high transition-colors whitespace-nowrap" type="button">Translate morning instructions to Yorùbá for field hands</button>
                  </div>
                  <div className="flex items-center gap-space-xs bg-surface-container-lowest p-2 rounded-xl shadow-sm">
                    <button className="p-2 text-on-surface-variant hover:text-primary rounded-lg transition-colors" title="Attach Field Telemetry or Image" type="button">
                      <Icon name="attach_file" className="text-xl" />
                    </button>
                    <input className="flex-1 bg-transparent px-2 py-1 font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-on-surface-variant/60" id="ai-user-input" placeholder="Ask anything about farm phenology, chemical dosage, rain windows, or worker dispatch..." type="text" />
                    <button className="p-2 text-secondary hover:text-primary rounded-lg transition-colors" title="Hold to record audio in Yorùbá / Pidgin / English" type="button">
                      <Icon name="mic" className="text-xl" />
                    </button>
                    <button className="px-space-md py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-all font-label-md text-label-md flex items-center gap-1 shadow-sm" id="ai-submit-btn" type="button">
                      <span>Send</span>
                      <Icon name="send" className="text-base" />
                    </button>
                  </div>
                </div>
              </section>
            ))}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Multimodal Diagnostic Vision Studio</h2>
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Edge Inference Ready</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Instant field leaf, pest insect, and soil lesion classifier calibrated to Nigerian pathogens</p>
                </div>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-md text-label-md flex items-center gap-1.5 transition-colors" type="button"><Icon name="add_a_photo" className="text-base" /> Upload Fresh Scan</button>
              </div>
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col md:flex-row gap-space-md items-start">
                <div className="relative w-full md:w-56 h-48 rounded-lg overflow-hidden shrink-0 shadow-sm bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Close up high-resolution macroscopic photo of a Roma tomato plant leaf showing distinct concentric ring lesions characteristic of Early Blight Alternaria solani in a sunny humid Nigerian farm field, surrounded by agricultural diagnostic bounding boxes and telemetry overlays in rich greens and slate tones." src="/images/screens/2d0db497be43.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-2 text-on-primary">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="bg-primary/80 px-1.5 py-0.5 rounded font-mono">CAM-02-B1</span>
                      <span>Captured 2h ago</span>
                    </div>
                  </div>
                  <div className="absolute top-8 left-10 w-24 h-24 border-2 border-dashed border-error rounded pointer-events-none flex items-start justify-end p-1">
                    <span className="bg-error text-on-error font-label-sm text-label-sm px-1 rounded">Alternaria 94%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Pathogen Identified</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Plot B1 Roma Tomato</span>
                    </div>
                    <span className="font-label-md text-label-md text-secondary font-bold">94% Confidence</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface"><strong>Early Blight (<em>Alternaria solani</em>)</strong> detected on 3 lower foliar leaves. Fungal spore germination triggered by 3 consecutive nights of &gt;85% relative humidity and 23°C dew point.</p>
                  <div className="p-space-sm rounded-lg bg-surface-container-highest text-on-surface space-y-1">
                    <div className="flex items-center gap-1.5 text-tertiary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      <Icon name="shield" className="text-base" />
                      <span>Mandatory Chemical Safety Guardrail (SOP §4.1)</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface"><strong>Pre-Harvest Interval (PHI):</strong> 14 Days. <strong>Spray rate:</strong> 2.5g/L Copper Hydroxide (Kocide 2000). <strong>PPE Requirement:</strong> Level 3 (Respirator mask, rubber gauntlets, face shield).</p>
                    <div className="flex items-center gap-1 text-error font-label-sm text-label-sm font-semibold">
                      <Icon name="air" className="text-sm" />
                      <span>Do not apply during flowering wind gusts &gt; 15 km/h (Current Wind: 8 km/h calm).</span>
                    </div>
                  </div>
                  <div className="pt-space-xs flex flex-wrap items-center gap-space-xs">
                    <button className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-primary font-label-sm text-label-sm flex items-center gap-1 transition-colors" type="button"><Icon name="task_alt" className="text-sm" /> Approve Knapsack Spray Task for Plot B1</button>
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-sm text-label-sm flex items-center gap-1 transition-colors" type="button"><Icon name="inventory_2" className="text-sm" /> Check Copper Hydroxide Silo Stock (4.2kg Left)</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="lg:col-span-5 space-y-space-lg">
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                    <Icon name="auto_awesome" className="text-lg" />
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Synthesized Farm Morning Briefing</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Multi-source automated synthesis across 42.5 Ha</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Today • 12 May 2026</span>
              </div>
              <div className="space-y-space-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-error" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">1. Crop Risk • Plot B1</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-error font-semibold">Elevated Fungal Pressure</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Roma tomato fungal pressure elevated due to 88% evening humidity. Preventive systemic spray recommended before Friday storm.</p>
                  <div className="pt-1 flex justify-end">
                    <button className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline" type="button">View Pathogen Curve <Icon name="arrow_forward" className="text-xs" /></button>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">2. Livestock • Broiler House 1</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold">Thermal Alert</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Ammonia levels (8 ppm) within safe threshold (&lt;20 ppm), but ambient temperature peaking at 28.2°C at 13:00 WAT. Trigger evaporative fan cycle to prevent heat-stress mortality.</p>
                  <div className="pt-1 flex justify-end">
                    <button className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline" type="button">Trigger Automation Fans <Icon name="arrow_forward" className="text-xs" /></button>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">3. Inventory &amp; Supplies</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Stock Check</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Urea Split-2 (12 bags) staged and ready in Store 01. Copper Hydroxide fungicide reorder required within 3 days for upcoming second flush.</p>
                  <div className="pt-1 flex justify-end">
                    <button className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline" type="button">Reorder via Marketplace <Icon name="arrow_forward" className="text-xs" /></button>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-label-sm text-label-sm text-on-surface font-bold uppercase tracking-wider">4. Finance &amp; Machinery</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-semibold">Reconciled</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">₦420,000 harrowing expense reconciled with tractor GPS telemetry logs (Plot C2 &amp; C3). ₦95,000 operator payout pending farmer Proof of Work confirmation.</p>
                  <div className="pt-1 flex justify-end">
                    <button className="text-secondary font-label-sm text-label-sm font-bold flex items-center gap-0.5 hover:underline" type="button">Release Escrow Funds <Icon name="arrow_forward" className="text-xs" /></button>
                  </div>
                </div>
              </div>
            </section>
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                    <Icon name="schema" className="text-lg" />
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Explainable AI Reasoning Engine</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Strict Human-in-the-Loop Protocol §8.1.E</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-bold">Zero Autonomous Writes</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">CultivaNode AI formulates verifiable hypotheses by chaining live IoT sensor streams against peer-reviewed regional agronomic models. High-stakes actions require manual farmer verification.</p>
              <div className="space-y-space-sm">
                <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="font-semibold text-primary">Supporting Sensor Inputs</span>
                    <span className="text-secondary font-bold">6 Data Streams</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-label-sm font-label-sm">
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">NiMet Doppler (42mm rain)</span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">Tensiometer A1 (24 cbar)</span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">NDVI Satellite (0.71)</span>
                    <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-on-surface">IoT Hygro (88% RH)</span>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="font-semibold text-primary">Uncertainty Bounds &amp; Risk Range</span>
                    <span className="text-on-surface-variant">±4.8% Sensitivity</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "94%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Lower Bound: 89.4% (Heavy storm lag)</span>
                    <span className="font-semibold text-primary">94.2% Nominal</span>
                    <span>Upper Bound: 98.1% (Runoff match)</span>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-start gap-2.5">
                  <Icon name="verified_user" className="text-xl shrink-0 mt-0.5" />
                  <div className="space-y-1 font-body-sm text-body-sm">
                    <div className="font-bold text-headline-sm text-sm">Human Confirmation Mandate</div>
                    <p>Per Farm Safety Policy §8.1.E, rescheduling of fertilizer applications exceeding ₦100,000 in material value or &gt;5 Ha requires approval from certified Lead Agronomist.</p>
                    <div className="pt-1 flex items-center gap-2">
                      <button className="px-3 py-1 bg-tertiary text-on-tertiary rounded font-label-sm text-label-sm font-semibold hover:bg-tertiary-container transition-colors" type="button">Authorize Reschedule (Quadri Olapade)</button>
                      <button className="px-3 py-1 bg-surface-container-lowest text-on-surface rounded font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="local_library" className="text-lg" />
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Agronomic Knowledge Base</h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Active regional agronomy standard rules</span>
                  </div>
                </div>
                <Icon name="cloud_done" className="text-secondary" />
              </div>
              <div className="space-y-space-xs">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="grass" className="text-secondary text-xl" />
                    <div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">IITA Maize Protocol (Guinea Savanna)</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Edition 2026.1 • N-P-K &amp; Urea timing logic</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Active</span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="spa" className="text-secondary text-xl" />
                    <div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">NIHORT Solanaceous Production Guide</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Early Blight &amp; Bacterial Wilt Thresholds</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Active</span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="cloud_sync" className="text-secondary text-xl" />
                    <div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">Oyo Savanna Rain Calendar 2026</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">NiMet Localized Inset #OYO-ISEYIN-09</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Synced</span>
                </div>
              </div>
              <button className="w-full py-2 bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5" type="button"><Icon name="manage_search" className="text-base" /> Browse Full Agronomy Rule Repository (148 SOPs)</button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
