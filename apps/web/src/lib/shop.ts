// Option lists for "My shop" (marketplace selling). Values match the database checks on marketplace_listings.
export const LISTING_TYPES = ["produce", "input", "service", "labour", "machinery"] as const;
export const UNITS = ["kg", "g", "tonne", "bag", "crate", "basket", "piece", "litre", "hectare", "hour", "day", "job"] as const;
export const PRICE_MODELS = ["fixed", "negotiable", "per_unit", "quotation"] as const;
export const SELLER_TYPES = ["farmer", "agro_dealer", "machinery_owner", "labour_provider", "service_provider", "aggregator", "processor", "cooperative"] as const;
export const FULFIL_STEPS = ["confirmed", "preparing", "ready_for_pickup", "dispatched", "in_transit", "delivered", "rejected"] as const;

export const LISTING_TYPE_LABEL: Record<(typeof LISTING_TYPES)[number], string> = {
  produce: "Farm produce (crops, grain, tubers, eggs, fish…)",
  input: "Farm inputs (seed, fertiliser, feed, chemicals)",
  service: "Service (consulting, agronomy, spraying, vet…)",
  labour: "Labour (farm hands, crews)",
  machinery: "Machinery hire",
};

/** What the seller can do next with an order, as [status, button label]. Mirrors seller_update_fulfilment. */
export const NEXT_STEPS: Record<string, [string, string][]> = {
  placed: [["confirmed", "Confirm"], ["rejected", "Can't fulfil"]],
  confirmed: [["preparing", "Preparing"], ["ready_for_pickup", "Ready for pickup"], ["dispatched", "Dispatched"], ["rejected", "Can't fulfil"]],
  preparing: [["ready_for_pickup", "Ready for pickup"], ["dispatched", "Dispatched"], ["rejected", "Can't fulfil"]],
  ready_for_pickup: [["delivered", "Handed over"]],
  dispatched: [["in_transit", "In transit"], ["delivered", "Delivered"]],
  in_transit: [["delivered", "Delivered"]],
};
