# Web and Mobile Functionality Audit — CultivaNode

**Audit Date:** 2026-11-17  
**Classification Scale:**  
- **A:** Fully implemented and tested  
- **B:** Implemented, awaiting database/deployment integration or automated test coverage  
- **C:** Implemented, partially functional  
- **D:** Interface only, with sample or placeholder data  
- **E:** Not implemented  

> **Test Coverage Note:** `apps/web` has **zero** automated test files and no `test` script in `apps/web/package.json`. `apps/mobile` has 3 Vitest test files (`apps/mobile/src/lib/__tests__/`), but `apps/mobile/package.json` has no `test` script or `vitest` dependency, and `packages/shared` is deleted on disk in this local backup. Therefore, no feature currently qualifies as **A**.

---

## 1. Feature Parity & Status Matrix

| Feature Area | Web Status | Web Evidence & Files | Mobile Status | Mobile Evidence & Files |
|---|---|---|---|---|
| **Registration, Onboarding & Auth** | **B** *(1 **D** route)* | `src/proxy.ts`, `src/actions/auth.ts`, `src/actions/onboarding.ts`, `PhoneSignIn` + Email OTP. `src/app/[lang]/onboarding/review/page.tsx` is static (**D**). | **B** | `src/lib/auth.ts`, `src/lib/encrypted-storage.ts` (AES-256-CTR + `expo-secure-store`), `PhoneSignInScreen.tsx`, `OnboardingScreen.tsx`. |
| **Multiple User Roles & Settings** | **B** | `src/lib/account/workspace.ts` (`WorkspaceSwitcher`), `src/app/[lang]/account/roles/page.tsx`, `verification/page.tsx`, `privacy/page.tsx`, `src/app/api/account/export/route.ts`. | **C** | Farmer & Provider (`/(provider)`) views only; NIN tier-1 check (`VerifyNinScreen.tsx`). Role requests, doc uploads, Agent/Agronomist/Buyer workspaces missing. |
| **Business Accounts** | **B** | `src/app/[lang]/account/business/page.tsx`, `src/actions/account.ts` (`updateBusiness`, `add_org_member` RPC, `changeStaffRole`, `removeStaff`). | **E** | Not implemented on mobile. |
| **Farmer Dashboards** | **B** | `src/app/[lang]/account/page.tsx`, `src/components/live/overview-panels.tsx` (`ProviderHome`, `AgentHome`, `ExecutiveDashboard`). | **B** | `HomeScreen.tsx`, `FarmScreen.tsx` (live farm/crop/alert queries). |
| **Crop Management** | **B** | `account/crops/page.tsx`, `crops/new/page.tsx`, `crops/[id]`, `crops/scouting/page.tsx`, `src/actions/farm-ops.ts` (`plots`, `crop_cycles`, `crop_observations`). | **C** | `CropSetupScreen.tsx`, `ScoutScreen.tsx` (with AI photo upload). Missing stand count, crop edit, and harvest closeout. |
| **Livestock Management** | **B** | `account/livestock/page.tsx` (flag `module_livestock`), `farm_livestock_groups`, feeding, health, production logs. | **C** | `AnimalsScreen.tsx`, `src/app/livestock/*` (list herds, add herd, log feed/health/mortality via outbox). |
| **Farm Tasks & Calendars** | **B** | `account/tasks/page.tsx`, `field-calendar.tsx`, `calendar-sync.tsx`, `src/app/api/calendar/[token]/route.ts` (`.ics` feed). | **C** | `HomeScreen.tsx` / `FarmScreen.tsx` group `crop_cycle_operations` (`markJobDone`, `moveJob`). No calendar view, custom tasks, or worker assignment. |
| **Weather** | **B** | `account/weather/page.tsx` (Open-Meteo 10-day + `telemetry_readings` + `crop_alerts`), `src/app/api/weather/route.ts`, `WeatherPanel`. | **B** | `src/lib/weather.ts`, `HomeScreen.tsx` (`WeatherCard`, 6h `AsyncStorage` cache from `${SITE_URL}/api/weather`). |
| **Inventory** | **B** | `account/inventory/page.tsx`, `farm_inventory`, `farm_inventory_transactions` (`createInventoryItem`, `recordStockMovement`). | **B** | `StoreScreen.tsx`, `StoreAddScreen.tsx`, `src/app/inventory/*` (add via outbox, online quantity adjust). |
| **Farm Finance** | **B** *(Web Account)* / **D** *(Admin)* | `account/finance/page.tsx`, `variance/page.tsx` (`farm_financial_transactions`, `farm_budgets`). `/admin/finance` (`PlatformFinance`) uses hardcoded `INITIAL_LEDGER` (**D**). | **B** | `BooksScreen.tsx`, `BookEntryScreen.tsx`, `src/app/books/*` (KPIs + offline outbox entries). |
| **Marketplace** | **B** | `[lang]/marketplace/*`, `src/actions/checkout.ts`, `direct-payment.ts`, `seller.ts`, `marketplace-disputes.ts`, Paystack/Flutterwave webhooks. | **B** | `MarketScreen.tsx`, `LotScreen.tsx`, `OrdersScreen.tsx`, `OrderScreen.tsx`, `SellScreen.tsx`, `ShopScreen.tsx` (`place_marketplace_order` RPC, direct pay). |
| **Equipment Hiring & Providers** | **B** | `account/find/page.tsx`, `bookings/*`, `listings/page.tsx`, `machinery/*` (`nearby_listings_for_farm`, GPS check-in, proofs, disputes). | **C / D** | Farmer hiring (`HireScreen.tsx`, `BookingScreen.tsx`) is **B**. Provider dispatch (`src/lib/provider-dispatch.ts`, `/(provider)/*`) is **C/D** with demo fallbacks & bugs. |
| **AI Assistant** | **B** | `account/assistant/page.tsx`, `AiFarmAssistant`, `src/app/api/ai/assistant/route.ts`, `src/app/api/scouting/analyse/route.ts`. | **D / E** | Native chat is **E** (`HelpScreen.tsx` opens web URL via `Linking.openURL`). Scouting photo AI (`src/lib/scout.ts`) is **B**. |
| **Administration** | **B** *(mostly)* / **C–D** | `/admin/*`: `health`, `agronomy`, `integrations`, `features`, `approvals`, `disputes`, `marketplace`, `users`, `access`, `audit`, `privacy` are **B**. `/admin/content` is **C**; `/admin/finance` & `/admin/support` are **D**. | **E** | No admin console on mobile (intentional). |
| **Offline Functionality** | **E** | Standard SSR/CSR online Next.js app. | **C** | `AsyncStorage` outbox (`src/lib/outbox.ts`, `AutoSync` in `_layout.tsx`). `expo-sqlite` is unused. No conflict resolution; farms/crops/jobs/orders are online-only. |

