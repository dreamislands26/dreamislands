import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/properties/peking-union-medical-college-hospital", destination: "/medical/china/hospitals/peking-union-medical-college-hospital", statusCode: 301 },
      { source: "/properties/fudan-zhongshan-hospital", destination: "/medical/china/hospitals/fudan-zhongshan-hospital", statusCode: 301 },
      { source: "/properties/shanghai-jiaotong-ruijin-hospital", destination: "/medical/china/hospitals/ruijin-hospital", statusCode: 301 },
      { source: "/properties/xian-international-medical-center", destination: "/medical/china/hospitals/xian-international-medical-center", statusCode: 301 },
      { source: "/properties/shanghai-jiahui-international-hospital", destination: "/medical/china/hospitals/shanghai-jiahui-international-hospital", statusCode: 301 },
      { source: "/properties/peking-university-first-hospital", destination: "/medical/china/hospitals/peking-university-first-hospital", statusCode: 301 },
      { source: "/properties/peking-university-international-hospital", destination: "/medical/china/hospitals/peking-university-international-hospital", statusCode: 301 },
      { source: "/properties/sichuan-university-west-china-hospital", destination: "/medical/china/hospitals/west-china-hospital", statusCode: 301 },
      { source: "/properties/sun-yat-sen-university-affiliated-hospital", destination: "/medical/china/hospitals/sun-yat-sen-university-hospital", statusCode: 301 },
      { source: "/properties/better-migrate-medical-network", destination: "/medical/china", statusCode: 301 },
      // The DS v2 medical page moved into the Stage 1 medical section
      { source: "/destinations/china/medical", destination: "/medical/china", statusCode: 301 },
    ]
  },
  // Files in public/ (videos, logos, flags, icons...) were served with max-age=0, so every visit re-checked
  // them. One day fresh, then up to a week served from cache while the browser re-checks in the background.
  // Replacing a file under the same name therefore reaches returning visitors within a day.
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }]
    return ["video", "brand", "images", "icons", "flags", "mascots"].map((dir) => ({ source: `/${dir}/:path*`, headers: cache }))
  },
  images: {
    // Optimised images (/_next/image) stay cached for 3 days instead of 4 hours. To refresh them on demand,
    // POST /api/revalidate?images=1 (deletes .next/cache/images); a NEW photo should get a new file name,
    // because browsers keep the old copy for up to this long.
    minimumCacheTTL: 259200,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xbzrtofanbrahasxbisf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
export default nextConfig;
