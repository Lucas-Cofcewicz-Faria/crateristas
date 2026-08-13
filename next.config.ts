import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    maximumRedirects: 0,
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/visits/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
