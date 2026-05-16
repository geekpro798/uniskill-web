import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.particle.network https://*.walletconnect.com; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
