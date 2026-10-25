// The marketplace: browse lots, order one, pay the seller directly, and sell your own harvest.
// Prices, stock and sellers always come from the database. Placing an order runs
// place_marketplace_order(), which prices it on the server like the website does.
// Some tables and columns are newer than the generated types, so those calls use an untyped client.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { stateCentroid } from '@cultivanode/shared/state-centroids';
import { reportError } from './monitoring';
import { supabase } from './supabase';

const loose = supabase as unknown as SupabaseClient;
const isNetwork = (e: { message?: string; code?: string } | null) => Boolean(e) && !e?.code && /network|fetch/i.test(e?.message ?? '');

export const LOT_TYPES = ['produce', 'input', 'service', 'labour', 'machinery'] as const;
export type LotType = (typeof LOT_TYPES)[number];

export type Lot = {
  id: string;
  title: string;
  type: string;
  priceKobo: number;
  priceModel: string;
  unit: string;
  available: number;
  minOrder: number;
  place: string;
  image: string | null;
  images: string[];
  description: string | null;
  seller: { id: string; name: string; verified: boolean; rating: number | null; ratingCount: number };
};

type LotRow = {
  id: string;
  title: string;
  listing_type: string;
  base_price_kobo: number;
  price_model: string;
  unit: string;
  available_quantity: number;
  min_order_quantity: number;
  location_state: string | null;
  location_lga: string | null;
  images: string[] | null;
  description: string | null;
  marketplace_sellers: { id: string; business_name: string; verification_status: string; rating_avg: number | null; rating_count: number | null } | null;
};

const LOT_FIELDS =
  'id, title, listing_type, base_price_kobo, price_model, unit, available_quantity, min_order_quantity, location_state, location_lga, images, description, marketplace_sellers ( id, business_name, verification_status, rating_avg, rating_count )';

function toLot(r: LotRow): Lot {
  const s = r.marketplace_sellers;
  return {
    id: r.id,
    title: r.title,
    type: r.listing_type,
    priceKobo: Number(r.base_price_kobo),
    priceModel: r.price_model,
    unit: r.unit,
    available: Number(r.available_quantity),
    minOrder: Number(r.min_order_quantity || 1),
    place: [r.location_lga, r.location_state].filter(Boolean).join(', '),
    image: r.images?.[0] ?? null,
    images: r.images ?? [],
    description: r.description,
    seller: {
      id: s?.id ?? '',
      name: s?.business_name ?? '',
      verified: s?.verification_status === 'verified',
      // No rating yet stays null ("New seller"), never an invented score.
      rating: s?.rating_count ? Number(s.rating_avg) : null,
      ratingCount: Number(s?.rating_count ?? 0),
    },
  };
}

/** Lots on sale, newest first, cached so the market still opens offline. */
export async function loadLots(filter: { type?: LotType | null; q?: string; state?: string | null }): Promise<Lot[]> {
  const key = `cn.lots.${filter.type ?? 'all'}`;
  try {
    let query = supabase.from('marketplace_listings').select(LOT_FIELDS).eq('status', 'active').order('created_at', { ascending: false }).limit(60);
    if (filter.type) query = query.eq('listing_type', filter.type);
    if (filter.q?.trim()) query = query.ilike('title', `%${filter.q.trim().replace(/[%_]/g, '')}%`);
    if (filter.state) query = query.eq('location_state', filter.state);
    const { data, error } = await query;
    if (error) throw error;
    const lots = ((data ?? []) as unknown as LotRow[]).map(toLot);
    if (!filter.q && !filter.state) AsyncStorage.setItem(key, JSON.stringify(lots)).catch(() => undefined);
    return lots;
  } catch (err) {
    const saved = await AsyncStorage.getItem(key).catch(() => null);
    if (saved && !filter.q) return JSON.parse(saved) as Lot[];
    throw err;
  }
}