---

## 2. Critical Bugs & Disconnected Interfaces Found

### Mobile (`apps/mobile`)
1. **Runtime Crash (`src/app/evidence/[jobId].tsx`):** Calls `useProvider()` from sibling `../(provider)/_layout`, which is not an ancestor of `/evidence/[jobId]`. Navigating from `inbox.tsx` or `calendar.tsx` throws `useProvider must be used within ProviderContext`.
2. **Android UI Bug (`src/app/(provider)/inbox.tsx:39`):** Calls `Alert.prompt(...)` for job decline reason, which is iOS-only in React Native and silently fails on Android.
3. **Demo Data Fallbacks (`src/lib/provider-dispatch.ts`):** `loadProviderJobs()` and `loadMachineryFleet()` fall back to hardcoded South-West Nigeria demo jobs/tractors; `submitWorkProofPhoto()` falls back to `'demo-provider-user'`; `WorkEvidenceScreen.tsx:85` allows local check-in when RPC fails; maintenance dates only persist to `sessionStorage`.
4. **GPS Boundary Default (`src/app/farms/boundary_walk.tsx`):** Hardcodes `initialFarmName="Farm"` and defaults to `Oyo`/`Ibadan`.
5. **Broken Workspace Imports:** `@cultivanode/shared*` imports cannot resolve while `packages/` is missing on disk.

### Web (`apps/web`)
1. **Sample Admin Screens:** `/admin/finance` (`PlatformFinance`), `/admin/support` (`SupportDesk`), and bottom half of `/admin/content` (`ContentAdmin`) render hardcoded sample data.
2. **Stubbed API Routes:**
   - `src/app/api/documents/[type]/route.ts` returns hardcoded static CSVs.
   - `src/app/api/engines/agronomy/schedule/route.ts` (`GET`) returns a hardcoded CSV string.
   - `src/app/api/engines/ledger/transact/route.ts` runs `CryptographicLedger` in-memory with no DB persistence.
3. **Unused Files:** `src/components/account/account-nav.tsx`, `src/lib/use-live-weather.ts`.
4. **Mobile Parity Gap:** Web has ~25 additional `account/*` modules (`agent`, `buyer`, `contracts`, `cooperative`, `enterprise`, `gov`, `grants`, `harvest`, `insurance`, `investor`, `iot`, `irrigation`, `lender`, `logistics`, `market-intel`, `messages`, `ngo`, `processing`, `reports`, `research`, `risk`, `supplier`, `variance`) absent from mobile.
