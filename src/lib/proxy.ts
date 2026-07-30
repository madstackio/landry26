import type { APIRoute } from "astro";
import { cmsRaw } from "./cms";

// Root search files must be served from this domain, but the CMS endpoints
// need the x-api-key header — so we proxy rather than rewrite. Never
// statically generate these: their content changes without a redeploy.
export const proxyRootFile =
  (path: string): APIRoute =>
  async () => {
    const res = await cmsRaw(path);
    return new Response(await res.text(), {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "text/plain",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  };
