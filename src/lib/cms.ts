/**
 * LucidOS Website CMS client — see LUCIDOS.md at the repo root.
 *
 * Server-side ONLY. The API key is a secret; never import this module from
 * client scripts. The one keyless endpoint (form submit) is called from the
 * browser directly against the form schema's `submit_url`.
 */

const BASE = import.meta.env.CMS_API_URL as string | undefined;
const KEY = import.meta.env.CMS_API_KEY as string | undefined;

export interface CmsFetchOptions {
  /** LucidOS draft-preview token resolved for this request (see middleware). */
  previewToken?: string | null;
  /** Locale code, e.g. "es". Omitted for the default locale. */
  locale?: string | null;
}

export async function cms<T>(path: string, opts: CmsFetchOptions = {}): Promise<T> {
  if (!BASE || !KEY) {
    throw new Error(
      "CMS_API_URL / CMS_API_KEY are not set. Copy .env.example to .env and fill them in."
    );
  }
  const url = new URL(`${BASE}${path}`);
  if (opts.locale) url.searchParams.set("locale", opts.locale);
  const headers: Record<string, string> = { "x-api-key": KEY };
  if (opts.previewToken) headers["x-preview-token"] = opts.previewToken;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new CmsError(res.status, `CMS ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export class CmsError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** Raw proxy fetch for root search files (sitemap.xml, robots.txt, llms.txt). */
export async function cmsRaw(path: string): Promise<Response> {
  if (!BASE || !KEY) throw new Error("CMS_API_URL / CMS_API_KEY are not set.");
  return fetch(`${BASE}${path}`, { headers: { "x-api-key": KEY } });
}

/* ---------------------------------------------------------------------- */
/* Types — mirrors of the API shapes documented in LUCIDOS.md             */
/* ---------------------------------------------------------------------- */

export interface Globals {
  name: string;
  default_locale: string;
  locales: string[];
  branding?: Record<string, unknown>;
  contact?: {
    email?: string | null;
    phone?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    office_hours?: string | null;
  } | null;
  social?: Partial<
    Record<"facebook" | "instagram" | "twitter" | "linkedin" | "youtube" | "tiktok", string | null>
  > | null;
  tracking?: {
    ga4_measurement_id?: string | null;
    gtm_container_id?: string | null;
    google_ads_id?: string | null;
    meta_pixel_id?: string | null;
  } | null;
  custom_head_tags?: string | null;
  portal_url?: string | null;
  recaptcha_site_key?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  json_ld?: unknown[] | null;
}

export interface PageSummary {
  slug: string;
  title: string;
  meta_title?: string | null;
  meta_description?: string | null;
  order_index: number;
}

export interface Section {
  id: string;
  type: string;
  data: Record<string, any>;
  live?: boolean;
  source?: string;
  live_fields?: string[];
}

export interface Page {
  slug: string;
  title: string;
  meta?: {
    title?: string | null;
    description?: string | null;
    keywords?: string | string[] | null;
    og_image_url?: string | null;
    canonical_url?: string | null;
    noindex?: boolean | null;
  } | null;
  json_ld?: unknown[] | null;
  sections: Section[];
}

export interface FloorPlan {
  name: string;
  slug: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  sqft_min?: number | null;
  sqft_max?: number | null;
  features?: string[];
  photos?: { url: string; alt?: string | null }[];
  available_count: number;
  starting_rent?: number | null;
  available_from?: string | null;
}

export interface AvailableUnit {
  unit_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  square_footage?: number | null;
  market_rent?: number | null;
  available_now: boolean;
  available_date?: string | null;
  floor_plan: { slug: string; name: string } | null;
}

export interface Special {
  title: string;
  description?: string | null;
  disclaimer?: string | null;
  display_mode: "text" | "image" | "image_text";
  starts_at?: string | null;
  ends_at?: string | null;
  floor_plan: { slug: string; name: string } | null;
  image: { url: string; alt?: string | null } | null;
}

export interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[] | null;
  option_labels?: (string | null)[] | null;
}

export interface FormSchema {
  id: string;
  name: string;
  redirect_url?: string | null;
  recaptcha_required: boolean;
  recaptcha_site_key?: string | null;
  submit_url: string;
  fields: FormField[];
}