export async function loadLot(id: string): Promise<Lot | null> {
  const { data, error } = await supabase.from('marketplace_listings').select(LOT_FIELDS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toLot(data as unknown as LotRow) : null;
}

/** Admin switch: while off, buyers pay sellers directly. */
export async function escrowOn(): Promise<boolean> {
  const { data } = await loose.from('feature_flags').select('enabled').eq('key', 'escrow_payments').maybeSingle();
  return (data as { enabled?: boolean } | null)?.enabled === true;
}

export type OrderError = 'bad_address' | 'listing_unavailable' | 'own_listing' | 'min_order' | 'not_enough' | 'no_payout_account' | 'empty' | 'offline' | 'errorGeneric';

export async function placeOrder(o: { listingId: string; quantity: number; address: string; state: string; lga: string; phone: string; notes: string }): Promise<{ id: string } | { error: OrderError; detail?: string }> {
  const { data, error } = await loose.rpc('place_marketplace_order', {
    p_lines: [{ listing_id: o.listingId, quantity: o.quantity }],
    p_address: { line: o.address, state: o.state, lga: o.lga, phone: o.phone },
    p_notes: o.notes || null,
  });
  if (!error && data) return { id: String(data) };
  if (isNetwork(error)) return { error: 'offline' };
  const hint = error?.hint ?? '';
  const known: OrderError[] = ['bad_address', 'listing_unavailable', 'own_listing', 'min_order', 'not_enough', 'no_payout_account', 'empty'];
  if (known.includes(hint as OrderError)) return { error: hint as OrderError, detail: error?.message };
  if (/INSUFFICIENT_STOCK/.test(error?.message ?? '')) return { error: 'not_enough' };
  reportError('mobile_place_order_failed', error, { reason: error?.code ?? 'unknown' });
  return { error: 'errorGeneric' };
}

// --- Buyer: orders ---------------------------------------------------------------------------------------

export type OrderPart = {
  id: string;
  number: string;
  sellerId: string;
  sellerName: string;
  status: string;
  subtotalKobo: number;
  deliveryKobo: number;
  direct: string | null;
  buyerRef: string | null;
  tracking: string | null;
  notes: string | null;
  payout: { bank: string; name: string; number: string } | null;
};

export type Order = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  mode: 'direct' | 'escrow';
  totalKobo: number;
  placedAt: string | null;
  items: { title: string; quantity: number; unit: string; subtotalKobo: number }[];
  parts: OrderPart[];
};

export async function myOrders(userId: string): Promise<{ id: string; number: string; status: string; paymentStatus: string; totalKobo: number; placedAt: string | null; title: string }[]> {
  const { data, error } = await loose
    .from('marketplace_orders')
    .select('id, order_number, status, payment_status, total_amount_kobo, placed_at, marketplace_order_items ( title )')
    .eq('buyer_id', userId)
    .order('placed_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return ((data ?? []) as { id: string; order_number: string; status: string; payment_status: string; total_amount_kobo: number; placed_at: string | null; marketplace_order_items: { title: string }[] }[]).map((o) => ({
    id: o.id,
    number: o.order_number,
    status: o.status,
    paymentStatus: o.payment_status,
    totalKobo: Number(o.total_amount_kobo),
    placedAt: o.placed_at,
    title: o.marketplace_order_items.map((i) => i.title).join(', '),
  }));
}

