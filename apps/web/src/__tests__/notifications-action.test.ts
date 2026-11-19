import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const mockRevalidatePath = vi.fn();
const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEqProfile = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockEqId = vi.fn(() => ({ eq: mockEqProfile }));
const mockSelect = vi.fn(() => ({ eq: mockEqId }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockRpc = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

const VALID_NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";
const VALID_ORDER_ID = "22222222-2222-4222-8222-222222222222";

function makeFormData(lang: string | null, notificationId: string): FormData {
  const fd = new FormData();
  if (lang !== null) fd.set("lang", lang);
  fd.set("notification_id", notificationId);
  return fd;
}

describe("openMarketplaceOrderNotification server action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockEqProfile.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockEqId.mockReturnValue({ eq: mockEqProfile });
    mockSelect.mockReturnValue({ eq: mockEqId });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockMaybeSingle.mockResolvedValue({
      data: { kind: "marketplace_order_placed", data: { order_id: VALID_ORDER_ID } },
      error: null,
    });
    mockRpc.mockResolvedValue({ error: null });
  });

  it("allows supported locales ('en' and 'yo') and preserves seller/buyer redirects", async () => {
    const { openMarketplaceOrderNotification } = await import("@/actions/notifications");

    await expect(
      openMarketplaceOrderNotification(makeFormData("yo", VALID_NOTIFICATION_ID)),
    ).rejects.toThrow(`NEXT_REDIRECT:/yo/account/marketplace/seller?order=${VALID_ORDER_ID}`);

    expect(mockEqId).toHaveBeenCalledWith("id", VALID_NOTIFICATION_ID);
    expect(mockEqProfile).toHaveBeenCalledWith("profile_id", "user-123");
    expect(mockRpc).toHaveBeenCalledWith("mark_notifications_read", { p_ids: [VALID_NOTIFICATION_ID] });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/yo/account/inbox");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/yo/account");

    mockMaybeSingle.mockResolvedValueOnce({
      data: { kind: "marketplace_order_dispatched", data: { order_id: VALID_ORDER_ID } },
      error: null,
    });

    await expect(
      openMarketplaceOrderNotification(makeFormData("EN", VALID_NOTIFICATION_ID)),
    ).rejects.toThrow(`NEXT_REDIRECT:/en/account/marketplace/orders/${VALID_ORDER_ID}`);
  });

  it("falls back to 'en' for invalid, missing, or traversal-like lang values", async () => {
    const { openMarketplaceOrderNotification } = await import("@/actions/notifications");

    for (const badLang of ["../..", "fr", "en/..", "//evil", "", null]) {
      await expect(
        openMarketplaceOrderNotification(makeFormData(badLang, VALID_NOTIFICATION_ID)),
      ).rejects.toThrow(`NEXT_REDIRECT:/en/account/marketplace/seller?order=${VALID_ORDER_ID}`);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/en/account/inbox");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/en/account");
    }

    await expect(
      openMarketplaceOrderNotification(makeFormData("../x", "not-a-uuid")),
    ).rejects.toThrow("NEXT_REDIRECT:/en/account/inbox");
  });

  it("redirects unauthenticated callers to sign-in with validated locale and throws on RPC error", async () => {
    const { openMarketplaceOrderNotification } = await import("@/actions/notifications");

    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(
      openMarketplaceOrderNotification(makeFormData("yo", VALID_NOTIFICATION_ID)),
    ).rejects.toThrow("NEXT_REDIRECT:/yo/sign-in");

    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(
      openMarketplaceOrderNotification(makeFormData("invalid", VALID_NOTIFICATION_ID)),
    ).rejects.toThrow("NEXT_REDIRECT:/en/sign-in");

    mockRpc.mockResolvedValueOnce({ error: { message: "db error" } });
    await expect(
      openMarketplaceOrderNotification(makeFormData("en", VALID_NOTIFICATION_ID)),
    ).rejects.toThrow("Could not mark this notification as read.");
  });
});
