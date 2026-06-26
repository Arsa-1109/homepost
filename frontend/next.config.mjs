import path from "path";

const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholder = !key || key.includes("placeholder") || key.includes("enabled-shrew-91") || key === "pk_test_ZW5hYmxlZC1zaHJldy05MS5jbGVyay5hY2NvdW50cy5kZXYk";
const useMockAuth = isPlaceholder || process.env.MOCK_AUTH === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  ...(useMockAuth ? {
    turbopack: {
      resolveAlias: {
        "@clerk/nextjs": "./src/lib/clerk-mock.tsx",
        "@clerk/nextjs/server": "./src/lib/clerk-server-mock.ts",
      }
    },
    webpack: (config) => {
      console.log("Using Mock Clerk Auth (offline mode)...");
      config.resolve.alias["@clerk/nextjs$"] = path.resolve(process.cwd(), "src/lib/clerk-mock.tsx");
      config.resolve.alias["@clerk/nextjs/server$"] = path.resolve(process.cwd(), "src/lib/clerk-server-mock.ts");
      return config;
    }
  } : {})
};

export default nextConfig;

