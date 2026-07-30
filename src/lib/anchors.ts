import type { Section } from "./cms";

/**
 * In-page anchor ids for well-known section types, used for the one-page
 * navigation (template design) and same-page CTA targets. Only the first
 * section of each type gets the anchor. Ids must match the anchors editors
 * use in CMS button links (e.g. "#schedule-a-tour", "#floor-plans").
 */
const ANCHOR_BY_TYPE: Record<string, { id: string; label: string }> = {
  "a-day-at-the-landry": { id: "day", label: "Life Here" },
  "feature-grid": { id: "day", label: "Life Here" },
  "life-at-the-landry": { id: "amenities", label: "Amenities" },
  "amenities-grid": { id: "amenities", label: "Amenities" },
  "floor-plan-grid": { id: "floor-plans", label: "Residences" },
  "image-gallery": { id: "gallery", label: "Gallery" },
  "availability-list": { id: "availability", label: "Availability" },
  faq: { id: "faq", label: "FAQ" },
  "form-section": { id: "schedule-a-tour", label: "Schedule a Tour" },
};

export interface Anchor {
  id: string;
  label: string;
}

/** Map of section.id -> anchor id, first instance of each anchor id only. */
export function anchorIdsForSections(sections: Section[]): Map<string, string> {
  const used = new Set<string>();
  const map = new Map<string, string>();
  for (const s of sections) {
    const anchor = ANCHOR_BY_TYPE[s.type];
    if (anchor && !used.has(anchor.id)) {
      used.add(anchor.id);
      map.set(s.id, anchor.id);
    }
  }
  return map;
}

/** Nav-worthy anchors present on a page (excludes the tour form — that's the CTA). */
export function navAnchors(sections: Section[]): Anchor[] {
  const used = new Set<string>();
  const anchors: Anchor[] = [];
  for (const s of sections) {
    const anchor = ANCHOR_BY_TYPE[s.type];
    if (anchor && anchor.id !== "schedule-a-tour" && !used.has(anchor.id)) {
      used.add(anchor.id);
      anchors.push(anchor);
    }
  }
  return anchors;
}
