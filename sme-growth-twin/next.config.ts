import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl && process.env.VERCEL_ENV === "production") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for browser authentication.");
}
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : undefined;
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Parser packages use Node resources and PDF.js loads its worker dynamically.
  serverExternalPackages: ["pdfjs-dist", "mammoth"],
  outputFileTracingIncludes: {
    "/api/v2/evidence-documents": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/v2/evidence-documents/*/reprocess": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
