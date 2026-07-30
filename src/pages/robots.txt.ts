import { proxyRootFile } from "../lib/proxy";

// Crawl policy is managed in LucidOS (SEO → Health) — never hand-author this.
export const GET = proxyRootFile("/robots.txt");
