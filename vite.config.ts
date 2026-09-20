import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  const site = new URL(env.VITE_SITE_URL || "https://moreda313.github.io/MM_Wedding_Invitation/");
  if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash) {
    throw new Error("VITE_SITE_URL must be a public HTTPS site URL without credentials, query or fragment");
  }
  if (!site.pathname.endsWith("/")) site.pathname += "/";
  const siteUrl = site.href.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return {
    plugins: [react(), {
      name: "static-share-metadata",
      // Emit real absolute URLs into HTML: share crawlers need not execute React.
      transformIndexHtml: (html) => html.replaceAll("__PUBLIC_SITE_URL__", siteUrl),
    }],
    base: "/",
  };
});
