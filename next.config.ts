import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Logo and product image uploads go through server actions.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