export async function loadOrder(id: string): Promise<Order | null> {
  const { data, error } = await loose
    .from('marketplace_orders')
    .select(
      'id, order_number, status, payment_status, payment_mode, total_amount_kobo, placed_at, marketplace_order_items ( title, quantity, unit, subtotal_kobo ), marketplace_fulfilments ( id, fulfilment_number, seller_id, status, subtotal_kobo, delivery_fee_kobo, direct_payment_status, buyer_payment_reference, tracking_number, notes, marketplace_sellers ( business_name ) )',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const o = data as unknown as {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    payment_mode: string | null;
    total_amount_kobo: number;
    placed_at: string | null;
    marketplace_order_items: { title: string; quantity: number; unit: string; subtotal_kobo: number }[];
    marketplace_fulfilments: {
      id: string;
      fulfilment_number: string;
      seller_id: string;
      status: string;
      subtotal_kobo: number;
      delivery_fee_kobo: number;
      direct_payment_status: string | null;
      buyer_payment_reference: string | null;
      tracking_number: string | null;
      notes: string | null;
      marketplace_sellers: { business_name: string } | null;
    }[];
  };
  const mode = o.payment_mode === 'direct' ? 'direct' : 'escrow';
  const payouts = new Map<string, { bank: string; name: string; number: string }>();
  if (mode === 'direct') {
    const { data: acc } = await loose
      .from('marketplace_seller_payout_accounts')
      .select('seller_id, bank_name, account_name, account_number')
      .in('seller_id', o.marketplace_fulfilments.map((f) => f.seller_id));
    for (const a of (acc ?? []) as { seller_id: string; bank_name: string; account_name: string; account_number: string }[]) {
      payouts.set(a.seller_id, { bank: a.bank_name, name: a.account_name, number: a.account_number });
    }
  }
  return {
    id: o.id,
    number: o.order_number,
    status: o.status,
    paymentStatus: o.payment_status,
    mode,
    totalKobo: Number(o.total_amount_kobo),
    placedAt: o.placed_at,
    items: o.marketplace_order_items.map((i) => ({ title: i.title, quantity: Number(i.quantity), unit: i.unit, subtotalKobo: Number(i.subtotal_kobo) })),
    parts: o.marketplace_fulfilments.map((f) => ({
      id: f.id,
      number: f.fulfilment_number,
      sellerId: f.seller_id,
      sellerName: f.marketplace_sellers?.business_name ?? '',
      status: f.status,
      subtotalKobo: Number(f.subtotal_kobo),
      deliveryKobo: Number(f.delivery_fee_kobo),
      direct: f.direct_payment_status,
      buyerRef: f.buyer_payment_reference,
      tracking: f.tracking_number,
      notes: f.notes,
      payout: payouts.get(f.seller_id) ?? null,
    })),
  };
}

async function rpc(name: string, args: Record<string, unknown>, op: string): Promise<string | null> {
  const { error } = await loose.rpc(name, args);
  if (!error) return null;
  if (isNetwork(error)) return 'offline';
  if (['P0001', 'P0002', '22023', '42501'].includes(error.code ?? '')) return error.message;
  reportError(`mobile_${op}_failed`, error, { reason: error.code ?? 'unknown' });
  return 'errorGeneric';
}

export const reportPayment = (fulfilmentId: string, reference: string) => rpc('buyer_report_direct_payment', { p_fulfilment_id: fulfilmentId, p_reference: reference }, 'report_payment');
export const confirmReceived = (fulfilmentId: string) => rpc('buyer_confirm_direct_delivery', { p_fulfilment_id: fulfilmentId }, 'confirm_received');

// --- Seller: my shop -------------------------------------------------------------------------------------

export type Shop = { id: string; name: string; verification: string; payout: { bank: string; name: string; number: string } | null };

export async function myShop(userId: string): Promise<Shop | null> {
  const { data } = await supabase.from('marketplace_sellers').select('id, business_name, verification_status').eq('profile_id', userId).maybeSingle();
  if (!data) return null;
  const { data: acc } = await loose.from('marketplace_seller_payout_accounts').select('bank_name, account_name, account_number').eq('seller_id', data.id).maybeSingle();
  const a = acc as { bank_name: string; account_name: string; account_number: string } | null;
  return { id: data.id, name: data.business_name, verification: data.verification_status, payout: a ? { bank: a.bank_name, name: a.account_name, number: a.account_number } : null };
}

/** The shop for selling, opened (unverified) on first use, named after the person. */
async function ensureShop(userId: string, name: string | null): Promise<string | null> {
  const existing = await myShop(userId);
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('marketplace_sellers')
    .insert({ profile_id: userId, seller_type: 'farmer', business_name: (name || 'My farm shop').slice(0, 120) })
    .select('id')
    .single();
  if (error) reportError('mobile_open_shop_failed', error, { reason: error.code ?? 'unknown' });
  return data?.id ?? null;
}

export async function savePayout(userId: string, name: string | null, p: { bank: string; accountName: string; number: string }): Promise<'bank' | 'name' | 'number' | 'offline' | 'errorGeneric' | null> {
  const bank = p.bank.trim();
  const accountName = p.accountName.trim();
  const number = p.number.replace(/\s+/g, '');
  if (bank.length < 2) return 'bank';
  if (accountName.length < 2) return 'name';
  if (!/^[0-9]{10}$/.test(number)) return 'number';
  const shopId = await ensureShop(userId, name);
  if (!shopId) return 'errorGeneric';
  const { error } = await loose
    .from('marketplace_seller_payout_accounts')
    .upsert({ seller_id: shopId, bank_name: bank.slice(0, 80), account_name: accountName.slice(0, 120), account_number: number, updated_at: new Date().toISOString() });
  if (!error) return null;
  return isNetwork(error) ? 'offline' : 'errorGeneric';
}

export type ShopOrder = {
  id: string;
  number: string;
  status: string;
  subtotalKobo: number;
  direct: string | null;
  buyerRef: string | null;
  createdAt: string;
  items: string;
  address: string;
  phone: string | null;
};

export async function shopOrders(shopId: string): Promise<ShopOrder[]> {
  const [{ data, error }, { data: items }] = await Promise.all([
    loose
      .from('marketplace_fulfilments')
      .select('id, order_id, fulfilment_number, status, subtotal_kobo, direct_payment_status, buyer_payment_reference, created_at, marketplace_orders ( delivery_address )')
      .eq('seller_id', shopId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('marketplace_order_items').select('order_id, title, quantity, unit').eq('seller_id', shopId),
  ]);
  if (error) throw error;
  const lines = new Map<string, string[]>();
  for (const i of items ?? []) lines.set(i.order_id, [...(lines.get(i.order_id) ?? []), `${Number(i.quantity)} ${i.unit} ${i.title}`]);
  return ((data ?? []) as unknown as {
    id: string;
    order_id: string;
    fulfilment_number: string;
    status: string;
    subtotal_kobo: number;
    direct_payment_status: string | null;
    buyer_payment_reference: string | null;
    created_at: string;
    marketplace_orders: { delivery_address: { line?: string; lga?: string; state?: string; phone?: string } | null } | null;
  }[]).map((f) => {
    const a = f.marketplace_orders?.delivery_address ?? null;
    return {
      id: f.id,
      number: f.fulfilment_number,
      status: f.status,
      subtotalKobo: Number(f.subtotal_kobo),
      direct: f.direct_payment_status,
      buyerRef: f.buyer_payment_reference,
      createdAt: f.created_at,
      items: (lines.get(f.order_id) ?? []).join('; '),
      address: [a?.line, a?.lga, a?.state].filter(Boolean).join(', '),
      phone: a?.phone ?? null,
    };
  });
}

export const confirmPaymentReceived = (fulfilmentId: string) => rpc('seller_confirm_direct_payment', { p_fulfilment_id: fulfilmentId }, 'confirm_payment');
export const moveOrder = (fulfilmentId: string, status: string, note?: string) =>
  rpc('seller_update_fulfilment', { p_fulfilment: fulfilmentId, p_status: status, p_note: note ?? null, p_tracking: null }, 'fulfil_order');

// --- Seller: sell my harvest (works offline) -------------------------------------------------------------

export type NewLot = {
  title: string;
  type: LotType;
  unit: string;
  priceNaira: number;
  quantity: number;
  minOrder: number;
  description: string;
  state: string | null;
  lga: string | null;
  farmId: string | null;
  photoUri: string | null;
};

const PENDING_KEY = 'cn.pendingLots';

async function uploadPhoto(userId: string, listingId: string, uri: string): Promise<string | null> {
  try {
    const res = await fetch(uri);
    const bytes = await res.arrayBuffer();
    const type = res.headers.get('content-type') ?? 'image/jpeg';
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    const path = `${userId}/${listingId}/${Date.now().toString(36)}.${ext}`;
    const { error } = await supabase.storage.from('listing-photos').upload(path, bytes, { contentType: type, cacheControl: '31536000', upsert: false });
    if (error) return null;
    return supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

async function publish(userId: string, name: string | null, lot: NewLot): Promise<{ id: string } | { error: 'offline' | 'errorGeneric' }> {
  const shopId = await ensureShop(userId, name);
  if (!shopId) return { error: 'errorGeneric' };
  const slug = lot.type === 'input' ? 'inputs' : lot.type === 'service' ? 'services' : lot.type;
  const { data: cat } = await supabase.from('marketplace_categories').select('id').eq('slug', slug).maybeSingle();
  if (!cat) return { error: 'errorGeneric' };
  const point = stateCentroid(lot.state) ?? stateCentroid('Oyo')!;
  const { data: listing, error } = await supabase
    .from('marketplace_listings')
    .insert({
      seller_id: shopId,
      category_id: cat.id,
      listing_type: lot.type,
      title: lot.title.slice(0, 140),
      description: lot.description.trim().slice(0, 2000) || null,
      unit: lot.unit,
      price_model: 'fixed',
      base_price_kobo: Math.round(lot.priceNaira * 100),
      min_order_quantity: lot.minOrder > 0 ? lot.minOrder : 1,
      location_state: lot.state,
      location_lga: lot.lga,
      location: `SRID=4326;POINT(${point.lng.toFixed(6)} ${point.lat.toFixed(6)})`,
      delivery_options: ['pickup', 'seller_delivery'],
      status: 'active',
    })
    .select('id')
    .single();
  if (error || !listing) {
    if (isNetwork(error)) return { error: 'offline' };
    reportError('mobile_create_lot_failed', error, { reason: error?.code ?? 'unknown' });
    return { error: 'errorGeneric' };
  }
  await supabase.from('marketplace_inventory_lots').insert({
    listing_id: listing.id,
    lot_number: `LOT-${Date.now().toString(36).toUpperCase()}`,
    physical_quantity: lot.quantity,
    reserved_quantity: 0,
    allocated_quantity: 0,
    sold_quantity: 0,
  });
  if (lot.farmId) await supabase.from('marketplace_produce_provenance').insert({ listing_id: listing.id, farm_id: lot.farmId });
  if (lot.photoUri) {
    const url = await uploadPhoto(userId, listing.id, lot.photoUri);
    if (url) await supabase.from('marketplace_listings').update({ images: [url] }).eq('id', listing.id);
  }
  return { id: listing.id };
}

/** Puts a lot on the market now, or keeps it on the phone and sends it when the connection is back. */
export async function sellLot(userId: string, name: string | null, lot: NewLot): Promise<'live' | 'queued' | 'errorGeneric'> {
  const res = await publish(userId, name, lot);
  if ('id' in res) return 'live';
  if (res.error === 'offline') {
    const saved = JSON.parse((await AsyncStorage.getItem(PENDING_KEY).catch(() => null)) ?? '[]') as NewLot[];
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...saved, lot].slice(-20)));
    return 'queued';
  }
  return 'errorGeneric';
}

export async function pendingLots(): Promise<NewLot[]> {
  return JSON.parse((await AsyncStorage.getItem(PENDING_KEY).catch(() => null)) ?? '[]') as NewLot[];
}

/** Sends lots saved while offline. Returns how many went live. */
export async function sendPendingLots(userId: string, name: string | null): Promise<number> {
  const saved = await pendingLots();
  if (!saved.length) return 0;
  const left: NewLot[] = [];
  let sent = 0;
  for (const lot of saved) {
    const res = await publish(userId, name, lot);
    if ('id' in res) sent++;
    else if (res.error === 'offline') left.push(lot);
  }
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(left));
  return sent;
}
