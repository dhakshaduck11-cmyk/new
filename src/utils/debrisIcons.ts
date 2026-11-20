import type { DebrisCategory } from '../types/anomasea';

export interface DebrisIconDefinition {
  key: string;
  label: string;
  svg: string;
}

const DEBRIS_SVGS: Record<string, string> = {
  plastic_bottle: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2h4v2.5l2 2.5v3.5c0 .6-.4 1-.4 1.5s.4.9.4 1.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6.5c0-.6.4-1 .4-1.5s-.4-.9-.4-1.5V7l2-2.5V2z"/><path d="M9 12h6"/></svg>`,
  plastic_bag: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l1.5 12H4.5L6 8z"/><path d="M9 8V5.5a3 3 0 0 1 6 0V8"/></svg>`,
  plastic_container: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16"/><path d="M8 14h8"/></svg>`,
  glass_bottle: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2h4v4l2.5 3.5V20a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V9.5L10 6V2z"/><path d="M8 14h8"/></svg>`,
  tire: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18"/></svg>`,
  buoy: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3"/><circle cx="12" cy="6.5" r="1.5" fill="currentColor"/><path d="M8 16l2-8h4l2 8"/><path d="M5 17c2.5 2 11.5 2 14 0"/><circle cx="12" cy="20" r="1.5"/></svg>`,
  fishing_net: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9l6-5M3 15l11-11M7 18L20 5M13 18l8-8"/><path d="M21 9l-6-5M21 15L10 4M17 18L4 5M11 18l-8-8"/><path d="M3 20.5h18" stroke-dasharray="2 2"/></svg>`,
  fishing_rope: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="11" rx="7" ry="6"/><ellipse cx="12" cy="11" rx="3.5" ry="2.8"/><path d="M17.5 15c1.5 1.5 1 4-1.5 5.5"/><path d="M7 15.5C5.5 17 6 19.5 8.5 20.5"/></svg>`,
  fishing_line: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3v12.5a3.5 3.5 0 0 1-7 0V13l2 2"/><path d="M15 3c-3 2-7 1-9 4"/><circle cx="15" cy="3.5" r="1" fill="currentColor"/></svg>`,
  fishing_trap: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10l3-5h10l3 5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-8z"/><path d="M4 10h16M9 5v14.5M15 5v14.5M4 14.5h16"/></svg>`,
  fad: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="4" rx="1"/><path d="M7 9v10M12 9v11M17 9v10"/><path d="M7 13h10M7 17h10" stroke-dasharray="2 1.5"/></svg>`,
  metal_can: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5.5" rx="5.5" ry="2"/><path d="M6.5 5.5v13c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-13"/><path d="M6.5 10.5c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2"/></svg>`,
  oil_drum: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="4.5" rx="6.5" ry="2"/><path d="M5.5 4.5v15c0 1.1 2.9 2 6.5 2s6.5-.9 6.5-2v-15"/><path d="M5.5 9.5c0 1.1 2.9 2 6.5 2s6.5-.9 6.5-2"/><path d="M5.5 14.5c0 1.1 2.9 2 6.5 2s6.5-.9 6.5-2"/></svg>`,
  battery_pack: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="7" width="17" height="13" rx="2"/><path d="M7 7V4.5h3V7M14 7V4.5h3V7"/><path d="M12.5 10.5L10 14h4l-2.5 3.5"/></svg>`,
  shipwreck: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16l3.5 3.5h11.5L21 12l-6.5 1.5L12 8l-3 3.5L3 16z"/><path d="M12 8V4M10 5.5h4"/><path d="M3 21c2-1 4 1 6 0s4 1 6 0 4 1 6 0"/></svg>`,
  electronics: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/></svg>`,
  anchor: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M8.5 10h7"/><path d="M5 14a7 7 0 0 0 14 0"/><path d="M4 15l1-1 1.5 1M17.5 15l1.5-1 1 1"/></svg>`,
  concrete_block: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10l8-4 8 4v8l-8 4-8-4v-8z"/><path d="M4 10l8 4 8-4M12 14v8"/><path d="M8 6V3M16 6V3" stroke-width="2"/></svg>`,
  pipe: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="3" height="10" rx="0.8"/><rect x="18" y="7" width="3" height="10" rx="0.8"/><path d="M6 9h12M6 15h12"/></svg>`,
  appliance: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M5 8h14"/><circle cx="12" cy="14" r="3.5"/><path d="M8 5.5h2"/></svg>`,
  timber: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8l12-4 4 3-12 4-4-3z"/><path d="M4 8v6l4 3 12-4V7"/><path d="M8 11v6"/></svg>`,
  textile: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7c3-2 5 2 8 0s5 2 8 0v10c-3 2-5-2-8 0s-5-2-8 0V7z"/><path d="M4 12c3-2 5 2 8 0s5 2 8 0"/></svg>`,
  unknown: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-dasharray="3 2"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.6-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/></svg>`,
};

function normalizeKey(value?: string): string {
  return (value ?? '').toLowerCase().trim().replace(/[\s/-]+/g, '_');
}

const EXACT_ICON_MAP: Record<string, DebrisIconDefinition> = {
  plastic_bottle: { key: 'plastic_bottle', label: 'Plastic Bottle', svg: DEBRIS_SVGS.plastic_bottle },
  plastic_water_bottle: { key: 'plastic_bottle', label: 'Plastic Bottle', svg: DEBRIS_SVGS.plastic_bottle },
  water_bottle: { key: 'plastic_bottle', label: 'Plastic Bottle', svg: DEBRIS_SVGS.plastic_bottle },
  plastic_bag: { key: 'plastic_bag', label: 'Plastic Bag', svg: DEBRIS_SVGS.plastic_bag },
  shopping_bag: { key: 'plastic_bag', label: 'Shopping Bag', svg: DEBRIS_SVGS.plastic_bag },
  plastic_sheeting: { key: 'plastic_bag', label: 'Plastic Film / Sheeting', svg: DEBRIS_SVGS.plastic_bag },
  plastic_film: { key: 'plastic_bag', label: 'Plastic Film', svg: DEBRIS_SVGS.plastic_bag },
  plastic_container: { key: 'plastic_container', label: 'Plastic Container', svg: DEBRIS_SVGS.plastic_container },
  polymer_cluster: { key: 'plastic_container', label: 'Polymer Cluster', svg: DEBRIS_SVGS.plastic_container },
  glass_bottle: { key: 'glass_bottle', label: 'Glass Bottle', svg: DEBRIS_SVGS.glass_bottle },
  rubber_tire: { key: 'tire', label: 'Rubber Tire', svg: DEBRIS_SVGS.tire },
  tyre: { key: 'tire', label: 'Tyre', svg: DEBRIS_SVGS.tire },
  tire: { key: 'tire', label: 'Tire', svg: DEBRIS_SVGS.tire },
  foam_buoy: { key: 'buoy', label: 'Foam Buoy', svg: DEBRIS_SVGS.buoy },
  fishing_buoy: { key: 'buoy', label: 'Fishing Buoy', svg: DEBRIS_SVGS.buoy },
  buoy: { key: 'buoy', label: 'Buoy', svg: DEBRIS_SVGS.buoy },
  ghost_net: { key: 'fishing_net', label: 'Fishing Net', svg: DEBRIS_SVGS.fishing_net },
  fishing_net: { key: 'fishing_net', label: 'Fishing Net', svg: DEBRIS_SVGS.fishing_net },
  trawl_net: { key: 'fishing_net', label: 'Trawl Net', svg: DEBRIS_SVGS.fishing_net },
  gillnet: { key: 'fishing_net', label: 'Gillnet', svg: DEBRIS_SVGS.fishing_net },
  mooring_rope: { key: 'fishing_rope', label: 'Fishing / Mooring Rope', svg: DEBRIS_SVGS.fishing_rope },
  fishing_rope: { key: 'fishing_rope', label: 'Fishing Rope', svg: DEBRIS_SVGS.fishing_rope },
  rope: { key: 'fishing_rope', label: 'Rope', svg: DEBRIS_SVGS.fishing_rope },
  longline_gear: { key: 'fishing_line', label: 'Fishing Line', svg: DEBRIS_SVGS.fishing_line },
  fishing_line: { key: 'fishing_line', label: 'Fishing Line', svg: DEBRIS_SVGS.fishing_line },
  fishing_trap: { key: 'fishing_trap', label: 'Fishing Trap', svg: DEBRIS_SVGS.fishing_trap },
  crab_trap: { key: 'fishing_trap', label: 'Crab Trap', svg: DEBRIS_SVGS.fishing_trap },
  lobster_trap: { key: 'fishing_trap', label: 'Lobster Trap', svg: DEBRIS_SVGS.fishing_trap },
  abandoned_fad: { key: 'fad', label: 'Derelict FAD', svg: DEBRIS_SVGS.fad },
  metal_can: { key: 'metal_can', label: 'Metal Can', svg: DEBRIS_SVGS.metal_can },
  aluminium_can: { key: 'metal_can', label: 'Aluminium Can', svg: DEBRIS_SVGS.metal_can },
  aluminum_can: { key: 'metal_can', label: 'Aluminum Can', svg: DEBRIS_SVGS.metal_can },
  steel_drum: { key: 'oil_drum', label: 'Metal Barrel / Drum', svg: DEBRIS_SVGS.oil_drum },
  oil_drum: { key: 'oil_drum', label: 'Oil Drum', svg: DEBRIS_SVGS.oil_drum },
  metal_barrel: { key: 'oil_drum', label: 'Metal Barrel', svg: DEBRIS_SVGS.oil_drum },
  battery_pack: { key: 'battery_pack', label: 'Battery Unit', svg: DEBRIS_SVGS.battery_pack },
  hull_fragment: { key: 'shipwreck', label: 'Shipwreck / Hull', svg: DEBRIS_SVGS.shipwreck },
  shipwreck: { key: 'shipwreck', label: 'Shipwreck', svg: DEBRIS_SVGS.shipwreck },
  marine_electronics: { key: 'electronics', label: 'Electronic Waste', svg: DEBRIS_SVGS.electronics },
  electronic_waste: { key: 'electronics', label: 'Electronic Waste', svg: DEBRIS_SVGS.electronics },
  anchor_chain: { key: 'anchor', label: 'Anchor & Chain', svg: DEBRIS_SVGS.anchor },
  concrete_rebar: { key: 'concrete_block', label: 'Concrete Block', svg: DEBRIS_SVGS.concrete_block },
  concrete_block: { key: 'concrete_block', label: 'Concrete Block', svg: DEBRIS_SVGS.concrete_block },
  pvc_conduit: { key: 'pipe', label: 'Pipe / Conduit', svg: DEBRIS_SVGS.pipe },
  metal_pipe: { key: 'pipe', label: 'Metal Pipe', svg: DEBRIS_SVGS.pipe },
  pipe: { key: 'pipe', label: 'Pipe', svg: DEBRIS_SVGS.pipe },
  household_appliance: { key: 'appliance', label: 'Household Appliance', svg: DEBRIS_SVGS.appliance },
  treated_timber: { key: 'timber', label: 'Treated Timber', svg: DEBRIS_SVGS.timber },
  synthetic_textile: { key: 'textile', label: 'Textile Bundle', svg: DEBRIS_SVGS.textile },
  unknown_metallic: { key: 'unknown', label: 'Unknown Anomaly', svg: DEBRIS_SVGS.unknown },
  unknown_reflective: { key: 'unknown', label: 'Unknown Anomaly', svg: DEBRIS_SVGS.unknown },
  unknown_encrusted: { key: 'unknown', label: 'Unknown Anomaly', svg: DEBRIS_SVGS.unknown },
  unknown_object: { key: 'unknown', label: 'Unknown Object', svg: DEBRIS_SVGS.unknown },
};

const PATTERN_ICON_MAP: Array<{ pattern: RegExp; icon: DebrisIconDefinition }> = [
  {
    pattern: /unknown|unidentified|anomal|unclassified|ambiguous/,
    icon: { key: 'unknown', label: 'Unknown Object', svg: DEBRIS_SVGS.unknown },
  },
  {
    pattern: /glass.*bottle|ceramic/,
    icon: { key: 'glass_bottle', label: 'Glass Bottle', svg: DEBRIS_SVGS.glass_bottle },
  },
  {
    pattern: /plastic.*bottle|water.*bottle|pet.*bottle/,
    icon: { key: 'plastic_bottle', label: 'Plastic Bottle', svg: DEBRIS_SVGS.plastic_bottle },
  },
  {
    pattern: /plastic.*bag|shopping.*bag|film|sheeting|tarp/,
    icon: { key: 'plastic_bag', label: 'Plastic Bag / Film', svg: DEBRIS_SVGS.plastic_bag },
  },
  {
    pattern: /plastic.*container|polymer|bucket|crate/,
    icon: { key: 'plastic_container', label: 'Plastic Container', svg: DEBRIS_SVGS.plastic_container },
  },
  {
    pattern: /tyre|tire|fender/,
    icon: { key: 'tire', label: 'Tyre', svg: DEBRIS_SVGS.tire },
  },
  {
    pattern: /buoy|float|polystyrene|foam/,
    icon: { key: 'buoy', label: 'Buoy', svg: DEBRIS_SVGS.buoy },
  },
  {
    pattern: /net|gillnet|trawl/,
    icon: { key: 'fishing_net', label: 'Fishing Net', svg: DEBRIS_SVGS.fishing_net },
  },
  {
    pattern: /rope|hawser|cordage/,
    icon: { key: 'fishing_rope', label: 'Fishing Rope', svg: DEBRIS_SVGS.fishing_rope },
  },
  {
    pattern: /longline|fishing.*line|monofilament|hook/,
    icon: { key: 'fishing_line', label: 'Fishing Line', svg: DEBRIS_SVGS.fishing_line },
  },
  {
    pattern: /trap|pot|cage/,
    icon: { key: 'fishing_trap', label: 'Fishing Trap', svg: DEBRIS_SVGS.fishing_trap },
  },
  {
    pattern: /fad|aggregating/,
    icon: { key: 'fad', label: 'FAD', svg: DEBRIS_SVGS.fad },
  },
  {
    pattern: /alumin.*can|metal.*can|tin.*can|beverage.*can/,
    icon: { key: 'metal_can', label: 'Metal Can', svg: DEBRIS_SVGS.metal_can },
  },
  {
    pattern: /drum|barrel/,
    icon: { key: 'oil_drum', label: 'Metal Barrel / Drum', svg: DEBRIS_SVGS.oil_drum },
  },
  {
    pattern: /battery|cell/,
    icon: { key: 'battery_pack', label: 'Battery', svg: DEBRIS_SVGS.battery_pack },
  },
  {
    pattern: /shipwreck|wreck|hull/,
    icon: { key: 'shipwreck', label: 'Shipwreck', svg: DEBRIS_SVGS.shipwreck },
  },
  {
    pattern: /electron|sonar|pcb|device|transducer/,
    icon: { key: 'electronics', label: 'Electronic Waste', svg: DEBRIS_SVGS.electronics },
  },
  {
    pattern: /anchor|chain/,
    icon: { key: 'anchor', label: 'Anchor', svg: DEBRIS_SVGS.anchor },
  },
  {
    pattern: /concrete|rebar|rubble|block/,
    icon: { key: 'concrete_block', label: 'Concrete Block', svg: DEBRIS_SVGS.concrete_block },
  },
  {
    pattern: /pipe|conduit|pvc/,
    icon: { key: 'pipe', label: 'Pipe', svg: DEBRIS_SVGS.pipe },
  },
  {
    pattern: /appliance|white.*good|fridge|washer/,
    icon: { key: 'appliance', label: 'Appliance', svg: DEBRIS_SVGS.appliance },
  },
  {
    pattern: /timber|wood|piling/,
    icon: { key: 'timber', label: 'Timber', svg: DEBRIS_SVGS.timber },
  },
  {
    pattern: /textile|fabric|carpet/,
    icon: { key: 'textile', label: 'Textile', svg: DEBRIS_SVGS.textile },
  },
];

const CATEGORY_DEFAULT_ICON: Record<DebrisCategory, DebrisIconDefinition> = {
  'Plastic, Rubber and Glass Debris': {
    key: 'plastic_bottle',
    label: 'Plastic, Rubber & Glass',
    svg: DEBRIS_SVGS.plastic_bottle,
  },
  'Fishing Nets, Ropes and Abandoned Fishing Equipment': {
    key: 'fishing_net',
    label: 'Fishing Nets & Gear',
    svg: DEBRIS_SVGS.fishing_net,
  },
  'Metal, Electronic and Shipwreck Debris': {
    key: 'oil_drum',
    label: 'Metal, Electronic & Wreck',
    svg: DEBRIS_SVGS.oil_drum,
  },
  'Construction, Household and Other Underwater Debris': {
    key: 'concrete_block',
    label: 'Construction & Household',
    svg: DEBRIS_SVGS.concrete_block,
  },
  'Unknown Underwater Anomalies': {
    key: 'unknown',
    label: 'Unknown Anomaly',
    svg: DEBRIS_SVGS.unknown,
  },
};

export function resolveDebrisIcon(
  catalogueClassId: string,
  objectName: string,
  category: DebrisCategory,
): DebrisIconDefinition {
  const idKey = normalizeKey(catalogueClassId);
  if (EXACT_ICON_MAP[idKey]) return EXACT_ICON_MAP[idKey];

  const nameKey = normalizeKey(objectName);
  if (EXACT_ICON_MAP[nameKey]) return EXACT_ICON_MAP[nameKey];

  const combined = `${idKey}_${nameKey}`;
  for (const entry of PATTERN_ICON_MAP) {
    if (entry.pattern.test(combined)) return entry.icon;
  }

  return (
    CATEGORY_DEFAULT_ICON[category] ?? {
      key: 'unknown',
      label: 'Unknown Object',
      svg: DEBRIS_SVGS.unknown,
    }
  );
}

export const LEGEND_CATEGORIES: Array<{
  category: DebrisCategory;
  shortLabel: string;
}> = [
  {
    category: 'Plastic, Rubber and Glass Debris',
    shortLabel: 'Plastic, Rubber & Glass',
  },
  {
    category: 'Fishing Nets, Ropes and Abandoned Fishing Equipment',
    shortLabel: 'Fishing Nets, Ropes & Gear',
  },
  {
    category: 'Metal, Electronic and Shipwreck Debris',
    shortLabel: 'Metal, Electronic & Wreck',
  },
  {
    category: 'Construction, Household and Other Underwater Debris',
    shortLabel: 'Construction & Household',
  },
];
