import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Use our custom service worker instead of auto-generated one
  sw: "sw.js",
  // Workbox options for production builds
  workboxOptions: {
    disableDevLogs: true,
    // Don't auto-generate SW, we have our custom one
    mode: "production",
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

const withNextIntl = createNextIntlPlugin();

// Compose plugins: PWA -> NextIntl -> Next Config
export default withPWA(withNextIntl(nextConfig));
