/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly CMS_API_URL: string;
  readonly CMS_API_KEY: string;
  readonly CMS_PREVIEW_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    /** LucidOS draft-preview token for this request, resolved in middleware. */
    previewToken: string | null;
  }
}
