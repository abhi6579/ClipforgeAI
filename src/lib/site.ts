/** Single source of truth for the public URL. Set NEXT_PUBLIC_SITE_URL at deploy time. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "ClipForge AI";
export const SITE_TAGLINE = "Turn one long video into a week of scroll-stopping clips";
export const SITE_DESCRIPTION =
  "ClipForge reads your footage, scores it, tells you exactly where to cut, and writes the hook and caption. Earn free credits with games and daily tasks.";
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@clipforge.ai";
