// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// SSR everywhere: CMS content changes without a redeploy, live availability
// sections hydrate per-request, and the LucidOS preview bridge needs
// per-request rendering. Do NOT enable the adapter's `isr` option — ISR
// ignores query strings/cookies, which breaks the editor preview token
// (see LUCIDOS.md). Caching is handled per-response in src/middleware.ts.
export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: "https://landryliving.com",
});
