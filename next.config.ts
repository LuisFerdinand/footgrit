import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only badge: keep it off the floating mobile bottom nav.
  devIndicators: { position: "top-left" },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
  typescript: {
    // Showcase build — surface type errors in the editor / `npm run typecheck`,
    // but don't hard-block the demo build on them.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
