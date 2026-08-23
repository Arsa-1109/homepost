import path from "path";

const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholder = !key || key.includes("placeholder") || key.includes("enabled-shrew-91") || key === "pk_test_ZW5hYmxlZC1zaHJldy05MS5jbGVyay5hY2NvdW50cy5kZXYk";
const useMockAuth = isPlaceholder || process.env.MOCK_AUTH === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
      "motion",
      "clsx",
      "tailwind-merge"
    ],
  },
  turbopack: {
    root: path.resolve(process.cwd()),
    ...(useMockAuth ? {
      resolveAlias: {
        "@clerk/nextjs": "./src/lib/clerk-mock.tsx",
        "@clerk/nextjs/server": "./src/lib/clerk-server-mock.ts",
      }
    } : {})
  },
  ...(useMockAuth ? {
    webpack: (config) => {
      config.resolve.alias["@clerk/nextjs$"] = path.resolve(process.cwd(), "src/lib/clerk-mock.tsx");
      config.resolve.alias["@clerk/nextjs/server$"] = path.resolve(process.cwd(), "src/lib/clerk-server-mock.ts");
      return config;
    }
  } : {})
};

export default nextConfig;

