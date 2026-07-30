import { defineMiddleware } from "astro:middleware";

const ADMIN_ORIGIN = "https://lucid.madstack.io";

/**
 * Resolves the LucidOS preview token for each request (query param first,
 * then session cookie, then the staging-only env var), and sets response
 * cache headers accordingly:
 *  - preview requests: private, no-store (edge caches must not replay stale
 *    HTML after an editor save)
 *  - normal requests: short CDN cache with stale-while-revalidate — NOT the
 *    Vercel adapter's `isr` option, which would break the preview token.
 * Also allows the LucidOS editor to frame the site for live preview.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const queryToken = context.url.searchParams.get("lucid_preview");
  if (queryToken) {
    context.cookies.set("lucid_preview", queryToken, {
      path: "/",
      sameSite: "none",
      secure: true,
      httpOnly: false,
    });
  }
  const token =
    queryToken ??
    context.cookies.get("lucid_preview")?.value ??
    (import.meta.env.CMS_PREVIEW_TOKEN as string | undefined) ??
    null;
  context.locals.previewToken = token;

  const response = await next();

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("text/html")) {
    response.headers.set("Content-Security-Policy", `frame-ancestors 'self' ${ADMIN_ORIGIN}`);
    if (token) {
      response.headers.set("Cache-Control", "private, no-store");
    } else {
      response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      response.headers.set(
        "CDN-Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );
    }
  }
  return response;
});
