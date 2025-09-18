import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native resvg binaries to avoid bundling; we'll require at runtime
      config.externals = config.externals || [];
      config.externals.push(/@resvg\/resvg-js.*/);
    }
    return config;
  },
};

export default nextConfig;
